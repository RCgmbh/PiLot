#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

mkdir /home/pi/PhotoImport
chown pi:pi /home/pi/PhotoImport
mkdir /var/opt/pilot/photos
chown pi:pi /var/opt/pilot/photos
mkdir /opt/pilotphotoswatcher/
cp -r resources/pilotphotoswatcher/* /opt/pilotphotoswatcher/

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