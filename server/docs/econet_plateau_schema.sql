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
    geom GEOMETRY(POLYGON, 4326),
    processed BOOLEAN NOT NULL DEFAULT FALSE,
    indexa TEXT,
    indexb TEXT,
    indexba TEXT
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
    uid UUID DEFAULT NULL,               -- optional unique identifier
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
    uid UUID DEFAULT uuid_generate_v4(),
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
    uid UUID DEFAULT NULL,          -- optional unique identifier
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
    uid UUID DEFAULT uuid_generate_v4(),
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL,
    properties JSONB
);

CREATE INDEX IF NOT EXISTS idx_buffer125_merged_green_geom
    ON processing.buffer125_merged_green USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_buffer125_merged_green_project_id
    ON processing.buffer125_merged_green (project_id);


-- clipped_green_joined: clipped_green joined with clipped_buffer125_green
CREATE TABLE IF NOT EXISTS processing.clipped_green_joined (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL
        REFERENCES public.projects(id) ON DELETE CASCADE,
    uid UUID NOT NULL,               -- from buffer125_merged_green
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_clipped_green_joined_geom
    ON processing.clipped_green_joined USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_clipped_green_joined_project_id
    ON processing.clipped_green_joined (project_id);


-- merged_green_joined: merged_green joined with buffer125_merged_green
CREATE TABLE IF NOT EXISTS processing.merged_green_joined (
    id SERIAL PRIMARY KEY,
    project_id UUID NOT NULL
        REFERENCES public.projects(id) ON DELETE CASCADE,
    uid UUID NOT NULL,               -- from buffer125_merged_green
    geom GEOMETRY(MULTIPOLYGON, 4326) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_merged_green_joined_geom
    ON processing.merged_green_joined USING GIST (geom);

CREATE INDEX IF NOT EXISTS idx_merged_green_joined_project_id
    ON processing.merged_green_joined (project_id);

----------------------------------------