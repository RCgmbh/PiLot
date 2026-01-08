#!/bin/bash

# This will get the latest sources and update the PiLot backup API. Git must be installed and the PiLot repository must have been created before.
# The dotnet SDK must have been installed before. 
#
# See 91-update-prerequisites.sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

cd /home/pi/repos/PiLot
git pull
echo "Build and install latest backup API version"
systemctl stop pilotBackupApi
rm -r /opt/pilotbackupapi/config_bak
mv /opt/pilotbackupapi/config /opt/pilotbackupapi/config_bak
dotnet build PiLotBackupAPI -o /opt/pilotbackupapi -c release --no-self-contained
mv -f /opt/pilotbackupapi/config_bak/* /opt/pilotbackupapi/config
rm -r /opt/pilotbackupapi/config_bak
echo "New backup API installed"
systemctl start pilotBackupApi

echo "Done"
