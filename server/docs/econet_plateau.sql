-- Enable extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Schemas
CREATE SCHEMA IF NOT EXISTS layers;
CREATE SCHEMA IF NOT EXISTS processing;

-------------------------------
-- 1. PROJECT TABLES (public)
-------------------------------

-- Main projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,           -- Japanese supported
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- UI + processing configuration (zoom, center, layer options, etc.)
    config JSONB DEFAULT '{}'::jsonb,

    -- AOI centroid and 1000m buffer
    aoi_centroid GEOMETRY(POINT, 4326),
    geom GEOMETRY(POLYGON, 4326)
);

-- User-drawn polygons for a project
CREATE TABLE IF NOT EXISTS public.project_polygons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL
        REFERENCES public.projects(id) ON DELETE CASCADE,
    polygon_index INTEGER NOT NULL, -- 1 to 5 (order of drawing/editing)
    geom GEOMETRY(POLYGON, 4326) NOT NULL,

    -- Store calculated values so you don’t recompute every time
    area_m2 NUMERIC,
    perimeter_m NUMERIC,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_polygon_geom
    ON public.project_polygons USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_project_polygon_project_id
    ON public.project_polygons (project_id);



-----------------------------------
-- 2. STATIC LAYERS (layers.*)
-----------------------------------

-- enp_green: loaded once from green.parquet
CREATE TABLE IF NOT EXISTS layers.enp_green (
    id SERIAL PRIMARY KEY,
    properties JSONB,           -- store attributes flexibly
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enp_green_geom
    ON layers.enp_green USING GIST (geom);

-- enp_buffer125_green: loaded once from buffer125_green.parquet
CREATE TABLE IF NOT EXISTS layers.enp_buffer125_green (
    id SERIAL PRIMARY KEY,
    properties JSONB,
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_enp_buffer125_green_geom
    ON layers.enp_buffer125_green USING GIST (geom);



-------------------------------------
-- 3. PROCESSING TABLES (per project)
-------------------------------------

-- Clipped green: "green" clipped to AOI polygons per project
CREATE TABLE IF NOT EXISTS processing.clipped_green (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL
        REFERENCES public.projects(id) ON DELETE CASCADE,
    src_id INT NOT NULL,                 -- layers.enp_green.id
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    properties JSONB                     -- copy/derived attributes
);

CREATE INDEX IF NOT EXISTS idx_clipped_green_geom
    ON processing.clipped_green USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_clipped_green_project_id
    ON processing.clipped_green (project_id);


-- Clipped buffer125_green: "buffer125_green" clipped to AOI, with UID
CREATE TABLE IF NOT EXISTS processing.clipped_buffer125_green (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL
        REFERENCES public.projects(id) ON DELETE CASCADE,
    src_id INT NOT NULL,                 -- layers.enp_buffer125_green.id
    uid TEXT,                            -- per-project UID if needed
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    properties JSONB
);

CREATE INDEX IF NOT EXISTS idx_clipped_buffer125_green_geom
    ON processing.clipped_buffer125_green USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_clipped_buffer125_green_project_id
    ON processing.clipped_buffer125_green (project_id);


-- Merged polygons: user polygons + clipped_green --> "merged_green"
CREATE TABLE IF NOT EXISTS processing.merged_green (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL
        REFERENCES public.projects(id) ON DELETE CASCADE,
    src_type TEXT NOT NULL,         -- 'user_polygon' or 'clipped_green'
    src_ref TEXT NOT NULL,          -- project_polygon.id or clipped_green.id
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    properties JSONB
);

CREATE INDEX IF NOT EXISTS idx_merged_green_geom
    ON processing.merged_green USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_merged_green_project_id
    ON processing.merged_green (project_id);


-- 125m buffer from merged_green, dissolved, with UID
CREATE TABLE IF NOT EXISTS processing.buffer125_merged_green (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL
        REFERENCES public.projects(id) ON DELETE CASCADE,
    uid TEXT NOT NULL,                   -- group identifier
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    properties JSONB
);

CREATE INDEX IF NOT EXISTS idx_buffer125_merged_green_geom
    ON processing.buffer125_merged_green USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_buffer125_merged_green_project_id
    ON processing.buffer125_merged_green (project_id);


-- Spatial join result: assigning UID/group to clipped_green & merged_green
CREATE TABLE IF NOT EXISTS processing.green_group_assignment (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL
        REFERENCES public.projects(id) ON DELETE CASCADE,

    target_table TEXT NOT NULL,      -- 'clipped_green' or 'merged_green'
    target_id INT NOT NULL,          -- id from that table
    uid TEXT NOT NULL,               -- UID from buffer layer

    area_ratio NUMERIC,              -- optional: overlap ratio
    intersects BOOLEAN,              -- true if ST_Intersects

    geom GEOMETRY(MULTIPOLYGON, 4326) -- optional for debugging/QA
);

CREATE INDEX IF NOT EXISTS idx_green_group_project_id
    ON processing.green_group_assignment (project_id);


-- Final calculated indices per UID (for Excel export)
CREATE TABLE IF NOT EXISTS processing.indices (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL
        REFERENCES public.project(id) ON DELETE CASCADE,
    uid TEXT NOT NULL,
    index_name TEXT NOT NULL,
    index_value NUMERIC,
    extra JSONB
);

CREATE INDEX IF NOT EXISTS idx_indices_project_id
    ON processing.indices (project_id);

CREATE INDEX IF NOT EXISTS idx_indices_uid
    ON processing.indices (uid);
