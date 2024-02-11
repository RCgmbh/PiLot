/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  This will add default track segment types
  ALL EXISTING TRACK SEGMENTS and TRACK SEGMENT TYPES WILL BE DELETED

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/* DELETE EXISTING DATA */

DELETE FROM track_segments;
DELETE FROM track_segment_types;

/* INSERT TRACK SEGMENT TYPES */
SELECT insert_track_segment_type(null, 1000, '{"de": "Schnellster Kilometer", "en": "Fastest kilometer"}');
SELECT insert_track_segment_type(null, 1852, '{"de": "Schnellste Meile", "en": "Fastest mile"}');
SELECT insert_track_segment_type(null, 5000, '{"de": "Schnellste fünf Kilometer", "en": "Fastest five kilometers"}');
SELECT insert_track_segment_type(null, 21097, '{"de": "Schnellster Halbmarathon", "en": "Fastest half marathon"}');
SELECT insert_track_segment_type(null, 42195, '{"de": "Schnellster Marathon", "en": "Fastest marathon"}');
SELECT insert_track_segment_type(10, null, '{"de": "Top Speed (10 Sekunden)", "en": "Top speed (10 seconds)"}');
SELECT insert_track_segment_type(60, null, '{"de": "Top Speed (1 Minute)", "en": "Top speed (1 minute)"}');
SELECT insert_track_segment_type(720, null, '{"de": "Schnellste 12 Minuten", "en": "Fastest twelve minutes"}');
SELECT insert_track_segment_type(3600, null, '{"de": "Schnellste Stunde", "en": "Fastest hour"}');
SELECT insert_track_segment_type(86400, null, '{"de": "Schnellste 24 Stunden", "en": "Fastest 24 hours"}');