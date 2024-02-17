/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  This will create the db structure for tracks
  ALL EXISTING TRACK DATA WILL BE LOST!

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/* DROP EXISTING ELEMENTS */
DROP FUNCTION IF EXISTS insert_track_segment_type;
DROP FUNCTION IF EXISTS update_track_segment_type;
DROP FUNCTION IF EXISTS delete_track_segment_type;
DROP FUNCTION IF EXISTS insert_track;
DROP FUNCTION IF EXISTS delete_track;
DROP FUNCTION IF EXISTS update_track_data;
DROP FUNCTION IF EXISTS insert_track_point;
DROP FUNCTION IF EXISTS delete_track_points;

/* DROP VIEW IF EXISTS blah; */
DROP TABLE IF EXISTS track_segments;
DROP TABLE IF EXISTS track_segment_types;
DROP TABLE IF EXISTS track_points;
DROP TABLE IF EXISTS tracks;

/*-----------TABLE track_segment_types -------------------------*/

CREATE TABLE track_segment_types(
	id serial PRIMARY KEY,
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
	stats_available boolean NOT NULL,
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

/*-----------TABLE track_points -------------------------*/

CREATE TABLE track_points(
	track_id integer REFERENCES tracks NOT NULL,
	utc bigint NOT NULL,
	boattime bigint NOT NULL,
	coordinates geography(POINT, 4326) NOT NULL,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

GRANT SELECT ON track_points TO pilotweb;
GRANT INSERT ON track_points TO pilotweb;
GRANT UPDATE ON track_points TO pilotweb;
GRANT DELETE ON track_points TO pilotweb;

CREATE INDEX track_points_coordinates_index
  ON track_points
  USING GIST (coordinates);

 CREATE INDEX IF NOT EXISTS track_points_track_id_index
   ON track_points 
   USING btree (track_id);

/*-----------FUNCTION insert_track_segment_type-----------------*/

CREATE OR REPLACE FUNCTION public.insert_track_segment_type(
	p_duration integer,
	p_distance integer,
	p_labels jsonb
)
RETURNS integer
LANGUAGE 'sql'
AS $BODY$
	INSERT INTO track_segment_types(
		duration, distance, labels, date_created, date_changed
	) VALUES (
		p_duration, p_distance, p_labels, NOW(), NOW()
	)
	RETURNING id
$BODY$;

GRANT EXECUTE ON FUNCTION insert_track_segment_type TO pilotweb;
GRANT USAGE, SELECT ON SEQUENCE track_segment_types_id_seq TO pilotweb;

/*-----------FUNCTION update_track_segment_type-----------------*/

CREATE OR REPLACE FUNCTION public.update_track_segment_type(
	p_id integer,
	p_duration integer,
	p_distance integer,
	p_labels jsonb
)
RETURNS integer 
LANGUAGE 'sql'
AS $BODY$
	UPDATE track_segment_types
	SET
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

/*-----------FUNCTION insert_track-----------------*/
-- inserts a new track, initializing start and end to one single time, and
-- the distance to 0

CREATE OR REPLACE FUNCTION public.insert_track(
	p_utc bigint,
	p_boattime bigint,
	p_boat text
)
RETURNS integer
LANGUAGE 'sql'
AS $BODY$
	INSERT INTO tracks(
		start_utc, end_utc, start_boattime, end_boattime, distance, boat, stats_available, date_created, date_changed
	) VALUES (
		p_utc, p_utc, p_boattime, p_boattime, 0, p_boat, false, NOW(), NOW()
	)
	RETURNING id
$BODY$;

GRANT EXECUTE ON FUNCTION insert_track TO pilotweb;

/*-----------FUNCTION delete_track-----------------*/
-- deletes a track and all connected segments and track_points

CREATE OR REPLACE FUNCTION public.delete_track(
	p_id integer
)
RETURNS void
LANGUAGE 'sql'
AS $BODY$
	DELETE FROM track_points WHERE track_id = p_id;
	DELETE FROM track_segments WHERE track_id = p_id;
	DELETE FROM tracks WHERE id = p_id;
$BODY$;

GRANT EXECUTE ON FUNCTION delete_track TO pilotweb;

/*-----------FUNCTION update_track_data-----------------*/
-- updates the track distance and start/end based on the track_points
-- deletes the track if no positions are available
-- deletes all track segments
-- sets stats_available to false

CREATE OR REPLACE FUNCTION public.update_track_data(
	p_id integer
)
RETURNS void
LANGUAGE 'plpgsql'
AS $$ BEGIN
	IF EXISTS (SELECT FROM track_points WHERE track_id = p_id) THEN
		UPDATE tracks SET (start_utc, end_utc, start_boattime, end_boattime, stats_available, distance, date_changed) = (
			SELECT
				MIN(utc), MAX(utc), MIN(boattime), MAX(boattime),
				FALSE,
				ST_Length(ST_MakeLine("coordinates"::geometry)::geography),
				NOW()
			FROM track_points tp WHERE track_id = p_id
		)
		WHERE id = p_id;
	ELSE
		PERFORM delete_track(p_id);
	END IF;
END $$;

GRANT EXECUTE ON FUNCTION update_track_data TO pilotweb;

/*-----------FUNCTION insert_track_point-----------------*/
-- inserts a track_point and updates the distance and start/end of the track

CREATE OR REPLACE FUNCTION public.insert_track_point(
	p_track_id integer,
	p_utc bigint,
	p_boattime bigint,
	p_latitude double precision,
	p_longitude double precision
)
RETURNS void
LANGUAGE 'sql'
AS $BODY$
	INSERT INTO track_points(
		track_id, utc, boatTime, coordinates, date_created, date_changed
	) VALUES (
		p_track_id, p_utc, p_boattime, ST_MakePoint(p_longitude, p_latitude), NOW(), NOW()
	);
	SELECT update_track_data(p_track_id);
$BODY$;

GRANT EXECUTE ON FUNCTION insert_track_point TO pilotweb;

/*-----------FUNCTION insert_track_point-----------------*/
-- deletes a range of track_points and updates the distance and start/end of the track

CREATE OR REPLACE FUNCTION public.delete_track_points(
	p_track_id integer,
	p_start bigint,
	p_end bigint,
	p_is_boattime boolean
)
RETURNS void
LANGUAGE 'sql'
AS $BODY$
	DELETE FROM track_points
	WHERE 
		track_id = p_track_id
		AND (
			(p_is_boattime = FALSE AND (utc >= p_start AND utc <= p_end))
			OR 
			(p_is_boattime = TRUE AND (boatTime >= p_start AND boattime <= p_end))
		);
	SELECT update_track_data(p_track_id);
$BODY$;

GRANT EXECUTE ON FUNCTION delete_track_points TO pilotweb;

