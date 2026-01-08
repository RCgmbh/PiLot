#!/bin/bash

# This will get the latest sources and update the PiLot backup client. Git must be installed and the PiLot repository must have been created before.
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
systemctl stop backupClient
mv /opt/pilotbackupclient/config.json /opt/pilotbackupclient/config.json.bak
mv /opt/pilotbackupclient/PiLot.Backup.Client.dll.config /opt/pilotbackupclient/PiLot.Backup.Client.dll.config.bak
dotnet build PiLotBackupClient -o /opt/pilotbackupclient -c release --no-self-contained
mv -f /opt/pilotbackupclient/config.json.bak /opt/pilotbackupclient/config.json
mv -f /opt/pilotbackupclient/PiLot.Backup.Client.dll.config.bak /opt/pilotbackupclient/PiLot.Backup.Client.dll.config
echo "Backup Client installed"
systemctl start backupClient