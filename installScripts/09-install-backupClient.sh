#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

# Prepare directories
mkdir /opt/pilotbackupclient	#PiLot backup client binaries
mkdir -p /var/log/pilot			#PiLot log directory
chown pi:root /var/log/pilot
mkdir -p /etc/pilot				#PiLot config directory

# copy application
cp -r resources/pilotbackupclient/* /opt/pilotbackupclient/
chown pi:root /opt/pilotbackupclient/config.json

# create config links in /etc/pilot
ln /opt/pilotbackupclient/PiLot.Backup.Client.dll.config /etc/pilot/pilotBackupClient.config
ln /opt/pilotbackupclient/config.json /etc/pilot/backupConfig.json

# install service
cp resources/pilotBackupClient.service /etc/systemd/system/pilotBackupClient.service
systemctl daemon-reload
systemctl enable pilotBackupClient
systemctl start pilotBackupClient

echo Done