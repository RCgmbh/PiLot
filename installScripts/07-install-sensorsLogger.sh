#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

# create directories
mkdir /opt/pilotsensors/		# application binaries

# install application
cp -r resources/pilotsensors/* /opt/pilotsensors/

# create config links in /etc/pilot
ln /opt/pilotsensors/PiLot.Sensors.dll.config /etc/pilot/pilotSensors.config

# configure and enable service
cp resources/sensorsLogger.service /etc/systemd/system/sensorsLogger.service
systemctl daemon-reload
systemctl enable sensorsLogger
systemctl start sensorsLogger

echo Done