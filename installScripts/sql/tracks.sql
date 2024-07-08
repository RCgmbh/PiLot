/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  This will create the db structure for tracks
  ALL EXISTING TRACK DATA WILL BE LOST!

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/* DROP EXISTING ELEMENTS */
DROP FUNCTION IF EXISTS insert_track_segment_type;
DROP FUNCTION IF EXISTS update_track_segment_type;
DROP FUNCTION IF EXISTS delete_track_segment_type;
DROP FUNCTION IF EXISTS read_tracks;
DROP FUNCTION IF EXISTS insert_track;
DROP FUNCTION IF EXISTS delete_track;
DROP FUNCTION IF EXISTS update_track_data;
DROP FUNCTION IF EXISTS read_track_segments_by_track;
DROP FUNCTION IF EXISTS save_track_segment;
DROP FUNCTION IF EXISTS delete_track_segments;
DROP FUNCTION IF EXISTS read_track_points;
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

GRANT USAGE, SELECT ON SEQUENCE track_segment_types_id_seq TO pilotweb;

/*-----------TABLE tracks -------------------------*/

CREATE TABLE tracks(
	id serial PRIMARY KEY,
	start_utc bigint NOT NULL,
	end_utc bigint NOT NULL,
	start_boattime bigint NOT NULL,
	end_boattime bigint NOT NULL,
	distance real NOT NULL,
	boat text NOT NULL,
	stats_dirty boolean NOT NULL,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

GRANT SELECT ON tracks TO pilotweb;
GRANT INSERT ON tracks TO pilotweb;
GRANT UPDATE ON tracks TO pilotweb;
GRANT DELETE ON tracks TO pilotweb;

GRANT USAGE, SELECT ON SEQUENCE tracks_id_seq TO pilotweb;

/*-----------TABLE track_segments -------------------------*/

CREATE TABLE track_segments(
	type_id integer REFERENCES track_segment_types NOT NULL,
	track_id integer REFERENCES tracks NOT NULL,
	start_utc bigint NOT NULL,
	end_utc bigint NOT NULL,
	start_boattime bigint NOT NULL,
	end_boattime bigint NOT NULL,
    distance_mm integer,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

ALTER TABLE public.track_segments
    ADD CONSTRAINT track_segments_track_id_type_id_key UNIQUE (type_id, track_id);

CREATE INDEX track_segments_track_id_index
   ON track_segments 
   USING btree (track_id);

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

 CREATE INDEX track_points_track_id_index
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

/*-----------FUNCTION read_tracks-----------------*/
-- reads all tracks overlapping a certain period of time

CREATE OR REPLACE FUNCTION public.read_tracks(
	p_start bigint,
	p_end bigint,
	p_is_boattime boolean
)
RETURNS TABLE (
	id integer,
	start_utc bigint,
	end_utc bigint,
	start_boattime bigint,
	end_boattime bigint,
	distance real,
	boat text,
	stats_dirty boolean,
	date_created timestamp,
	date_changed timestamp
)
LANGUAGE 'sql'
AS $BODY$
	SELECT
		id,
		start_utc,
		end_utc,
		start_boattime,
		end_boattime,
		distance,
		boat,
		stats_dirty,
		date_created,
		date_changed
	FROM
		tracks
	WHERE
		(p_is_boattime = FALSE AND start_utc <= p_end AND end_utc >= p_start)
		OR
		(p_is_boattime = TRUE AND start_boattime <= p_end AND end_boattime >= p_start)
	ORDER BY start_utc ASC

$BODY$;

GRANT EXECUTE ON FUNCTION read_tracks TO pilotweb;

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
		start_utc, end_utc, start_boattime, end_boattime, distance, boat, stats_dirty, date_created, date_changed
	) VALUES (
		p_utc, p_utc, p_boattime, p_boattime, 0, p_boat, FALSE, NOW(), NOW()
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
-- deletes all track segments
-- sets stats_dirty to true
-- deletes the track if it has no track_points

CREATE OR REPLACE FUNCTION public.update_track_data(
	p_id integer
)
RETURNS void
LANGUAGE 'plpgsql'
AS $$ BEGIN
	IF EXISTS (SELECT FROM track_points WHERE track_id = p_id) THEN
		WITH ordered_track_points AS (
			SELECT utc, boattime, coordinates
			FROM track_points
			WHERE track_id = p_id
			ORDER BY utc ASC
		)	
		UPDATE tracks
		SET (start_utc, end_utc, start_boattime, end_boattime, stats_dirty, distance, date_changed) = (
			SELECT
				MIN(utc), MAX(utc), MIN(boattime), MAX(boattime),
				TRUE,
				ST_Length(ST_MakeLine("coordinates"::geometry)::geography),
				NOW()
			FROM ordered_track_points 
		)
		WHERE id = p_id;
	ELSE
		PERFORM delete_track(p_id);
	END IF;
END $$;

GRANT EXECUTE ON FUNCTION update_track_data TO pilotweb;

/*-----------FUNCTION read_track_segments-----------------*/
-- reads all track segments for a certain track

CREATE OR REPLACE FUNCTION public.read_track_segments_by_track(
	p_track_id integer
)
RETURNS TABLE (
	type_id integer,
	track_id integer,
	start_utc bigint,
	end_utc bigint,
	start_boattime bigint,
	end_boattime bigint,
	distance_mm integer
)
LANGUAGE 'sql'
AS $BODY$
	SELECT
		type_id,
		track_id,
		start_utc,
		end_utc,
		start_boattime,
		end_boattime,
		distance_mm
	FROM
		track_segments
	WHERE
		track_id = p_track_id
$BODY$;

GRANT EXECUTE ON FUNCTION read_track_segments_by_track TO pilotweb;

/*-----------FUNCTION save_track_segment -----------------*/
-- saves a track segment, replacing any existing segment for
-- the same type and track.

CREATE OR REPLACE FUNCTION public.save_track_segment(
	p_type_id integer,
	p_track_id integer,
	p_start_utc bigint,
	p_end_utc bigint,
	p_start_boattime bigint,
	p_end_boattime bigint,
	p_distance_mm integer
)
RETURNS void
LANGUAGE 'plpgsql'
AS $$ BEGIN
	IF EXISTS (SELECT FROM track_segments WHERE	track_id = p_track_id AND type_id = p_type_id) THEN
		UPDATE track_segments
		SET
			start_utc = p_start_utc, end_utc = p_end_utc,
			start_boattime = p_start_boattime, end_boattime = p_end_boattime,
			distance_mm = p_distance_mm,
			date_changed = NOW()
		WHERE 
			track_id = p_track_id AND type_id = p_type_id;
	ELSE
		INSERT INTO track_segments (
			type_id, track_id, 
			start_utc, end_utc,	start_boattime,	end_boattime,
			distance_mm,
			date_created, date_changed
		)
		VALUES (
			p_type_id, p_track_id,
			p_start_utc, p_end_utc, p_start_boattime, p_end_boattime,
			p_distance_mm,
			NOW(), NOW()
		);
	END IF;
END $$;

GRANT EXECUTE ON FUNCTION save_track_segment TO pilotweb;

/*-----------FUNCTION delete_track_segments -----------------*/
-- deletes all track segments for one or all tracks and of one or all types

CREATE OR REPLACE FUNCTION public.delete_track_segments(
	p_type_id integer,
	p_track_id integer
)
RETURNS void
LANGUAGE 'sql'
AS $BODY$
	DELETE FROM track_segments
	WHERE 
		    ((p_track_id is null) OR (track_id = p_track_id))
		AND ((p_type_id is null) OR (type_id = p_type_id));
$BODY$;

GRANT EXECUTE ON FUNCTION delete_track_segments TO pilotweb;

/*-----------FUNCTION read_track_points-----------------*/
-- reads all track points of a track, optionally limited by start-/endtime

CREATE OR REPLACE FUNCTION public.read_track_points(
	p_track_id integer,
	p_start bigint,
	p_end bigint,
	p_is_boattime boolean
)
RETURNS TABLE (
	utc bigint,
	boattime bigint,
	latitude double precision,
	longitude double precision,
	date_created timestamp,
	date_changed timestamp
)
LANGUAGE 'sql'
AS $BODY$
	SELECT
		utc, 
		boattime,
		ST_Y(coordinates::geometry) AS latitude,
		ST_X(coordinates::geometry) AS longitude,
		date_created,
		date_changed
	FROM
		track_points
	WHERE
		track_id = p_track_id
		AND ((p_start is null) OR (p_is_boattime = FALSE AND utc >= p_start) OR (p_is_boattime = TRUE AND boattime >= p_start))
		AND ((p_end is null) OR (p_is_boattime = FALSE AND utc <= p_end) OR (p_is_boattime = TRUE AND boattime <= p_end))
	ORDER BY utc ASC
$BODY$;

GRANT EXECUTE ON FUNCTION read_track_points TO pilotweb;

/*-----------FUNCTION insert_track_point-----------------*/
-- inserts a track_point and optionally updates the distance and start/end of the track

CREATE OR REPLACE FUNCTION public.insert_track_point(
	p_track_id integer,
	p_utc bigint,
	p_boattime bigint,
	p_latitude double precision,
	p_longitude double precision,
	p_update_track_data boolean
)
RETURNS void
LANGUAGE 'plpgsql'
AS $$ BEGIN
	INSERT INTO track_points(
		track_id, utc, boatTime, coordinates, date_created, date_changed
	) VALUES (
		p_track_id, p_utc, p_boattime, ST_MakePoint(p_longitude, p_latitude), NOW(), NOW()
	);
	IF (p_update_track_data = TRUE) THEN
		PERFORM update_track_data(p_track_id);
	END IF;
END $$;

/*-----------FUNCTION delete_track_point-----------------*/
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

