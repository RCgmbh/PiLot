#!/bin/sh
if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
apt update
apt upgrade -y
mkdir -p /opt/dotnet
#wget https://builds.dotnet.microsoft.com/dotnet/aspnetcore/Runtime/8.0.22/aspnetcore-runtime-8.0.22-linux-arm.tar.gz
#tar -zxf aspnetcore-runtime-8.0.22-linux-arm.tar.gz -C /opt/dotnet
wget https://builds.dotnet.microsoft.com/dotnet/aspnetcore/Runtime/9.0.22/aspnetcore-runtime-9.0.22-linux-arm64.tar.gz
tar -zxf aspnetcore-runtime-9.0.22-linux-arm64.tar.gz -C /opt/dotnet

ln -s /opt/dotnet/dotnet /usr/bin

#postgres
 apt install postgresql -y
 apt install postgis -y
 
 #nginx
 apt install -y nginx

 echo Done installing .net core, postgres and nginx.