#!/bin/sh

apt install -y samba
mv /etc/samba/smb.conf /etc/samba/smb.bak
echo \
"[global]
workgroup = WORKGROUP
security = user
encrypt password = yes

[Home]
path = /home/pi
read only = no" >> /etc/samba/smb.conf

smbpasswd -a pi
systemctl restart smbd
echo Done