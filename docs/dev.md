# PiLot
## Getting started for Developers
This document gives an overview of what is needed to build, test and debug the PiLot applications. The first few chapters give a rough overview. Below you will find a step-by-step guide.
### Development environment
You need to be able to compile and debug dotnet core projects in order to build the rest api and the different tools. You can either use [Visual Studio Code](https://code.visualstudio.com/) (multi platform), [Visual Studio Community](https://visualstudio.microsoft.com/vs/community/) on Windows, or just the [dotnet SDK](https://dotnet.microsoft.com/en-us/download). For the web application, F12 should usually do.

### Get the code
Clone the entire Pilot solution from github. Either use git, or the built-in functions in Visual Studio.

### nginx
nginx is used to deliver static content (the entire web gui) and the map tiles. We will also configure it to forward api calls to the port on which our REST API runs in the debugger.

### Cofiguration
There is some configuration to be done in order for all the parts of the system to play well together. No magic there. 

## Step by Step example
This example shows the step-by-step setup of a PiLot development environment on a machine with Debian 11 and GNOME. It should work similarly on most Linux environments. Just make sure to have a 64 bit Linux, as there is no i386 version of the dotnet SDK. So, let's go.

Install the dotnet core SDK as described [here](https://docs.microsoft.com/en-us/dotnet/core/install/linux-debian)

Install and configure git, and get the PiLot repo (replace the [brackets] by your actual github account data. The "double quotes" remain):
```
sudo apt install git
git config --global user.name "[username]"
git config --global user.email "[email]"
```
If you don't already have a directory for your git repositories, create one. So `cd` to where you want it and create the directory:
```
cd ~/Documents
mkdir repos
```
And finally clone the PiLot repo:
```
cd repos
git clone https://github.com/RCgmbh/PiLot
```
Note: Usually you don't have to authenticate. If so, you will need a Personal access token, which you can create in the [Github Settings](https://github.com/settings/tokens). In the command line, when asked for the password, enter the token instead.

Install [Visual Studio Code](https://code.visualstudio.com/Download). Download the latest version, then `cd ~/Downloads` and `sudo apt install ./code_1.63.2-1639562499.deb` (or whatever your file is called)

Now open Visual Studio Code, which should be available in the "Activities". Under "Source Control" you can open the directory where you git cloned the PiLot repo. Next, install C# for Visual Studio Code, by clicking on "Extensions" and entering `ms-dotnettools.csharp` in the search box.

We also need to add a few dotnet packages for the projects that are displayed in red. For each red project, right-click the project, such as "PiLotAPICore" in the explorer sidebar, the select "Open in integrated terminal" and enter `dotnet restore`. For some projects, this will install a zillion of dependencies, but at the end, there should be no more red projects.

Now, we should be able to debug the PiLot API. Hit F5. The "select environment" dialogue appears. Select ".NET 5+ and .NET Core". Next, in the "Select the project to launch", select "PiLotAPI". This will create a "launch.json" file, but not yet start the debugger. Hit F5 again, and now the API gets loaded and the browser opens at localhost:5000. Enter the url http://localhost:5000/api/v1/Ping, and hit enter. The Page should show "OK". Now go back to VS Code, find the file `PiLotAPICore/Controllers/PingController.cs`, and add a breakpoint at the line `return "OK"`. Refresh the browser, and check the breakpoint was hit in VS Code. Hit F10 to step next. Congrats, you are debugging the PiLot API. Hit the "stop" button on top of VS Code.

In order to easily run the web applications, we set up nginx and configure the sites for the web content and for the api. There we go:

```
sudo apt install nginx
sudo nano /etc/nginx/sites-enabled/default
```
Make sure to have the following content within the server-block.
The path has to match the path to your repos directory.
```
location /PiLotWeb/ {
	root /home/[username]/Documents/repos/PiLot;
}

location /api/{
	proxy_pass http://127.0.0.1:5000;
}
```
save the file. Finally we restart nginx:
```
sudo systemctl restart nginx
```
It's time for some configuration work.

- In PiLotWeb/js/Config.js, set apiUrl: http://localhost/api/v1

Create the data and log directories for the development environment. They can be anywhere, I choose the "Documents" directory. In the production environment, we will need to make sure the right user hat write permissions. But as for now we run the api with our personal login, things will be fine in the Documents directory.
```
cd ~/Documents
mkdir piLotDev
mkdir piLotDev/log
mkdir piLotDev/data
```
There are a few data files that we need, so we just copy them from the repo into the newly created data directory:

```
cd ~/Documents
cp -R repos/PiLot/PiLotApiCore/App_Data/* piLotDev/data/
```

Now we need to enter the data and log paths into a bunch of config files (always replace [username] by your actual username). The repo contains .example files, which need to be copied to the actual config files. These are excluded from git, so that changes remain local.
Copy **PiLotAPICore/app.example.config** to **PiLotAPICore/app.config**, and set `value="/home/[username]/Documents/piLotDev/data"` where `key="dataDir"` and `value="/home/[username]/Documents/piLotDev/data"` where `key=logfilePath`, or whatever directories you just created before.

Copy **PiLotSensors/app.example.config** to **PiLotSensors/app.config**, and update the logfilePath in the same way. Furthermore, update the value for sensorsConfigFile. The value here is `/home/[username]/Documents/piLotDev/data/sensors/sensors.json`. Before we work with the SensorsLogger, we will have to update the content of the sensors.json file, but we will do that later. And we need to update the `localAPI` value, which would usually be `http://localhost/api/v1`.

Now it's time for a first test. In VS Code, hit F5 so that the API gets started. In a browser, enter http://localhost/PiLotWeb. In the best of all cases, this will launch the PiLot web app. In the normal case, hit F12 and spend some time fixing all the issues - things you did wrong, things that I have forgotten or mixed up in the above description.

When finally the web app shows up, you will see a few things are still missing. At first, the map will be empty. We need to configure the tile sources and download some tiles. Let's do that. The tiles can be saved anywhere. However, the web server must be able to deliver them, and the API must have the permissions to save them. You might have noticed, that in the nginx config for the default site, the root is set to `/var/www/html`. So everyting within that directroy will just be delivered by nginx. We store our tiles there. We create two tile sources, one for Open Streetmap, which gives us excellent global maps, and one for Open Seamap, which adds a layer of sea maps. As the API needs to save files there (the downloaded tiles), and the API runs with our personal user when debugging, we need to grant ourselves write permissions.

```
cd /var/www/html
sudo mkdir tiles
cd tiles
mkdir openstreetmap
mkdir openseamap
cd ..
sudo chmod -R [username]:www-data tiles
sudo chmod -R 771 tiles
``` 

Now there's another config file to update, where we define our tile sources:
```
sudo nano ~/Documents/piLotDev/data/tiles/tileSources.json
```
In the first block, where name="osm", set localPath to `/var/www/html/tiles/openstreetmap/{0}/{1}/{2}.png`, and in the second block, for openseamap, set localPath to `/var/www/html/tiles/openseamap/{0}/{1}/{2}.png`. As the tileSources are cached in the application, we need to refresh the cache (or just restart the API in VS code). Open http://localhost/api/v1/TileSources/ReloadConfig. A blank page means everything is fine.

To download tiles, we open the tools page in the Web App (the tools icon in the lowermost menu section), and then click on the "Local Tiles" item. This brings up the tiles download tool. First navigate to the area you want to download. Then check the "Download" checkboxes for both sources (osm and openseamap). As soon as the map loads new tiles (when zooming or panning the map), these tiles will be saved in our local tiles directories. Additionally, you can choose to automatically save lower and higher zoom-levels. When selecting all lower zoom levels, and 2 higher zoom levels, things will take quite a while, but you will have a rather ok map available offline. To test whether the tiles have successfully downloaded, klick the "map" icon in the second section of the navigation. You should now see a proper offline map.

It's maybe a good moment to look at the log now. This is only permitted to users with admin permissions. Click on the smiley-icon on the top right to see your permissions. Then click "Login", and log in with an admin user (Username: admin, Password: secret, if you did not change users.json). Now you have the "admin" icon in the lowermost menu section, looking somewhat like a console. On the Admin page you have the "Logfiles" link. In the logfiles section, you todays logfile. Yes, it would be a good idea to set `key="logLevel" value="INFO"` in PiLotAPICore/app.config.
