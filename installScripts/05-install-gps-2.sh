#!/bin/sh

systemctl stop gpsd.socket
systemctl disable gpsd.socket
killall gpsd
gpsd /dev/ttyS0 -F /var/run/gpsd.sock

mkdir -p /opt/pilotgpslogger
cp resources/startGps.sh /opt/pilotgpslogger/
chmod +x /opt/pilotgpslogger/startGps.sh
cp resources/gpsLogger.py /opt/pilotgpslogger/

cp resources/gpsLogger.service /etc/systemd/system/

chmod 446 /etc/systemd/system/gpsLogger.service
systemctl daemon-reload