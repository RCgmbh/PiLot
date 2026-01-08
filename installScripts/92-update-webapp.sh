#!/bin/bash

# This will get the latest sources and update the PiLot DB, the REST API and the web app.
# Git must be installed and the PiLot repository must have been created before.
# The dotnet SDK must have been installed before. 
#
# See 91-update-prerequisites.sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

cd /home/pi/repos/PiLot
git pull

# update DB
su -c installscripts/sql/update-db.sh postgres

echo "Copy website files"
rsync -vr PiLotWeb/* /var/www/html/pilot/ --exclude 'js/Config*.js'
echo "Copy website files done."
echo "Build and install latest API Version"
systemctl stop gpsLogger
systemctl stop pilotApi
systemctl stop sensorsLogger
mv /opt/pilotapi/config /opt/pilotapi/config_bak
mv /opt/pilotapi/PiLot.API.dll.config /opt/pilotapi/PiLot.API.dll.config.bak
dotnet build PiLotAPICore -o /opt/pilotapi -c release --no-self-contained
rm -r /opt/pilotapi/config
# remove links from /etc/pilot
rm -f /etc/pilot/pilotapi.config
rm -f /etc/pilot/authorization.json
rm -f /etc/pilot/users.json
rm -f /etc/pilot/publishingTargets.json
rm -f /etc/pilot/sensors.json
rm -f /etc/pilot/tileSources.json
mv /opt/pilotapi/config_bak /opt/pilotapi/config
mv -f /opt/pilotapi/PiLot.API.dll.config.bak /opt/pilotapi/PiLot.API.dll.config
# restore links in /etc/pilot
ln /opt/pilotapi/PiLot.API.dll.config /etc/pilot/pilotapi.config
ln /opt/pilotapi/config/authorization.json /etc/pilot/authorization.json
ln /opt/pilotapi/config/users.json /etc/pilot/users.json
ln /opt/pilotapi/config/publishingTargets.json /etc/pilot/publishingTargets.json
ln /opt/pilotapi/config/sensors.json /etc/pilot/sensors.json
ln /opt/pilotapi/config/tileSources.json /etc/pilot/tileSources.json
rm -r /opt/pilotapi/App_Data
echo "API installed"
systemctl start pilotApi
systemctl start gpsLogger
systemctl start sensorsLogger

echo "Done"
