#!/bin/sh
if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi
wget  https://download.visualstudio.microsoft.com/download/pr/cf567026-a29a-41aa-bc3a-e4e1ad0df480/0925d411e8e09e31ba7a39a3eb0e29af/aspnetcore-runtime-6.0.8-linux-arm.tar.gz
mkdir -p /opt/dotnet
tar -zxf aspnetcore-runtime-6.0.8-linux-arm.tar.gz -C /opt/dotnet

#wget https://download.visualstudio.microsoft.com/download/pr/9f538111-c9a9-443e-a8e0-7cd8b3433904/49bc583c459098228a31d37a6dc71034/aspnetcore-runtime-7.0.3-linux-arm.tar.gz
# wget https://download.visualstudio.microsoft.com/download/pr/d37fc703-70c6-46f2-a5a1-b60f45fd71d0/6a74aa0bb89feb7f795df1ea92d030bf/aspnetcore-runtime-8.0.7-linux-arm.tar.gz
#wget https://download.visualstudio.microsoft.com/download/pr/9e0bdcde-1878-4351-883a-c0adbb570bba/156df738634f710dad131e993fc0f48a/dotnet-sdk-8.0.303-linux-arm.tar.gz
#tar -zxf dotnet-sdk-8.0.303-linux-arm.tar.gz -C /opt/dotnet

ln -s /opt/dotnet/dotnet /usr/bin

#postgres
 apt install postgresql -y
 apt install postgis -y
 
 #nginx
 apt install -y nginx

 echo Done installing .net core, postgres and nginx.