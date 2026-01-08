#!/bin/bash

# This will get the latest sources and update the PiLot Photos Watcher. Git must be installed and the PiLot repository must have been created before.
# The dotnet SDK must have been installed before. 
#
# See 91-update-prerequisites.sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

cd /home/pi/repos/PiLot
git pull
echo "Build and install latest PhotosWatcher version"
systemctl stop photosWatcher
dotnet build PiLotPhotosWatcher -o /opt/pilotphotoswatcher -c release --no-self-contained
echo "New PhotosWatcher installed"
systemctl start photosWatcher
echo "Done"