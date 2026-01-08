#!/bin/bash

# This will download the prebuilt package for PiLot Backup API and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

echo downloading release
wget https://roethenmund.biz/pilot/pilotbackupapi.tar.gz
echo stopping services
systemctl stop pilotBackupApi
echo installing application
mkdir temp
cp -r /opt/pilotbackupapi/config temp
cp -r /opt/pilotbackupapi/PiLot.Backup.API.dll.config temp
rm -r /opt/pilotbackupapi/*
tar zxf pilotbackupapi.tar.gz -C /opt/pilotbackupapi
mv temp/* /opt/pilotbackupapi
echo starting services
systemctl start pilotBackupApi
echo cleaning up
rm -r temp
rm pilotbackupapi.tar.gz
echo done