/* !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

  This will create the db structure for POIs
  ALL EXISTING POI DATA WILL BE LOST!

!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/

/* DELETE EXISTING DATA */

DELETE FROM poi_features__pois;
DELETE FROM pois;
DELETE FROM poi_features;
DELETE FROM poi_categories;

/* INSERT CATEGORIES */

SELECT insert_poi_category(null, 'event');
SELECT insert_poi_category(null, 'object');
SELECT insert_poi_category(null, 'information');
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'health', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'lock', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'marina', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'gazstation', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'mooring', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'anchorage', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'toilet', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'restaurant', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'shop', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'obstacle', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'measuringstation', NOW(), NOW() FROM poi_categories WHERE name='object';
INSERT INTO poi_categories (parent_id, name, date_created, date_changed) SELECT id, 'sight', NOW(), NOW() FROM poi_categories WHERE name='object';


/* INSERT FEATURES */

SELECT insert_poi_feature('drinkingWater', '{"de": "Trinkwasser", "en": "Drinking Water"}');
SELECT insert_poi_feature('wasteWater', '{"de": "Schmutzwasser", "en": "Waste water"}');
SELECT insert_poi_feature('guestPlaces', '{"de": "Gästeplätze", "en": "Guest places"}');
SELECT insert_poi_feature('toilet', '{"de": "Toilette", "en": "Toilet"}');
SELECT insert_poi_feature('shower', '{"de": "Dusche", "en": "Shower"}');
SELECT insert_poi_feature('laundry', '{"de": "Waschmaschine", "en": "Laundry"}');
SELECT insert_poi_feature('shorePower', '{"de": "Landstrom", "en": "Shore power"}');
SELECT insert_poi_feature('crane', '{"de": "Kran", "en": "Crane"}');
SELECT insert_poi_feature('slipway', '{"de": "Rampe", "en": "Slipway"}');
SELECT insert_poi_feature('diesel', '{"de": "Diesel", "en": "Diesel"}');
SELECT insert_poi_feature('gasoline', '{"de": "Benzin", "en": "Gasoline"}');
SELECT insert_poi_feature('pharmacy', '{"de": "Apotheke", "en": "Pharmacy"}');
SELECT insert_poi_feature('emergencyRoom', '{"de": "Notaufnahme", "en": "Emergency room"}');
SELECT insert_poi_feature('hospital', '{"de": "Spital", "en": "Hospital"}');
SELECT insert_poi_feature('waterLevel', '{"de": "Wasserstand", "en": "Water level"}');
SELECT insert_poi_feature('waterDischarge', '{"de": "Abflussmenge", "en": "Water discharge"}');
SELECT insert_poi_feature('waterTemperature', '{"de": "Wassertemperatur", "en": "Water temperature"}');
SELECT insert_poi_feature('windSpeed', '{"de": "Windgeschwindigkeit", "en": "Wind speed"}');
SELECT insert_poi_feature('airTemperature', '{"de": "Lufttemperatur", "en": "Air temperature"}');
