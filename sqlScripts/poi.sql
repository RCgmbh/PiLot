/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  This will create the db structure for POIs
  ALL EXISTING POI DATA WILL BE LOST!

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/* DROP EXISTING ELEMENTS */

DROP FUNCTION IF EXISTS insert_poi;
DROP FUNCTION IF EXISTS update_poi;
DROP FUNCTION IF EXISTS delete_poi;
DROP FUNCTION IF EXISTS find_pois;
DROP FUNCTION IF EXISTS read_poi;
DROP FUNCTION IF EXISTS read_external_poi;
DROP FUNCTION IF EXISTS insert_poi_category;
DROP FUNCTION IF EXISTS update_poi_category;
DROP FUNCTION IF EXISTS insert_poi_feature;
DROP VIEW IF EXISTS all_pois;
DROP VIEW IF EXISTS poi_latest_change;
DROP TABLE IF EXISTS poi_features__pois;
DROP TABLE IF EXISTS pois;
DROP TABLE IF EXISTS poi_categories;
DROP TABLE IF EXISTS poi_features;


/*-----------TABLE poi_categories-------------------------*/

CREATE TABLE poi_categories(
	id serial PRIMARY KEY,
	parent_id integer REFERENCES poi_categories,
	name text NOT NULL,
	labels jsonb,
	icon text,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL

);

GRANT SELECT ON poi_categories TO pilotweb;
GRANT INSERT ON poi_categories TO pilotweb;
GRANT UPDATE ON poi_categories TO pilotweb;
GRANT DELETE ON poi_categories TO pilotweb;

/*-----------FUNCTION insert_poi_category-----------------*/

CREATE OR REPLACE FUNCTION public.insert_poi_category(
	p_parent_id integer,
	p_name text,
	p_labels jsonb,
	p_icon text
)
    RETURNS integer
    LANGUAGE 'sql'
AS $BODY$
	INSERT INTO poi_categories(
		parent_id, name, labels, icon, date_created, date_changed
	) VALUES (
		p_parent_id, p_name, p_labels, p_icon, NOW(), NOW()
	)
	RETURNING id
$BODY$;

GRANT EXECUTE ON FUNCTION insert_poi_category to pilotweb;

/*-----------FUNCTION insert_poi_category-----------------*/

CREATE OR REPLACE FUNCTION public.update_poi_category(
	p_id integer,
	p_parent_id integer,
	p_name text,
	p_labels jsonb,
	p_icon text
)
    RETURNS void AS 
'
	UPDATE poi_categories
	SET
		parent_id = p_parent_id,
		name = p_name,
		labels = p_labels,
		icon = p_icon,
		date_changed = NOW()
	WHERE 
		id = p_id;
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION update_poi_category to pilotweb;

/*---------- TABLE poi_features --------------------------*/

CREATE TABLE poi_features(
	id serial PRIMARY KEY,
	name text NOT NULL,
	labels jsonb,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

GRANT SELECT ON poi_features TO pilotweb;
GRANT INSERT ON poi_features TO pilotweb;
GRANT UPDATE ON poi_features TO pilotweb;
GRANT DELETE ON poi_features TO pilotweb;

/*-----------FUNCTION insert_poi_feature -----------------*/

CREATE OR REPLACE FUNCTION public.insert_poi_feature(
	p_name text,
	p_labels jsonb
)
    RETURNS integer
    LANGUAGE 'sql'
AS $BODY$
	INSERT INTO poi_features(
		name, labels, date_created, date_changed
	) VALUES (
		p_name, p_labels, NOW(), NOW()
	)
	RETURNING id
$BODY$;

GRANT EXECUTE ON FUNCTION insert_poi_feature to pilotweb;

/*---------- TABLE pois ----------------------------------*/

CREATE TABLE pois(
	id bigserial PRIMARY KEY,
	title text NOT NULL,
	description text,
	category_id integer REFERENCES poi_categories NOT NULL,
	properties jsonb,
	coordinates geography(POINT, 4326) NOT NULL,
	valid_from timestamp,
	valid_to timestamp,
	source text,
	source_id text,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

CREATE INDEX pois_coordinates_index
  ON pois
  USING GIST (coordinates);

CREATE INDEX pois_source_index
  ON pois
  USING btree (source ASC NULLS LAST, source_id ASC NULLS LAST);

GRANT SELECT ON pois TO pilotweb;
GRANT INSERT ON pois TO pilotweb;
GRANT UPDATE ON pois TO pilotweb;
GRANT DELETE ON pois TO pilotweb;

/*---------- TABLE poi_features_pois -----------------------*/

CREATE TABLE poi_features__pois(
	feature_id integer references poi_features NOT NULL,
	poi_id integer references pois NOT NULL
);

GRANT SELECT ON poi_features__pois TO pilotweb;
GRANT INSERT ON poi_features__pois TO pilotweb;
GRANT UPDATE ON poi_features__pois TO pilotweb;
GRANT DELETE ON poi_features__pois TO pilotweb;

/*------------VIEW all_pois -------------------------------*/

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
		valid_to,
		source,
		source_id
	FROM pois LEFT JOIN poi_features__pois f ON pois.id = f.poi_id
	GROUP BY pois.id;

GRANT SELECT ON all_pois TO pilotweb;

/*----------- FUNCTION insert_poi -------------------------*/

CREATE FUNCTION insert_poi(
	p_title text,
	p_description text,
	p_category_id integer,
	p_properties jsonb,
	p_latitude double precision,
	p_longitude double precision,
	p_valid_from timestamp,
	p_valid_to timestamp,
	p_source text,
	p_source_id text
)
RETURNS bigint AS 
'
	INSERT INTO pois(
		title, description, category_id, properties,
		coordinates,
		valid_from, valid_to,
		source, source_id,
		date_created, date_changed
	) VALUES (
		p_title, p_description, p_category_id, p_properties,
		ST_MakePoint(p_longitude, p_latitude),
		p_valid_from, p_valid_to,
		p_source, p_source_id,
		NOW(), NOW()
	)
	RETURNING ID;
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION insert_poi TO pilotweb;
GRANT USAGE, SELECT ON SEQUENCE pois_id_seq TO pilotweb;

/*----------- FUNCTION update_poi -------------------------*/

CREATE FUNCTION update_poi(
	p_id bigint,
	p_title text,
	p_description text,
	p_category_id integer,
	p_properties jsonb,
	p_latitude double precision,
	p_longitude double precision,
	p_valid_from timestamp,
	p_valid_to timestamp,
	p_source text,
	p_source_id text
)
RETURNS bigint AS 
'
	UPDATE pois SET
		title = p_title,
		description = p_description,
		category_id = p_category_id,
		properties = p_properties,
		coordinates = ST_MakePoint(p_longitude, p_latitude),
		valid_from = p_valid_from,
		valid_to = p_valid_to,
		source = p_source,
		source_id = p_source_id,
		date_changed = NOW()
	WHERE
		id = p_id
	RETURNING p_id;
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION update_poi TO pilotweb;

/*----------- FUNCTION delete_poi -------------------------*/

CREATE FUNCTION delete_poi(
	p_id bigint
)
RETURNS void AS 
'
	DELETE FROM poi_features__pois
	WHERE poi_id = p_id;
	DELETE FROM pois
	WHERE id = p_id;
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION delete_poi TO pilotweb;

/*----------- FUNCTION find_pois -------------------------*/

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
	valid_to timestamp,
	source text,
	source_id text
) AS $$
	SELECT 
		id,
		title,
		category_id,
		feature_ids,
		latitude,
		longitude,
		valid_from,
		valid_to,
		source,
		source_id
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
	valid_to timestamp,
	source text,
	source_id text
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
		valid_to,
		source,
		source_id
	FROM all_pois
	WHERE
		id = poi_id
$$
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION read_poi TO pilotweb;

/*----------- FUNCTION read_external_poi -------------------------------------*/

CREATE FUNCTION read_external_poi(
	p_source text, p_source_id text
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
	valid_to timestamp,
	source text,
	source_id text
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
		valid_to,
		source,
		source_id
	FROM all_pois
	WHERE
		source = p_source AND source_id = p_source_id;
$$
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION read_external_poi TO pilotweb;

/* view poi_latest_changes */

CREATE VIEW poi_latest_change AS (
	SELECT MAX(date_changed) date_changed FROM (
		SELECT MAX(date_changed) date_changed from pois
		UNION ALL
		SELECT MAX(date_changed) date_changed from poi_categories
		UNION ALL
		SELECT MAX(date_changed) date_changed from poi_features
	) AS latestChanges
ORDER BY date_changed DESC);

GRANT SELECT ON poi_latest_change TO pilotweb;

