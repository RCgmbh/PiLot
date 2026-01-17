#!/bin/bash

# This will download the prebuilt package for pilotapi and copy the
# files to the program directory. As it does not include config files,
# it is not suited for initial installation
# usage: sudo sh u1-update-pilotAPI.sh net9.0

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 1 ]; then
        echo please pass net version as parameter, e.g. sudo sh u1-update-pilotAPI.sh net9.0
        exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotapi_$1.tar.gz
echo stopping services
systemctl stop gpsLogger
systemctl stop sensorsLogger
systemctl stop pilotApi
echo installing application
mkdir temp
cp -r /opt/pilotapi/config temp
cp -r /opt/pilotapi/PiLot.API.dll.config temp
rm -r /opt/pilotapi/*
tar zxf pilotapi_$1.tar.gz -C /opt/pilotapi
cp -r temp/* /opt/pilotapi/
echo starting services
systemctl start gpsLogger
systemctl start sensorsLogger
systemctl start pilotApi
echo cleaning up
rm -r temp
rm pilotapi_$1.tar.gz
echo done