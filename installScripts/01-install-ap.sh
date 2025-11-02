#!/bin/sh

# the name of the adapter for the access point as found in ifconfig:
apAdapter="wlxOnboardWiFi"
# the name of the PiLot Wi-Fi:
ssid="pilot"
# the Wi-Fi password, 8-63 characters:
passphrase=""
# the static ip of the pilot with netmask:
staticIp="192.168.80.1/24"

# **** End of variables ****

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

if [ -z "$apAdapter" ]; then
	echo "Please use 'nano install1-ap.sh', and enter the name of your network interfaces."
elif [ -z "$passphrase" ]; then
	echo "Please use 'nano install-ap.sh', and set a value for passphrase"
else
	nmcli con add con-name hotspot ifname $apAdapter type wifi ssid "$ssid"
	nmcli con modify hotspot wifi-sec.key-mgmt wpa-psk
	nmcli con modify hotspot wifi-sec.psk "$passphrase"
	nmcli con modify hotspot 802-11-wireless.mode ap 802-11-wireless.band bg ipv4.method shared
	nmcli con modify hotspot ipv4.addresses $staticIp
	echo Done
fi