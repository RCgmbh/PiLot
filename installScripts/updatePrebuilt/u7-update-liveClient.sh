#!/bin/bash

# This will download the prebuilt package for PiLot Live Client and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation
# usage: sudo sh u1-update-liveClient.sh net9.0

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 1 ]; then
        echo please pass net version as parameter, e.g. sudo sh u1-update-liveClient.sh net9.0
        exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotliveclient_$1.tar.gz
echo stopping services
systemctl stop liveClient
echo installing application
mkdir temp
mv /opt/pilotliveclient/config.json temp
mv /opt/pilotliveclient/PiLot.LiveClient.dll.config temp
rm -r /opt/pilotliveclient/*
tar zxf pilotliveclient_$1.tar.gz -C /opt/pilotliveclient
mv temp/* /opt/pilotliveclient
echo cleaning up
rm -r temp
rm pilotliveclient_$1.tar.gz
echo done. Please start the service if you need it.