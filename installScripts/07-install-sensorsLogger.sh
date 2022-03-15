#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

mkdir /opt/pilotsensors/
cp -r resources/pilotsensors/* /opt/pilotsensors/

cp resources/sensorsLogger.service /etc/systemd/system/sensorsLogger.service
systemctl daemon-reload
systemctl enable sensorsLogger
systemctl start sensorsLogger

echo Done