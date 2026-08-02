DO $$
DECLARE
    track RECORD;
BEGIN
    FOR track IN
        SELECT id
        FROM tracks
    LOOP
        PERFORM update_track_data(track.id);
		RAISE NOTICE 'Track % updated', track.id;
    END LOOP;
	RAISE NOTICE 'All tracks updated';
END $$;