
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
        1::text AS id,
        ST_Union(geom) AS geom,
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
    project_geom geometry;
BEGIN
    ----------------------------------------------------------------------
    -- 0. Fetch the project AOI geometry (public.projects.geom)
    ----------------------------------------------------------------------
    SELECT geom 
    INTO project_geom
    FROM public.projects
    WHERE id = p_project_id;

    IF project_geom IS NULL THEN
        RAISE EXCEPTION 'Project geom is NULL in public.projects for id=%', p_project_id;
    END IF;

    ----------------------------------------------------------------------
    -- 1. Clear previous buffer results
    ----------------------------------------------------------------------
    DELETE FROM processing.buffer125_merged_green
    WHERE project_id = p_project_id;

    ----------------------------------------------------------------------
    -- 2. Build 125m dissolved buffer around merged_green
    ----------------------------------------------------------------------
    SELECT
        ST_Transform(
            ST_UnaryUnion(
                ST_Buffer(
                    ST_Transform(ST_Collect(geom), 3857),   -- convert to meters
                    125                                    -- 125m buffer
                )
            ),
            4326                                            -- return to WGS84
        )
    INTO dissolved_geom
    FROM processing.merged_green
    WHERE project_id = p_project_id;

    IF dissolved_geom IS NULL THEN
        RETURN;
    END IF;

    ----------------------------------------------------------------------
    -- 3. Clip dissolved buffer by project AOI
    ----------------------------------------------------------------------
    dissolved_geom := ST_Intersection(dissolved_geom, project_geom);

    IF dissolved_geom IS NULL OR ST_IsEmpty(dissolved_geom) THEN
        RETURN;  -- No clipped buffer remains
    END IF;

    ----------------------------------------------------------------------
    -- 4. Dump clipped multipolygon and insert
    ----------------------------------------------------------------------
    INSERT INTO processing.buffer125_merged_green (project_id, uid, geom, properties)
    SELECT
        p_project_id,
        uuid_generate_v4(),
        clipped.geom,
        '{}'::jsonb
    FROM (
        SELECT (ST_Dump(dissolved_geom)).geom AS geom
    ) AS clipped
    WHERE NOT ST_IsEmpty(clipped.geom);

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


CREATE OR REPLACE FUNCTION processing.compute_indexes_new(p_project_id UUID) -- not used
RETURNS void AS $$
DECLARE
    v_indexA NUMERIC;
    v_indexB NUMERIC;
    v_indexBA NUMERIC;
BEGIN
    ----------------------------------------------------------------------
    -- INDEX A
    ----------------------------------------------------------------------
    WITH poly AS (
        SELECT ST_Union(geom) AS geom
        FROM public.project_polygons
        WHERE project_id = p_project_id
    ),
    poly_centroid AS (
        SELECT ST_Centroid(geom) AS geom
        FROM poly
    ),
    buffer1000 AS (
        SELECT ST_Buffer(geom::geography, 1000)::geometry AS geom
        FROM poly_centroid
    ),
    clip_enp_green AS (
        SELECT
            g.id,
            ST_Intersection(g.geom, b.geom) AS geom
        FROM layers.enp_green g
        JOIN buffer1000 b ON ST_Intersects(g.geom, b.geom)
    ),
    clip_enp_buffer125_green AS (
        SELECT
            uuid_generate_v4() AS uid,
            g.id,
            ST_Intersection(g.geom, b.geom) AS geom
        FROM layers.enp_buffer125_green g
        JOIN buffer1000 b ON ST_Intersects(g.geom, b.geom)
    ),
    joinedA AS (
        SELECT
            b.uid,
            ST_Intersection(g.geom, b.geom) AS geom
        FROM clip_enp_buffer125_green b
        JOIN clip_enp_green g
          ON ST_Intersects(g.geom, b.geom)
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
        FROM clip_enp_green
    ),
    poly_areaA AS (
        SELECT ST_Area(geom::geography) AS poly_area_m2
        FROM poly
    ),
    aggA AS (
        SELECT
            COALESCE((SELECT SUM(POWER(area_m2, 2)) FROM areas_by_uidA), 0) AS sum_uid_area_sq,
            (SELECT poly_area_m2 FROM poly_areaA) AS poly_area_m2,
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
    -- INDEX B
    ----------------------------------------------------------------------
    WITH poly AS (
        SELECT ST_Union(geom) AS geom
        FROM public.project_polygons
        WHERE project_id = p_project_id
    ),
    poly_centroid AS (
        SELECT ST_Centroid(geom) AS geom
        FROM poly
    ),
    buffer1000 AS (
        SELECT ST_Buffer(geom::geography, 1000)::geometry AS geom
        FROM poly_centroid
    ),
    clip_enp_green AS (
        SELECT
            g.id,
            ST_Intersection(g.geom, b.geom) AS geom
        FROM layers.enp_green g
        JOIN buffer1000 b ON ST_Intersects(g.geom, b.geom)
        WHERE NOT ST_IsEmpty(ST_Intersection(g.geom, b.geom))
    ),
    merged_enp_green AS (
        SELECT id, geom FROM clip_enp_green
        UNION ALL
        SELECT NULL::integer AS id, geom FROM poly
    ),
    buffer125_raw AS (
        SELECT ST_Buffer(geom::geography, 125)::geometry AS geom
        FROM merged_enp_green
    ),
    buffer125_union AS (
        SELECT ST_UnaryUnion(ST_Collect(geom)) AS geom
        FROM buffer125_raw
    ),
    buffer125_dump AS (
        SELECT (ST_Dump(geom)).geom AS geom
        FROM buffer125_union
    ),
    buffer125_with_uid AS (
        SELECT uuid_generate_v4() AS uid, geom
        FROM buffer125_dump
    ),
    joinedB AS (
        SELECT
            b.uid,
            ST_Intersection(m.geom, b.geom) AS geom
        FROM buffer125_with_uid b
        JOIN merged_enp_green m
          ON ST_Intersects(m.geom, b.geom)
        WHERE NOT ST_IsEmpty(ST_Intersection(m.geom, b.geom))
    ),
    areas_by_uidB AS (
        SELECT uid, SUM(ST_Area(geom::geography)) AS area_m2
        FROM joinedB
        GROUP BY uid
    ),
    aggB AS (
        SELECT
            COALESCE(SUM(POWER(area_m2, 2)), 0) AS sum_area_sq,
            COALESCE(SUM(area_m2), 0)          AS sum_area
        FROM areas_by_uidB
    )
    SELECT
        (sum_area_sq / NULLIF(POWER(sum_area, 2), 0)) * 100.0
    INTO v_indexB
    FROM aggB;

    ----------------------------------------------------------------------
    -- INDEX BA
    ----------------------------------------------------------------------
    v_indexBA := v_indexB - v_indexA;

    ----------------------------------------------------------------------
    -- UPDATE project record
    ----------------------------------------------------------------------
    UPDATE public.projects
    SET
        indexA = v_indexA,
        indexB = v_indexB,
        indexBA = v_indexBA
    WHERE id = p_project_id;

END;
$$ LANGUAGE plpgsql;
--------------------------------------------------------------------------------------------