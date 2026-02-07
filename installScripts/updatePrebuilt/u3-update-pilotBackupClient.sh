#!/bin/bash

# This will download the prebuilt package for PiLot Backup Client and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation
# usage: sh u3-update-pilotBackupClient.sh net9.0

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 1 ]; then
        echo please pass net version as parameter, e.g. sudo sh u3-update-pilotBackupClient.sh net9.0
        exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotbackupclient_$1.tar.gz
echo stopping services
systemctl stop backupClient
echo installing application
mkdir temp
tar zxf pilotbackupclient_$1.tar.gz -C temp
mv /opt/pilotbackupclient/config.json temp/app
mv /opt/pilotbackupclient/PiLot.Backup.Client.dll.config temp/app
rm -r /opt/pilotbackupclient/*
mv temp/app/* /opt/pilotbackupclient
echo starting services
systemctl start backupClient
echo cleaning up
rm -r temp
rm pilotbackupclient_$1.tar.gz
echo done