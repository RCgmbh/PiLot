#!/bin/sh
if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

# prepare directories
mkdir -p /var/opt/pilot			#PiLot data directory
chown pi:root /var/opt/pilot
mkdir -p /var/log/pilot			#PiLot log directory
chown pi:root /var/log/pilot
mkdir -p /opt/pilotapi			#PiLot binaries

# set up API including service
cp -r resources/pilotapi/* /opt/pilotapi/
mv resources/pilotapi/App_Data/global /var/opt/pilot/
mv resources/pilotapi/App_Data/boat /var/opt/pilot/
mv resources/pilotapi/App_Data/sensors /var/opt/pilot/
mv resources/pilotapi/App_Data/tiles /var/opt/pilot/
cp resources/pilotApi.service /etc/systemd/system/pilotApi.service
chmod 446 /etc/systemd/system/pilotApi.service
systemctl daemon-reload
systemctl enable pilotApi
systemctl start pilotApi

# set up website
mkdir -p /var/www/html/pilot
cp -r resources/pilotweb/* /var/www/html/pilot/
cp /var/www/html/index.html backup/
cp resources/index.html /var/www/html/
mkdir /var/www/html/tiles
mkdir /var/www/html/tiles/openstreetmap
mkdir /var/www/html/tiles/openseamap
chown -R pi:root /var/www/html/tiles
mkdir /var/www/html/library
chown -R pi:root /var/www/html/library
cp resources/library/* /var/www/html/library/
# todo: install samba, if it's not installed yet, and add share for library and maybe data

# update nginx config
apt install -y nginx
cp /etc/nginx/sites-enabled/default backup/
cp resources/nginx.conf /etc/nginx/sites-enabled/default
systemctl restart nginx

if [ -e /etc/samba/smb.conf ]
then 
echo \
"

[Pilot Data]
path = /var/opt/pilot
read only = no

[Library]
path = /var/www/html/library
read only = no" >> /etc/samba/smb.conf
systemctl restart smbd
fi

echo Done