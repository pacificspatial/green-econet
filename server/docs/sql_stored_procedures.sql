
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
    dissolved geometry;
BEGIN
    DELETE FROM processing.buffer125_merged_green
    WHERE project_id = p_project_id;

    -- Union all merged geometries
    SELECT ST_Union(geom) INTO dissolved
    FROM processing.merged_green
    WHERE project_id = p_project_id;

    -- Buffer 125m & convert back to 4326
    INSERT INTO processing.buffer125_merged_green (project_id, uid, geom, properties)
    VALUES (
        p_project_id,
        gen_random_uuid()::text,
        ST_Transform(
          ST_Buffer(ST_Transform(dissolved, 3857), 125),
        4326),
        '{}'::jsonb
    );
END;
$$ LANGUAGE plpgsql;

------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION processing.assign_groups(p_project_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM processing.green_group_assignment
    WHERE project_id = p_project_id;

    INSERT INTO processing.green_group_assignment
        (project_id, target_table, target_id, uid, intersects, area_ratio, geom)
    SELECT
        p_project_id,
        'clipped_green',
        cg.id,
        buf.uid,
        TRUE,
        ST_Area(ST_Intersection(cg.geom, buf.geom)) / ST_Area(cg.geom),
        cg.geom
    FROM processing.clipped_green cg
    CROSS JOIN processing.buffer125_merged_green buf
    WHERE cg.project_id = p_project_id
      AND buf.project_id = p_project_id
      AND ST_Intersects(cg.geom, buf.geom);
END;
$$ LANGUAGE plpgsql;


------------------------------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION processing.calculate_indices(p_project_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM processing.indices
    WHERE project_id = p_project_id;

    INSERT INTO processing.indices (project_id, uid, index_name, index_value)
    SELECT
        p_project_id,
        uid,
        'sample_index',
        COUNT(*)
    FROM processing.green_group_assignment
    WHERE project_id = p_project_id
    GROUP BY uid;
END;
$$ LANGUAGE plpgsql;

--------------------------------------------------------------------------------------------

