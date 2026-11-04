#!/bin/bash

# This will download the prebuilt package for PiLot Tiles Downloader and copy
# the files to the program directory. Can also be used for initial installation.
# usage: sh u8-update-pilotTilesDownloader.sh net9.0

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 1 ]; then
    echo please pass net version as parameter, e.g. sudo sh u8-update-pilotTilesDownloader.sh net9.0
    exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilottilesdownloader_$1.tar.gz
echo installing application
if [ ! -d /opt/pilottilesdownloader ]
then
        mkdir /opt/pilottilesdownloader
fi
mkdir temp
tar zxf pilottilesdownloader_$1.tar.gz -C temp
mv temp/app/* /opt/pilottilesdownloader
echo cleaning up
rm -r temp
echo done