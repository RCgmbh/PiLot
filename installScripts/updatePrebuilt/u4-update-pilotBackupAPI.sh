#!/bin/bash

# This will download the prebuilt package for PiLot Backup API and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation
# usage: sudo sh u4-update-pilotBackupAPI.sh net9.0

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 1 ]; then
        echo please pass net version as parameter, e.g. sudo sh u4-update-pilotBackupAPI.sh net9.0
        exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotbackupapi_$1.tar.gz
echo stopping services
systemctl stop pilotBackupApi
echo installing application
mkdir temp
cp -r /opt/pilotbackupapi/config temp
cp -r /opt/pilotbackupapi/PiLot.Backup.API.dll.config temp
rm -r /opt/pilotbackupapi/*
tar zxf pilotbackupapi_$1.tar.gz -C /opt/pilotbackupapi
mv temp/* /opt/pilotbackupapi
echo starting services
systemctl start pilotBackupApi
echo cleaning up
rm -r temp
rm pilotbackupapi_$1.tar.gz
echo done