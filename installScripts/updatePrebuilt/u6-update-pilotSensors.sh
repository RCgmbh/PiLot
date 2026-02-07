#!/bin/bash

# This will download the prebuilt package for PiLot Sensors Logger and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation
# usage: sudo sh u6-update-pilotSensors.sh net9.0

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 1 ]; then
        echo please pass net version as parameter, e.g. sudo sh u6-update-pilotSensors.sh net9.0
        exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotsensors_$1.tar.gz
echo stopping services
systemctl stop sensorsLogger
echo installing application
mkdir temp
tar zxf pilotsensors_$1.tar.gz -C temp
mv /opt/pilotsensors/PiLot.Sensors.dll.config temp/app
rm -r /opt/pilotsensors/*
mv temp/app/* /opt/pilotsensors
echo starting services
systemctl start sensorsLogger
echo cleaning up
rm -r temp
rm pilotsensors_$1.tar.gz
echo done