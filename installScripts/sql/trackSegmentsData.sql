/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  This will add default track segment types
  ALL EXISTING TRACK SEGMENTS and TRACK SEGMENT TYPES WILL BE DELETED

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/* DELETE EXISTING DATA */

DELETE FROM track_segments;
DELETE FROM track_segment_types;

/* INSERT TRACK SEGMENT TYPES */
SELECT insert_track_segment_type(null, 1000, '{"de": "Top Kilometer", "en": "Top kilometer"}');
SELECT insert_track_segment_type(null, 1852, '{"de": "Top Meile", "en": "Top mile"}');
SELECT insert_track_segment_type(null, 5000, '{"de": "Top 5 Kilometer", "en": "Top 5 kilometers"}');
SELECT insert_track_segment_type(null, 21097, '{"de": "Top Halbmarathon", "en": "Top half marathon"}');
SELECT insert_track_segment_type(null, 42195, '{"de": "Top Marathon", "en": "Top marathon"}');
SELECT insert_track_segment_type(10, null, '{"de": "Top 10 Sekunden", "en": "Top 10 seconds"}');
SELECT insert_track_segment_type(60, null, '{"de": "Top Minute", "en": "Top minute"}');
SELECT insert_track_segment_type(720, null, '{"de": "Top 12 Minuten", "en": "Top 12 minutes"}');
SELECT insert_track_segment_type(3600, null, '{"de": "Top Stunde", "en": "Top hour"}');
SELECT insert_track_segment_type(86400, null, '{"de": "Top 24 Stunden", "en": "Top 24 hours"}');