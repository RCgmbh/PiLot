/**
 * (c) 2021 Röthenmund Consulting GmbH
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *  
 * The full license text is available at https://github.com/RCgmbh/PiLot/blob/master/LICENSE.
 *  
 * THIS PROGRAM DOES IN NO WAY REPLACE SUITABLE NAVIGATION EQUIPMENT, UP-TO-DATE OFFICIAL CHARTS OR EDUCATED SEAMANSHIP.
 **/

var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Common = (function () {

	/**
	 * The BoatTime is the virtual timezone used on the boat. It is defined by
	 * just the UtcOffset, and offers some help to handle BoatTime-local DateTimes. It also makes 
	 * sure the client uses the time from the server, as these can differ in offline szenarios.
	 * @param {Number} pUtcOffset - the utc offset in minutes, e.g. 60 for MEZ
	 *  */ 
	var BoatTime = function (pUtcOffset) {
		this.utcOffset = pUtcOffset;
		this.clientServerError = 0;							
	};

	BoatTime.prototype = {

		/** @returns {DateTime} the current boat time as luxon DateTime */
		now: function (pLocale = null) {
			return this.fromMillisUTC(this.utcNowUnix() * 1000, pLocale);
		},

		/** @returns {RC.Date.DateOnly} the current day */
		today: function () {
			return RC.Date.DateOnly.fromObject(this.now());
		},

		/** @returns {DateTime} utc now as Luxon */
		utcNow: function () {
			return DateTime.fromMillis(this.utcNowMillis(), { zone: 'UTC' });;
		},

		/** @returns {Number} Gets the current boatTime in seconds from epoc */
		nowUnix: function () {
			return this.utcNowUnix() + (this.utcOffset * 60);
		},

		/** @returns {Number} the seconds from epoc corrected by the clientServerOffset, resulting in something close to server UTC */
		utcNowUnix: function () {
			return this.utcNowMillis() / 1000;
		},

		/** @returns {Number} the milliseconds from epoc corrected by the clientServerOffset, resulting in something close to server UTC */
		utcNowMillis: function(){
			return (new Date().getTime()) - this.clientServerError;
		},

		/** 
		 * @param {Number} pMillis - a value representing millis from epoc UTC
		 * @param {String} pLocale - the locale, e.g. "de-CH", allows to properly format the luxon object
		 * @returns {DateTime} a luxon DateTime object in the BoatTime timezone 
		 * */ 
		fromMillisUTC: function (pMillis, pLocale) {
			const utc = DateTime.fromMillis(pMillis, { zone: 'UTC' });
			let result = DateTime.fromObject({
				year: utc.year,
				month: utc.month,
				day: utc.day,
				hour: utc.hour,
				minute: utc.minute,
				second: utc.second,
                millisecond: utc.millisecond				
			}, {
                locale: pLocale || navigator.language || 'de-CH',
                zone: this.getTimezoneName()
			});
			result = result.plus({ minutes: this.utcOffset });
			return result;
		},

		/**
		 * Creates a luxon DateTime from seconds since Epoc. The seconds represent a point in time in BoatTime (not UTC).
		 * @param {Number} pSeconds - seconds since epoc in BoatTime (not UTC)
		 * @returns {DateTime} a luxon DateTime in boattime zone
		 * */
		fromSeconds: function (pSeconds) {
			return DateTime.fromSeconds(pSeconds - this.utcOffset * 60, {zone: this.getTimezoneName()});
		},

		/**  @returns {Number} the boat time's UTC offset in minutes */ 
		getUtcOffsetMinutes: function () {
			return this.utcOffset;
		},

		/**  @returns {Number} the boat time's UTC offset in hurs */ 
		getUtcOffsetHours: function () {
			return this.utcOffset / 60;
		},

		/** @param {Number} pOffsetMinutes - the UTC offset in minutes */ 
		setUtcOffset: function (pOffsetMinutes) {
			this.utcOffset = pOffsetMinutes;
		},

		/**  @returns {Number} the difference between client utc and server utc in milliseconds */
		getClientServerError: function () {
			return this.clientServerError;
		},
		
		/**  @returns {Number} the difference between client utc and server utc in seconds */
		getClientServerErrorSeconds: function () {
			return this.clientServerError / 1000;
		},	

		/** @param {Number} pClientServerError - the difference between client utc and server utc in milliseconds */
		setClientServerError: function(pClientServerError){
			this.clientServerError = pClientServerError;
		},

		/** @returns {String} astring like UTC+1, to be used for setZone */
		getTimezoneName: function () {
			let plusSign = this.utcOffset >= 0 ? '+' : '';
			return 'UTC' + plusSign + this.getUtcOffsetHours();
		},

		/** @returns {Object} an object that can be processed on the server */
		toServerObject: function () {
			return {
				utcOffset: this.utcOffset
			};
		}
	};

	/** singleton instance for AuthHelper */
	var currentAuthHelper = null;

	/**
	 * Auth helper giving access to login, logout, user info and permissions. Usually
	 * you won't want to instantiate this, but instead use AuthHelper.instance() to 
	 * get the authHelper for the current rest backend. You can however manually
	 * instantiate one for a different endpoint.
	 * */
	var AuthHelper = function (pEndpointUrl = null) {
		this.endpointUrl = pEndpointUrl || '';
		this.observers = null;
		this.permissions = null;
		this.initialize();
	};

	AuthHelper.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['login', 'logout']);
		},

		/**
		 * Adds an observer.
		 * @param {String} pEvent: login, logout
		 * @param {Function} pCallback: The callback function
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/**
		 * Tries to authenticate using a given username and password. Returns true,
		 * if login succeeded, else returns false.
		 * @param {String} pUsername
		 * @param {String} pPassword
		 */
		loginAsync: async function (pUsername, pPassword) {
			const result = await PiLot.Service.Common.ServiceHelper.postToServerAsync(this.endpointUrl.concat('/Authentication/login'), { username: pUsername, password: pPassword });
			PiLot.log(`result from login attempt: data: ${result.data}, status: ${result.status}`, 3);
			const success = (result.status === 200);
			if (success) {
				await this.loadPermissionsAsync();
				RC.Utils.notifyObservers(this, this.observers, 'login', null);
			}
			return success;
		},

		/** calls the logout against the api */
		logoutAsync: async function () {
			document.cookie = 'token=;expires=Thu, 01 Jan 1970 00:00:00 GMT'
			await PiLot.Service.Common.ServiceHelper.postToServerAsync(this.endpointUrl.concat('/Authentication/logout'), null);
			await this.loadPermissionsAsync();
			RC.Utils.notifyObservers(this, this.observers, 'logout', null);
		},

		/** loads the current permissions for later use */
		loadPermissionsAsync: async function () {
			const json = await PiLot.Service.Common.ServiceHelper.getFromServerAsync(this.endpointUrl.concat('/Permissions'));
			this.permissions = Permissions.fromData(json);
		},

		/**
		 * gets the current permissions, if they have been loades using loginAsync() or 
		 * loadPermissionsAsync
		 * */
		getPermissions() {
			return this.permissions;
		}
	};

	/** Pseudo singleton accessor, gets the current authHelper */
	AuthHelper.instance = function () {
		if (currentAuthHelper === null) {
			currentAuthHelper = new AuthHelper();
		}
		return currentAuthHelper;
	};

	/**
	 * Class permissions: holds information about the current user's permissions
	 * @param {String} pUsername 
	 * @param {Boolean} pCanRead
	 * @param {Boolean} pCanWrite
	 * @param {Boolean} pCanChangeConfig
	 * @param {Boolean} pHasSystemAccess
	 * */
	var Permissions = function (pUsername, pCanRead, pCanWrite, pCanChangeSettings, pHasSystemAccess) {
		this.username = pUsername;
		this.canRead = pCanRead;
		this.canWrite = pCanWrite;
		this.canChangeSettings = pCanChangeSettings;
		this.hasSystemAccess = pHasSystemAccess;
	};

	Permissions.prototype = {

		getUsername: function () {
			return this.username;
		},

		getCanRead: function () {
			return this.canRead;
		},

		getCanWrite: function () {
			return this.canWrite;
		},

		getCanChangeSettings: function () {
			return this.canChangeSettings;
		},

		getHasSystemAccess: function () {
			return this.hasSystemAccess;
		}
	}

	/**
	 * Creates a Permissions object from the rest response json having 
	 * {username, canRead, canWrite, hasSystemAccess}
	 * @param {any} pData
	 */
	Permissions.fromData = function (pData) {
		return new Permissions(pData.username, pData.canRead, pData.canWrite, pData.canChangeSettings, pData.hasSystemAccess);
	};

	/** Static shortcut to get whether the current user can read */
	Permissions.canRead = function () {
		return AuthHelper.instance().getPermissions().getCanRead();
	};
	
	/** Static shortcut to get whether the current user can write */
	Permissions.canWrite = function () {
		return AuthHelper.instance().getPermissions().getCanWrite();
	};

	/** Static shortcut to get whether the current user can change settings */
	Permissions.canChangeSettings = function () {
		return AuthHelper.instance().getPermissions().getCanChangeSettings();
	};

	/** Static shortcut to get whether the current user has system access */
	Permissions.hasSystemAccess = function () {
		return AuthHelper.instance().getPermissions().getHasSystemAccess();
	};

	PiLot.Permissions = Permissions;

	return {
		BoatTime: BoatTime,
		AuthHelper: AuthHelper,
		Permissions: Permissions
	};

})();