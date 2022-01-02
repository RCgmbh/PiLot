# PiLot
## PiLotDataFiles

These classes handle CRUD-operations for all PiLot Data in a file system. We have different structures for the files, but mostly
it's in a per-day structure. The data is sometimes stored as JSON, or just line/semicolon separated, where JSON would give us too
much overhead. There is one folder for each data type, like "gps" or "logbook". The main location for the files is configured
in the config file of the API (or of anyone else who uses these classes), it usually is /var/lib/pilot.
