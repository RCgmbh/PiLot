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

SELECT insert_poi_category(null, 'event', '{"de": "Ereignis", "en": "Event"}', 'css:icon-pin');
SELECT insert_poi_category(null, 'object', '{"de": "Objekt", "en": "Object"}', 'css:icon-location');
SELECT insert_poi_category(null, 'information', '{"de": "Information", "en": "Information"}', 'css:icon-info2');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'health', '{"de": "Gesundheit", "en": "Health"}', 'css:icon-health');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'lock', '{"de": "Schleuse", "en": "Lock"}', 'svg:lock.svg');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'marina', '{"de": "Marina", "en": "Marina"}', 'svg:marina.svg');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'gazstation', '{"de": "Tankstelle", "en": "Gaz station"}', 'svg:gazstation.svg');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'mooring', '{"de": "Anlegestelle", "en": "Mooring"}', 'svg:mooring.svg');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'anchorage', '{"de": "Ankerstelle", "en": "Anchorage"}', 'css:icon-anchor');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'toilet', '{"de": "Toilette", "en": "Toilet"}', 'css:icon-man-woman');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'restaurant', '{"de": "Restaurant", "en": "Restaurant"}', 'css:icon-spoon-knife');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'shop', '{"de": "Geschäft", "en": "Shop"}', 'css:icon-cart');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'obstacle', '{"de": "Hindernis", "en": "Obstacle"}', 'css:icon-warning2');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'measuringstation', '{"de": "Messstation", "en": "Measuring station"}', 'css:icon-meter2');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'sight', '{"de": "Sehenswürdigkeit", "en": "Sight"}', 'css:icon-eye');
SELECT insert_poi_category ((SELECT id FROM poi_categories WHERE name='object'), 'nicePlace', '{"de": "Schönes Plätzchen", "en": "Nice place"}', 'css:icon-sun');


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
