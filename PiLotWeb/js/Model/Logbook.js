﻿var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Logbook = (function () {

	/**
	 * Class LogbookDay 
	 * A LogbookDay encapsulates all logbook entries plus the free-text diary for one day.
	 * Observable events are saveEntry, deleteEntry
	 * @param {RC.Date.DateOnly} pDay
	 * */
	var LogbookDay = function (pDay) {
		this.day = pDay;					// the day as DateOnly, in BoatTime
		this.diaryText = '';				// the diary text for this day, as String
		this.logbookEntries = null;			// the array of logook entries
		this.observers = null;				// observers used by RC.Utils observers pattern
		this.initialize();
	};

	/// LogbookDay Methods
	LogbookDay.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['saveEntry', 'deleteEntry']);
			this.logbookEntries = new Array();
		},

		/**
		 * Registers an observer that will be called when pEvent happens.
		 * @param {String} pEvent - 'saveEntry', 'deleteEntry'
		 * @param {Function} pCallback - The method to call 
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/** Removes ALL observers for a ALL Events */
		off: function(){
			RC.Utils.removeObservers(this.observers, 'saveEntry');
			RC.Utils.removeObservers(this.observers, 'deleteEntry');
		},

		/** Handler for when the item is saved, notifies observers */
		logbookEntry_save: function(pEntry){
			RC.Utils.notifyObservers(this, this.observers, 'saveEntry', pEntry);
		},

		/** Handler for when the item is being deleted  */
		logbookEntry_delete: function (pEntry) {
			RC.Utils.notifyObservers(this, this.observers, 'deleteEntry', pEntry);
		},

		/** @returns {RC.Date.DateOnly} */
		getDay: function () {
			return this.day;
		},

		/** @params {String} pText */
		setDiaryText: function (pText) {
			this.diaryText = pText;
		},

		/** @returns {String} */
		getDiaryText: function () {
			return this.diaryText;
		},

		/** @returns {PiLot.Model.Logbook.LogbookEntry[]} */ 
		getLogbookEntries: function () {
			return this.logbookEntries;
		},

		/** @returns {Boolean} */
		hasEntries: function () {
			return this.logbookEntries.length > 0;
		},

		/** 
		 * Adds an entry to this.logbookEntries. If pLogbookEntry is null, 
		 * a new entry is created. The added entry is returned as result.
		 * @param {PiLot.Model.Logbook.LogbookEntry|null} pLogbookEntry
		 * @returns {PiLot.Model.Logbook.LogbookEntry} - The new or added entry
		 * */
		addEntry: function (pLogbookEntry) {
			let entry = pLogbookEntry;
			if (!entry) {
				entry = new PiLot.Model.Logbook.LogbookEntry(this);
			}
			this.logbookEntries.push(entry);
			entry.on('save', this.logbookEntry_save.bind(this));
			entry.on('delete', this.logbookEntry_delete.bind(this));
			return entry;
		},

		/** 
		 * Sorts the entries by time. Default is Ascending, except for pDescending being true
		 * @param {Boolean} pDescending - if true, sort descending, else ascending
		 * */
		sortEntries: function (pDescending) {
			this.logbookEntries.sort(function (x, y) {
				return ((x.getDateTime().toMillis() - y.getDateTime().toMillis()) * (pDescending ? -1 : 1));
			});
		},

		/** @param {PiLot.Model.Logbook.LogbookEntry} pEntry */
		removeEntry(pEntry) {
			const index = this.logbookEntries.indexOf(pEntry);
			if (index > -1) {
				this.logbookEntries.splice(index, 1);
			}
		},

		/**
		 * Gets a clone of the boatSetup for the latest entry on this LogbookDay, can be null
		 * @returns {PiLot.Model.BoatSetup|null}
		 * */
		getLatestBoatSetup: function () {
			let result = null;
			this.sortEntries(false);
			let setup;
			for (let i = this.logbookEntries.length - 1; i >= 0; i--) {
				setup = this.logbookEntries[i].getBoatSetup();
				if (setup !== null) {
					result = setup.clone();
					break;
				}
			}
			return result;
		},

		/** 
		 * Saves the current diary text back to the server 
		 * @returns {Object} an object with {data: object, status: http code, ok: Boolean}
		 * */
		saveDiaryTextAsync: async function () {
			const serverObject = {
				text: this.diaryText
			}
			return PiLot.Utils.Common.putToServerAsync(`/Logbook/diary/${this.day.year}/${this.day.month}/${this.day.day}`, serverObject);
		},
	};

	/**
	 * Creates a LogbookDay based on data as it is recieved from the server
	 * @param {Object} pData
	 */
	LogbookDay.fromDataAsync = async function (pData) {
		let result = null;
		if (pData && pData.date) {
			let day = RC.Date.DateOnly.fromObject(pData.date);
			if (day.isValid()) {
				const boatConfigs = new Map();
				result = new LogbookDay(day);
				result.setDiaryText(pData.diaryText || '');
				for (const logbookEntryData of pData.logbookEntries) {
					let logbookEntry = await LogbookEntry.fromData(logbookEntryData, result, boatConfigs);
					if (logbookEntry) {
						result.addEntry(logbookEntry);
					}
				}
			} else {
				PiLot.log(`Invalid value for logbook date: ${pData.date}`, 0);
			}
		}
		return result;
	};

	/**
	 * Loads a logbookDay with all Entries from the server and returns either
	 * the LogbookDay or null.
	 * @param {RC.Date.DateOnly} pDate
	 */
	var loadLogbookDayAsync = async function (pDate) {
		const json = await PiLot.Utils.Common.getFromServerAsync(`/Logbook/${pDate.year}/${pDate.month}/${pDate.day}`);
		return await LogbookDay.fromDataAsync(json);
	};

	/**
	 * Loads the latest BoatSetup that was used no later than pDate for the current
	 * BoatConfig. Returns both, the BoatSetup and the BoatConfig. This is useful, 
	 * because me might get no boatSetup, but then still get the current boatConfig.
	 * @param {date} pDate - only setups no later than pDate will be returned
	 * @return {Object} an object {currentBoatConfig, latestBoatSetup}
	 */
	var loadCurrentBoatSetupAsync = async function (pDate) {
		const boatConfig = await PiLot.Model.Boat.loadCurrentConfigAsync();
		if (boatConfig !== null) {
			const url = `/Logbook/latestBoatSetup?year=${pDate.year}&month=${pDate.month}&day=${pDate.day}&boatConfigName=${boatConfig.getName()}`;
			const json = await PiLot.Utils.Common.getFromServerAsync(url);
			latestSetup = PiLot.Model.Boat.BoatSetup.fromData(json, boatConfig);
		}
		return { currentBoatConfig: boatConfig, latestBoatSetup: latestSetup };
	};

	/** 
	 * Class LogbookEntry.
	 * Observable events: save, delete
	 * @param {PiLot.Model.Logbook.LogbookDay} pLogbookDay - the LogbookDay (don't try without one)
	 * */
	var LogbookEntry = function (pLogbookDay) {
		this.entryId = null;			// the unique entryId
		this.logbookDay = pLogbookDay;	// the logbook day this belongs to
		this.dateTime = null;			// the Timestamp of the entry in BoatTime timezone, as Luxon DateTime
		this.title = null;				// the title text
		this.latLng = null;				// a leaflet style latLng object
		this.cog = null;				// the course over ground
		this.sog = null;				// the current speed over ground
		this.log = null;				// the current log state
		this.meteo = {};				// an anonymous object containing meteo data
		this.boatSetup = null			// a PiLot.Model.Boat.BoatSetup representing the boatSetup at the time of this entry
		this.notes = null;				// additional text for longer comments
		this.observers = null;			// observers used by RC.Utils observers pattern
		this.initialize();
	};

	/// LogbookEntry Methods
	LogbookEntry.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['save', 'delete']);			
		},

		/**
		 * Registers an observer that will be called when pEvent happens.
		 * @param {String} pEvent - 'save', 'delete'
		 * @param {Function} pCallback - The method to call 
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/** @returns {PiLot.Model.Logbook.LogbookDay} */
		getLogbookDay: function () {
			return this.logbookDay;
		},

		/** @returns {Number} */
		getEntryId: function () {
			return this.entryId;
		},

		/** @param {Number} pEntryId */
		setEntryId: function (pEntryId) {
			this.entryId = pEntryId;
		},

		/** gets the dateTime as Luxon DateTime in the BoatTime timezone */
		getDateTime: function () {
			return this.dateTime;
		},

		/** sets the time of the entry based on a luxon object */
		setDateTime: function (pDateTime) {
			this.dateTime = pDateTime;
		},

		/**
		 * Sets the time of the entry, both in UTC and in BoatTime 
		 * @param {Number} pUtc - the UTC timestamp in seconds from epoc
		 * @param {Number} pBoatTime - the BoatTime timestamp in seconds from epoc
		 */
		setTime: function (pUtc, pBoatTime) {
			this.dateTime = new PiLot.Model.Common.BoatTime((pBoatTime - pUtc) / 60, false).fromSeconds(pBoatTime);
		},

		/**
		 * Sets the dateTime based on a daytime (seconds since midnight), using
		 * the actual offset of this.dateTime, or, if there is no dateTime yet,
		 * the BoatTime provided. This allows to both set and update the times,
		 * while either using the current BoatTime or keeping any existing offset
		 * @param {Number} pSeconds - seconds since midnight
		 * @param {PiLot.Model.Common.BoatTime} - the current BoatTime
		 */
		setTimeOfDay: function (pSeconds, pBoatTimeObject) {
			let boatTimeObject;
			if (this.dateTime) {
				boatTimeObject = new PiLot.Model.Common.BoatTime(this.dateTime.offset, false);
			} else {
				boatTimeObject = pBoatTimeObject;
			}
			this.dateTime = boatTimeObject.fromSeconds(this.logbookDay.getDay().totalSeconds() + pSeconds);
		},

		getTitle: function () {
			return this.title;
		},

		setTitle: function (pTitle) {
			this.title = pTitle;
		},

		getLatLng: function () {
			return this.latLng;
		},

		/// sets or updates the coordinates based on latitude and longitude.
		/// returns whether the value has been updated
		setLatLng: function (pLat, pLng) {
			let result = false;
			if ((pLat !== null) && (pLng !== null)) {
				if (this.latLng === null) {
					this.latLng = new L.LatLng(pLat, pLng);
				} else {
					this.latLng.lat = pLat;
					this.latLng.lng = pLng;
				}
				result = true;
			}
			return result;
		},

		/// returns the latitude or null, if latLng is null
		getLatitude: function () {
			return this.latLng !== null ? this.latLng.lat : null
		},

		/// returns the longitude or null, if latLng is null
		getLongitude: function () {
			return this.latLng !== null ? this.latLng.lng : null
		},

		getCOG: function () {
			return this.cog;
		},

		setCOG: function (pCOG) {
			if ((pCOG === null) || (pCOG === '')) {
				this.cog = null;
			} else if (RC.Utils.isNumeric(pCOG)) {
				this.cog = Number(pCOG);
			}
		},

		getSOG: function () {
			return this.sog;
		},

		setSOG: function (pSOG) {
			if ((pSOG === null) || (pSOG === '')) {
				this.sog = null;
			} else if (RC.Utils.isNumeric(pSOG)) {
				this.sog = Number(pSOG);
			}
		},

		getLog: function () {
			return this.log;
		},

		setLog: function (pLog) {
			if ((pLog === null) || (pLog === '')) {
				this.log = null;
			} else if (RC.Utils.isNumeric(pLog)) {
				this.log = Number(pLog);
			}
		},

		getMeteo: function () {
			return this.meteo;
		},

		/**
		 * Sets an object with {weather, temperature, pressure, windForce, windDirection, waveHeight}
		 * as meteo data. 
		 * @param {Object} pMeteo - the raw object
		 */
		setMeteo: function (pMeteo) {
			this.meteo = pMeteo;
		},

		getBoatConfig: function () {
			return this.boatSetup.getBoatConfig();
		},

		getBoatConfigName: function () {
			return this.getBoatConfig().getName();
		},

		getBoatSetup: function () {
			return this.boatSetup;
		},

		setBoatSetup: function (pBoatSetup) {
			this.boatSetup = pBoatSetup;
		},

		getNotes: function () {
			return this.notes;
		},

		setNotes: function (pNotes) {
			this.notes = pNotes;
		},

		/** saves the LogbookEntry to the server and updates the entryId */
		saveAsync: async function () {
			const result = await PiLot.Utils.Common.putToServerAsync(`/Logbook/entry`, this);
			if (result.ok) {
				this.entryId = result.data.entryId;
				RC.Utils.notifyObservers(this, this.observers, 'save', null);
			} else {
				PiLot.Utils.Common.log(`Error saving LogbookEntry`, 0);
			}
		},

		/** 
		 * Deletes an entry from the logbook day and deletes the item from the server.
		 * @returns {Boolean} whether deletion was successful
		 * */
		deleteAsync: async function () {
			const path = `/Logbook/entry/${this.entryId}`;
			const deleted = await PiLot.Utils.Common.deleteFromServerAsync(path);
			if (deleted) {
				this.logbookDay.removeEntry(this);
				RC.Utils.notifyObservers(this, this.observers, 'delete', null);
			}
			return deleted;
		},

		/** Converts the js object into an object as it is expected by the server */
		toServerObject: function () {
			return {
				entryId: this.entryId,
				utc: RC.Date.DateHelper.luxonToUnix(this.dateTime),
				boatTime: RC.Date.DateHelper.luxonToUnixLocal(this.dateTime),
				title: this.title,
				latitude: this.getLatitude(),
				longitude: this.getLongitude(),
				cog: this.cog,
				sog: this.sog,
				log: this.log,
				meteo: this.meteo,
				boatSetup: this.boatSetup,
				notes: this.notes
			};
		}
	};

	/**
	 * Tries to create a LogbookEntry from a data object as recieved from the server.
	 * If creation fails, returns null. Needs a LogbookDay (required to create a LogbookEntry)
	 * plus a Map of BoatSetups (which can initially be empty and will be filled as needed)
	 * in order to not create different BoatConfigs. 
	 * @param {Object} pData - the data from the server
	 * @param {LogbookDay} pLogbookDay - the LogbookDay this belongs to
	 * @param {Map} pBoatConfigs - a map with those BoatSetups already loaded
	 */
	LogbookEntry.fromData = async function (pData, pLogbookDay, pBoatConfigs) {
		let result = null;
		if (pData.entryId) {
			result = new LogbookEntry(pLogbookDay);
			result.setEntryId(pData.entryId);
			result.setTime(pData.utc, pData.boatTime);
			result.setTitle(pData.title);
			result.setLatLng(pData.latitude, pData.longitude);
			result.setCOG(pData.cog);
			result.setSOG(pData.sog);
			result.setLog(pData.log);
			result.setMeteo(pData.meteo);
			let boatConfig;
			if (pBoatConfigs.has(pData.boatSetup.boatConfigName)) {
				boatConfig = pBoatConfigs.get(pData.boatSetup.boatConfigName)
			} else {
				boatConfig = await PiLot.Model.Boat.loadConfigAsync(pData.boatSetup.boatConfigName);
				if (boatConfig) {
					pBoatConfigs.set(pData.boatSetup.boatConfigName, boatConfig);
				}
			}
			result.setBoatSetup(PiLot.Model.Boat.BoatSetup.fromData(pData.boatSetup, boatConfig));
			result.setNotes(pData.notes);
		}
		return result;
	};

	/**
	 * This loads and stores information about Diary data (track, logbook/diary, photos)
	 * and gives quick access to the data
	 * */
	DiaryInfoCache = function () {
		this.infoMap = null;			// a Map with a Map for each year, with a Map for each month with an object for each day
		this.initialize();
	};

	DiaryInfoCache.prototype = {

		initialize: function () {
			this.infoMap = new Map();
		},

		/**
		 * Preloads data for a month as well as for the previous and next month
		 * @param {Number} pYear - the year
		 * @param {Number} pMonth - the month (1-12)
		 */
		preloadData: async function (pYear, pMonth) {
			let year = pYear;
			let month = pMonth;
			month--;
			if (month < 1) {
				month = 12;
				year--;
			}
			for (let i = 0; i < 3; i++) {
				await this.getMonthInfoAsync(year, month);
				month++;
				if (month > 12) {
					month = 1;
					year++;
				}
			}
		},

		/// this returns the info for one month, a Map with one object per day,
		/// where key = day (1-31) and value is {hasTrack, hasLogbook, hasPhotos}
		/// the date is taken from the map we store, or loaded from the server
		getMonthInfoAsync: async function (pYear, pMonth) {
			let yearMap;
			let monthMap;
			if (this.infoMap.has(pYear)) {
				yearMap = this.infoMap.get(pYear);
			} else {
				yearMap = new Map();
				this.infoMap.set(pYear, yearMap);
			}
			if (yearMap.has(pMonth)) {
				monthMap = yearMap.get(pMonth);
			} else {
				monthMap = new Map();
				const monthInfos = await Promise.all([
					this.loadLogbookMonthAsync(pYear, pMonth),
					PiLot.Service.Nav.TrackService.getInstance().loadMonthlyTrackSummaryAsync(pYear, pMonth)
				]);
				const logbookMonthInfo = monthInfos[0];
				const trackMonthInfo = monthInfos[1];
				for (let i = 0; i < logbookMonthInfo.length; i++) {
					monthMap.set(i + 1, {
						hasTrack: trackMonthInfo[i],
						hasLogbook: logbookMonthInfo[i].hasLogbook,
						hasPhotos: logbookMonthInfo[i].hasPhotos
					});
				}
				yearMap.set(pMonth, monthMap);
			}
			return monthMap;
		},

		/** Gets the next day with any data, but only based on preloaded data for the calendar.
		 * returns null, if nothing is found within this data.
		 * @param {DateTime} pDate - The start date to search from (not included)
		 * */
		getPreviousDate: function (pDate) {
			return this.getClosestDate(pDate, true);
		},

		/** Gets the next day with any data, but only based on preloaded data for the calendar.
		 * returns null, if nothing is found within this data.
		 * @param {DateTime} pDate - The start date to search from (not included)
		 * */
		getNextDate: function (pDate) {
			return this.getClosestDate(pDate, false);
		},

		/**
		 * Gets the previous or next day with data, but only based on preloaded data for the calendar.
		 * returns null, if nothing is found within this data.
		 * @param {RC.Date.DateOnly} pDate - The start date to search from (not included)
		 * @param {Boolean} pSearchDescending - true: search backwards (previous), false: search forward (next)
		 * @return {RC.Date.DateOnly}
		 */
		getClosestDate: function (pDate, pSearchDescending) {
			let result = null;
			let loopDate = pDate.toLuxon();
			let info;
			do {
				loopDate = loopDate.plus({ days: pSearchDescending ? -1 : 1 });
				info = null;
				if (this.infoMap.has(loopDate.year) && this.infoMap.get(loopDate.year).has(loopDate.month)) {
					info = this.infoMap.get(loopDate.year).get(loopDate.month).get(loopDate.day);
					if (info.hasTrack || info.hasLogbook || info.hasPhotos) {
						result = RC.Date.DateOnly.fromObject(loopDate);
					}
				} 
			}
			while ((info !== null) && (result === null));
			return result;
		},

		/**
		 * Loads consolidated data for each day of a month from the server. The result is
		 * an array of objects {hasTrack, hasLogbook, hasPhotos}, with exactly one object
		 * per day, sorted by date ascending
		 * @param {Number} pYear
		 * @param {Number} pMonth
		 */
		loadLogbookMonthAsync: async function (pYear, pMonth) {
			return await PiLot.Utils.Common.getFromServerAsync(`/Logbook/${pYear}/${pMonth}`);
		}
	};

	/**
	 * Loads the photos for one day, returning info about the photos root, the
	 * thumbnail folders and the image names. This can be passed to an image
	 * gallery control.
	 * @param {RC.Date.DateOnly} pDate
	 */
	var loadDailyImageCollectionAsync = async function (pDate) {
		PiLot.log('PiLot.Logbook.Model.loadDailyImageCollectionAsync', 3);
		const url = `/Photos?year=${pDate.year}&month=${pDate.month}&day=${pDate.day}`;
		const json = await PiLot.Utils.Common.getFromServerAsync(url);
		return new RC.ImageGallery.ImageCollection(json.rootUrl, json.zoomFolders, json.imageNames);
	};

	/**
	 * Uploads a photo to the server
	 * @param {Byte[]} pBytes - the image bytes as array
	 * @param {String} pFilename - the original filename
	 * @param {RC.Date.DateOnly} pDate - the image date
	 */
	var uploadPhotoAsync = async function (pDate, pFilename, pBytes) {
		PiLot.log('PiLot.Logbook.Model.uploadPhotoAsync', 3);
		const url = `/Photos?day=${pDate.toLuxon().toFormat('yyyy-MM-dd')}&fileName=${pFilename}`;
		const result = await PiLot.Utils.Common.putToServerAsync(url, pBytes, true);
		return result;
	};

	var deletePhotoAsync = async function (pDate, pFilename) {
		PiLot.log('PiLot.Logbook.Model.deletePhotoAsync', 3);
		const url = `/Photos?day=${pDate.toLuxon().toFormat('yyyy-MM-dd')}&fileName=${pFilename}`;
		const result = await PiLot.Utils.Common.deleteFromServerAsync(url);
		return result;
	}

	/**
	 * Loads an array of objects from the server, representing the
	 * configured publish targets.
	 * @returns {Object[]} with {name, displayName}
	 */
	var loadPublishTargetsAsync = async function () {
		PiLot.log('PiLot.Logbook.Model.loadPublishTargetsAsync', 3);
		const url = '/PublishTargets';
		const json = await PiLot.Utils.Common.getFromServerAsync(url);
		return json;
	};

	/**
	 * Loads data for one day, used for the sync meccano. There will be no
	 * specific object created, but instead it just returns the structure
	 * as it comes from the server, having success, messages and a data 
	 * object with track, logbookDay, photoInfos. From the data objects,
	 * we create the according PiLot Model objects.
	 * @param {String} pTargetName - the name of the publish target
	 * @param {RC.Date.DateOnly} pDate - the date for which we want the data
	 * @return {Object} with {success, messages, data: {track, logbookDay, photoInfos}}
	 * */
	var loadDailyDataAsync = async function (pTargetName, pDate) {
		PiLot.log('PiLot.Logbook.Model.loadDailyDataAsync', 3);
		const url = `/PublishTargets/${pTargetName}/${pDate.year}/${pDate.month}/${pDate.day}`;
		const result = await PiLot.Utils.Common.getFromServerAsync(url);
		if (result.success) {
			let tracks = [];
			for(aTrackData of result.data.tracks){
				const track = PiLot.Model.Nav.Track.fromData(aTrackData);
				if(track && track.hasTrackPoints()){
					tracks.push(track);
				}
			}
			result.data.tracks = tracks;
			result.data.logbookDay = await PiLot.Model.Logbook.LogbookDay.fromDataAsync(result.data.logbookDay);
			result.data.photoInfos = new RC.ImageGallery.ImageCollection(result.data.photoInfos.rootUrl, result.data.photoInfos.zoomFolders, result.data.photoInfos.imageNames);
		}
		return result;
	};

	/**
	 * Gets the status of any running publish Job for a target and date. It can
	 * either return null, or an object with {overallStatus: int, messages: string[], isFinished: boolean }
	 * overallStatus: Idle = 0, Busy = 1, Finished = 2, Skipped = 3, Error = 9
	 * @param {String} pTargetName
	 * @param {RC.Date.DateOnly} pDate
	 */
	var loadJobStatusAsync = async function (pTargetName, pDate) {
		PiLot.log('PiLot.Logbook.Model.loadJobStatusAsync', 3);
		const url = `/PublishJobs/${pTargetName}/${pDate.year}/${pDate.month}/${pDate.day}`;
		const result = await PiLot.Utils.Common.getFromServerAsync(url);
		return result;
	};

	/**
	 * Sends a publish Job to the server. Take good care of the result, as the server might
	 * return with a 409, if there is an existing active Job on the server. You might want
	 * to first call loadJobStatusAsync, and only have a close look at the isFinished. The
	 * publishSelection takes the values 0: ignore, 1: publish & replace, 2: publish & add/merge. 
	 * @param {String} pTargetName
	 * @param {RC.Date.DateOnly} pDate
	 * @param {Object} pPublishSelection - { publishTrackMode: 0|1 , publishDiaryMode: 0|1|2, publishLogbookMode: 0|1|2, publishPhotos: String[] }
	 */
	var sendPublishJobAsync = async function (pTargetName, pDate, pPublishSelection) {
		PiLot.log('PiLot.Logbook.Model.sendPublishJobAsync', 3);
		const url = `/PublishJobs/${pTargetName}/${pDate.year}/${pDate.month}/${pDate.day}`;
		var result = await PiLot.Utils.Common.putToServerAsync(url, pPublishSelection);
		return result;
	};

	/// Returning the class and static method definitions
	return {
		LogbookDay: LogbookDay,
		LogbookEntry: LogbookEntry,
		DiaryInfoCache: DiaryInfoCache,
		loadLogbookDayAsync: loadLogbookDayAsync,
		loadCurrentBoatSetupAsync: loadCurrentBoatSetupAsync,
		loadDailyImageCollectionAsync: loadDailyImageCollectionAsync,
		uploadPhotoAsync: uploadPhotoAsync,
		deletePhotoAsync: deletePhotoAsync,
		loadPublishTargetsAsync: loadPublishTargetsAsync,
		loadDailyDataAsync: loadDailyDataAsync,
		loadJobStatusAsync: loadJobStatusAsync,
		sendPublishJobAsync: sendPublishJobAsync
	};

})();