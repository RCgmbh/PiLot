#!/bin/bash

# This will download the prebuilt package for PiLot Live Client and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

echo downloading release
wget https://roethenmund.biz/pilot/pilotliveclient.tar.gz
echo stopping services
systemctl stop liveClient
echo installing application
mkdir temp
mv /opt/pilotliveclient/config.json temp
mv /opt/pilotliveclient/PiLot.LiveClient.dll.config temp
rm -r /opt/pilotliveclient/*
tar zxf pilotliveclient.tar.gz -C /opt/pilotliveclient
mv temp/* /opt/pilotliveclient
echo cleaning up
rm -r temp
rm pilotsensors.tar.gz
echo done. Please start the service if you need it.