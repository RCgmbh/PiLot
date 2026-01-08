#!/bin/sh

# This installs or updates the restore client which allows to restore data from a backup set.
# This can be used for the first installation as well as for an update.

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

# Prepare directories
mkdir -p /opt/pilotrestoreclient	#PiLot restore client binaries

# pull and build application
cd /home/pi/repos/PiLot
git pull
echo "Build and install latest restore client version"
dotnet build PiLotRestoreClient -o /opt/pilotrestoreclient -c release --no-self-contained
echo "New restore client built"
echo "Done"