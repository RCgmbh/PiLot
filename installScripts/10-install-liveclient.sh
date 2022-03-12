#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

mkdir /opt/pilotliveclient/
cp -r resources/pilotliveclient/* /opt/pilotliveclient/

cp resources/liveClient.service /etc/systemd/system/liveClient.service
systemctl daemon-reload

echo Done. Please update /opt/liveclient/config.json