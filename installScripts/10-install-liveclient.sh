#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

# create directory
mkdir /opt/pilotliveclient/		# application binaries

# install application
cp -r resources/pilotliveclient/* /opt/pilotliveclient/

# configure service, don't enable or start
cp resources/liveClient.service /etc/systemd/system/liveClient.service
systemctl daemon-reload

echo Done. Please update /etc/pilot/liveClient.config