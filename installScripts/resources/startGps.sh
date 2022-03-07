sudo killall gpsd
sudo gpsd /dev/ttyS0 -F /var/run/gpsd.sock
python3 /opt/pilotgpslogger/gpsLogger.py