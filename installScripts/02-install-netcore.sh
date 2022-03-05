#!/bin/sh
if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
wget https://download.visualstudio.microsoft.com/download/pr/93874c40-bd2d-4a7d-bbb5-716b161594c0/f698334222759b065f5da4e8915ae982/aspnetcore-runtime-6.0.2-linux-arm.tar.gz
mkdir -p /opt/dotnet
tar -zxf aspnetcore-runtime-6.0.2-linux-arm.tar.gz -C /opt/dotnet
ln -s /opt/dotnet/dotnet /usr/bin