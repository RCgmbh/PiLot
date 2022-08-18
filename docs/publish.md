# PiLot
## Publish data

### Overview
You can publish data from one PiLot to another PiLot. This is helpful if you have multiple devices and want to sync data between them. Or if you want to publish data to a public website. For instance, you can publish your live position data using the [live tracking service](livetracking.md) while you're underway, and at the end of the day additionally publish your logbook, diary and photos. The publishing feature lets you select in detail what you want to publish or not.

As the publishing feature is part of the standard installation, it only takes some configuration to make work. Let's walk throught an example setup, where you have one PiLot (let's call it pilot1) which is mobile and you take with you. This will be the client, which publishes data in our example. Then you have and a second PiLot (let's call it pilot2), which sits on your desktop, is always on and something like your everyday computer, but also has the PiLot web application installed. You want to have all your diaries, tracks, logbooks and photos available on that one too, for redundancy and to have all data available just in case you feel like reading some of last year's diaries. In short, you want to publish data from pilot1, the client, to pilot2, the server.

### Client Configuration
On the client, you configure the publishing targets. You can have multiple targets, in case you not only want to publish to pilot2 in our example, but also to your website. The targets are configured in `/etc/pilot/publishingTargets.json`. In our example, given that pilot2 is available in your network by its name (http://pilot2), this might look like this:

```
[
	{
		"name": "PiLot2",
		"displayName": "PiLot2",
		"apiUrl": "http://pilot2/pilotapi/v1",
		"webUrl": "http://pilot2/pilot",
		"username": "pilot1",
		"password": "$ecret1"
	}
] 
```

The web url is needed to provide preview images of the images available on the server, which helps in deciding which images to publish.

Second, to have the permission to publish data, you need a user with the "admin" role. Therefore, on pilot1, in the `/etc/pilot/users.json` file you need an admin user, which will be the case if the file content looks like this:

```
[
  {
		"username": "admin",
		"pwd": "$uper$ecret",
		"rolename": "admin"
	}
]
```

### Server configuration
On the server, you only need to crant write permissions to the client. The publishing mechanism uses the same interface as the web application, so granting permission works exactly the same as granting permissions to a user using the web application. The users are configured in `/etc/pilot/users.json`. To grant write permissions to pilot1 (which is the username we configured above), you need the users.json file look like this (multiple users are configured with one curly brackets block per user, separated by a colon):
```
[
  {
		"username": "pilot1",
		"pwd": "$ecret1",
		"rolename": "writer"
	}
]
```

That's already it. Now open the pilot web application on pilot1, go to the logbook page (with the feather icon), add some diary text, create some logbook entries and make sure the gps logger is running. Then change onto the diary page (the one with the book icon), make sure you're logged in as admin (click on the smiley on top right) and you should see the "Publish" button at the bottom of the page. Klicking it will show the publishing page, where you can select "PiLot2" as target, then select which data you want to publish and hit the "Publish" button. When done, the data for that day will be available on PiLot2 as well.

Now, finally, to make it all complete, it's time to draw your boat! To see how, move on to the next page.

\> [Customize your boat...](boat.md)

<< [Back to overview](user.md)
