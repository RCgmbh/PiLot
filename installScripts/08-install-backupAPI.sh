#!/bin/sh
if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

# prepare directories
mkdir -p /var/opt/pilotbackup			# PiLot backup API data directory
chown pi:root /var/opt/pilotbackup
mkdir -p /var/log/pilotbackup			# PiLot backup API log directory
chown pi:root /var/log/pilotbackup
mkdir -p /opt/pilotbackupapi			# PiLot backup API binaries
mkdir -p /etc/pilotbackupapi			# PiLot backup API config

# set up Backup API
cp -r resources/pilotbackupapi/* /opt/pilotbackupapi/

# create config links in /etc/pilotbackupapi
ln /opt/pilotbackupapi/PiLot.Backup.API.dll.config /etc/pilotbackupapi/pilotbackupapi.config
ln /opt/pilotbackupapi/config/authorization.json /etc/pilotbackupapi/authorization.json
ln /opt/pilotbackupapi/config/users.json /etc/pilotbackupapi/users.json
ln /opt/pilotbackupapi/config/config.json /etc/pilotbackupapi/config.json

# install service
cp resources/pilotBackupApi.service /etc/systemd/system/pilotBackupApi.service
chmod 446 /etc/systemd/system/pilotBackupApi.service
systemctl daemon-reload
systemctl enable pilotBackupApi
systemctl start pilotBackupApi

# update nginx config. We assume there is a line "include locations/*;" in the server block of sites-enabled/default
apt install -y nginx
mkdir -p /etc/nginx/locations
cp resources/nginx.pilotbackupapi.conf /etc/nginx/locations/pilotbackupapi
systemctl restart nginx

if [ -e /etc/samba/smb.conf ]
then 
echo \
"

[Pilot Backup Data]
path = /var/opt/pilotbackup
read only = no" >> /etc/samba/smb.conf
systemctl restart smbd
fi

echo "Testing api. You should see OK next."
curl http://localhost/pilotbackupapi/v1/Ping
echo \
"
Done"