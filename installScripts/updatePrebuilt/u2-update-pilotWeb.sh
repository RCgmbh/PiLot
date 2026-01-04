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
mkdir temp
tar zxf pilotweb.tar.gz -C temp
echo installing website
cp -r /var/www/html/pilot/js/Config.js temp
rm -r /var/www/html/pilot/*
cp -r temp/Config.js /var/www/html/pilot/js/
echo cleaning up
rm -r temp
rm pilotweb.tar.gz
echo done