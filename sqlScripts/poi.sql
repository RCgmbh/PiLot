/*---------- TABLE pois ----------------------------------*/

CREATE TABLE pois(
	id bigserial PRIMARY KEY,
	title text not null,
	position geography(POINT, 4326)
);

GRANT SELECT ON pois TO pilotweb;
GRANT INSERT ON pois TO pilotweb;
GRANT UPDATE ON pois TO pilotweb;
GRANT DELETE ON pois TO pilotweb;

/*----------- FUNCTION insert_poi -------------------------*/

CREATE OR REPLACE FUNCTION insert_poi(
	title text,
	latitude double precision,
	longitude double precision	
)
RETURNS void AS 
'
	INSERT INTO pois(title, position)
	VALUES ($1, ST_MakePoint(longitude, latitude));
'
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION insert_poi(text, double precision, double precision) to pilotweb;

/*----------- FUNCTION insert_poi -------------------------*/

CREATE OR REPLACE FUNCTION find_pois(
	min_lat double precision,
	min_lng double precision,
	max_lat double precision,
	max_lng double precision
) RETURNS TABLE (
	id bigint,
	title text,
	latitude double precision,
	longitude double precision
) AS $$
	SELECT 
		id, title, ST_Y(position::geometry) AS latitude, ST_X(position::geometry) AS longitude
	FROM pois
	WHERE ST_Intersects (
		position,
		ST_MakeEnvelope (
			min_lng,
			min_lat,
			max_lng,
			max_lat,
			4326 -- projection epsg-code
		)::geography(POLYGON) 
	)
$$
LANGUAGE SQL;

GRANT EXECUTE ON FUNCTION find_pois(double precision, double precision, double precision, double precision) to pilotweb;

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
