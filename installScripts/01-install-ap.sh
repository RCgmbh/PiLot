#!/bin/sh

# the name of the adapter for the access point as found in ifconfig:
apAdapter=""
# the name of the wireless adapter for internet access as found in ifconfig:
inetWiFiAdapter=""
# the name of the ethernet adapter for internet access as found in ifconfig:
inetEthAdapter=""
# the name of the PiLot Wi-Fi:
ssid=""
# the Wi-Fi password, 8-63 characters:
passphrase=""
# the static ip of the pilot with netmask:
staticIp="192.168.80.1/24"
# the ip address range of the access point (from, to, subnet, time to live):
ipRange="192.168.80.2,192.168.80.20,255.255.255.0,24h"

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

if [ -z "$apAdapter" ]
then
echo "Please use 'nano install1-ap.sh', and enter the name of your network interfaces."
elif [ -z "$passphrase" ]
then
echo "Please use 'nano install-ap.sh', and set a value for passphrase"
else

# install packages
apt install -y hostapd dnsmasq dhcpcd
systemctl stop hostapd
systemctl stop dnsmasq

mkdir -p backup

# crate hostapd config
echo \
"interface="$apAdapter"
driver=nl80211
ssid="$ssid"
hw_mode=g
channel=6
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase="$passphrase"
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP" > /etc/hostapd/hostapd.conf

# set hostapd config for daemon
echo DAEMON_CONF=\"/etc/hostapd/hostapd.conf\" > /etc/default/hostapd

# set ip range in dnsmasq
cp backup/dnsmasq.conf > /etc/
cp /etc/dnsmasq.conf > backup/
echo \
"#PiLot hotspot IP range
interface="$apAdapter"
dhcp-range="$ipRange >> /etc/dnsmasq.conf

# enable ip forwarding
echo \
"net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1" > /etc/sysctl.conf

# set static ip for ap adapter
cp backup/dhcpcd.conf /etc/
cp /etc/dhcpcd.conf backup/
echo \
"interface "$apAdapter"
nohook wpa_supplicant
static ip_address="$staticIp"
static domain_name_servers=8.8.8.8" >> /etc/dhcpcd.conf

# fix issue with hostapd (ap hangs on connect)
rm /etc/modprobe.d/blacklist-rtl*

# start services
systemctl unmask hostapd
systemctl enable hostapd
systemctl start hostapd

# configure NAT, if we have at least one internet adapter, save the rules and re-apply them on boot
if [ "$inetWiFiAdapter" != "" ] || [ "$inetEthAdapter" != "" ]
then
 if [ "$inetWiFiAdapter" != "" ]
 then
  iptables -t nat -A POSTROUTING -o $inetWiFiAdapter -j MASQUERADE
 fi
 if [ "$inetEthAdapter" != "" ]
 then
  iptables -t nat -A POSTROUTING -o $inetEthAdapter -j MASQUERADE
 fi
 sh -c "iptables-save > /etc/iptables.ipv4.nat"
 cp resources/restoreIptables.sh /usr/local/bin/
 chmod 744 /usr/local/bin/restoreIptables.sh
 cp resources/restoreIptables.service /etc/systemd/system/
 systemctl daemon-reload
 systemctl enable restoreIptables
else
 echo "skipping NAT configuration, no inetAdapter defined"
fi
echo "Done. Please use 'sudo reboot now' to restart"
fi
