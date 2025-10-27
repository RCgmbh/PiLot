#!/bin/sh
if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

mkdir -p /opt/dotnet
wget  https://builds.dotnet.microsoft.com/dotnet/aspnetcore/Runtime/6.0.36/aspnetcore-runtime-6.0.36-linux-arm64.tar.gz
tar -zxf aspnetcore-runtime-6.0.36-linux-arm64.tar.gz -C /opt/dotnet

ln -s /opt/dotnet/dotnet /usr/bin

#postgres
 apt install postgresql -y
 apt install postgis -y
 
 #nginx
 apt install -y nginx

 echo Done installing .net core, postgres and nginx.