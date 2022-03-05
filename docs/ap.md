# PiLot - getting started
## Set up a wireless access point
The idea of the PiLot is that you connect to it via Wi-Fi and use a browser to interact with it. As you might not always have a wireless network available (especially outdoors), the PiLot simply creates its own wireless network and acts as an access point. Clients then can just connect to the network. As a plus, the PiLot can use its second wireless adapter or the cable to connect to a public Wi-Fi or a local network, and will then pass all internet traffic from its clients through that connection to the internet. A client (your phone, tablet or laptop) connected to the PiLot can then access both, the PiLot's local web application, and the internet.

This step is mandatory, if you want to access the PiLot otuside of any existing network environment. If you intend to only use it in an existing Wi-Fi or LAN, or just want to connect screen, keyboard and mouse directly to the Raspberry Pi, you can skip this step.

The first few settings require some manual actions, while for the second part there is a script, which automates the rest of the setup (but should only used for a blank installation, as described in the previous chapter). 

First run `sudo raspi-config`, and in **Advanced Options** > **Network Interface Names**, enable "predictable network interface names". This will give you a very new understanding of the word "predictable". When asked to reboot, select "yes", so that your changes can take effect.

Now let's have a look at our network devices. As soon as you have re-connected, type `ifonfig`, and you will see a list of devices. The cryptic names, such as "enxb827eb356c2a", are the predictable network interface names. Yes, right, they don't seem predictable at first, but they acutally are. Without enabling predictable names, if you have two wireless network adapters, one will be wlan0, and the other wlan1. But every time you boot, they can switch names, so you actually can't predict which physical device will be wlan0, and which will be wlan1. The predictable names however will remain the same, as long as you don't change the hardware. So if you always want to use the network adapter with the huge antenna to access the far away marina Wi-Fi, then you will want the onboard wlan interface for the access point. But - oh no! The internal interface still has a much too simple name, like "wlan1". We also want to give it a fixed, predictable name. Thats quite simple: First, look at the result of ifconfig for the device called "wlan0" or "wlan1". Now copy the value after "ether", which is of the form b8:27:cb:60:49:6f. See what I have marked in the below picture:

![image](https://user-images.githubusercontent.com/96988699/154531955-c3a32389-374b-4a14-947e-4c49063f433a.png)

Then create a new file by typing 
```
sudo nano /etc/udev/rules.d/10-network-device.rules
```
The file needs to have the following content:
```
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="wlxOnboardWiFi"
```
Instead of **xx:xx:xx:xx:xx:xx** the value after ATTR{address} is the value for "ether" you copied before (7f:27:b8:60:39:7f in our example). As soon as you have replaced and double-checked the text, hit Ctrl + X, then Y, then Enter to save the file. You can reboot now to apply the changes with the command `sudo reboot now`.

After a minute, re-connect your ssh session as you did at the end of the last chapter (you can use the arrow-up key in the console, which will bring back the last command in the current context, and this will after the disconnection from the PiLot usually be the ssh command). Run ifconfig once again, and now you see both wireless interfaces having a name starting with "wlx". Fantastic!

### Scripted setup
There is a script which will install the required packages and change some configuration files. The script isn't particularly sophisticated, but will probably work if you started from a blank setup as described in the previous chapter. If you prefer a manual configuration, scroll down a bit and follow the steps in the section [Manual setup](ap.md#scripted-setup).

Using the script is quite easy. You just have to set an handful of values in the script file first. First, using `ifconfig` once again, get the names of your network interfaces (like wlxSomething for wireless adapters, and enxSomething for wired adapters), and copy them somewhere for later use. Then, if, you haven't done yet, change into the pilotinstall directory, and start editing the install script:
```
cd ~/pilotinstall
nano 01-install-ap.sh
```
You will see some empty variables, like **apAdapter=""**. There is a comment for each variable, that tells you what value to set. You have to decide which wireless adapter (if you have two) you want to use for the access point, so just enter the name of that adapter, as found in "ifconfig", between the double quotes. I usually use wlxOnboardWiFi for this, but on Raspberry Pi 3 I had some issues with that, and had to use the other wlx... Adapter. Using the onboard WiFi, you would end up with **apAdapter="wlxOnboardWiFi"**. If you have a second WiFi adapter, enter its name for "inetWiFiAdapter", and enter the name of the ethernet adapter (starting with enx...) for inetEthAdapter, if you want to share any available internet access with clients connected to the PiLot access point.

Also enter values for the next to variables, to give your wireless network an name, and set a reasonable password. The values for staticIp don't need to be changed, but if you understand enough about IP addresses, you can of course change them. Finally save the file and close it (Ctrl+X, Y, Enter).

Now, take an deep breath, and run the script as superuser, so enter
``` 
sudo sh 01-install-ap.sh
```
When the script asks you to do so, reboot your PiLot. When it comes back online, re-connect using ssh. After the reboot, you should see the "pilot" (or whatever you named it) network from you phone, tablet or computer. And when connected to it (using the wpa_passphrase you defined), the device should be able to access the PiLot's internet connection.

### Manual setup
If you don't want to use the script, or the script did not work, you can set up the access point manually, following these steps.

We need three services: **hostapd**, which creates the local access point, **dnsmasq** which provides IP adresses to the clients and **dhcpcd**, the dhcp client that gets dynamic IP addresses. So we just install them both like this:
```
sudo apt install -y dnsmasq hostapd dhcpcd
```
In order to configure the services, we need to stop them:
```
sudo systemctl stop dnsmasq
sudo systemctl stop hostapd
```
No we configure hostapd to set up an access point called "pilot" with the password "SECRET1234" (you will of course enter something more reasonable!), and using the onboard wlan adapter we named wlxOnboardWiFi.

**Note** I did have issues with this setup on a Raspberry Pi 3. The internet access did not work for clients connected to the access point. Switching the inferfaces (using the USB Wi-Fi dongle for the access point) fixed this - no idea why. So if you run into this issue, just switch the interface names (wlxOnboardWiFi and wlxCrypticSth123) in the following steps.
```
sudo nano /etc/hostapd/hostapd.conf
```
Enter this text, and change the value for "wpa_passphrase". The passphrase must be 8-63 characters long. You can also change the name of the network (ssid), which in my example is "pilot".
```
interface=wlxOnboardWiFi
driver=nl80211
ssid=pilot
hw_mode=g
channel=6
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=SECRET1234
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
```
Hit Ctrl+X, Y, Enter to save and close nano.
To tell hostapd to use the configuration we just created, we need to reference it in the daemon config file:
```
sudo nano /etc/default/hostapd
```
Find the line **#DAEMON_CONF=""** and replace it by **DAEMON_CONF="/etc/hostapd/hostapd.conf"**. By removing the #, we "uncomment" it, so that it will have an effect, and by setting the path to our previously created config file we tell the service where to find its configuration. Save and close the file.

Next we configure dnsmasq by changing its config file:
```
sudo nano /etc/dnsmasq.conf
```
At the end of the file, insert the following lines, and then save and close the file. This defines the range of addresses our PiLot will give its clients. Instead of 192.168.80... you can use a different IP range. Just make sure you use a private IP address range.
```
#PiLot hotspot IP range
interface=wlxOnboardWiFi
dhcp-range=192.168.80.2,192.168.80.99,255.255.255.0,24h
```
We also need to enable IP forwarding, which is a small change in just another config file:
```
sudo nano /etc/sysctl.conf
```
Find those two lines, and remove the # for both lines, so that you end up with:
```
net.ipv4.ip_forward=1
net.ipv6.conf.all.forwarding=1
```
As always, save and close. Next we define the static IP adress. This is done within the dhcpcd configuration:
```
sudo nano /etc/dhcpcd.conf
```
Go to the end of the file and insert these lines, which will make sure the access point interface does not connect to other networks, sets the static IP address and sets Googles DNS server (8.8.8.8) for the resolution of public internet addresses.:
```
interface wlxOnboardWiFi
nohook wpa_supplicant
static ip_address=192.168.80.1/24
static domain_name_servers=8.8.8.8
```
We can now enable the two services. We first need to unmask hostapd, because it has been masked when we changed its daemon config.
```
sudo systemctl unmask hostapd
sudo systemctl enable hostapd
sudo systemctl start dnsmasq
sudo systemctl start hostapd
```
I had an issue in the past when hostapd crashed as soon as a client tried to connect, and could resolve it by deleting a file:
```
sudo rm /etc/modprobe.d/blacklist-rtl*
```
Finally, to share the raspis internet connection with clients connected to its access point, do this (in case you have only one wireless adapter - the onboard Wi-Fi - you can skip this): First run ifconfig and copy the name of your other wlan interface (wlxSomething, not the one you used for the access point) and of the ethernet connection (enxSomething). Then run these commands:
```
sudo iptables -t nat -A POSTROUTING -o wlxSomething -j MASQUERADE
sudo iptables -t nat -A POSTROUTING -o enxSomething -j MASQUERADE
```
In order to reload the configuration on each boot, we save the configuration to file, create a short script that reloads the configuration from that file, and a simple systemd service that will call the script on boot.
First, save the iptables configuration to a file:
```
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"
```
Second, create a script that will reapply the configuration:
```
sudo nano /usr/local/bin/restoreIptables.sh
```
Add these lines:
```
#!/bin/sh
iptables-restore < /etc/iptables.ipv4.nat
exit 0
```
Save and close, and then make the file executable:
```
sudo chmod 744 /usr/local/bin/restoreIptables.sh
```
Finally, create the service definition:
```
sudo nano /etc/systemd/system/restoreIptables.service
```
And add this content:
```
[Unit]
Description=restore iptables

[Service]
Type=simple
ExecStart= /bin/sh /usr/local/bin/restoreIptables.sh
RemainAfterExit=yes
Restart=no

[Install]
WantedBy=default.target
```
Reload the service definitions, and enable the service so that it will start on each boot:
```
sudo systemctl daemon-reload
sudo systemctl enable restoreIptables
```
It's time for a sudo reboot now! After the reboot, you should see the "pilot" (or whatever you named it) network from you phone, tablet or computer. And when connected to it (using the wpa_passphrase you defined), the device should be able to access the PiLot's internet connection.

If this all works, you have successfully completed one of the more tricky parts and can move on. 

\> [Install the web application...](web.md)

<< [Back to overview](user.md)
