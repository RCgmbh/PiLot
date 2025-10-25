psql -d postgres -f /home/pi/pilotinstall/resources/sql/pilotDb.sql
psql -d pilot -f /home/pi/pilotinstall/resources/sql/poi.sql
psql -d pilot -f /home/pi/pilotinstall/resources/sql/poiData.sql
psql -d pilot -f /home/pi/pilotinstall/resources/sql/tracks.sql
psql -d pilot -f /home/pi/pilotinstall/resources/sql/trackSegmentsData.sql