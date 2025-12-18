#!/bin/bash

# This installs git and the dotnet sdk, creates a folder for git repos and clones the pilot repo.
# These actions are required to later fetch the latest versions of the PiLot applications, and build
# and deploy them locally.
# The script assumes to have a user pi with a /home/pi home directory.

set -e

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

mkdir -p /home/pi/repos
cd /home/pi/repos
apt update
apt -y upgrade
apt -y install git
git clone https://github.com/RCgmbh/PiLot
cd /home/pi
wget https://builds.dotnet.microsoft.com/dotnet/Sdk/8.0.416/dotnet-sdk-8.0.416-linux-arm.tar.gz
tar -zxf dotnet-sdk-8.0.416-linux-arm.tar.gz -C /opt/dotnet

# x64: 
# wget https://builds.dotnet.microsoft.com/dotnet/Sdk/6.0.428/dotnet-sdk-6.0.428-linux-arm64.tar.gz
# tar -zxf dotnet-sdk-6.0.428-linux-arm64.tar.gz -C /opt/dotnet