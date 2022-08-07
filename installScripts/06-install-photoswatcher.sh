#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

# create directories
mkdir /home/pi/PhotoImport			# Photo import directory
chown pi:pi /home/pi/PhotoImport
mkdir -p /var/opt/pilot/photos		# Data directory for photos
chown pi:pi /var/opt/pilot/photos
mkdir /opt/pilotphotoswatcher/		# Application binaries

# install application
cp -r resources/pilotphotoswatcher/* /opt/pilotphotoswatcher/

# create config link in /etc/pilot
ln /opt/pilotphotoswatcher/PiLot.PhotosWatcher.dll.config /etc/pilot/pilotPhotosWatcher.config

# install service
cp resources/photosWatcher.service /etc/systemd/system/photosWatcher.service
systemctl daemon-reload
systemctl enable photosWatcher
systemctl start photosWatcher

if [ -e /etc/samba/smb.conf ]
then 
echo \
"

[Photo Import]
path = /home/pi/PhotoImport
read only = no" >> /etc/samba/smb.conf
systemctl restart smbd
fi
echo Done