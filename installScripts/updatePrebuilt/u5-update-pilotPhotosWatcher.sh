#!/bin/bash

# This will download the prebuilt package for PiLot Photos Watcher and copy
# the files to the program directory. As it does not include config files,
# it is not suited for initial installation

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

echo downloading release
wget https://roethenmund.biz/pilot/pilotphotoswatcher.tar.gz
echo stopping services
systemctl stop photosWatcher
echo installing application
mkdir temp
mv /opt/pilotphotoswatcher/PiLot.PhotosWatcher.dll.config temp
rm -r /opt/pilotphotoswatcher/*
tar zxf pilotphotoswatcher.tar.gz -C /opt/pilotphotoswatcher
mv temp/* /opt/pilotphotoswatcher
echo starting services
systemctl start photosWatcher
echo cleaning up
rm -r temp
rm pilotphotoswatcher.tar.gz
echo done