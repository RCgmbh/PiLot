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
wget https://download.visualstudio.microsoft.com/download/pr/451f282f-dd26-4acd-9395-36cc3a9758e4/f5399d2ebced2ad9640db6283aa9d714/dotnet-sdk-6.0.401-linux-arm.tar.gz
tar -zxf dotnet-sdk-6.0.401-linux-arm.tar.gz -C /opt/dotnet