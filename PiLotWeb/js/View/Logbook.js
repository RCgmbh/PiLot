var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Logbook = (function () {

	/**
	 * The LogbookPage allows to enter and edit logbook entries for the current day. This
	 * is very much like the open paperbook on the nav table. For editing data of past days,
	 * the diary page is used. This one here has the sole goal of quickly and correctly 
	 * create new logbook entries.
	 * */
	var LogbookPage = function () {

		this.logbookDay = null;			// PiLot.Model.Logbook.LogbookDay
		this.boatTime = null;			// PiLot.Model.Common.BoatTime
		this.gpsObserver = null;		// PiLot.Model.Nav.GPSObserver
		this.boatConfig = null;			// PiLot.Model.Boat.BoatConfig, the current boat config
		this.boatImageConfig = null;	// PiLot.View.Boat.BoatImageConfig
		this.editForm = null;			// PiLot.View.Logbook.LogbookEntryForm
		this.logbookEntries = null;		// PiLot.View.Logbook.LogbookEntries
		this.pnlNoEntries = null;		// HTMLElement
		this.pnlRecentSetups = null;	// HTMLElement
		this.plhRecentSetups = null;	// HTMLElement
		this.pnlDefaultSetups = null;	// HTMLElement
		this.plhDefaultSetups = null;	// HTMLElement

		this.initializeAsync();
	};

	LogbookPage.prototype = {

		initializeAsync: async function () {
			await Promise.all(
				[PiLot.Model.Common.getCurrentBoatTimeAsync(), PiLot.Service.Boat.BoatConfigService.getInstance().loadCurrentConfigAsync()]
			).then(results => {
				this.boatTime = results[0];
				this.boatConfig = results[1];
				this.boatImageConfig = new PiLot.View.Boat.BoatImageConfig(this.boatConfig);
			});
			this.gpsObserver = PiLot.Model.Nav.GPSObserver.getInstance();
			await this.loadLogbookDayAsync();
			this.draw();
			this.showLogbookDay();
		},

		unload: function(){
			PiLot.Model.Nav.GPSObserver.stopInstance();
		},

		/** Click handler for the add entry link * */
		lnkAddEntry_click: async function () {
			this.showEntryFormAsync(null);
		},

		/** Handles all changes of the LogbookDay */
		logbookDay_change: function () {
			this.showNewEntryLinks();
			this.updateNoEntries();
		},

		/** draws the form  */
		draw: function () {
			const logbookPage = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookPage);
			PiLot.Utils.Loader.getContentArea().appendChild(logbookPage);
			this.editForm = new PiLot.View.Logbook.LogbookEntryForm(this.gpsObserver);
			const plhLogbookEntries = logbookPage.querySelector('.plhLogbookEntries');
			this.logbookEntries = new LogbookEntries(plhLogbookEntries, this.editForm, this.boatTime, { isReadOnly: false, sortDescending: true });
			this.pnlNoEntries = logbookPage.querySelector('.pnlNoEntries');
			logbookPage.querySelector('.lnkAddEntry').addEventListener('click', this.lnkAddEntry_click.bind(this));
			this.pnlRecentSetups = logbookPage.querySelector('.pnlRecentSetups');
			this.plhRecentSetups = logbookPage.querySelector('.plhRecentSetups');
			this.pnlDefaultSetups = logbookPage.querySelector('.pnlDefaultSetups');
			this.plhDefaultSetups = logbookPage.querySelector('.plhDefaultSetups');
		},

		/** Loads the current logbookDay, of if none exists, creates a new one */
		loadLogbookDayAsync: async function () {
			this.logbookDay = await PiLot.Model.Logbook.loadLogbookDayAsync(this.boatTime.today());
			if (this.logbookDay === null) {
				this.logbookDay = new PiLot.Model.Logbook.LogbookDay(this.boatTime.today());
			}
			this.logbookDay.on('saveEntry', this.logbookDay_change.bind(this));
			this.logbookDay.on('deleteEntry', this.logbookDay_change.bind(this));
		},
				
		/** Shows the current day's logbookEntries */
		showLogbookDay: function () {
			this.logbookEntries.showLogbookDay(this.logbookDay);
			this.showNewEntryLinks();
			this.updateNoEntries();
		},

		/** Updates the visibility of the "no entries" info based on the current day */
		updateNoEntries: function () {
			this.pnlNoEntries.hidden = this.logbookDay.hasEntries();
		},

		/**
		 * Shows the entry form for a specific or the current setup. Also makes sure the logbookDay is reloaded,
		 * if the day has changed since the page loaded, so that we don't mess things up around midnight. 
		 * */
		showEntryFormAsync: async function (pSetup) {
			const today = this.boatTime.today();
			if (!this.logbookDay.getDay().equals(today)) {
				await this.loadLogbookDayAsync();
			}
			this.editForm.showDefaultValuesAsync(this.logbookDay, pSetup);
		},


		showNewEntryLinks: function () {
			const hasRecent = this.createBoatImageLinks(this.logbookDay.getLogbookEntries().map(i => i.getBoatSetup()), this.plhRecentSetups);
			this.pnlRecentSetups.hidden = !hasRecent;
			const hasDefault = this.createBoatImageLinks(this.boatConfig.getBoatSetups(), this.plhDefaultSetups);
			this.pnlDefaultSetups.hidden = !hasDefault;
		},

		/**
		 * Fills a container with a set of Boat setup images, each linked to the entry form
		 * for that specific setup.
		 * @param {PiLot.Boat.Model.BoatSetup[]} pBoatSetups
		 * @param {HTMLElement} pContainer
		 */
		createBoatImageLinks: function (pBoatSetups, pContainer) {
			let result = false;
			const displayedSetups = []
			pContainer.clear();
			for (let i = 0; i < pBoatSetups.length; i++) {
				if (!displayedSetups.some(s => s.equals(pBoatSetups[i]))) {
					const imageLink = this.createBoatImageLink(pContainer, this.showEntryFormAsync.bind(this, pBoatSetups[i]));
					imageLink.showBoatSetup(pBoatSetups[i]);
					displayedSetups.push(pBoatSetups[i]);
					result = true;
				}
			}
			return result;
		},

		/**
		 * Creates a single BoatImageLink, using a template to wrap around
		 * @param {HTMLElement} pContainer
		 * @param {Function} pOnClick
		 */
		createBoatImageLink: function (pContainer, pOnClick) {
			const element = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookNewEntryImage);
			pContainer.appendChild(element);
			return new PiLot.View.Boat.BoatImageLink(this.boatImageConfig, element, pOnClick);
		}
	};
	
	/**
	 * Class LogbookEntries
	 * This represents a control containing all logbook entries for one LogbookDay.
	 * @param {HTMLElement} pContainer - the container where the controll will be added
	 * @param {PiLot.View.Logbook.LogbookEntryForm} pEditForm - optionally pass an existing editForm
	 * @param {PiLot.Model.Common.pBoatTime} - the current BoatTime
	 * @param {Object} pOptions - Object with {isReadOnly:Boolean, sortDescending:Boolean}
	 *  */
 	var LogbookEntries = function (pContainer, pEditForm, pCurrentBoatTime, pOptions) {
		this.container = pContainer;					// HTMLElement object where the entries will be added
		this.editForm = pEditForm;						// one edit form used to edit existing and create new items
		this.currentBoatTime = pCurrentBoatTime;		// the current BoatTime used for new Entries
		this.logbookEntryControls = null;				// an array of all PiLot.View.Logbook.LogbookEntryControl elements
		this.gpsObserver = null;						// a GPS Observer used to auto-populate NAV Data
		this.logbookDay = null;							// the Model object
		this.date = null;								// the date as RC.Date.DateOnly
		this.sortDescending = false;					// If true, the latest logbookEntries will appear on top
		this.isReadOnly = false;						// If true, no delete- nor edit icons are shown for the entries
		
		// controls
		this.initialize(pOptions);
	};

	LogbookEntries.prototype = {

		initialize: function (pOptions) {
			this.readOptions(pOptions);
			this.logbookEntryControls = [];
			this.draw();
		},

		/** reads the options and assigns the values to instance variables */
		readOptions: function (pOptions) {
			if (pOptions) {
				this.isReadOnly = !!pOptions.isReadOnly;
				this.sortDescending = !!pOptions.sortDescending;
			}
		},

		/** Generic handler for all kinds of changes of a logbookDay, just re-shows the data */
		logbookDay_change: function(){
			this.showData();
		},

		/** Actually nothing much to draw, as items will be added directly to this.container */
		draw: function () {
			this.editForm = this.editForm || new PiLot.View.Logbook.LogbookEntryForm();
		},

		/**
		 * Shows the logbookEntries for pLogbookDay. Binds event handlers to make sure
		 * we refresh the view when LogbookEntries are changed or removed (we don't need
		 * to observe "addEntry", as this is always followed by 'changeEntryTime')
		 */
		showLogbookDay: function (pLogbookDay) {
			if(this.logbookDay){
				this.logbookDay.off();
			}
			this.logbookDay = pLogbookDay;
			const eventHandler = this.logbookDay_change.bind(this);
			this.logbookDay.on('saveEntry', eventHandler);
			this.logbookDay.on('deleteEntry', eventHandler);
			this.showData();
		},

		/**
		 * Sets the form readonly or not, by hiding/showing the edit- and delete icons
		 * on the logbook entries
		 * @param {Boolean} pReadOnly
		 */
		toggleReadOnly: function (pReadonly) {
			this.isReadOnly = pReadonly;
			this.logbookEntryControls.forEach(control => control.toggleReadOnly(pReadonly));
		},

		/** Clears and re-draws the entries  */
		showData: function () {
			this.container.clear();
			this.logbookEntryControls = [];
			this.logbookDay.sortEntries(this.sortDescending);
			const logbookEntries = this.logbookDay.getLogbookEntries();
			for (let i = 0; i < logbookEntries.length; i++) {
				const control = this.showLogbookEntry(logbookEntries[i]);
				this.logbookEntryControls.push(control);
			}
		},

		/** Shows a LogBookEntry and returns the control */
		showLogbookEntry: function (pLogbookEntry,) {
			const control = new PiLot.View.Logbook.LogbookEntryControl(
				this.container,
				this.editForm,
				pLogbookEntry,
				this.isReadOnly
			);
			control.showData();
			return control;
		}
	};

	/**
	 * Class LogbookEntryControl 
	 * This represents the control showing a single LogbookEntry.
	 * @param {HTMLElement} pContainer - the container to which the control will be added
	 * @param {PiLot.View.Logbook.LogbookEntryForm} pEditForm - the form to show when clicking the edit icon
	 * @param {PiLot.Model.Logbook.LogbookEntry} pLogbookEntry - the logbook entry to show
	 * @param {Boolean} pIsReadOnly - if true, hides the edit icon
	 *  */ 
	var LogbookEntryControl = function (pContainer, pEditForm, pLogbookEntry, pIsReadOnly) {
		this.entriesContainer = pContainer;			// a HTMLElement object where the control will be added
		this.editForm = pEditForm;					// a LogbookEntryForm use to edit this
		this.logbookEntry = pLogbookEntry;			// the business object to show
		this.isReadOnly = pIsReadOnly;				// if true, the delete- and edit links will not be shown
		
		// controls: HTMLElement objects
		this.lblTime = null;
		this.lblTitle = null;
		this.btnEditEntry = null;
		this.btnDeleteEntry = null;
		this.lblNotes = null;
		this.lblWeather = null;
		this.lblTemperature = null;
		this.lblPressure = null;
		this.lblWindForce = null;
		this.lblWindDirection = null;
		this.lblWaveHeight = null;
		this.lblLat = null
		this.lblLon = null;
		this.lblCOG = null;
		this.lblSOG = null;
		this.lblLog = null;
		this.boatSetupImage = null;				// PiLot.View.Boat.BoatImageLink
		this.boatSetupDetails = null;			// PiLot.View.Boat.BoatSetupDetails
		this.initialize();
	};

	LogbookEntryControl.prototype = {

		initialize: function () {
			this.draw();
		},

		/** handles click on the delete icon by showing a confirmation message, then deleting the entry */
		btnDeleteEntry_click: function (e) {
			e.preventDefault();
			if (window.confirm(PiLot.Utils.Language.getText('confirmDeleteLogbookEntry'))) {
				this.deleteEntryAsync();
			}
		},

		/** handles clicks on the edit icon, by showing the edit form for this entry */		
		btnEditEntry_click: function (e) {
			e.preventDefault();
			this.editForm.showLogbookEntryAsync(this.logbookEntry);
		},

		boatSetupImage_click: function (e) {
			this.boatSetupDetails.showBoatSetup(this.logbookEntry.getBoatSetup());
		},
	
		/** creates the display form */ 
		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookEntryControl);
			this.entriesContainer.appendChild(control);
			this.lblTime = control.querySelector('.lblTime');
			this.lblTitle = control.querySelector('.lblTitle');
			this.lblNotes = control.querySelector('.lblNotes');
			this.btnEditEntry = control.querySelector('.btnEditEntry');
			this.btnEditEntry.addEventListener('click', this.btnEditEntry_click.bind(this));
			this.btnDeleteEntry = control.querySelector('.btnDeleteEntry');
			this.btnDeleteEntry.addEventListener('click', this.btnDeleteEntry_click.bind(this));
			this.lblWeather = control.querySelector('.lblWeather');
			this.lblTemperature = control.querySelector('.lblTemperature');
			this.lblPressure = control.querySelector('.lblPressure');
			this.lblWindForce = control.querySelector('.lblWindForce');
			this.lblWindDirection = control.querySelector('.lblWindDirection');
			this.lblWaveHeight = control.querySelector('.lblWaveHeight');
			this.lblLat = control.querySelector('.lblLat');
			this.lblLon = control.querySelector('.lblLon');
			this.lblCOG = control.querySelector('.lblCOG');
			this.lblSOG = control.querySelector('.lblSOG');
			this.lblLog = control.querySelector('.lblLog');
			this.boatSetupImage = new PiLot.View.Boat.BoatImageLink(null, control.querySelector('.plhBoatSetup'), this.boatSetupImage_click.bind(this));
			this.boatSetupDetails = new PiLot.View.Boat.BoatSetupDetails();
			this.toggleReadOnly(this.isReadOnly);
		},

		/** shows the data of the LogbookEntry */
		showData: function () {
			this.showTime();
			this.lblTitle.innerText = this.logbookEntry.getTitle();
			this.lblNotes.innerText = this.logbookEntry.getNotes();
			const meteo = this.logbookEntry.getMeteo();
			if (meteo.weather) {
				let key = PiLot.Templates.Logbook.weatherTypes.find(e => e[0] == meteo.weather)[1];
				this.lblWeather.innerText = PiLot.Utils.Language.getText(key);
			}
			this.showText(this.lblTemperature, meteo.temperature);
			this.showText(this.lblPressure, meteo.pressure);
			this.showText(this.lblWindForce, meteo.windForce);
			if (meteo.windDirection) {
				let key = PiLot.Templates.Logbook.windDirections.find(e => e[0] == meteo.windDirection)[1];
				this.lblWindDirection.innerText = PiLot.Utils.Language.getText(key);
			}
			this.showText(this.lblWaveHeight, meteo.waveHeight);
			this.showText(this.lblLat, PiLot.Utils.Nav.toCoordinateString(this.logbookEntry.getLatitude(), true, true));
			this.showText(this.lblLon, PiLot.Utils.Nav.toCoordinateString(this.logbookEntry.getLongitude(), false, true));
			this.showText(this.lblCOG, this.logbookEntry.getCOG());
			this.showText(this.lblSOG, this.logbookEntry.getSOG());
			this.showText(this.lblLog, this.logbookEntry.getLog());
			this.boatSetupImage.showBoatSetup(this.logbookEntry.getBoatSetup());
		},

		toggleReadOnly: function (pReadOnly) {
			this.btnDeleteEntry.hidden = pReadOnly;
			this.btnEditEntry.hidden = pReadOnly;
		},

		showText: function (pControl, pText) {
			if (pText !== undefined && pText !== null && pText !== '') {
				pControl.innerText = pText;
			}
		},

		showTime: function () {
			let text = '';
			const time = this.logbookEntry.getDateTime();
			if (time !== null) {
				text = time.toFormat('HH:mm');
			}
			this.lblTime.innerText = text;
		},

		deleteEntryAsync: async function () {
			const success = await this.logbookEntry.deleteAsync();
			RC.Utils.notifyObservers(this, this.observers, 'delete', null);
		}
	}

	/**
	 * Class LogbookEntryControl 
	 * This represents a form used to enter or edit a LogbookEntry.
	 * @param {PiLot.Model.Nav.GPSObserver} pGPSObserver - used to auto-fill nav data
	 * */
	var LogbookEntryForm = function (pGPSObserver) {
		this.gpsObserver = pGPSObserver;			// a PiLot.Model.Nav.GPSObserver
		this.logbookDay = null;						// the LogbookDay for creating new items
		this.logbookEntry = null;					// the business object to edit
		
		// controls: HTMLElement objects
		this.control = null;				/// the entire control created from the template
		this.lblTitleAddEntry = null;
		this.lblTitleEditEntry = null;
		this.tbTime = null;
		this.tbTitle = null;
		this.tbNotes = null;
		this.ddlWeather = null;
		this.tbTemperature = null;
		this.tbPressure = null;
		this.ddlWindForce = null;
		this.ddlWindDirection = null;
		this.tbWaveHeight = null;
		this.editLatitude = null;
		this.editLongitude = null;
		this.tbCOG = null;
		this.tbSOG = null;
		this.tbLog = null;
		this.editBoatSetupImage = null;		/// PiLot.View.Boat.BoatImageLink
		this.boatSetupForm = null;			/// PiLot.View.Boat.BoatSetupForm
		this.btnSave = null;
		this.btnCancel = null;

		this.observers = null;				// observers used by RC.Utils observers pattern
		
		this.initialize();
	};

	LogbookEntryForm.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['show', 'hide', 'save']);
			this.draw();
		},

		/**
		 * Registers an observer that will be called when pEvent happens.
		 * @param {String} pEvent - 'show', 'hide', 'save'
		 * @param {Function} pCallback - The method to call 
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		boatSetupForm_show: function () {
			this.control.hidden = true;
		},

		boatSetupForm_hide: function () {
			this.control.hidden = false;
		},

		/** handles clicks on the save button */
		btnSave_click: async function (e) {
			e.preventDefault();
			this.saveAsync();
		},

		/** handles clicks on the cancel button */
		btnCancel_click: function (e) {
			e.preventDefault();
			this.hide();
		},

		/** creates the editForm, without displaying an item  */
		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookEntryForm)
			document.body.insertAdjacentElement('afterbegin', this.control);
			PiLot.Utils.Common.bindKeyHandlers(this.control, this.hide.bind(this), this.saveAsync.bind(this));
			this.lblTitleAddEntry = this.control.querySelector('.lblTitleAddEntry');
			this.lblTitleEditEntry = this.control.querySelector('.lblTitleEditEntry');
			this.tbTime = this.control.querySelector('.tbTime');
			this.tbTitle = this.control.querySelector('.tbTitle');
			this.tbNotes = this.control.querySelector('.tbNotes');
			this.ddlWeather = this.control.querySelector('.ddlWeather');
			PiLot.Utils.Common.fillDropdown(this.ddlWeather, PiLot.Templates.Logbook.weatherTypes);
			this.tbTemperature = this.control.querySelector('.tbTemperature');
			this.tbPressure = this.control.querySelector('.tbPressure');
			this.ddlWindForce = this.control.querySelector('.ddlWindForce');
			PiLot.Utils.Common.fillDropdown(this.ddlWindForce, PiLot.Templates.Logbook.windForces, false);
			this.ddlWindDirection = this.control.querySelector('.ddlWindDirection');
			PiLot.Utils.Common.fillDropdown(this.ddlWindDirection, PiLot.Templates.Logbook.windDirections);
			this.tbWaveHeight = this.control.querySelector('.tbWaveHeight');
			this.editLatitude = new PiLot.View.Nav.CoordinateForm(this.control.querySelector('.plhLat'), true);
			this.editLongitude = new PiLot.View.Nav.CoordinateForm(this.control.querySelector('.plhLon'), false);
			this.tbCOG = this.control.querySelector('.tbCOG');
			this.tbSOG = this.control.querySelector('.tbSOG');
			this.tbLog = this.control.querySelector('.tbLog');
			this.editBoatSetupImage = new PiLot.View.Boat.BoatImageLink(null, this.control.querySelector('.plhBoatSetup'), null);
			this.boatSetupForm = new PiLot.View.Boat.BoatSetupForm(null, this.control.querySelector('.logbookBoxes'));
			this.boatSetupForm.on('show', this.boatSetupForm_show.bind(this));
			this.boatSetupForm.on('hide', this.boatSetupForm_hide.bind(this));
			this.editBoatSetupImage.attachForm(this.boatSetupForm);
			this.btnSave = this.control.querySelector('.btnSave');
			this.btnSave.addEventListener('click', this.btnSave_click.bind(this));
			this.btnCancel = this.control.querySelector('.btnCancel');
			this.btnCancel.addEventListener('click', this.btnCancel_click.bind(this));
			RC.Utils.selectOnFocus(this.tbTime, this.tbTitle, this.tbTemperature, this.tbPressure, this.tbWaveHeight, this.tbSOG, this.tbCOG, this.tbLog);
		},

		/** 
		 * Shows the data of a logbook entry 
		 * @param {PiLot.Model.Logbook.LogbookEntry} pLogbookEntry - the entry to show, not null 
		 * */
		showLogbookEntryAsync: async function (pLogbookEntry) {
			this.logbookEntry = pLogbookEntry;
			this.logbookDay = pLogbookEntry.getLogbookDay();
			this.showTime(this.logbookEntry.getDateTime());
			this.tbTitle.value = this.logbookEntry.getTitle() || '';
			this.tbNotes.value = this.logbookEntry.getNotes() || '';
			this.showMeteo(this.logbookEntry.getMeteo());
			this.showNavData(this.logbookEntry.getLatitude(), this.logbookEntry.getLongitude(), this.logbookEntry.getCOG(), this.logbookEntry.getSOG());
			RC.Utils.showNumericValue(this.tbLog, this.logbookEntry.getLog(), '', 1);
			this.showBoatSetup(this.logbookEntry.getBoatSetup());
			this.showForm();
		},

		/**
		 * Shows default values for nav and sensor data, and empties all other fields. Then shows the form.
		 * @param {PiLot.Model.Logbook.LogbookDay} pLogbookDay - The logbook day needed to create a new item
		 * @param {PiLot.Model.Boat.BoatSetup} pBoatSetup - Optionally pass a boat setup.
		 * */
		showDefaultValuesAsync: async function(pLogbookDay, pBoatSetup = null){
			this.logbookEntry = null;
			this.logbookDay = pLogbookDay;
			const boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.showTime(boatTime.now());
			this.showDefaultTitle(pBoatSetup);
			this.tbNotes.value = '';
			const currentMeteo = await new PiLot.Service.Meteo.DataLoader().loadLogbookMeteoAsync();
			const latestMeteo = pLogbookDay.getLatestMeteo() || {};
			this.showMeteo({
				temperature: currentMeteo.temperature || latestMeteo.temperature,
				pressure: currentMeteo.pressure || latestMeteo.pressure,
				weather: latestMeteo.weather,
				windForce: currentMeteo.windForce || latestMeteo.windForce,
				windDirection: currentMeteo.windDirection || latestMeteo.windDirection,
				waveHeight: latestMeteo.waveHeight
			});
			let lat = null;
			let lon = null;
			if (this.gpsObserver !== null) {
				const latestPosition = this.gpsObserver.getRecentPosition(10);
				if (latestPosition) {
					const latLon = latestPosition.getLatLon();
					lat = latLon.lat;
					lon = latLon.lon;
				}
				
			}
			this.showNavData(lat, lon, this.gpsObserver.getCOG(), this.gpsObserver.getSOG());
			const track = await ( new PiLot.Service.Nav.TrackService().loadCurrentTrackAsync());
			if(track !== null){
				RC.Utils.showNumericValue(this.tbLog, PiLot.Utils.Nav.metersToNauticalMiles(track.getDistance()), '', 2);
			}
			if (pBoatSetup !== null) {
				this.showBoatSetup(pBoatSetup);
			} else {
				await this.showLatestBoatSetupAsync();
			}
			this.showForm();
		},

		/**
		 * Shows an empty form. Only the boatSetup is preset based on the latest setup of the current logbookDay
		 * @param {PiLot.Model.Logbook.LogbookDay} pLogbookDay - The logbook day needed to create a new item
		 * @param {PiLot.Model.Boat.BoatSetup} pBoatSetup - Optionally pass a boat setup to use
		 * */
		showEmptyFormAsync: async function (pLogbookDay, pBoatSetup = null) {
			this.logbookEntry = null;
			this.logbookDay = pLogbookDay;
			this.showTime(null);
			this.showDefaultTitle(pBoatSetup);
			this.tbNotes.value = '';
			this.showMeteo({});
			this.showNavData(null, null, null, null);
			this.tbLog.value = '';
			if (pBoatSetup) {
				this.showBoatSetup(pBoatSetup);
			} else {
				await this.showLatestBoatSetupAsync();
			}			
			this.showForm();
		},

		/** defaults to the latest boatSetup for the logbookDay, if we find any */
		showLatestBoatSetupAsync: async function () {
			const boatSetupResult = await PiLot.Model.Logbook.loadCurrentBoatSetupAsync(this.logbookDay.getDay());
			if (boatSetupResult !== null) {
				if (boatSetupResult.latestBoatSetup !== null) {
					this.showBoatSetup(boatSetupResult.latestBoatSetup);
				} else if (boatSetupResult.currentBoatConfig !== null) {
					this.showBoatSetup(boatSetupResult.currentBoatConfig.getDefaultSetup());
				}
			}
		},

		/**
		 * Shows pBoatSetup in the boatImage and editForm 
		 * @param {PiLot.Model.Boat.BoatSetup} pBoatSetup - the setup to show
		 * */
		showBoatSetup: function (pBoatSetup) {
			if (pBoatSetup !== null) {
				this.boatSetupForm.setBoatConfig(pBoatSetup.getBoatConfig());
				this.boatSetupForm.showBoatSetup(pBoatSetup);
				this.editBoatSetupImage.showBoatSetup(pBoatSetup);
			}
		},

		/** @param {DateTime} pDateTime - a luxon DateTime or nullish */ 
		showTime: function (pDateTime) {
			let text = '';
			if (pDateTime){
				text = pDateTime.toFormat('HH:mm');
			}
			this.tbTime.value = text;			
		},

		/**
		 * Sets the name of a BoatSetup as title, to be used for new entries
		 * @param {PiLot.Model.Boat.BoatSetup} pBoatSetup
		 */
		showDefaultTitle: function (pBoatSetup) {
			if (pBoatSetup) {
				this.tbTitle.value = pBoatSetup.getName() || '';
			}
		},

		/** 
		 * expects a meteo object and shows them values in the input fields. Not all fields need to be
		 * present in the object, an empty object will just empty all fields.
		 * @param {Object} pMeteo - {temperature, pressure, weather, windForce, windDirection, waveHeight}
		 * */ 
		showMeteo: function (pMeteo) {
			RC.Utils.showNumericValue(this.tbTemperature, pMeteo.temperature, '', 1);
			let pressure = pMeteo.pressure;
			if (pressure > 10000) {
				pressure /= 100;
			}
			RC.Utils.showNumericValue(this.tbPressure, pressure, '', 1);
			this.ddlWeather.value = pMeteo.weather || '';
			this.ddlWindForce.value = pMeteo.windForce || '';
			this.ddlWindDirection.value = pMeteo.windDirection || '';
			RC.Utils.showNumericValue(this.tbWaveHeight, pMeteo.waveHeight, '', 1);	
		},

		/** shows data in the nav inputs. expects numeric values */
		showNavData: function (pLat, pLon, pCOG, pSOG) {
			this.editLatitude.setCoordinate(pLat).showCoordinate();
			this.editLongitude.setCoordinate(pLon).showCoordinate();
			RC.Utils.showNumericValue(this.tbCOG, pCOG, '', 0);
			RC.Utils.showNumericValue(this.tbSOG, pSOG, '', 1);
		},

		/** shows the form and sets focus on the first field */
		showForm: function () {
			document.body.classList.toggle('overflowHidden', true);
			this.control.hidden = false;
			this.lblTitleAddEntry.hidden = !!this.logbookEntry;
			this.lblTitleEditEntry.hidden = !this.logbookEntry;
			RC.Utils.notifyObservers(this, this.observers, 'show', this);
			this.tbTime.focus();
		},

		/** hides the form */
		hide: function () {
			document.body.classList.toggle('overflowHidden', false);
			this.control.hidden = true;
			RC.Utils.notifyObservers(this, this.observers, 'hide', this);
		},

		/** Reads the input, saves the data and closes the form */
		saveAsync: async function () {
			await this.readInputAsync();
			await this.logbookEntry.saveAsync();
			this.hide();
			RC.Utils.notifyObservers(this, this.observers, 'save', this.logbookEntry);
		},

		/**
		 * reads the input and assigns the values to this.logbookEntry. If the latter is null, a new LogbookEntry
		 * will be created.
		 * */
		readInputAsync: async function () {
			this.logbookEntry = this.logbookEntry || this.logbookDay.addEntry(null);
			const boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.logbookEntry.setTimeOfDay(this.readTime(), boatTime);
			this.logbookEntry.setTitle(this.tbTitle.value);
			this.logbookEntry.setNotes(this.tbNotes.value);
			const meteo = this.logbookEntry.getMeteo();
			meteo.weather = this.ddlWeather.value;
			meteo.temperature = RC.Utils.getNumericValue(this.tbTemperature);
			meteo.pressure = RC.Utils.getNumericValue(this.tbPressure);
			meteo.windForce = this.ddlWindForce.value;
			meteo.windDirection = this.ddlWindDirection.value;
			meteo.waveHeight = RC.Utils.getNumericValue(this.tbWaveHeight);
			this.logbookEntry.setLatLng(this.editLatitude.getCoordinate(), this.editLongitude.getCoordinate());
			this.logbookEntry.setCOG(RC.Utils.getNumericValue(this.tbCOG));
			this.logbookEntry.setSOG(RC.Utils.getNumericValue(this.tbSOG));
			this.logbookEntry.setLog(RC.Utils.getNumericValue(this.tbLog));
			this.logbookEntry.setBoatSetup(this.boatSetupForm.getBoatSetup());
		},

		/** parses the value in tbTime and converts it into seconds */ 
		readTime: function () {
			return RC.Date.DateHelper.parseTime(this.tbTime.value).minutes * 60;
		},
	}

	return {
		LogbookPage: LogbookPage,
		LogbookEntries: LogbookEntries,
		LogbookEntryControl: LogbookEntryControl,
		LogbookEntryForm: LogbookEntryForm
	};

})();