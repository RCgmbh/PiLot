#!/bin/bash

# This will download the prebuilt package for pilotapi and copy the
# files to the program directory. As it does not include config files,
# it is not suited for initial installation
# usage: sudo sh u1-update-pilotAPI.sh net9.0 linux-arm64

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 2 ]; then
        echo please pass net version and architecture as 2 parameters
        exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotapi_$1\_$2.tar.gz
mkdir temp
tar zxf pilotapi_$1\_$2.tar.gz -C temp
echo stopping services
systemctl stop gpsLogger
systemctl stop sensorsLogger
systemctl stop pilotApi
echo installing application
cp -r /opt/pilotapi/config temp
cp -r /opt/pilotapi/PiLot.API.dll.config temp
rm -r /opt/pilotapi/*
cp -r temp/* /opt/pilotapi/
echo starting services
systemctl start gpsLogger
systemctl start sensorsLogger
systemctl start pilotApi
echo cleaning up
rm -r temp
rm pilotapi_$1\_$2.tar.gz
echo done