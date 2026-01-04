#!/bin/bash

# This will download the prebuilt package for pilotweb and copy the
# files to the website directory. As it does not include config files,
# it is not suited for initial installation

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotweb.tar.gz
echo installing website
mkdir temp
mkdir temp/js
cp /var/www/html/pilot/js/Config.js temp/js
rm -r /var/www/html/pilot/*
tar zxf pilotweb.tar.gz -C /var/www/html/pilot
cp -r temp/* /var/www/html/pilot
echo cleaning up
rm -r temp
rm pilotweb.tar.gz
echo done