#!/bin/bash

# This will get the latest sources and update all PiLot components. Git must be installed and the PiLot repository must have been created before.
# The dotnet SDK must have been installed before. 
#
# See 91-update-prerequisites.sh

set -e

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

cd /home/pi/repos/PiLot
git pull
echo "Copy website data"
sudo rsync -vr PiLotWeb/* /var/www/html/pilot/ --exclude 'js/Config*.js'
echo "Copy website data done."
echo "Build and install latest API Version"
systemctl stop gpsLogger
systemctl stop pilotApi
mv /opt/pilotapi/config /opt/pilotapi/config_bak
mv /opt/pilotapi/PiLot.API.dll.config /opt/pilotapi/PiLot.API.dll.config.bak
dotnet build PiLotAPICore -o /opt/pilotapi -c release -r linux-arm --no-self-contained
rm -r /opt/pilotapi/config
mv /opt/pilotapi/config_bak /opt/pilotapi/config
mv -f /opt/pilotapi/PiLot.API.dll.config.bak /opt/pilotapi/PiLot.API.dll.config
rm -r /opt/pilotapi/App_Data
echo "API installed"
systemctl start pilotApi
systemctl start gpsLogger

echo "Done"
