# PiLot
## Publish data

### Overview
You can publish data from one PiLot to another PiLot. This is helpful if you have multiple devices and want to sync data between them. Or if you want to publish data to a public website. For instance, you can publish your live position data using the [live tracking service](livetracking.md) while you're underway, and at the end of the day additionally publish your logbook, diary and photos. The publishing feature lets you select in detail what you want to publish or not.

As the publishing feature is part of the standard installation, it only takes some configuration to make it work. Let's walk through an example setup, where you have one PiLot (let's call it pilot1) which is mobile and you take with you. This will be the client that publishes data. Then you have a second PiLot (let's call it pilot2), which sits on your desktop, is always on and something like your everyday computer, and also has the PiLot web application installed. That's the server. You want to have all your diaries, tracks, logbooks and photos available on that one too, for redundancy and to have all data available just in case you feel like reading some of last year's diaries one cold evening. In short, you want to publish data from pilot1, the client, to pilot2, the server.

### Client Configuration
On the client, you configure the publishing targets. You can have multiple targets, in case you not only want to publish to pilot2 as in our example, but also to your website. The targets are configured in `/etc/pilot/publishingTargets.json` on **pilot1**. In our example, given that pilot2 is available in your network by its name (http://pilot2), this might look like this:

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

Second, to have the permission to publish data, you need a user with the "admin" role on pilot1. Therefore, in the `/etc/pilot/users.json` file on **pilot1** you need an admin user, which will be the case if the file content looks like this (multiple users could be configured with one curly brackets block per user, separated by a colon):

```
[
	{
		"username": "admin",
		"pwd": "$uper$ecret",
		"rolename": "admin"
	}
]
```
In order to update the user configuration, which is only read from file on start, you need to restart the pilot api with this command on pilot1:
```
sudo systemctl restart pilotApi
```

### Server configuration
On the server, you only need to grant write permissions to the client. The publishing mechanism uses the same interface as the web application, so granting permission works exactly the same as granting permissions to a user for the web application. The users are again configured in `/etc/pilot/users.json`. To grant write permissions to pilot1 (which is the username we configured above), you need the users.json file on **pilot2** to look like this:
```
[
	{
		"username": "pilot1",
		"pwd": "$ecret1",
		"rolename": "writer"
	}
]
```

Having changed the users.json file, you also need to restart the pilot api on pilot2:
```
sudo systemctl restart pilotApi
```

That's already it. Now open the pilot web application on pilot1, go to the diary page (with the book icon), select "Edit mode" at the bottom, add some diary text, create some logbook entries and make sure the gps logger is running. Then click the "Publish" link at the bottom of the page (depending on your users configuration, you will have to change the user. You need admin rights for this). Klicking it will show the publishing page, where you can select "PiLot2" as target, then select which data you want to publish and hit the "Publish" button. When done, the data for that day will be available on PiLot2 as well.

Now, well... that's basically it. You have a full-featured PiLot, so it's time to go on the water and see how it works! For any ideas, questions or other feedback, just crate an issue. Good luck and have fun with your PiLot. And don't forget, always have official, up-to date charts with you along with the PiLot.

<< [Back to overview](user.md)
