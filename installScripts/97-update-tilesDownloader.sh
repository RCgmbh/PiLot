#!/bin/bash

# This will get the latest sources and update the PiLot Tiles Downloader. Git must be installed and the PiLot repository must have been created before.
# The dotnet SDK must have been installed before. 
#
# See 91-update-prerequisites.sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

cd /home/pi/repos/PiLot
git pull
echo "Build and install latest PiLotTilesDownloader version"
dotnet build PiLotTilesDownloader -o /opt/pilottilesdownloader -c release -r linux-arm --no-self-contained
sudo chmod +x /opt/pilottilesdownloader/launcher.sh
echo "New PiLotTilesDownloader installed"
echo "Done"