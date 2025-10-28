sudo killall gpsd
sudo gpsd /dev/serial0 -F /var/run/gpsd.sock
python3 /opt/pilotgpslogger/gpsLogger.py