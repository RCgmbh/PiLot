psql -d postgres -f sql/once/pilotDb.sql
psql -d pilot -f sql/always/poi.sql
psql -d pilot -f sql/once/poiData.sql
psql -d pilot -f sql/always/tracks.sql
psql -d pilot -f sql/once/trackSegmentsData.sql