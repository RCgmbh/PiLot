/*-----------TABLE poi_categories-------------------------*/
DROP TABLE IF EXISTS poi_categories;

CREATE TABLE poi_categories(
	id serial PRIMARY KEY,
	parent_id integer REFERENCES poi_categories,
	name text NOT NULL
);

GRANT SELECT ON poi_categories TO pilotweb;
GRANT INSERT ON poi_categories TO pilotweb;
GRANT UPDATE ON poi_categories TO pilotweb;
GRANT DELETE ON poi_categories TO pilotweb;

/*-----------FUNCTION insert_poi_category-----------------*/

DROP FUNCTION IF EXISTS insert_poi_category;

CREATE OR REPLACE FUNCTION public.insert_poi_category(
	p_parent_id integer,
	p_name text
)
    RETURNS integer
    LANGUAGE 'sql'
AS $BODY$
	INSERT INTO poi_categories(
		parent_id, name
	) VALUES (
		p_parent_id, p_name
	)
	RETURNING id
$BODY$;

GRANT EXECUTE ON FUNCTION insert_poi_category to pilotweb;

/*---------- TABLE poi_features --------------------------*/

DROP TABLE IF EXISTS poi_features;

CREATE TABLE poi_features(
	id serial PRIMARY KEY,
	name text NOT NULL
);

GRANT SELECT ON poi_features TO pilotweb;
GRANT INSERT ON poi_features TO pilotweb;
GRANT UPDATE ON poi_features TO pilotweb;
GRANT DELETE ON poi_features TO pilotweb;

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
	valid_to timestamp,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL,
);

CREATE INDEX pois_coordinats_index
  ON pois
  USING GIST (coordinates);

GRANT SELECT ON pois TO pilotweb;
GRANT INSERT ON pois TO pilotweb;
GRANT UPDATE ON pois TO pilotweb;
GRANT DELETE ON pois TO pilotweb;


/*---------- TABLE poi_features_pois -----------------------*/

DROP TABLE IF EXISTS poi_features__pois;

CREATE TABLE poi_features__pois(
	feature_id integer references poi_features NOT NULL,
	poi_id integer references pois NOT NULL
);

GRANT SELECT ON poi_features__pois TO pilotweb;
GRANT INSERT ON poi_features__pois TO pilotweb;
GRANT UPDATE ON poi_features__pois TO pilotweb;
GRANT DELETE ON poi_features__pois TO pilotweb;

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
		coordinates,
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
	p_title text,
	p_description text,
	p_category_id integer,
	p_properties jsonb,
	p_latitude double precision,
	p_longitude double precision,
	p_valid_from timestamp,
	p_valid_to timestamp
)
RETURNS bigint AS 
'
	INSERT INTO pois(
		title, description, category_id, properties,
		coordinates,
		valid_from, valid_to, date_created, date_changed
	) VALUES (
		p_title, p_description, p_category_id, p_properties,
		ST_MakePoint(p_longitude, p_latitude),
		p_valid_from, p_valid_to, NOW(), NOW()
	)
	RETURNING ID;
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION insert_poi TO pilotweb;
GRANT USAGE, SELECT ON SEQUENCE pois_id_seq TO pilotweb;

/*----------- FUNCTION update_poi -------------------------*/

DROP FUNCTION IF EXISTS update_poi;

CREATE FUNCTION update_poi(
	p_id bigint,
	p_title text,
	p_description text,
	p_category_id integer,
	p_properties jsonb,
	p_latitude double precision,
	p_longitude double precision,
	p_valid_from timestamp,
	p_valid_to timestamp
)
RETURNS VOID AS 
'
	UPDATE pois
	SET
		title = p_title,
		description = p_description,
		category_id = p_category_id,
		properties = p_properties,
		coordinates = ST_MakePoint(p_longitude, p_latitude),
		valid_from = p_valid_from,
		valid_to = p_valid_to,
		date_changed = NOW()
	WHERE
		id = p_id
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION update_poi TO pilotweb;

/*----------- FUNCTION delete_poi -------------------------*/

DROP FUNCTION IF EXISTS delete_poi;

CREATE FUNCTION delete_poi(
	p_id bigint
)
RETURNS void AS 
'
	DELETE FROM pois
	WHERE id = p_id;
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION delete_poi TO pilotweb;

/*----------- FUNCTION find_pois -------------------------*/

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

GRANT EXECUTE ON FUNCTION find_pois TO pilotweb;

/*----------- FUNCTION read_poi -------------------------------------*/

DROP FUNCTION IF EXISTS read_poi;

CREATE FUNCTION read_poi(
	poi_id bigint
) RETURNS TABLE (
	id bigint,
	title text,
	description text,
	category_id integer,
	feature_ids integer[],
	properties jsonb,
	latitude double precision,
	longitude double precision,
	valid_from timestamp,
	valid_to timestamp
) AS $$
	SELECT 
		id,
		title,
		description,
		category_id,
		feature_ids,
		properties,
		latitude,
		longitude,
		valid_from,
		valid_to
	FROM all_pois
	WHERE
		id = poi_id
$$
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION read_poi TO pilotweb;

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
