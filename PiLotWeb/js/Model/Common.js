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

	var currentBoatTime = null;

	/// The BoatTime is the virtual timezone used on the boat. It is defined by
	/// just the UtcOffset, and offers some help to handle BoatTime-local DateTimes
	var BoatTime = function (pUtcOffset, pIsCurrentBoatTime) {
		this.utcOffset = 0;								// the offset against UTC in minutes
		this.clientErrorOffsetSeconds = 0;				// the number of seconds the client is wrong relative to the server (comparing utc)
		this.setUtcOffset(pUtcOffset);
		this.isCurrentBoatTime = pIsCurrentBoatTime;	// if true, any change in the BoatTime will be saved to the server
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

		/// gets UTC now, corrected by clientErrorOffsetSeconds, therefore
		/// close to Server UTC, as luxon DateTime	
		utcNow: function () {
			return luxon.DateTime.fromMillis(this.utcNowUnix() * 1000, { zone: 'UTC' });;
		},

		/** Gets the current boatTime in seconds from epoc */
		nowUnix: function () {
			return this.utcNowUnix() + (this.utcOffset * 60);
		},

		/// Gets seconds from epoc in UTC, corrected by client error, resulting
		/// in something close to server UTC
		utcNowUnix: function () {
			return (new Date().getTime() / 1000) - this.clientErrorOffsetSeconds;
		},

		/// Creates a luxon DateTime object in the BoatTime timezone based on 
		/// a value representing millis from epoc UTC
		fromMillisUTC: function (pMillis, pLocale) {
			var utc = luxon.DateTime.fromMillis(pMillis, { zone: 'UTC' });
			var result = luxon.DateTime.fromObject({
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

		/// Creates a luxonDateTime from seconds since Epoc. The seconds represent
		/// a point in time in BoatTime (not UTC).
		fromSeconds: function (pSeconds) {
			return luxon.DateTime.fromSeconds(pSeconds - this.utcOffset * 60, {zone: this.getTimezoneName()});
		},

		/// sets the utc offset of the current boat time, in minutes
		/// e.g. for MEZ: 60, and writes it back to the server if this
		/// is the default boatTime
		setUtcOffset: function (pOffsetMinutes, pSuppressSave = false) {
			if (RC.Utils.isNumeric(pOffsetMinutes)) {
				this.utcOffset = Number(pOffsetMinutes);
			} else {
				PiLot.log('invalid pOffsetMinutes: ' + pOffsetMinutes, 0);
				this.utcOffset = 0;
			}
			if (this.isCurrentBoatTime && !pSuppressSave) {
				PiLot.Utils.Common.putToServerAsync(`/Settings/boatTime?utcOffset=${this.utcOffset}`);
			}
		},

		/// takes the current server time utc as luxon object, and calculates
		/// the client error offset.
		calculateClientError: function (pServerUTC) {
			if (pServerUTC instanceof luxon.DateTime) {
				this.clientErrorOffsetSeconds = luxon.DateTime.utc().diff(pServerUTC).as('seconds');
				PiLot.Utils.Common.log(`clientOffsetErrorSeconds set to ${this.clientErrorOffsetSeconds}`, 3);
			} else {
				PiLot.Utils.Common.log(`invalid value for pServerUTC while a luxon object was expected. ${pServerUTC} `, 0);
			}
		},

		/// gets the boat time's UTC offset in minutes
		getUtcOffsetMinutes: function () {
			return this.utcOffset;
		},

		/// gets the boat time's UTC offset in hours
		getUtcOffsetHours: function () {
			return this.utcOffset / 60;
		},

		/// gets the offset error of the client compared to the server in seconds
		getClientErrorOffsetSeconds: function () {
			return this.clientErrorOffsetSeconds;
		},

		/// returns a string like UTC+1, to be used for setZone
		getTimezoneName: function () {
			let plusSign = this.utcOffset >= 0 ? '+' : '';
			return 'UTC' + plusSign + this.getUtcOffsetHours();
		},

		/// converts this to an object that can be processed on the server
		toServerObject: function () {
			return {
				utcOffset: this.utcOffset
			};
		}
	};

	/// creates a BoatTime object based on an object loaded from the server. Don't use this
	/// to create the current BoatTime.
	BoatTime.fromServerObject = function (pServerObject) {
		var result = null;
		if (pServerObject && 'UtcOffset' in pServerObject) {
			result = new BoatTime(pServerObject.UtcOffset);
		} else {
			PiLot.Utils.Common.log('Invalid argument in BoatTime.fromServerObject: ' + pServerObject);
		}
		return result;
	};

	/**
	 * Gets the current boatTime either from the instance or from the server
	 * Usage: PiLot.Model.Common.getCurrentBoatTymeAsync.then({b=> blah;});
	 * or const boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
	 * This also measures the entire time of the request/response, and adds
	 * a part of it to correct the client error in order to get a best
	 * possible quess of the client/server difference
     * @param {Boolean} pForceReload - Set to true to force reload from the server
	 * */
    async function getCurrentBoatTimeAsync(pForceReload = false) {
        if (currentBoatTime === null || pForceReload) {
			const requestTime = luxon.DateTime.utc();
			const json = await PiLot.Utils.Common.getFromServerAsync('/Settings/boatTime');
			const responseTime = luxon.DateTime.utc();
			const responseMillis = (responseTime.toMillis() - requestTime.toMillis()) * 0.9; // we just guess 90% of the time was the response
			const serverTimeUTC = RC.Date.DateHelper.millisToLuxon(json.utcNow + responseMillis);
			currentBoatTime = currentBoatTime || new BoatTime(json.utcOffsetMinutes || 0, true); // another instance might have been created in the meantime, therefore the ||
			currentBoatTime.calculateClientError(serverTimeUTC);
		}
		return currentBoatTime;
	}

	/** singleton instance for AuthHelper */
	var currentAuthHelper = null;

	/**
	 * Auth helper giving access to login, logout, user info and permissions. Usually
	 * you won't want to instantiate this, but instead use AuthHelper.instance() to 
	 * get the authHelper for the current rest backend. You can hovewer manually
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
			const result = await PiLot.Utils.Common.postToServerAsync(this.endpointUrl.concat('/Authentication/login'), { username: pUsername, password: pPassword });
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
			await PiLot.Utils.Common.postToServerAsync(this.endpointUrl.concat('/Authentication/logout'), null);
			await this.loadPermissionsAsync();
			RC.Utils.notifyObservers(this, this.observers, 'logout', null);
		},

		/** loads the current permissions for later use */
		loadPermissionsAsync: async function () {
			const json = await PiLot.Utils.Common.getFromServerAsync(this.endpointUrl.concat('/Permissions'));
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
		getCurrentBoatTimeAsync: getCurrentBoatTimeAsync,
		BoatTime: BoatTime,
		AuthHelper: AuthHelper,
		Permissions: Permissions
	};

})();