#!/bin/bash

# This will download the prebuilt package for PiLot Restore Client and copy
# the files to the program directory. Can also be used for initial installation.
# usage: sh u9-update-pilotRestoreClient.sh net9.0

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
if [ "$#" -ne 1 ]; then
    echo please pass net version as parameter, e.g. sudo sh u9-update-pilotRestoreClient.sh net9.0
    exit
fi
echo downloading release
wget https://roethenmund.biz/pilot/pilotrestoreclient_$1.tar.gz
echo installing application
if [ ! -d /opt/pilotrestoreclient ]
then
        mkdir /opt/pilotrestoreclient
fi
mkdir temp
tar zxf pilotrestoreclient_$1.tar.gz -C temp
mv temp/app/* /opt/pilotrestoreclient
echo cleaning up
rm -r temp
echo done