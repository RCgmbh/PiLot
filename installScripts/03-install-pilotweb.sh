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
mkdir -p /etc/pilot				#PiLot config directory

# set up API
cp -r resources/pilotapi/* /opt/pilotapi/
mv resources/pilotapi/data/* /var/opt/pilot/
rm resources/pilotapi/data/
# add config links in /etc/pilot
ln /var/opt/pilot/PiLot.API.dll.config /etc/pilot/pilotapi.config
ln /var/opt/pilot/config/authorization.json /etc/pilot/authorization.json
ln /var/opt/pilot/config/users.json /etc/pilot/users.json
ln /var/opt/pilot/config/publishingTargets.json /etc/pilot/publishingTargets.json
ln /var/opt/pilot/config/sensors.json /etc/pilot/sensors.json
ln /var/opt/pilot/config/tileSources.json /etc/pilot/tileSources.json
ln -s /var/opt/pilot/config/boats /etc/pilot/boats
# set up API service
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
# add link for Config.js to /etc/pilot
ln /var/www/html/pilot/js/Config.js /etc/pilot/webappConfig.js

# update nginx config
apt install -y nginx
cp /etc/nginx/sites-enabled/default backup/
cp resources/nginx.conf /etc/nginx/sites-enabled/default
mkdir /etc/nginx/locations
systemctl restart nginx

# add samba share if samba is installed
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