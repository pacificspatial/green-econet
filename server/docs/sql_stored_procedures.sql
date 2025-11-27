
CREATE OR REPLACE FUNCTION processing.set_aoi(p_project_id UUID)
RETURNS void AS $$
DECLARE
    poly_union geometry;
    center geometry;
    buff geometry;
BEGIN
    -- Merge all project polygons
    SELECT ST_Union(geom) INTO poly_union
    FROM public.project_polygons
    WHERE project_id = p_project_id;

    -- Compute centroid
    SELECT ST_Centroid(poly_union) INTO center;

    -- Compute 1000m buffer (convert to meters)
    SELECT 
        ST_Transform(
            ST_Buffer(
                ST_Transform(center, 3857),
                1000
            ),
        4326
    )
    INTO buff;

    -- Ensure POLYGON (extract polygon elements only)
    buff := ST_CollectionExtract(buff, 3)::geometry(Polygon, 4326);

    -- Update project
    UPDATE public.projects
    SET 
        aoi_centroid = center,
        geom = buff,
        updated_at = NOW()
    WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION processing.clip_green(p_project_id UUID)
RETURNS void AS $$
BEGIN
    -- Remove old results
    DELETE FROM processing.clipped_green
    WHERE project_id = p_project_id;

    -- Clip static green layer to AOI
    INSERT INTO processing.clipped_green (project_id, src_id, geom, properties)
    SELECT
        p_project_id,
        g.id,
        ST_Intersection(g.geom, pr.geom),
        g.properties
    FROM layers.enp_green g
    CROSS JOIN public.projects pr
    WHERE pr.id = p_project_id
      AND ST_Intersects(g.geom, pr.geom);
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION processing.clip_buffer125_green(p_project_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM processing.clipped_buffer125_green
    WHERE project_id = p_project_id;

    INSERT INTO processing.clipped_buffer125_green (project_id, src_id, geom, properties)
    SELECT
        p_project_id,
        b.id,
        ST_Intersection(b.geom, pr.geom),
        b.properties
    FROM layers.enp_buffer125_green b
    CROSS JOIN public.projects pr
    WHERE pr.id = p_project_id
      AND ST_Intersects(b.geom, pr.geom);
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION processing.merge_green(p_project_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM processing.merged_green
    WHERE project_id = p_project_id;

    -- Insert user polygons
    INSERT INTO processing.merged_green (project_id, src_type, src_ref, geom, properties)
    SELECT
        p_project_id,
        'user_polygon',
        id::text,
        geom,
        '{}'::jsonb
    FROM public.project_polygons
    WHERE project_id = p_project_id;

    -- Insert clipped green
    INSERT INTO processing.merged_green (project_id, src_type, src_ref, geom, properties)
    SELECT
        p_project_id,
        'clipped_green',
        id::text,
        geom,
        properties
    FROM processing.clipped_green
    WHERE project_id = p_project_id;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION processing.buffer125_merged(p_project_id UUID)
RETURNS void AS $$
DECLARE
    dissolved_geom geometry;
BEGIN
    -- 1. Clear previous buffer results
    DELETE FROM processing.buffer125_merged_green
    WHERE project_id = p_project_id;

    -- 2. Buffer (125m) and dissolve using ST_UnaryUnion
    SELECT
        ST_Transform(
            ST_UnaryUnion(
                ST_Buffer(
                    ST_Transform(geom, 3857),  -- convert to meters
                    125                       -- 125m buffer
                )
            ),
            4326                              -- return to WGS84
        )
    INTO dissolved_geom
    FROM processing.merged_green
    WHERE project_id = p_project_id;

    -- If no geometry was found, exit
    IF dissolved_geom IS NULL THEN
        RETURN;
    END IF;

    -- 3. Dump dissolved multipolygon and insert each part separately
    INSERT INTO processing.buffer125_merged_green (project_id, uid, geom, properties)
    SELECT
        p_project_id,
        uuid_generate_v4(),
        (geom_dump).geom,
        '{}'::jsonb
    FROM (
        SELECT (ST_Dump(dissolved_geom)) AS geom_dump
    ) AS dumped;

END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION processing.assign_uids(p_project_id UUID)
RETURNS void AS $$
BEGIN
    ---------------------------------------------------------
    -- 1) Assign UID to clipped_green from clipped_buffer125_green
    ---------------------------------------------------------
    UPDATE processing.clipped_green cg
    SET uid = buf.uid
    FROM processing.clipped_buffer125_green buf
    WHERE cg.project_id = p_project_id
      AND buf.project_id = p_project_id
      AND cg.uid IS NULL
      AND ST_Intersects(cg.geom, buf.geom);

    ---------------------------------------------------------
    -- 2) Assign UID to merged_green from buffer125_merged_green
    ---------------------------------------------------------
    UPDATE processing.merged_green mg
    SET uid = buf.uid
    FROM processing.buffer125_merged_green buf
    WHERE mg.project_id = p_project_id
      AND buf.project_id = p_project_id
      AND mg.uid IS NULL
      AND ST_Intersects(mg.geom, buf.geom);

END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------------------------
