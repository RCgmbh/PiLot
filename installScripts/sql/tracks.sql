/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  This will create the db structure for tracks
  ALL EXISTING POI DATA WILL BE LOST!

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/* DROP EXISTING ELEMENTS */

DROP FUNCTION IF EXISTS insert_track_segment_type;
DROP FUNCTION IF EXISTS update_track_segment_type;
DROP FUNCTION IF EXISTS delete_track_segment_type;
/* DROP VIEW IF EXISTS blah; */
DROP TABLE IF EXISTS track_segment_types;
DROP TABLE IF EXISTS tracks;
DROP TABLE IF EXISTS track_segments;

/*-----------TABLE track_segment_types -------------------------*/

CREATE TABLE track_segment_types(
	id serial PRIMARY KEY,
	criterion text NOT NULL,
	duration integer,
	distance integer,
	labels jsonb,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

GRANT SELECT ON track_segment_types TO pilotweb;
GRANT INSERT ON track_segment_types TO pilotweb;
GRANT UPDATE ON track_segment_types TO pilotweb;
GRANT DELETE ON track_segment_types TO pilotweb;

/*-----------TABLE tracks -------------------------*/

CREATE TABLE tracks(
	id serial PRIMARY KEY,
	start_utc bigint NOT NULL,
	end_utc bigint NOT NULL,
	start_boattime bigint NOT NULL,
	end_boattime bigint NOT NULL,
	distance real NOT NULL,
	boat text NOT NULL,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

GRANT SELECT ON tracks TO pilotweb;
GRANT INSERT ON tracks TO pilotweb;
GRANT UPDATE ON tracks TO pilotweb;
GRANT DELETE ON tracks TO pilotweb;

/*-----------TABLE track_segments -------------------------*/

CREATE TABLE track_segments(
	id serial PRIMARY KEY,
	type_id integer REFERENCES track_segment_types NOT NULL,
	track_id integer REFERENCES tracks NOT NULL,
	start_utc bigint NOT NULL,
	end_utc bigint NOT NULL,
	start_boattime bigint NOT NULL,
	end_boattime bigint NOT NULL,
	distance integer,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

GRANT SELECT ON track_segments TO pilotweb;
GRANT INSERT ON track_segments TO pilotweb;
GRANT UPDATE ON track_segments TO pilotweb;
GRANT DELETE ON track_segments TO pilotweb;

/*-----------FUNCTION insert_track_segment_type-----------------*/

CREATE OR REPLACE FUNCTION public.insert_track_segment_type(
	p_criterion text,
	p_duration integer,
	p_distance integer,
	p_labels jsonb
)
RETURNS integer
LANGUAGE 'sql'
AS $BODY$
	INSERT INTO track_segment_types(
		criterion, duration, distance, labels, date_created, date_changed
	) VALUES (
		p_criterion, p_duration, p_distance, p_labels, NOW(), NOW()
	)
	RETURNING id
$BODY$;

GRANT EXECUTE ON FUNCTION insert_track_segment_type TO pilotweb;
GRANT USAGE, SELECT ON SEQUENCE track_segment_types_id_seq TO pilotweb;

/*-----------FUNCTION update_track_segment_type-----------------*/

CREATE OR REPLACE FUNCTION public.update_track_segment_type(
	p_id integer,
	p_criterion text,
	p_duration integer,
	p_distance integer,
	p_labels jsonb
)
RETURNS integer 
LANGUAGE 'sql'
AS $BODY$
	UPDATE track_segment_types
	SET
		criterion = p_criterion,
		duration = p_duration,
		distance = p_distance,
		labels = p_labels,
		date_changed = NOW()
	WHERE
		id = p_id
	RETURNING p_id;
$BODY$;


GRANT EXECUTE ON FUNCTION update_track_segment_type to pilotweb;

/*-----------FUNCTION delete_track_segment_type-----------------*/
-- Deletes a track_segment_type, and with it all track segments for this type
CREATE OR REPLACE FUNCTION public.delete_track_segment_type(
	p_id integer
)
RETURNS void 
LANGUAGE 'sql'
AS $BODY$
	DELETE FROM track_segments 
	WHERE type_id = p_id;
	DELETE FROM track_segment_types
	WHERE id = p_id;
$BODY$;

GRANT EXECUTE ON FUNCTION delete_track_segment_type TO pilotweb;