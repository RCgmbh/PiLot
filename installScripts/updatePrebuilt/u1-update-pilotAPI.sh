#!/bin/bash

# This will download the prebuilt package for pilotapi and copy the
# files to the program directory. As it does not include config files,
# it is not suited for initial installation

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotapi.tar.gz
echo stopping services
systemctl stop gpsLogger
systemctl stop sensorsLogger
systemctl stop pilotApi
echo installing application
mkdir temp
cp -r /opt/pilotapi/config temp
cp -r /opt/pilotapi/PiLot.API.dll.config temp
rm -r /opt/pilotapi/*
tar zxf pilotapi.tar.gz -C /opt/pilotapi
cp -r temp/* /opt/pilotapi/
echo starting services
systemctl start gpsLogger
systemctl start sensorsLogger
systemctl start pilotApi
echo cleaning up
rm -r temp
rm pilotapi.tar.gz
echo done