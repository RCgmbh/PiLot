psql -d postgres -f sql/pilotDb.sql
psql -d pilot -f sql/poi.sql
psql -d pilot -f sql/poiData.sql
psql -d pilot -f sql/tracks.sql
psql -d pilot -f sql/trackSegmentsData.sql