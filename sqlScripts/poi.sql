/*-----------TABLE poi_categories-------------------------*/
DROP TABLE IF EXISTS poi_categories;

CREATE TABLE poi_categories(
	id serial PRIMARY KEY,
	parent_id integer REFERENCES poi_categories,
	title text NOT NULL
);

GRANT SELECT ON poi_categories TO pilotweb;
GRANT INSERT ON poi_categories TO pilotweb;
GRANT UPDATE ON poi_categories TO pilotweb;
GRANT DELETE ON poi_categories TO pilotweb;

/*-----------FUNCTION insert_poi_category-----------------*/

DROP FUNCTION IF EXISTS insert_poi_category;

CREATE FUNCTION insert_poi_category(
	parent_id integer,
	title text
) RETURNS integer AS '
	INSERT INTO poi_categories(
		parent_id, title
	) VALUES (
		parent_id, title
	)
	RETURNING id
' LANGUAGE SQL;

/*---------- TABLE poi_features --------------------------*/

DROP TABLE IF EXISTS poi_features;

CREATE TABLE poi_features(
	id serial PRIMARY KEY,
	title text NOT NULL
);

/*---------- TABLE poi_features_pois -----------------------*/

DROP TABLE IF EXISTS poi_features__pois;

CREATE TABLE poi_features__pois(
	feature_id integer references poi_features NOT NULL,
	poi_id integer references pois NOT NULL
);

/*---------- TABLE pois ----------------------------------*/

DROP TABLE IF EXISTS pois;

CREATE TABLE pois(
	id bigserial PRIMARY KEY,
	title text NOT NULL,
	description text,
	category_id integer REFERENCES poi_categories NOT NULL,
	properties jsonb,
	coordinates geography(POINT, 4326) NOT NULL,
	valid_from timestamp,
	valid_to timestamp
);

CREATE INDEX pois_coordinats_index
  ON pois
  USING GIST (coordinates);

GRANT SELECT ON pois TO pilotweb;
GRANT INSERT ON pois TO pilotweb;
GRANT UPDATE ON pois TO pilotweb;
GRANT DELETE ON pois TO pilotweb;

/*------------VIEW all_pois -------------------------------*/

DROP VIEW IF EXISTS all_pois;

CREATE VIEW all_pois AS 
	SELECT 
		id,
		title,
		description,
		category_id,
		array_agg(f.feature_id) as feature_ids,
		properties,
		ST_Y(coordinates::geometry) AS latitude,
		ST_X(coordinates::geometry) AS longitude,
		valid_from,
		valid_to
	FROM pois LEFT JOIN poi_features__pois f ON pois.id = f.poi_id
	GROUP BY pois.id;

GRANT SELECT ON all_pois TO pilotweb;

/*----------- FUNCTION insert_poi -------------------------*/
DROP FUNCTION IF EXISTS insert_poi;

CREATE FUNCTION insert_poi(
	title text,
	description text,
	category_id integer,
	properties jsonb,
	latitude double precision,
	longitude double precision,
	valid_from timestamp,
	valid_to timestamp
)
RETURNS void AS 
'
	INSERT INTO pois(
		title, description, category_id, properties, coordinates, valid_from, valid_to
	) VALUES (
		title, description, category_id, properties, ST_MakePoint(longitude, latitude), valid_from, valid_to
	);
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION insert_poi TO pilotweb;

/*----------- FUNCTION insert_poi -------------------------*/

DROP FUNCTION IF EXISTS find_pois;

CREATE FUNCTION find_pois(
	min_lat double precision,
	min_lng double precision,
	max_lat double precision,
	max_lng double precision,
	categories integer[],
	features integer[]
) RETURNS TABLE (
	id bigint,
	title text,
	category_id integer,
	feature_ids integer[],
	latitude double precision,
	longitude double precision,
	valid_from timestamp,
	valid_to timestamp
) AS $$
	SELECT 
		id,
		title,
		category_id,
		feature_ids,
		latitude,
		longitude,
		valid_from,
		valid_to
	FROM all_pois
	WHERE
		ST_Intersects (
			coordinates,
			ST_MakeEnvelope (
				min_lng,
				min_lat,
				max_lng,
				max_lat,
				4326 -- projection epsg-code
			)::geography(POLYGON) 
		)
	AND category_id = ANY (categories)
	AND features <@ feature_ids
$$
LANGUAGE SQL;

--SELECT * FROM find_pois(45, -10, 48, -5, '{1, 2}', '{1,2}')

GRANT EXECUTE ON FUNCTION find_pois TO pilotweb;

/*----------- Not used as long as raspi postgis does not support ST_AsGeoJson -------------------------*/

/*CREATE OR REPLACE FUNCTION find_pois_geojson(
	min_lat double precision,
	min_lng double precision,
	max_lat double precision,
	max_lng double precision
	
) RETURNS json
AS $$
	SELECT json_build_object(
    	'type', 'FeatureCollection',
    	'features', json_agg(ST_AsGeoJSON(pois.*)::json)
    )
FROM find_pois (min_lng, min_lat, max_lng, max_lat) as pois;
$$
LANGUAGE SQL;*/
