# PiLot
## Live tracking

The PiLot can be configured to permanently send position and logbook data to another PiLot. That other PiLot can be a webserver with the PiLot web application installed, so that authorized people can watch you live, as soon as you have started the live tracking service. To make this all work, you need to install the PiLot application on a webserver and install and configure the LiveClient on your PiLot. We won't go into every detail, so this section needs a bit of background knowledge or duckduckgo.

### Install the PiLot application on a webserver
Depending on the webserver's operating system and hosting control system, this step will look a bit different on each environments. In brief, that's what you're going to do:

#### Windows hosting with dotnet core support
- Copy the website (the content of pilotinstall/resources/pilotweb) into the website directory (you might want to create a subdomain, such as pilot.yourdomain.com)
- Create a subdirectory "pilotapi", and copy the content of pilotinstall/resources/pilotapi there. 
- See below for the common configuration steps

#### Linux environment
- Copy the website (the content of pilotinstall/resources/pilotweb) into the website directory.
- Copy the content of pilotinstall/resources/pilotapi somewhere where it can be executed.
- Define a service which will execute PiLot.API from that folder. See pilotinstall/resources/pilotApi.service for an example.
- Configure your webserver to pass requests for /pilotapi to 127.0.0.1:5000. See pilotinstall/resources/nginx.conf for an example.

#### Common configuration
Independent of the hosting environment, some more configuration is necessary:
- Create a log and a data directory, where the user running the pilotapi has write access. Set the paths in pilotapi/PiLot.API.dll.config. In windows environments, you can just keep App_Data for the data.
- Move the subdirectories (but not the two .json files) from pilotapi/App_Data to your data directory.
- In pilotapi/App_Data, edit the authorization.json file. Set "anonymousRole": "noaccess" to force authentication
- In pilotapi/App_Data, edit the users.json file. Create users as needed (separate them by "," between the curly brackets). The rolenames must match the roles in the authorization.json file. Create a user with the "writer" role, which you will use for the live tracking service.
- Crate the directories "openstreetmap" and "openseamap" in the web root or another folder that can deliver web content.
- Edit the file in /yourDataDirectory/tiles/tileSources.json and for "localUrl", copy the values from "onlineUrl" (we dont need local tiles here). The localPath values can be left empty, as you won't download tiles to that server. 
- In the website, there is a file /js/Config.js. You can change the value for "apiUrl" here, depending on the url where the api is accessible.

Well, ehm that's about it. You will probably need some finetuning to make it all work. At the end, you should see a login prompt, and when logged in, the PiLot application.

### Set up and configure the live tracking service
That's easier. Just run
```
cd ~/pilotinstall
sudo sh 10-install-liveclient.sh
```
After that, edit the config file:
```
sudo nano /opt/pilotliveclient/config.json
```
The value for **localapi** should be ok. For **remoteAPI**, enter the url of the pilot api on your webserver. It should end with "pilotapi/v1" Pro-tip: you can test it by entering https://yourdomain/pilotapi/v1/Ping, which should write "Ok". Enter the username and password you have created above in the users.json file. If you want, you can change the "interval", which is the interval in seconds, for sending data to the server.

Now, to start the service, on the PiLot Application on your PiLot, go to "Administration", then "Services", where you can start and stop the different PiLot services. Start the service "liveClient", and after some seconds you should see your PiLot's position on your website. 

\> [What's next...?](tbd.md)

<< [Back to overview](user.md)
