shopt -s nullglob
for file in /home/pi/repos/PiLot/installscripts/sql/always/*.sql; do
    psql -d pilot -f "$file" 
done