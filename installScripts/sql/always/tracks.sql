/* *****************************************************

  This will create or update the db structure for tracks
  
***************************************************** */

DROP VIEW IF EXISTS public.all_track_segments;
DROP FUNCTION IF EXISTS public.insert_track_segment_type;
DROP FUNCTION IF EXISTS public.update_track_segment_type;
DROP FUNCTION IF EXISTS public.delete_track_segment_type;
DROP FUNCTION IF EXISTS public.read_tracks;
DROP FUNCTION IF EXISTS public.find_tracks;
DROP FUNCTION IF EXISTS public.insert_track;
DROP FUNCTION IF EXISTS public.delete_track;
DROP FUNCTION IF EXISTS public.update_track_data;
DROP FUNCTION IF EXISTS public.update_track_boat;
DROP FUNCTION IF EXISTS public.read_track_segments_by_track;
DROP FUNCTION IF EXISTS public.find_track_segments;
DROP FUNCTION IF EXISTS public.save_track_segment;
DROP FUNCTION IF EXISTS public.delete_track_segments;
DROP FUNCTION IF EXISTS public.read_track_points;
DROP FUNCTION IF EXISTS public.insert_track_point;
DROP FUNCTION IF EXISTS public.delete_track_points;

/*-----------TABLE track_segment_types -------------------------*/

CREATE TABLE IF NOT EXISTS track_segment_types(
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

CREATE TABLE IF NOT EXISTS tracks(
	id serial PRIMARY KEY,
	start_utc bigint,
	end_utc bigint,
	start_boattime bigint,
	end_boattime bigint,
	distance real NOT NULL,
	boat text NOT NULL,
	date_created timestamp NOT NULL,
	date_changed timestamp NOT NULL
);

GRANT SELECT ON tracks TO pilotweb;
GRANT INSERT ON tracks TO pilotweb;
GRANT UPDATE ON tracks TO pilotweb;
GRANT DELETE ON tracks TO pilotweb;

GRANT USAGE, SELECT ON SEQUENCE tracks_id_seq TO pilotweb;

CREATE INDEX IF NOT EXISTS track_start_utc_index ON tracks USING btree (start_utc);
CREATE INDEX IF NOT EXISTS track_end_utc_index ON tracks USING btree (end_utc);
CREATE INDEX IF NOT EXISTS track_start_boattime_index ON tracks USING btree (start_boattime);
CREATE INDEX IF NOT EXISTS track_end_boattime_index ON tracks USING btree (end_boattime);

/*-----------TABLE track_segments -------------------------*/

CREATE TABLE IF NOT EXISTS track_segments(
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
    DROP CONSTRAINT IF EXISTS track_segments_track_id_type_id_key;

ALTER TABLE public.track_segments
    ADD CONSTRAINT track_segments_track_id_type_id_key UNIQUE (type_id, track_id);

CREATE INDEX IF NOT EXISTS track_segments_track_id_index
   ON track_segments 
   USING btree (track_id);

ALTER TABLE track_segments ADD COLUMN IF NOT EXISTS speed double precision;

CREATE INDEX IF NOT EXISTS track_segments_type_speed_index ON track_segments (type_id, speed DESC);

UPDATE track_segments SET speed = distance_mm::double precision / (end_utc - start_utc)::double precision;

GRANT SELECT ON track_segments TO pilotweb;
GRANT INSERT ON track_segments TO pilotweb;
GRANT UPDATE ON track_segments TO pilotweb;
GRANT DELETE ON track_segments TO pilotweb;


/*-----------TABLE track_points -------------------------*/

CREATE TABLE IF NOT EXISTS track_points(
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

CREATE INDEX IF NOT EXISTS track_points_coordinates_index
  ON track_points
  USING GIST (coordinates);

 CREATE INDEX IF NOT EXISTS track_points_track_id_index
   ON track_points 
   USING btree (track_id);

/*-----------VIEW all_track_segments-----------------*/

CREATE VIEW public.all_track_segments
 AS
  SELECT 
 	type_id,
	track_id,
	start_utc,
	end_utc,
	start_boattime,
	end_boattime,
	distance_mm,
	speed,
	boat,
	row_number() over (PARTITION BY type_id, boat, year ORDER BY speed DESC) as year_rank,
	row_number() over (PARTITION BY type_id, boat ORDER BY speed DESC) as overall_rank
 FROM (
 SELECT ts.type_id,
    ts.track_id,
    ts.start_utc,
    ts.end_utc,
    ts.start_boattime,
    ts.end_boattime,
    ts.distance_mm,
    ts.speed,
    tr.boat,
    EXTRACT(year FROM to_timestamp((ts.start_boattime / 1000)::double precision)) AS year
   FROM track_segments ts
     JOIN tracks tr ON ts.track_id = tr.id
 ) AS joinedTracks;

GRANT SELECT ON all_track_segments TO pilotweb;

/*-----------FUNCTION insert_track_segment_type-----------------*/

CREATE FUNCTION public.insert_track_segment_type(
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

CREATE FUNCTION public.update_track_segment_type(
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

CREATE FUNCTION public.delete_track_segment_type(
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

CREATE FUNCTION public.read_tracks(
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
		date_created,
		date_changed
	FROM
		tracks
	WHERE
		(p_is_boattime = FALSE AND start_utc IS NOT NULL AND start_utc < p_end AND end_utc IS NOT NULL AND end_utc > p_start)
		OR
		(p_is_boattime = TRUE AND start_boattime IS NOT NULL AND start_boattime < p_end AND end_boattime IS NOT NULL AND end_boattime > p_start)
	ORDER BY start_utc ASC

$BODY$;

GRANT EXECUTE ON FUNCTION read_tracks TO pilotweb;

/*-----------FUNCTION find_tracks-----------------*/
-- finds all tracks overlapping a certain period of time for one or many
-- specific boats. Includes information about the fastest segments for
-- each track.

CREATE FUNCTION public.find_tracks(
	p_start bigint,
	p_end bigint,
	p_is_boattime boolean,
	p_boats text[]
)
RETURNS TABLE(
	id integer,
	start_utc bigint,
	end_utc bigint,
	start_boattime bigint,
	end_boattime bigint,
	distance real,
	boat text,
	type_ids integer [],
	year_ranks bigint[],
	overall_ranks bigint[]
) 
LANGUAGE 'sql'
AS $BODY$
	SELECT
	 tracks.id,
	 tracks.start_utc,
	 tracks.end_utc,
	 tracks.start_boattime,
	 tracks.end_boattime,
	 tracks.distance,
	 tracks.boat,
	 array_remove(array_agg(segments.type_id), NULL) AS type_ids,
	 array_remove(array_agg(segments.year_rank), NULL) AS year_ranks,
	 array_remove(array_agg(segments.overall_rank), NULL) AS overall_ranks 
	FROM
		tracks
		LEFT JOIN
			(SELECT track_id, type_id, year_rank, overall_rank
			FROM all_track_segments
			WHERE year_rank = 1)
			AS segments
		ON tracks.id = segments.track_id
	WHERE
		( 
			(p_is_boattime = FALSE AND (p_end IS NULL OR start_utc < p_end) AND (p_start IS NULL OR end_utc > p_start))
			OR
			(p_is_boattime = TRUE AND (p_end IS NULL OR start_boattime < p_end) AND (p_start IS NULL OR end_boattime > p_start))
		)
		AND (
			p_boats IS NULL OR array_length(p_boats, 1) IS NULL OR boat = ANY (p_boats)
		)
	GROUP BY tracks.id
$BODY$;

GRANT EXECUTE ON FUNCTION find_tracks TO pilotweb;

/*-----------FUNCTION insert_track-----------------*/
-- inserts a new track, setting the distance to 0

CREATE FUNCTION public.insert_track(
	p_boat text
)
RETURNS integer
LANGUAGE 'sql'
AS $BODY$
	INSERT INTO tracks(
		distance, boat, date_created, date_changed
	) VALUES (
		0, p_boat, NOW(), NOW()
	)
	RETURNING id
$BODY$;

GRANT EXECUTE ON FUNCTION insert_track TO pilotweb;

/*-----------FUNCTION delete_track-----------------*/
-- deletes a track and all connected segments and track_points

CREATE FUNCTION public.delete_track(
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

CREATE FUNCTION public.update_track_data(
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
		SET (start_utc, end_utc, start_boattime, end_boattime, distance, date_changed) = (
			SELECT
				MIN(utc), MAX(utc), MIN(boattime), MAX(boattime),
				ST_Length(ST_MakeLine("coordinates"::geometry)::geography),
				NOW()
			FROM ordered_track_points 
		)
		WHERE id = p_id;
	ELSE
		UPDATE tracks
		SET start_utc = NULL, end_utc = NULL, start_boattime = NULL, end_boattime = NULL, distance = 0, date_changed = NOW()
		WHERE id = p_id;
		DELETE FROM track_points WHERE track_id = p_id;
		DELETE FROM track_segments WHERE track_id = p_id;
	END IF;
END $$;

GRANT EXECUTE ON FUNCTION update_track_data TO pilotweb;

/*-----------FUNCTION update_track_boat-----------------*/
-- updates the boat for a track

CREATE FUNCTION public.update_track_boat(
	p_id integer,
	p_boat text 
)
RETURNS void
LANGUAGE 'plpgsql'
AS $$ BEGIN
	UPDATE tracks
	SET boat = p_boat, date_changed = NOW()
	WHERE id = p_id;
END $$;

GRANT EXECUTE ON FUNCTION update_track_boat TO pilotweb;

/*-----------FUNCTION read_track_segments-----------------*/
-- reads all track segments for a certain track

CREATE FUNCTION public.read_track_segments_by_track(
	p_track_id integer
)
RETURNS TABLE (
	type_id integer,
	track_id integer,
	start_utc bigint,
	end_utc bigint,
	start_boattime bigint,
	end_boattime bigint,
	distance_mm integer,
	speed double precision,
	boat text,
	year_rank bigint,
	overall_rank bigint
)
LANGUAGE 'sql'
AS $BODY$
	SELECT
		*
	FROM (
		SELECT 
			type_id,
			track_id,
			start_utc,
			end_utc,
			start_boattime,
			end_boattime,
			distance_mm,
			speed,
			boat,
			year_rank,
			overall_rank
		FROM
			all_track_segments
		WHERE
			boat IN (SELECT boat FROM tracks WHERE id = p_track_id)
	) AS ranked_segments
	WHERE
		track_id = p_track_id
$BODY$;

GRANT EXECUTE ON FUNCTION read_track_segments_by_track TO pilotweb;

/*-----------FUNCTION find_track_segments -----------------*/
-- finds track segments for a certain type, optionally limited
-- by a timeframe and boats

CREATE FUNCTION public.find_track_segments(
	p_type_id integer,
	p_start bigint,
	p_end bigint,
	p_is_boattime boolean,
	p_boats text[],
	p_page_size integer
)
RETURNS TABLE (
	type_id integer,
	track_id integer,
	start_utc bigint,
	end_utc bigint,
	start_boattime bigint,
	end_boattime bigint,
	distance_mm integer,
	speed double precision,
	boat text,
	year_rank bigint,
	overall_rank bigint
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
		distance_mm,
		speed,
		boat,
		year_rank,
		overall_rank
	FROM
		all_track_segments
	WHERE
		type_id = p_type_id
		AND	( 
			(p_is_boattime = FALSE AND (p_end IS NULL OR start_utc < p_end) AND (p_start IS NULL OR end_utc > p_start))
			OR
			(p_is_boattime = TRUE AND (p_end IS NULL OR start_boattime < p_end) AND (p_start IS NULL OR end_boattime > p_start))
		)
		AND (
			p_boats IS NULL OR array_length(p_boats, 1) IS NULL OR boat = ANY (p_boats)
		)		
	ORDER BY speed DESC
	LIMIT p_page_size;

$BODY$;

GRANT EXECUTE ON FUNCTION find_track_segments TO pilotweb;

/*-----------FUNCTION save_track_segment -----------------*/
-- saves a track segment, replacing any existing segment for
-- the same type and track.

CREATE FUNCTION public.save_track_segment(
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
			speed = p_distance_mm::double precision / (p_end_utc - p_start_utc)::double precision,
			date_changed = NOW()
		WHERE 
			track_id = p_track_id AND type_id = p_type_id;
	ELSE
		INSERT INTO track_segments (
			type_id, track_id, 
			start_utc, end_utc,	start_boattime,	end_boattime,
			distance_mm, speed,
			date_created, date_changed
		)
		VALUES (
			p_type_id, p_track_id,
			p_start_utc, p_end_utc, p_start_boattime, p_end_boattime,
			p_distance_mm,
			p_distance_mm::double precision / (p_end_utc - p_start_utc)::double precision,
			NOW(), NOW()
		);
	END IF;
END $$;

GRANT EXECUTE ON FUNCTION save_track_segment TO pilotweb;

/*-----------FUNCTION delete_track_segments -----------------*/
-- deletes all track segments for one or all tracks and of one or all types

CREATE FUNCTION public.delete_track_segments(
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

CREATE FUNCTION public.read_track_points(
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

CREATE FUNCTION public.insert_track_point(
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

CREATE FUNCTION public.delete_track_points(
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

