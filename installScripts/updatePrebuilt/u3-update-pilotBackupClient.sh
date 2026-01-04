#!/bin/bash

# This will download the prebuilt package for PiLot Backup Client and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation
# usage: sudo sh u3-update-pilotBackupClient.sh net9.0 linux-arm64

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 2 ]; then
    echo please pass net version and architecture as 2 parameters
    exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotbackupclient_$1\_$2.tar.gz
echo stopping services
systemctl stop backupClient
echo installing application
mkdir temp
cp /opt/pilotbackupclient/config.json temp
cp /opt/pilotbackupclient/PiLot.Backup.Client.dll.config temp
rm -r /opt/pilotbackupclient/*
tar zxf pilotbackupclient_$1\_$2.tar.gz -C /opt/pilotbackupclient
cp -r temp/* /opt/pilotbackupclient
echo starting services
systemctl start backupClient
echo cleaning up
rm -r temp
rm pilotbackupclient_$1\_$2.tar.gz
echo done