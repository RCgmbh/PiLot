# PiLot - getting started
## Set up a wireless access point
The idea of the PiLot is that you connect to it via Wi-Fi and use a browser to interact with it. As you might not always have a wireless network available (especially outdoors), the PiLot simply creates its own Wi-Fi and acts as an access point. Clients can then just connect to the network. As a plus, the PiLot can use its second network interface to connect to a public Wi-Fi, and will then pass all internet traffic from its clients through that connection to the internet. A client (your phone, tablet or laptop) connected to the PiLot can then access both, the PiLot's local web application, and the internet.

This step is mandatory, if you want to access the PiLot using any device. If you intend to just connect screen, keyboard and mouse directly to the Raspberry Pi, you can skip this step.

Run `sudo raspi-config`, and in **Advanced Options** > **Network Interface Names**, enable "predictable network interface names". This will give you a very new understanding of the word "predictable". When asked to reboot, select "yes", so that your changes can take effect.

Now let's have a look at our network devices. Type `ifonfig`, and you will see a list of devices. The cryptic names, such as "enxb827eb356c2a", are the predictable network interface names. Yes, right, they don't seem predictable at first, but they acutally are. Without enabling predictable names, if you have two wireless network interfaces, one will be wlan0, and the other wlan1. But every time you boot, they can switch names, so you actually can't predict, which physical device will be wlan0, and which will be wlan1. The predictable names however will remain the same, as long as you don't change the hardware. So if you always want to use the network adapter with the huge antenna to access the far away marina Wi-Fi, then you will want the onboard wlan interface for the access point. But - oh no! The internal interface still has a much too simple name, like "wlan1". We also want to give it a fixed, predictable name. Thats quite simple: First, look at the result of ifconfig for the device called "wlan0" or "wlan1". Now copy the value after "ether", which is of the form b8:27:cb:60:49:6f. See what I have marked in the below picture:

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

We now need two services: hostapd, which creates the local access point, and dnsmasq which provides IP adresses to the clients. So we just install them both like this:
```
sudo apt install -y dnsmasq hostapd
```
In order to configure the services, we need to stop them:
```
sudo systemctl stop dnsmasq
sudo systemctl stop hostapd
```
No we configure hostapd to set up an access point called "pilot" with the password "SECRET1234" (you will of course enter something more reasonable!), and using the onboard wlan adapter we named wlxOnboardWiFi.

**Note** I did have issues with this setup on a Raspberry Pi 3. The internet access did not work for clients connected to the access point. Switching the inferfaces (using the external wireless network device for the access point) fixed this - no idea why. So if you run into this issue, just switch the interface names (wlxOnboardWiFi and wlxCrypticSth123) in the following steps.
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
As always, save and close. Hold on, we're almost there! Just a few more things. We now define the static IP adress. This is done within the dhcpcd configuration:
```
sudo nano /etc/dhcpcd.conf
```
Go to the end of the file, and insert these lines:
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
Finally, to share an existing Internet connection the Raspberry Pi might have with clients connected to its access point, do this (in case you have only one wireless adapter - the onboard Wi-Fi - you can skip this): First run ifconfig and copy the name of your other wlan interface (wlxSomething) and of the ethernet connection (enxSomething). Then run these commands:
```
sudo iptables -t nat -A POSTROUTING -o wlxSomething -j MASQUERADE
sudo iptables -t nat -A POSTROUTING -o enxSomething -j MASQUERADE
```
In order to reload the configuration on each boot, we have to add a line to the rc.local file:
```
sudo sh -c "iptables-save > /etc/iptables.ipv4.nat"
sudo nano /etc/rc.local
```
Before the line **exit 0**, add 
```
iptables-restore < /etc/iptables.ipv4.nat
```
It's time for a sudo reboot now! After the reboot, you should see the "pilot" (or whatever you named it) network from you phone, tablet or computer. And when connected to it (using the wpa_passphrase you defined), the device should be able to access the internet.