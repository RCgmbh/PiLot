#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

apt install -y gpsd gpsd-clients gpsd-tools

systemctl stop gpsd.socket
systemctl disable gpsd.socket
killall gpsd

mkdir -p /opt/pilotgpslogger
cp resources/startGps.sh /opt/pilotgpslogger/
chmod +x /opt/pilotgpslogger/startGps.sh
cp resources/gpsLogger.py /opt/pilotgpslogger/

cp resources/gpsLogger.service /etc/systemd/system/

chmod 0644 /etc/systemd/system/gpsLogger.service
systemctl daemon-reload
systemctl enable gpsLogger
systemctl start gpsLogger
echo "Done installing GPS Logger"
