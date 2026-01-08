#!/bin/bash

# This will download the prebuilt package for PiLot Sensors Logger and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

echo downloading release
wget https://roethenmund.biz/pilot/pilotsensors.tar.gz
echo stopping services
systemctl stop sensorsLogger
echo installing application
mkdir temp
mv /opt/pilotSensors/PiLot.Sensors.dll.config temp
rm -r /opt/pilotSensors/*
tar zxf pilotsensors.tar.gz -C /opt/pilotsensors
mv temp/* /opt/pilotsensors
echo starting services
systemctl start sensorsLogger
echo cleaning up
rm -r temp
rm pilotsensors.tar.gz
echo done