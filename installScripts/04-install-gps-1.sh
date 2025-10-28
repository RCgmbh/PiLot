#!/bin/sh

if [ `whoami` != root ]; then
    echo Please run this script using sudo
    exit
fi

#apt install -y python3-pip
#pip3 install gps3 > no pip, use gps instad of gpsd, change python script
# why? echo "dwc_otg.lpm_enable=0 console=tty1 root=/dev/mmcblk0p2 rootfstype=ext4 elevator=deadline rootwait" > /boot/cmdline.txt

# might not be needed... systemctl stop serial-getty@ttyS0.service
# might not be needed... systemctl disable serial-getty@ttyS0.service
apt install -y gpsd gpsd-clients gpsd-tools

echo \
"enable_uart=1
dtoverlay=disable-bt" >> /boot/firmware/config.txt
# maybe better do this manually to make sure its in the right section
echo "Done with part 1. Please reboot, then start 05-install-gps-2.sh"
