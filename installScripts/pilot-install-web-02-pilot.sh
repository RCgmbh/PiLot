#!/bin/sh
# prepare directories
mkdir -p /var/opt/pilot			#PiLot data directory
chown pi:root /var/opt/pilot
mkdir -p /var/log/pilot			#PiLot log directory
chown pi:root /var/log/pilot
mkdir -p /opt/pilotapi			#PiLot binaries

# set up API including service
#tar -zxf resources/pilotapi.tar.gz -C /opt/pilotapi
cp -r resources/pilotapi/* /opt/pilotapi/
cp resources/pilotApi.service /etc/systemd/system/pilotApi.service
chmod 446 /etc/systemd/system/pilotApi.service
sudo systemctl daemon-reload
sudo systemctl enable pilotApi
sudo systemctl start pilotApi

# set up website
mkdir -p /var/www/html/pilot
#tar -zxf resources/pilotweb.tar.gz -C /var/www/html/pilot
cp -r resources/pilotweb/* /var/www/html/pilot/

# update nginx config
cp /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
cp resources/nginx.conf /etc/nginx/sites-enabled/default
systemctl restart nginx
echo Done