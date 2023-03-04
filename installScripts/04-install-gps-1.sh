#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

apt install -y python3-pip
pip3 install gps3
echo "dwc_otg.lpm_enable=0 console=tty1 root=/dev/mmcblk0p2 rootfstype=ext4 elevator=deadline rootwait" > /boot/cmdline.txt

systemctl stop serial-getty@ttyS0.service
systemctl disable serial-getty@ttyS0.service
apt install -y gpsd gpsd-clients gpsd-tools

echo "enable_uart=1" >> /boot/config.txt
echo "Done with part 1. Please reboot, then start 05-install-gps-2.sh"
