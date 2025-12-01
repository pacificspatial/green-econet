
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
                    ST_Transform(ST_Collect(geom), 3857),  -- convert to meters
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

CREATE OR REPLACE FUNCTION processing.join_clip_green(p_project_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM processing.clipped_green_joined
    WHERE project_id = p_project_id;

    INSERT INTO processing.clipped_green_joined (project_id, uid, geom)
    SELECT
        p_project_id,
        j.uid,
        j.geom_int
    FROM (
        SELECT
            cg.project_id,
            buf.uid,
            ST_Multi(
                ST_CollectionExtract(
                    ST_Intersection(cg.geom, buf.geom),
                    3
                )
            ) AS geom_int
        FROM processing.clipped_green cg
        JOIN processing.clipped_buffer125_green buf
            ON cg.project_id = buf.project_id
            AND cg.project_id = p_project_id
            AND ST_Intersects(cg.geom, buf.geom)
    ) AS j
    WHERE geom_int IS NOT NULL
    AND NOT ST_IsEmpty(geom_int);
END;
$$ LANGUAGE plpgsql;

-------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION processing.join_merged_green(p_project_id UUID)
RETURNS void AS $$
BEGIN
    -- 1) Clear previous joined data for this project
    DELETE FROM processing.merged_green_joined
    WHERE project_id = p_project_id;

    -- 2) merged_green_joined : merged_green  ∩  buffer125_merged_green
    INSERT INTO processing.merged_green_joined (project_id, uid, geom)
    SELECT
        p_project_id,
        j.uid,
        j.geom_int
    FROM (
        SELECT
            mg.project_id,
            buf.uid,
            ST_Multi(
                ST_CollectionExtract(
                    ST_Intersection(mg.geom, buf.geom),
                    3
                )
            ) AS geom_int
        FROM processing.merged_green mg
        JOIN processing.buffer125_merged_green buf
            ON mg.project_id = buf.project_id
            AND mg.project_id = p_project_id
            AND ST_Intersects(mg.geom, buf.geom)
    ) AS j
    WHERE geom_int IS NOT NULL
        AND NOT ST_IsEmpty(geom_int);

END;
$$ LANGUAGE plpgsql;

-------------------------------------------------------------------------------------


CREATE OR REPLACE FUNCTION processing.compute_indexes(p_project_id UUID)
RETURNS void AS $$
DECLARE
    v_indexA NUMERIC;
    v_indexB NUMERIC;
    v_indexBA NUMERIC;
BEGIN
    ----------------------------------------------------------------------
    -- SECTION A: Compute indexA using clipped_green_joined
    ----------------------------------------------------------------------
    WITH joinedA AS (
        SELECT uid, geom
        FROM processing.clipped_green_joined
        WHERE project_id = p_project_id
    ),
    areas_by_uidA AS (
        SELECT
            uid,
            SUM(ST_Area(geom::geography)) AS area_m2
        FROM joinedA
        GROUP BY uid
    ),
    sum_clip_green AS (
        SELECT
            COALESCE(SUM(ST_Area(geom::geography)), 0) AS total_clip_green_area_m2
        FROM processing.clipped_green
        WHERE project_id = p_project_id
    ),
    poly_union AS (
        SELECT ST_Union(geom) AS geom
        FROM public.project_polygons
        WHERE project_id = p_project_id
    ),
    poly_area AS (
        SELECT ST_Area(geom::geography) AS poly_area_m2
        FROM poly_union
    ),
    aggA AS (
        SELECT
            COALESCE((SELECT SUM(POWER(area_m2, 2)) FROM areas_by_uidA), 0) AS sum_uid_area_sq,
            (SELECT poly_area_m2 FROM poly_area) AS poly_area_m2,
            (SELECT total_clip_green_area_m2 FROM sum_clip_green) AS total_clip_green_area_m2
    )
    SELECT
        (
            (sum_uid_area_sq + POWER(poly_area_m2, 2))
            / NULLIF(POWER(total_clip_green_area_m2 + poly_area_m2, 2), 0)
        ) * 100.0
    INTO v_indexA
    FROM aggA;

    ----------------------------------------------------------------------
    -- SECTION B: Compute indexB using merged_green_joined (already created)
    ----------------------------------------------------------------------
    WITH joinedB AS (
        SELECT uid, geom
        FROM processing.merged_green_joined
        WHERE project_id = p_project_id
    ),
    areas_by_uidB AS (
        SELECT
            uid,
            SUM(ST_Area(geom::geography)) AS area_m2
        FROM joinedB
        GROUP BY uid
    ),
    aggB AS (
        SELECT
            COALESCE(SUM(POWER(area_m2, 2)), 0) AS sum_area_sq,
            COALESCE(SUM(area_m2), 0) AS sum_area
        FROM areas_by_uidB
    )
    SELECT
        (sum_area_sq / NULLIF(POWER(sum_area, 2), 0)) * 100.0
    INTO v_indexB
    FROM aggB;

    ----------------------------------------------------------------------
    -- SECTION C: Compute indexBA
    ----------------------------------------------------------------------
    v_indexBA := v_indexB - v_indexA;

    ----------------------------------------------------------------------
    -- SECTION D: Store results in public.projects
    ----------------------------------------------------------------------
    UPDATE public.projects
    SET
        indexA  = v_indexA,
        indexB  = v_indexB,
        indexBA = v_indexBA
    WHERE id = p_project_id;

END;
$$ LANGUAGE plpgsql;
--------------------------------------------------------------------------------------------