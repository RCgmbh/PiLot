#!/bin/bash

# This will download the prebuilt package for PiLot Backup Client and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

echo downloading release
wget https://roethenmund.biz/pilot/pilotbackupclient.tar.gz
echo stopping services
systemctl stop backupClient
echo installing application
mkdir temp
mv /opt/pilotbackupclient/config.json temp
mv /opt/pilotbackupclient/PiLot.Backup.Client.dll.config temp
rm -r /opt/pilotbackupclient/*
tar zxf pilotbackupclient.tar.gz -C /opt/pilotbackupclient
mv temp/* /opt/pilotbackupclient
echo starting services
systemctl start backupClient
echo cleaning up
rm -r temp
rm pilotbackupclient.tar.gz
echo done