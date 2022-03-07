#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

mkdir ~/PhotoImport
mkdir /var/opt/pilot/photos
chown pi:pi /var/opt/pilot/photos
mkdir /opt/pilotphotoswatcher/
cp -r resources/pilotphotoswatcher/* /opt/pilotphotoswatcher/

cp resources/photosWatcher.service /etc/systemd/system/photosWatcher.service
systemctl daemon-reload
systemctl enable photosWatcher
systemctl start photosWatcher

apt install -y samba
mv /etc/samba/smb.conf /etc/samba/smb.bak
echo \
"
[global]
workgroup = WORKGROUP
security = user
encrypt password = yes

[Photo Import]
path = /home/pi/PhotoImport
read only = no" >> /etc/samba/smb.conf
systemctl restart smbd
smbpasswd -a pi
