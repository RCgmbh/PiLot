var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Logbook = (function () {

	/// class LogbookPage, representing the page containing the logbook, either in editable form or in readonly form (a.k.a. diary page).
	/// Parameters:
	/// pTemplate: the template to be used to create the page, different templates for logbook and diary
	/// pLogbookReadonly: if true, items are read only, no items can ge added
	/// pSortLogbookEntriesDesc: sort entries by time descending, having the newest on top
	/// pSettingsContext: a string key to use when storing the selected date.
	var LogbookPage = function (pTemplate, pLogbookReadonly, pSortLogbookEntriesDesc, pSettingsContext) {
		this.template = pTemplate						// the template used to draw the page
		this.logbookReadonly = pLogbookReadonly			// if true, the logbook is readonly
		this.sortDescending = pSortLogbookEntriesDesc	// if true, lobookEntries will be sorted descening (default: ascending)
		this.settingsContext = pSettingsContext			// a key used to separate different user settings, e.g. one for the logbook, one for the diary
		this.currentBoatTime = null;					// the current boatTime, needed when creating new entries and for setting default date
		this.logbookDay = null;							// the logbookDay being displayed
		this.date = null;								// the RC.Date.DateOnly currently selected
		this.diaryInfoCache = null;						// the PiLot.Model.Logbook.DiaryInfoCache used to load calendar icons and jump to previos/next day with data

		// controls
		this.lblFriendlyDate = null;					// span showing the friendly date
		this.lblLogbook = null;							// the title for the non-today logbook page
		this.lblTodaysLogbook = null;					// the title to be shown if the current date is today
		this.calendar = null;							// PiLot.View.Logbook.DiaryCalendar to select the date			
		this.lnkPreviousDay = null;						// the link to go back one day
		this.lnkNextDay = null;							// the link to go to the next day
		this.logbookEntriesControl = null;				// PiLot.View.Logbook.LogbookEntries control which will be added on the fly
		this.map = null;								// PiLot.View.Nav.Seamap showing the track of the day
		this.mapTrack = null;							// the PiLot.View.Map.MapTrack for the daily track
		this.plhPhotos = null;							// the placeholder where we will add the photo gallery
		this.imageGallery = null;						// RC.Controls.ImageGallery.Gallery for the daily photos
		this.pnlDiary = null;							// The panel containing diary text and distance
		this.tbDiary = null;							// textbox for diary content
		this.lblDiary = null;							// readonly diary content
		this.diaryFontSize = null;						// the index of [0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5] for the current diary text size
		this.plhDistance = null;						// distance container
		this.lblDistanceKm = null;						// the label for distance in KM
		this.lblDistanceNm = null;						// the label for distance in NM
		this.pnlSpeedDiagram = null;					// panel where the speed diagram will be added
		this.logbookPhotos = null;						// PiLot.View.Logbook.LogbookPhotos
		this.lnkEdit = null;							// link opening the editable view of a diary page
		this.lnkEditTrack = null;						// link pointing to the tools page to edit the gps track
		this.lnkPublish = null;							// the link to publish all data

		this.initialize();
	}

	LogbookPage.diaryFontSizes = [0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5];
	LogbookPage.diaryLineHeights = [1.5, 1.5, 1.25, 1.25, 1.25, 1.25, 1.25];

	LogbookPage.prototype = {

		initialize: async function () {
			this.currentBoatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.draw();
			this.initializeDate();
		},

		/// handler for selecting a date in the calendar
		calendar_dateSelected: function () {
			let date = RC.Date.DateOnly.fromObject(this.calendar.date());
			this.setDate(date);
		},

		/// change handler for the diary field, assigns the text and
		/// saves the changes.
		tbDiary_change: function () {
			this.logbookDay.setDiaryText(this.tbDiary.value);
			this.logbookDay.saveDiaryTextAsync();
		},

		lnkBiggerText_click: function () {
			this.changeDiaryFontSize(1);
		},

		lnkSmallerText_click: function () {
			this.changeDiaryFontSize(-1);
		},

		/// draws the page and finds the controls and binds handlers
		draw: function () {
			const logbookControl = PiLot.Utils.Common.createNode(this.template);
			PiLot.Utils.Loader.getContentArea().appendChild(logbookControl);
			this.lblFriendlyDate = logbookControl.querySelector('.lblFriendlyDate');
			this.lblLogbook = logbookControl.querySelector('.lblLogbook');
			this.lblTodaysLogbook = logbookControl.querySelector('.lblTodaysLogbook');
			const divCalendar = logbookControl.querySelector('.logbookCalendar');
			const calendarLink = logbookControl.querySelector('.lblCalendarLink');
			const calendarDate = logbookControl.querySelector('.lblCalendarDate');
			const locale = PiLot.Utils.Language.getLocale();
			this.calendar = new RC.Controls.Calendar(divCalendar, calendarDate, calendarLink, this.calendar_dateSelected.bind(this), this.currentBoatTime.getUtcOffsetMinutes(), locale);
			if (divCalendar.classList.contains('diaryCalendar')) {
				this.diaryInfoCache = new PiLot.Model.Logbook.DiaryInfoCache();
				new PiLot.View.Logbook.DiaryCalendar(this.calendar, this.diaryInfoCache);
			}
			this.lnkPreviousDay = logbookControl.querySelector('.lnkPreviousDay');
			this.lnkNextDay = logbookControl.querySelector('.lnkNextDay');
			const options = { isReadOnly: this.logbookReadonly, sortDescending: this.sortDescending };
			this.logbookEntriesControl = new PiLot.View.Logbook.LogbookEntries(logbookControl, this.currentBoatTime, options);
			this.pnlDiary = logbookControl.querySelector('.pnlDiary');
			this.tbDiary = logbookControl.querySelector('.tbDiary');
			if (this.tbDiary !== null) {
				this.tbDiary.addEventListener('change', this.tbDiary_change.bind(this));
			}
			const lnkBiggerText = logbookControl.querySelector('.lnkBiggerText');
			if (lnkBiggerText !== null) {
				lnkBiggerText.addEventListener('click', this.lnkBiggerText_click.bind(this));
			}
			const lnkSmallerText = logbookControl.querySelector('.lnkSmallerText');
			if (lnkSmallerText !== null) {
				lnkSmallerText.addEventListener('click', this.lnkSmallerText_click.bind(this));
			}
			this.lblDiary = logbookControl.querySelector('.lblDiary');
			this.applyDiaryFontSize();
			this.plhDistance = logbookControl.querySelector('.plhDistance');
			if (this.plhDistance !== null) {
				this.lblDistanceKm = this.plhDistance.querySelector('.lblDistanceKm');
				this.lblDistanceNm = this.plhDistance.querySelector('.lblDistanceNm');
			}
			const plhMap = logbookControl.querySelector('.plhMap');
			if (plhMap !== null) {
				this.map = this.map || new PiLot.View.Map.Seamap(plhMap, { persistMapState: false });
			}
			this.pnlSpeedDiagram = logbookControl.querySelector('.pnlSpeedDiagram');
			this.plhPhotos = logbookControl.querySelector('.diaryPhotos');
			const plhLogbookPhotos = logbookControl.querySelector('.plhLogbookPhotos');
			if (plhLogbookPhotos !== null) {
				this.logbookPhotos = new LogbookPhotos(plhLogbookPhotos);
			}
			const plhImageUpload = logbookControl.querySelector('.plhImageUpload');
			if (plhImageUpload !== null) {
				new LogbookImageUpload(plhImageUpload, this);
			}
			this.lnkEdit = logbookControl.querySelector('.lnkEdit');
			RC.Utils.showHide(this.lnkEdit, PiLot.Model.Common.Permissions.canWrite());
			this.lnkEditTrack = logbookControl.querySelector('.lnkEditTrack');
			RC.Utils.showHide(this.lnkEditTrack, PiLot.Model.Common.Permissions.canWrite());
			this.lnkPublish = logbookControl.querySelector('.lnkPublish');
			RC.Utils.showHide(this.lnkPublish, PiLot.Model.Common.Permissions.hasSystemAccess());
		},

		/// sets the date based on the user settings, the value from the url or now
		initializeDate: function () {
			let date = PiLot.Utils.Common.parseQsDate(this.currentBoatTime);
			if (date === null) {
				date = this.loadDateFromSetting();
			}
			if (date === null) {
				date = RC.Date.DateOnly.fromObject(this.currentBoatTime.now());
			}
			this.setDate(date);
		},

		/** Loads the date from the user settings, if there is any  */
		loadDateFromSetting: function () {
			let result = null;
			let settingValue = PiLot.Utils.Common.loadUserSetting('PiLot.View.Logbook.' + this.settingsContext + '.currentDate');
			if (settingValue) {
				let settingDate = RC.Date.DateOnly.fromObject(settingValue);
				if (settingDate) {
					result = settingDate;
				}
			}
			return result;
		},

		/**
		 * This binds the previous and next buttons either to the previous/next day, or, if 
		 * we have a diaryInfoCache, to the previous or next day with data. If there is no such
		 * day, the buttons are hidden.
		 * */
		bindPreviousNextButtons: async function () {
			let previousHandler, nextHandler;
			if (this.diaryInfoCache !== null) {
				RC.Utils.showHide(this.lnkPreviousDay, false);
				RC.Utils.showHide(this.lnkNextDay, false);
				await this.diaryInfoCache.preloadData(this.date.year, this.date.month);
				const previousDate = this.diaryInfoCache.getPreviousDate(this.date);
				if (previousDate) {
					previousHandler = function () { this.setDate(previousDate); }.bind(this);
				}
				RC.Utils.showHide(this.lnkPreviousDay, !!previousDate);
				const nextDate = this.diaryInfoCache.getNextDate(this.date);
				if (nextDate) {
					nextHandler = function () { this.setDate(nextDate); }.bind(this);
				}
				RC.Utils.showHide(this.lnkNextDay, !!nextDate);
			} else {
				previousHandler = function () { this.changeDay(-1); }.bind(this);
				nextHandler = function () { this.changeDay(1); }.bind(this);
			}
			this.lnkPreviousDay.onclick = previousHandler;
			this.lnkNextDay.onclick = nextHandler;
		},

		/** Updates the href attribute of the edit link */
		bindLnkEdit: function () {
			this.bindDateLink (this.lnkEdit, PiLot.Utils.Loader.pages.logbook.logbook);
		},

		/** Updates the href attribute of the editTrack link */
		bindLnkEditTrack: function () {
			this.bindDateLink(this.lnkEditTrack, PiLot.Utils.Loader.pages.system.tools.data);
		},

		/** Updates the href attribute of the publish link */
		bindLnkPublish: function () {
			this.bindDateLink(this.lnkPublish, PiLot.Utils.Loader.pages.logbook.publish);
		},

		/**
		 * Sets the href attribute of a link to an url containing a date querystring
		 * @param {HTMLAnchorElement} pLink - the link for which we set the href. Can be nullish
		 * @param {String} pPage - the name of the page according to PiLot.Utils.Loader.pages
		 */
		bindDateLink: function (pLink, pPage) {
			if (pLink) {
				const pageUrl = PiLot.Utils.Loader.createPageLink(pPage);
				const qsDate = PiLot.Utils.Common.getQsDateValue(this.date);
				let url = `${pageUrl}&d=${qsDate}`;
				pLink.href = url;
			}
		},

		/// Loads the LogbookDay and shows it in the LogbookDayForm.
		/// If no LogbookDay is found, a new LogbookDay is created
		load: function () {
			PiLot.Model.Logbook.loadLogbookDayAsync(this.date)
				.then(result => this.showData(result || new PiLot.Model.Logbook.LogbookDay(this.date)));
		},

		/// tries to load the track and show it on the map
		loadTrack: function () {
			this.showDistance(null);
			let startMS = this.date.toLuxon().toMillis();
			let endMS = this.date.addDays(1).toLuxon().toMillis();
			PiLot.Model.Nav.loadTrackAsync(startMS, endMS, true).then(function (pTrack) {
				this.showTrackAsync(pTrack);
				this.showDistance(pTrack.getDistance());
				this.showSpeedDiagram(pTrack);
			}.bind(this));
		},

		/** If we have a photos panel, this tries to load photos for the day,
		 * and creates an image gallery with the photos shows them in the image gallery
		 */
		loadPhotos: async function () {
			if (this.plhPhotos !== null) {
				let imageCollection = await PiLot.Model.Logbook.loadDailyImageCollectionAsync(this.logbookDay.getDay());
				RC.Utils.showHide(this.plhPhotos, true);
				if (imageCollection.getImagesCount() > 0) {
					if (this.imageGallery !== null) {
						this.imageGallery.setImageCollection(imageCollection);
					} else {
						let galleryOptions = {
							paddingTop: 20,
							paddingRight: 20,
							paddingBottom: 20,
							paddingLeft: 20,
							imageSpaceH: 5,
							imageSpaceV: 5,
							minHeightUsed: 0.75,
							autoFocus: false
						};
						this.imageGallery = new RC.ImageGallery.Gallery(this.plhPhotos, imageCollection, galleryOptions);
					}
				} else {
					RC.Utils.showHide(this.plhPhotos, false);
				}
			}
		},

		/// passes pLogbookDay to the logbookEntries control in order to show it
		showData: function (pLogbookDay) {
			this.logbookDay = pLogbookDay;
			this.showFriendlyDate();
			this.showDiaryText();
			this.logbookEntriesControl.showLogbookDay(this.logbookDay);
			this.loadTrack();
			this.loadPhotos();
		},

		/// shows the currently selected date in friendly form
		showFriendlyDate: function () {
			if (this.lblFriendlyDate !== null) {
				const locale = PiLot.Utils.Language.getLocale();
				this.lblFriendlyDate.innerText = this.date.toLuxon().setLocale(locale).toLocaleString({ weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
			}
			let isToday = this.date.contains(this.currentBoatTime.now());
			if (this.lblTodaysLogbook !== null) {
				RC.Utils.showHide(this.lblTodaysLogbook, isToday);
			}
			if (this.lblLogbook !== null) {
				RC.Utils.showHide(this.lblLogbook, !isToday);
			}
		},

		/// changes the current day by pDays and re-loads the data. 
		/// Also saves the currently selected day to the user settings
		changeDay: function (pDays) {
			this.setDate(this.date.addDays(pDays));
		},

		changeDiaryFontSize: function (pChangeBy) {
			this.diaryFontSize = Math.max(Math.min(LogbookPage.diaryFontSizes.length - 1, this.diaryFontSize + pChangeBy), 0);
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Logbook.diaryFontSize', this.diaryFontSize);
			this.applyDiaryFontSize();
		},

		applyDiaryFontSize: function () {
			if (this.pnlDiary) {
				if (this.diaryFontSize === null) {
					this.diaryFontSize = PiLot.Utils.Common.loadUserSetting('PiLot.View.Logbook.diaryFontSize');
					if (this.diaryFontSize === null) {
						this.diaryFontSize = LogbookPage.diaryFontSizes.indexOf(1);
					}
				}
				this.pnlDiary.style.fontSize = LogbookPage.diaryFontSizes[this.diaryFontSize] + 'em';;
				//this.pnlDiary.style.lineHeight = LogbookPage.diaryLineHeights[this.diaryFontSize] + 'em';
			}
		},

		/// changes the current date and re-loads the data. 
		/// Also saves the currently selected day to the user settings
		setDate: function (pDate) {
			this.date = pDate;
			this.calendar.date(this.date.toLuxon().setLocale(PiLot.Utils.Language.getLocale()));
			this.calendar.showDate();
			this.bindPreviousNextButtons();
			this.bindLnkEdit();
			this.bindLnkEditTrack();
			this.bindLnkPublish();
			this.setLogbookPhotosDate();
			this.saveDate();
			const url = PiLot.Utils.Common.setQsDate(window.location, this.date);
			window.history.pushState({}, '', url);
			this.load();
		},

		/** access for this.date */
		getDate: function () {
			return this.date;
		},

		/// saves the currently selected date to the user settings
		saveDate: function () {
			let settingsValue = null;
			if (!this.date.contains(this.currentBoatTime.now())) {
				settingsValue = this.date;
			}
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Logbook.' + this.settingsContext + '.currentDate', settingsValue)
		},

		/// makes sure we have a LogbookDay, creates one if necessary
		ensureLogbookDay: function () {
			if (this.logbookDay === null) {
				this.logbookDay = new PiLot.Logbook.Model.LogbookDay();
			}
		},

		/// takes a track and shows it on the map
		showTrackAsync: async function (pTrack) {
			if (this.map !== null) {
				if (pTrack.getPositionsCount() > 0) {
					await this.map.showAsync();
					if (this.mapTrack === null) {
						this.mapTrack = new PiLot.View.Map.MapTrack(this.map, this.currentBoatTime, null, { ignoreSettings: true, showTrack: true });
					}
					this.mapTrack.setTrack(pTrack);
					this.mapTrack.draw();
					this.mapTrack.zoomToTrack();
					this.mapTrack.showTimeSlider(true);
				} else {
					this.map.hide();
					if (this.mapTrack !== null) {
						this.mapTrack.hideTimeSlider();
					}
				}
			}
		},

		/**
		 * shows the distance in km and nm. If pDistance is null, the value ... will be 
		 * shown, as this is used while loading the track. If the distance is 0, the entire
		 * panel will be hidden.
		 * @param {Number} pDistance
		 */
		showDistance: function (pDistance) {
			if (this.plhDistance !== null) {
				if (pDistance === 0) {
					RC.Utils.showHide(this.plhDistance, false);
				} else {
					RC.Utils.showHide(this.plhDistance, true);
					let km, nm;
					if (pDistance === null) {
						km = '...';
						nm = '...';
					} else {
						km = (pDistance / 1000).toFixed(2);
						nm = PiLot.Utils.Common.metersToNauticalMiles(pDistance).toFixed(2)
					}
					this.lblDistanceKm.innerText = km;
					this.lblDistanceNm.innerText = nm;
				}
			}
		},

		/**
		 * Shows the speed diagram for the track that has been loaded
		 * @param {any} pTrack
		 */
		showSpeedDiagram: function (pTrack) {
			if (this.pnlSpeedDiagram !== null) {
				if (pTrack && pTrack.getPositionsCount() > 0) {
					this.pnlSpeedDiagram.hidden = false;
					new PiLot.View.Tools.SpeedDiagram(this.pnlSpeedDiagram, pTrack);
				} else {
					this.pnlSpeedDiagram.hidden = true;
				}				
			}
		},

		/// shows the diary text of the current logbookDay, either in 
		/// the textbox or in the label, depending on what we have
		showDiaryText: function () {
			const diaryText = (this.logbookDay !== null ? this.logbookDay.getDiaryText() : '');
			if (this.tbDiary !== null) {
				this.tbDiary.value = diaryText;
			}
			if (this.lblDiary !== null) {
				if (diaryText !== '') {
					RC.Utils.showHide(this.lblDiary, true);
				}
				this.lblDiary.innerText = diaryText;
			}
		},

		/// reads the value from the diary textfield, assigns it to the current
		/// LogbookDay and saves the day back to the server
		saveDiaryText: function () {
			this.ensureLogbookDay();
			this.logbookDay.setDiaryText(this.tbDiary.value);
			this.logbookDay.saveDiaryTextAsync();
		},

		/** Sets the current date to the LogbookPhotos, if we have one */
		setLogbookPhotosDate: function () {
			if (this.logbookPhotos !== null) {
				this.logbookPhotos.setDate(this.date);
			}
		}
	};

	/// Class LogbookEntries
	/// This represents a single control containing all LogbookEntryForms for one
	/// LogbookDay.
	/// pOptions: {isReadOnly:Boolean, sortDescending:Boolean}
	var LogbookEntries = function (pContainer, pCurrentBoatTime, pOptions) {
		this.container = pContainer;					// jQuery object containing all necessary elements
		this.currentBoatTime = pCurrentBoatTime;		// the current BoatTime used for new Entries
		this.gpsObserver = null;						// a GPS Observer used to auto-populate NAV Data
		this.logbookDay = null;							// the Model object
		this.date = null;								// the date as RC.Date.DateOnly
		this.sortDescending = false;					// If true, the latest logbookEntries will appear on top
		this.isReadOnly = false;						// If true, no add button is expected, no edit icons are shown

		// controls
		this.lnkAddEntry = null;						// link to add a new entry
		this.plhLogbookEntries = null;					// placeholder for logbook entries
		this.initialize(pOptions);
	};

	LogbookEntries.prototype = {

		initialize: function (pOptions) {
			this.readOptions(pOptions);
			this.findControls();
			if (!this.isReadOnly) {
				this.gpsObserver = new PiLot.Model.Nav.GPSObserver({autoStart:false});
			}
		},

		/// reads the options and assigns the values to instance variables
		readOptions: function (pOptions) {
			if (pOptions) {
				this.isReadOnly = pOptions.isReadOnly || false;
				this.sortDescending = pOptions.sortDescending || false;
			}
		},

		/// handles the save event of the logbookEntry, triggering a re-draw
		logbookEntry_save: function (pSender, pArg) {
			this.showData();
		},

		/// handles the delete event of the logbookEntry, triggering a re-draw
		logbookEntry_delete: function (pSender, pArg) {
			this.showData();
		},

		/// click handler for the add Entry link
		lnkAddEntry_click: function () {
			this.showLogbookEntry(null, true);
		},

		/// shows the logbookEntries for pLogbookDay
		showLogbookDay: function (pLogbookDay) {
			this.logbookDay = pLogbookDay;
			this.showData();
		},

		/// assigns the controls (as jquery objects) to some instance variables for later usage
		findControls: function () {
			this.lnkAddEntry = this.container.querySelector('.lnkAddEntry');
			if (!this.isReadOnly) {
				this.lnkAddEntry.addEventListener('click', this.lnkAddEntry_click.bind(this));
			} else {
				RC.Utils.showHide(this.lnkAddEntry, false);
			}
			this.plhLogbookEntries = this.container.querySelector('.plhLogbookEntries');
		},

		/// shows the data. Clears the urls parameters afterwards, otherwise
		/// they could interfer with showing next days data.
		showData: function () {
			this.plhLogbookEntries.clear();
			this.logbookDay.sortEntries(false);
			let logbookEntries = this.logbookDay.getLogbookEntries();
			const editLatest = RC.Utils.getUrlParameter('editLatest') === 'true';
			for (var i = 0; i < logbookEntries.length; i++) {
				this.showLogbookEntry(logbookEntries[i], editLatest && i === logbookEntries.length -1, false);
			}
			RC.Utils.clearUrlParameters('editLatest');
		},

		/// Shows a LogBookEntryForm, either readonly (default) or
		/// editable. If editable, pLogbookEntry can be null. Returns the form
		showLogbookEntry: function (pLogbookEntry, pEditable) {
			let form = new PiLot.View.Logbook.LogbookEntryForm(
				this.plhLogbookEntries,
				this.logbookDay,
				pLogbookEntry,
				this.currentBoatTime,
				this.gpsObserver,
				this.isReadOnly,
				this.sortDescending
			);
			if (pEditable) {
				form.showEditable();
			} else {
				form.showReadonly();
			}
			form.on('save', this.logbookEntry_save.bind(this));
			form.on('delete', this.logbookEntry_delete.bind(this));
			return form;
		}
	};

	/// Class LogbookEntryForm 
	/// This represents a form used to enter or edit a LogbookDay. It expects
	/// the business object to show (which can be null when showing an empty form),
	/// and the current LogbookDay business object (which can not be null).
	/// It also expects a GPS Observer, which is used to automatically populate
	/// or on request update the NAV data such as position, speed, course
	var LogbookEntryForm = function (pContainer, pLogbookDay, pLogbookEntry, pBoatTime, pGPSObserver, pIsReadOnly, pSortDescending) {
		this.entriesContainer = pContainer			// a HTMLElement object where the control will be added
		this.logbookDay = pLogbookDay;				// as we might have no LogbookEntry, we need the LogbookDay separately
		this.logbookEntry = pLogbookEntry;			// the business object to show
		this.currentBoatTime = pBoatTime;			// the current BoatTime object
		this.gpsObserver = pGPSObserver;			// a PiLot.Model.Nav.GPSObserver
		this.isReadOnly = pIsReadOnly;				// if true, the edit link will not be shown, and edit mode is not supported
		this.sortDescending = pSortDescending;		// if true, newer entries well be added above later entries
		//this.boatConfig = null;						// the boatConfig used for the BoatSetupForm
		this.boatImageConfig = null;				// the boatImageConfig used to display the images
		this.observers = null;						// observers used by RC.Utils observers pattern

		// controls: HTMLElement objects
		this.itemContainer = null;			/// the control containing both the displayForm and the editForm
		this.editForm = null;				/// the form used to show an item editable
		this.tbTime = null;
		this.tbTitle = null;
		this.btnDeleteEntry = null;
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
		this.displayForm = null;			/// the form used to show an item readOnly
		this.lblTime = null;
		this.lblTitle = null;
		this.btnEditEntry = null;
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
		this.showBoatSetupImage = null;		/// PiLot.View.Boat.BoatImageLink

		this.initialize();
	};

	LogbookEntryForm.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['save', 'delete']);
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/// handles click on the delete icon
		btnDeleteEntry_click: function (e) {
			e.preventDefault();
			if (window.confirm('Soll dieser Eintrag wirklich gelöscht werden?')) {
				this.deleteEnty();
			}
		},

		/// handles clicks on the save button
		btnSave_click: function (e) {
			e.preventDefault();
			this.readInput();
			this.logbookEntry.saveAsync().then(result => {
				this.showReadonly();
				RC.Utils.notifyObservers(this, this.observers, `save`, null);
			});
		},

		/// handles clicks on the cancel button
		btnCancel_click: function (e) {
			e.preventDefault();
			if (this.logbookEntry === null) {
				this.itemContainer.remove();
			} else {
				this.showReadonly();
			}
		},

		/// handles klicks on the edit icon, switching to edit mode		
		btnEditEntry_click: function (e) {
			e.preventDefault();
			this.showEditable();
		},

		/// this makes sure we haven itemContainer control, which will contain both the displayForm and the editForm
		ensureItemContainer: function () {
			if (this.itemContainer === null) {
				this.itemContainer = RC.Utils.stringToNode(PiLot.Templates.Logbook.logbookEntryContainer);
				this.entriesContainer.insertAdjacentElement(this.sortDescending ? 'afterbegin' : 'beforeend', this.itemContainer);
			}
			return this.itemContainer;
		},

		/// creates the editForm, without displaying an item, returning the form
		drawEditForm: function () {
			if (!this.isReadOnly) {
				this.ensureItemContainer();
				this.editForm = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookEntryEditable)
				this.itemContainer.insertAdjacentElement('afterbegin', this.editForm);
				RC.Utils.showHide(this.editForm, false);
				this.tbTime = this.editForm.querySelector('.tbTime');
				this.tbTitle = this.editForm.querySelector('.tbTitle');
				this.btnDeleteEntry = this.editForm.querySelector('.btnDeleteEntry');
				this.btnDeleteEntry.addEventListener('click', this.btnDeleteEntry_click.bind(this));
				this.tbNotes = this.editForm.querySelector('.tbNotes');
				this.ddlWeather = this.editForm.querySelector('.ddlWeather');
				PiLot.Utils.Common.fillDropdown(this.ddlWeather, PiLot.Templates.Logbook.weatherTypes);
				this.tbTemperature = this.editForm.querySelector('.tbTemperature');
				this.tbPressure = this.editForm.querySelector('.tbPressure');
				this.ddlWindForce = this.editForm.querySelector('.ddlWindForce');
				PiLot.Utils.Common.fillDropdown(this.ddlWindForce, PiLot.Templates.Logbook.windForces, false);
				this.ddlWindDirection = this.editForm.querySelector('.ddlWindDirection');
				PiLot.Utils.Common.fillDropdown(this.ddlWindDirection, PiLot.Templates.Logbook.windDirections);
				this.tbWaveHeight = this.editForm.querySelector('.tbWaveHeight');
				this.editLatitude = new PiLot.View.Nav.CoordinateForm(this.editForm.querySelector('.plhLat'), true);
				this.editLongitude = new PiLot.View.Nav.CoordinateForm(this.editForm.querySelector('.plhLon'), false);
				this.tbCOG = this.editForm.querySelector('.tbCOG');
				this.tbSOG = this.editForm.querySelector('.tbSOG');
				this.tbLog = this.editForm.querySelector('.tbLog');
				this.editBoatSetupImage = new PiLot.View.Boat.BoatImageLink(null, this.editForm.querySelector('.plhBoatSetup'), null);
				this.boatSetupForm = new PiLot.View.Boat.BoatSetupForm(null, this.editForm.querySelector('.plhBoatSetupForm'));
				this.editBoatSetupImage.attachForm(this.boatSetupForm);
				this.btnSave = this.editForm.querySelector('.btnSave');
				this.btnSave.addEventListener('click', this.btnSave_click.bind(this));
				this.btnCancel = this.editForm.querySelector('.btnCancel');
				this.btnCancel.addEventListener('click', this.btnCancel_click.bind(this));
				RC.Utils.selectOnFocus(this.tbTime, this.tbTitle, this.tbTemperature, this.tbPressure, this.tbWaveHeight, this.tbSOG, this.tbCOG, this.tbLog);
			} else {
				PiLot.log('can not draw the edit form in ReadOnly mode', 0);
			}
		},

		/// creates the display form, without displaying an item 
		drawDisplayForm: function () {
			this.ensureItemContainer();
			this.displayForm = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookEntryReadonly);
			this.itemContainer.appendChild(this.displayForm);
			this.lblTime = this.displayForm.querySelector('.lblTime');
			this.lblTitle = this.displayForm.querySelector('.lblTitle');
			this.lblNotes = this.displayForm.querySelector('.lblNotes');
			this.btnEditEntry = this.displayForm.querySelector('.btnEditEntry');
			if (this.isReadOnly) {
				RC.Utils.showHide(this.btnEditEntry, false);
			} else {
				this.btnEditEntry.addEventListener('click', this.btnEditEntry_click.bind(this));
			}
			this.lblWeather = this.displayForm.querySelector('.lblWeather');
			this.lblTemperature = this.displayForm.querySelector('.lblTemperature');
			this.lblPressure = this.displayForm.querySelector('.lblPressure');
			this.lblWindForce = this.displayForm.querySelector('.lblWindForce');
			this.lblWindDirection = this.displayForm.querySelector('.lblWindDirection');
			this.lblWaveHeight = this.displayForm.querySelector('.lblWaveHeight');
			this.lblLat = this.displayForm.querySelector('.lblLat');
			this.lblLon = this.displayForm.querySelector('.lblLon');
			this.lblCOG = this.displayForm.querySelector('.lblCOG');
			this.lblSOG = this.displayForm.querySelector('.lblSOG');
			this.lblLog = this.displayForm.querySelector('.lblLog');
			this.showBoatSetupImage = new PiLot.View.Boat.BoatImageLink(null, this.displayForm.querySelector('.plhBoatSetup'), null);
		},

		/// shows the editForm and this.logbookEntry in it
		showEditable: function () {
			if (this.displayForm !== null) {
				RC.Utils.showHide(this.displayForm, false);
			}
			if (this.editForm === null) {
				this.drawEditForm();
			}
			RC.Utils.showHide(this.editForm, true);
			if (this.logbookEntry !== null) {
				this.showTime(this.logbookEntry.getDateTime(), false);
				this.tbTitle.value = this.logbookEntry.getTitle() || '';
				this.tbNotes.value = this.logbookEntry.getNotes() || '';
				var meteo = this.logbookEntry.getMeteo();
				this.ddlWeather.value = meteo.weather || '';
				this.showTemperature(meteo.temperature);
				this.showPressure(meteo.pressure);
				this.ddlWindForce.value = meteo.windForce || '';
				this.ddlWindDirection.value = meteo.windDirection || '';
				RC.Utils.showNumericValue(this.tbWaveHeight, meteo.waveHeight, '', 1);
				this.showNavData(this.logbookEntry.getLatitude(), this.logbookEntry.getLongitude(), this.logbookEntry.getCOG(), this.logbookEntry.getSOG());
				RC.Utils.showNumericValue(this.tbLog, this.logbookEntry.getLog(), '', 1);
				this.showBoatSetup(this.logbookEntry.getBoatSetup());
				RC.Utils.showHide(this.btnDeleteEntry, true);
			} else {
				this.showDefaultValues();
				RC.Utils.showHide(this.btnDeleteEntry, false);
			}
		},

		/// populates the form with default values for time, navigation, meteo and boat setup
		showDefaultValues: function () {
			let boatTimeNow = this.currentBoatTime.now();
			PiLot.Model.Logbook.loadCurrentBoatSetupAsync(this.logbookDay.getDay()).then(function (result) {
				if (result !== null) {
					if (result.latestBoatSetup !== null) {
						this.showBoatSetup(result.latestBoatSetup);
					} else if (result.currentBoatConfig !== null) {
						this.showBoatSetup(result.currentBoatConfig.getDefaultSetup());
					}
				}
			}.bind(this));
			if (this.logbookDay.getDay().contains(boatTimeNow)) {
				this.showTime(boatTimeNow);
				new PiLot.Model.Meteo.DataLoader().loadLogbookMeteoAsync().then(result => this.showMeteo(result));
				if (this.gpsObserver !== null) {
					const latestPosition = this.gpsObserver.getRecentPosition(10);
					let lat = null;
					let lon = null;
					if (latestPosition) {
						const latLon = latestPosition.getLatLon();
						lat = latLon.lat;
						lon = latLon.lon;
					}
					this.showNavData(lat, lon, this.gpsObserver.getCOG(), this.gpsObserver.getSOG());
				}
			}
		},

		/// reads the input and assigns the values to the business object
		readInput: function () {
			this.ensureLogbookEntry();
			this.logbookEntry.setTimeOfDay(this.readTime(), this.currentBoatTime);
			this.logbookEntry.setTitle(this.tbTitle.value);
			this.logbookEntry.setNotes(this.tbNotes.value);
			var meteo = this.logbookEntry.getMeteo() || {};
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

		/// this makes sure we have a logbookEntry. If not, it creates one
		/// and sets the boatTime
		ensureLogbookEntry: function () {
			if (this.logbookEntry === null) {
				this.logbookEntry = this.logbookDay.addEntry(null);
			}
		},

		/// shows a logbook entry in read-only mode
		showReadonly: function () {
			if (this.displayForm === null) {
				this.drawDisplayForm();
			}
			RC.Utils.showHide(this.displayForm, true);
			if (this.editForm !== null) {
				RC.Utils.showHide(this.editForm, false);
			}
			if (this.logbookEntry !== null) {
				this.showTime(this.logbookEntry.getDateTime(), true);
				this.lblTitle.innerText = this.logbookEntry.getTitle();
				this.lblNotes.innerText = this.logbookEntry.getNotes();
				var meteo = this.logbookEntry.getMeteo();
				if (meteo.weather) {
					let key = PiLot.Templates.Logbook.weatherTypes.find(e => e[0] == meteo.weather)[1];
					this.lblWeather.innerText = PiLot.Utils.Language.getText(key);
				}
				this.showLabeledText(this.lblTemperature, meteo.temperature, 1);
				this.showLabeledText(this.lblPressure, meteo.pressure, 1);
				this.showLabeledText(this.lblWindForce, meteo.windForce, 0);
				//this.lblWindDirection.innerText = new Map(PiLot.Templates.Logbook.windDirections).get(meteo.windDirection) || '';
				if (meteo.windDirection) {
					let key = PiLot.Templates.Logbook.windDirections.find(e => e[0] == meteo.windDirection)[1];
					this.lblWindDirection.innerText = PiLot.Utils.Language.getText(key);
				}
				this.showLabeledText(this.lblWaveHeight, meteo.waveHeight, 1);
				this.showLabeledText(this.lblLat, PiLot.Utils.Nav.toCoordinateString(this.logbookEntry.getLatitude(), true, true));
				this.showLabeledText(this.lblLon, PiLot.Utils.Nav.toCoordinateString(this.logbookEntry.getLongitude(), false, true));
				this.showLabeledText(this.lblCOG, this.logbookEntry.getCOG(), 1);
				this.showLabeledText(this.lblSOG, this.logbookEntry.getSOG(), 1);
				this.showLabeledText(this.lblLog, this.logbookEntry.getLog(), 1);
				this.showBoatSetupImage.showBoatSetup(this.logbookEntry.getBoatSetup());
			} else {
				PiLot.log('No logbookEntry in LogbookEntryForm.showReadonly', 0);
			}
		},

		/// shows pBoatSetup in the boatImage and editForm
		showBoatSetup: function (pBoatSetup) {
			if (pBoatSetup !== null) {
				this.boatSetupForm.setBoatConfig(pBoatSetup.getBoatConfig());
				this.boatSetupForm.setBoatSetup(pBoatSetup);
				this.editBoatSetupImage.showBoatSetup(pBoatSetup);
			}
		},

		/// expects a meteo object with {temperature, pressure} and shows them
		/// values in the input fields
		showMeteo: function (pMeteo) {
			this.showTemperature(pMeteo.temperature);
			this.showPressure(pMeteo.pressure);
		},

		/// shows the value inside a control which also contains a label. The value
		/// is inserted (prepended to be precise) to the last span within pControl
		/// If the value is null, the entire control is hidden.
		showLabeledText: function (pControl, pText, pNumberFixed) {
			if ((typeof pText !== 'undefined') && (pText !== null) && (pText !== '')) {
				var inner = Array.from(pControl.querySelectorAll('span')).last();
				if ((typeof pNumberFixed !== 'undefined') && (pNumberFixed !== null)) {
					RC.Utils.showNumericValue(inner, pText, '', pNumberFixed);
				} else {
					RC.Utils.setText(pControl, pText);
				}
			} else {
				RC.Utils.showHide(pControl, false);
			}
		},

		/// shows the time of the entry. By default, the textbox is used, if pReadonly,
		/// the label is used. pTime is expected to be a luxon DateTime object
		showTime: function (pTime, pReadOnly) {
			var text = '';
			if (pTime !== null) {
				text = pTime.toFormat('HH:mm');
			}
			if (pReadOnly) {
				RC.Utils.setText(this.lblTime, text);
			} else {
				RC.Utils.setText(this.tbTime, text);
			}
		},

		/// reads the value from tbTime and converts it into a time represented
		/// by seconds since midnight. 
		readTime: function () {
			return RC.Date.DateHelper.parseTime(this.tbTime.value).minutes * 60;
		},

		/// shows a temperature in the input field
		showTemperature: function (pTemperature) {
			RC.Utils.showNumericValue(this.tbTemperature, pTemperature, '', 1);
		},

		/// shows a pressure in the input field. Automagically converts from
		/// PA to mBar if necessary
		showPressure: function (pPressure) {
			if (pPressure > 10000) {
				pPressure /= 100;
			}
			RC.Utils.showNumericValue(this.tbPressure, pPressure, '', 1);
		},

		/// shows data in the nav inputs. expects numeric values
		showNavData: function (pLat, pLon, pCOG, pSOG) {
			this.editLatitude.setCoordinate(pLat).showCoordinate();
			this.editLongitude.setCoordinate(pLon).showCoordinate();
			RC.Utils.showNumericValue(this.tbCOG, pCOG, '', 0);
			RC.Utils.showNumericValue(this.tbSOG, pSOG, '', 1);
		},

		/// deletes a logbook entry and removes the editForm and displayForm
		deleteEnty: function () {
			this.logbookEntry.deleteAsync().then(success => {
				if (success) {
					if (this.editForm !== null) {
						this.editForm.parentNode.removeChild(this.editForm);
					}
					if (this.displayForm !== null) {
						this.displayForm.parentNode.removeChild(this.displayForm);
					}
				}
				RC.Utils.notifyObservers(this, this.observers, `delete`, null);
			});
		}
	}

	/**
	 * A control to upload a photo into the logbook
	 * @param {HTMLElement} pContainer - to container where the control will be added
	 * @param {PiLot.View.Logbook.LogbookPage} pLogbookPage - the logbook page, needed to get the current date
	 */
	var LogbookImageUpload = function (pContainer, pLogbookPage) {

		this.container = pContainer;
		this.logbookPage = pLogbookPage;
		this.filePreviewReader = null;
		this.fileDataReader = null;
		this.fileImageUpload = null;
		this.imgPreview = null;
		this.btnSend = null;
		this.pnlUploading = null;
		this.pnlUploadSuccess = null;
		this.pnlInvalidType = null;

		this.initialize();
	};

	LogbookImageUpload.prototype = {

		initialize: function () {
			this.filePreviewReader = new FileReader();
			this.filePreviewReader.onload = this.filePreviewReader_load.bind(this);
			this.fileDataReader = new FileReader();
			this.fileDataReader.onloadend = this.fileDataReader_loadend.bind(this)
			this.draw();
		},

		fileImageUpload_change: function (e) {
			if (this.fileImageUpload.files[0].type === "image/jpeg") {
				this.pnlInvalidType.hidden = true;
				this.filePreviewReader.readAsDataURL(this.fileImageUpload.files[0]);
				this.imgPreview.hidden = true;
			} else {
				this.pnlInvalidType.hidden = false;
			}
		},

		filePreviewReader_load: function (e) {
			this.imgPreview.setAttribute('src', this.filePreviewReader.result);
			this.imgPreview.hidden = false;
			this.btnSend.hidden = false;
			this.pnlUploadSuccess.hidden = true;
		},

		btnSend_click: function () {
			this.fileDataReader.readAsArrayBuffer(this.fileImageUpload.files[0]);
			this.btnSend.hidden = true;
			this.pnlUploading.hidden = false;
		},

		fileDataReader_loadend: async function () {
			const file = this.fileImageUpload.files[0];
			await PiLot.Model.Logbook.uploadPhotoAsync(this.fileDataReader.result, file.name, this.logbookPage.getDate());
			this.pnlUploading.hidden = true;
			this.pnlUploadSuccess.hidden = false;
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookImageUpload);
			this.container.appendChild(control);
			this.fileImageUpload = control.querySelector('.fileImageUpload');
			this.fileImageUpload.addEventListener('change', this.fileImageUpload_change.bind(this));
			this.imgPreview = control.querySelector('.imgPreview');
			this.btnSend = control.querySelector('.btnSend');
			this.btnSend.addEventListener('click', this.btnSend_click.bind(this));
			this.pnlUploading = control.querySelector('.pnlUploading');
			this.pnlUploadSuccess = control.querySelector('.pnlUploadSuccess');
			this.pnlInvalidType = control.querySelector('.pnlInvalidType');
		}
	};

	var LogbookPhotos = function (pContainer) {
		this.container = pContainer;
		this.imageCollection = null;		// RC.ImageGallery.ImageCollection
		this.plhPhotos = null;				// HTMLElement

		this.initialize();
	};

	LogbookPhotos.prototype = {

		initialize: function () {
			this.draw();
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookPhotos);
			this.container.appendChild(control);
			this.plhPhotos = this.container.querySelector('.plhPhotos');
		},

		loadImageCollectionAsync: async function (pDay) {
			this.imageCollection = await PiLot.Model.Logbook.loadDailyImageCollectionAsync(pDay);
			this.plhPhotos.clear();
			this.imageCollection.getImageNames().forEach(function (anImage) {
				new LogbookPhoto(this.plhPhotos, anImage, this.imageCollection);
			}.bind(this));			
		},

		setDate: function (pDate) {
			this.loadImageCollectionAsync(pDate);
		}
	};

	LogbookPhoto = function (pContainer, pImageName, pImageCollection) {
		this.container = pContainer;					// HTMLElement
		this.imageName = pImageName;					// String (the original image name)
		this.imageCollection = pImageCollection;		// RC.ImageGallery.ImageCollection

		this.initialize();
	};

	LogbookPhoto.prototype = {

		initialize: function () {
			this.draw();
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.logbookPhoto);
			this.container.appendChild(control);
			const image = control.querySelector('.imgPhoto');
			const imageSize = Math.max(control.clientHeight, control.clientWidth);
			const imageUrl = this.imageCollection.getFolderUrl(imageSize) + this.imageName;
			image.src = imageUrl;
		}
	};

	/**
	 * The publish page lists the logbook data and allows it to be published to
	 * a remote system showing as well the current data on the remote system.
	 * */
	var PublishLogbookPage = function () {
		this.date = null;					// RC.Date.DateOnly
		this.targtName = null;				// String, the name of the selected publish target
		this.targetData = null;				// Object {track, logbookDay, photoInfos}, the data we recieved from the target
		this.jobStatusInterval = null;

		this.ddlPublishTarget = null;
		this.localTrackMap = null;			// PiLot.View.Map.Seamap
		this.targetTrackMap = null;			// PiLot.View.Map.Seamap
		this.cbSelectPhotos = null; // not the checkbox itself, but an RC.Controls.TriStateCheckBox!

		this.initialize();
	};

	PublishLogbookPage.prototype = {

		initialize: function () {
			this.initializeDate();
			this.draw();
			this.loadLocalDataAsync();
			
		},

		initializeDate: function () {
			this.date = PiLot.Utils.Common.parseQsDate(null);
		},

		/** Draws the page */
		draw: function () {
			let x = PublishLogbookPage.MAXIMAGESIZE;
			let loader = PiLot.Utils.Loader;
			PiLot.View.Common.setCurrentMainMenuPage(loader.pages.logbook.logbook);
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.publishLogbookPage);
			loader.getContentArea().appendChild(pageContent);
			this.ddlPublishTarget = pageContent.querySelector('.ddlPublishTarget');
			this.icoWait = pageContent.querySelector('.icoWait');
			this.loadPublishTargetsAsync();
			this.pnlConnecting = pageContent.querySelector('.pnlConnecting');
			this.ddlPublishTarget.addEventListener('change', this.ddlPublishTarget_select.bind(this));
			this.pnlJobInfo = pageContent.querySelector('.pnlJobInfo');
			this.pnlJobInfo.querySelector('.btnClose').addEventListener('click', this.btnCloseJobInfo_click.bind(this));
			this.pnlPublish = pageContent.querySelector('.pnlPublish');
			this.lblLocalPositionsCount = this.pnlPublish.querySelector('.lblLocalPositionsCount');
			this.lblTargetPositionsCount = this.pnlPublish.querySelector('.lblTargetPositionsCount');
			this.localTrackMap = new PiLot.View.Map.Seamap(this.pnlPublish.querySelector('.divLocalTrack'), { persistMapState: false });
			this.localTrack = new PiLot.View.Map.MapTrack(this.localTrackMap, null, null, { ignoreSettings: true, showTrack: true });
			this.targetTrackMap = new PiLot.View.Map.Seamap(this.pnlPublish.querySelector('.divTargetTrack'), { persistMapState: false });
			this.targetTrack = new PiLot.View.Map.MapTrack(this.targetTrackMap, null, null, { ignoreSettings: true, showTrack: true });
			this.cbPublishTrack = this.pnlPublish.querySelector('.cbPublishTrack');
			this.cbPublishDiary = this.pnlPublish.querySelector('.cbPublishDiary');
			this.cbOverwriteDiary = this.pnlPublish.querySelector('.cbOverwriteDiary');
			this.cbPublishLogbook = this.pnlPublish.querySelector('.cbPublishLogbook');
			this.cbOverwriteLogbook = this.pnlPublish.querySelector('.cbOverwriteLogbook');
			this.divLocalDiaryText = this.pnlPublish.querySelector('.divLocalDiaryText');
			this.lblLocalDiaryLength = this.pnlPublish.querySelector('.lblLocalDiaryLength');
			this.divTargetDiaryText = this.pnlPublish.querySelector('.divTargetDiaryText');
			this.lblTargetDiaryLength = this.pnlPublish.querySelector('.lblTargetDiaryLength');
			this.divLocalLogbookEntries = this.pnlPublish.querySelector('.divLocalLogbookEntries');
			this.lblLocalLogbookEntriesCount = this.pnlPublish.querySelector('.lblLocalLogbookEntriesCount');
			this.divTargetLogbookEntries = this.pnlPublish.querySelector('.divTargetLogbookEntries');
			this.lblTargetLogbookEntriesCount = this.pnlPublish.querySelector('.lblTargetLogbookEntriesCount');
			this.lblLocalPhotosCount = this.pnlPublish.querySelector('.lblLocalPhotosCount');
			this.divLocalPhotos = this.pnlPublish.querySelector('.divLocalPhotos');
			this.lblTargetPhotosCount = this.pnlPublish.querySelector('.lblTargetPhotosCount');
			this.divTargetPhotos = this.pnlPublish.querySelector('.divTargetPhotos');
			this.cbSelectPhotos = new RC.Controls.TriStateCheckBox(this.pnlPublish.querySelector('.cbSelectPhotos'));
			this.cbSelectPhotos.on('change', this.cbSelectPhotos_change.bind(this));
			this.pnlPublish.querySelector('.btnPublish').addEventListener('click', this.btnPublish_click.bind(this));
			this.pnlPublish.querySelector('.btnStatus').addEventListener('click', this.btnStatus_click.bind(this));
		},

		/** Handler when a publish target from the dropdown-list is selected */
		ddlPublishTarget_select: async function (pEvent) {
			this.targetName = pEvent.target.value;
			this.targetData = null;
			if (this.targetName) {
				this.loadTargetDataAsync();
			} 		
		},

		btnCloseJobInfo_click: function () {
			window.clearInterval(this.jobStatusInterval);
			this.pnlJobInfo.hidden = true;
			this.loadTargetDataAsync();
		},

		cbPhoto_change: function (sender) {
			this.setCbPhotosState();
		},

		cbSelectPhotos_change: function (sender) {
			this.applyCbPhotosState();
		},

		btnStatus_click: async function () {
			if (this.targetName) {
				this.showPublishJob();
			} 
		},

		btnPublish_click: function () {
			if (this.targetName) {
				this.publishDataAsync();
			}
		},

		/** loads the publish targets, and fills the dropdown when done */
		loadPublishTargetsAsync: async function () {
			const targets = await PiLot.Model.Logbook.loadPublishTargetsAsync();
			const ddlArray = targets.map(t => [t.name, t.displayName]);
			ddlArray.unshift(['', 'pleaseSelect']);
			PiLot.Utils.Common.fillDropdown(this.ddlPublishTarget, ddlArray);
		},

		/** loads the local data to show in the publish form ("left side") */
		loadLocalDataAsync: async function () {
			const startMS = this.date.toLuxon().toMillis();
			const endMS = this.date.addDays(1).toLuxon().toMillis();
			const track = await PiLot.Model.Nav.loadTrackAsync(startMS, endMS, true);
			this.showTrackAsync(track, this.localTrackMap, this.localTrack, this.lblLocalPositionsCount);
			const logbookDay = await PiLot.Model.Logbook.loadLogbookDayAsync(this.date);
			this.showLogbook(logbookDay, this.divLocalDiaryText, this.lblLocalDiaryLength, this.divLocalLogbookEntries, this.lblLocalLogbookEntriesCount);
			const dailyPhotos = await PiLot.Model.Logbook.loadDailyImageCollectionAsync(this.date);
			this.showPhotos(dailyPhotos, this.divLocalPhotos, this.lblLocalPhotosCount, true);
		},

		/** loads the target data to show in the publish form ("right side") */
		loadTargetDataAsync: async function () {
			this.icoWait.hidden = false;
			this.showTrackAsync(null, this.targetTrackMap, this.targetTrack, this.lblTargetPositionsCount);
			this.showLogbook(null, this.divTargetDiaryText, this.lblTargetDiaryLength, this.divTargetLogbookEntries, this.lblTargetLogbookEntriesCount)
			this.showPhotos(null, this.divTargetPhotos, this.lblTargetPhotosCount, false);
			this.targetData = await PiLot.Model.Logbook.loadDailyDataAsync(this.targetName, this.date);
			if (this.targetData.success) {
				this.showTrackAsync(this.targetData.data.track, this.targetTrackMap, this.targetTrack, this.lblTargetPositionsCount);
				this.showLogbook(this.targetData.data.logbookDay, this.divTargetDiaryText, this.lblTargetDiaryLength, this.divTargetLogbookEntries, this.lblTargetLogbookEntriesCount)
				this.showPhotos(this.targetData.data.photoInfos, this.divTargetPhotos, this.lblTargetPhotosCount, false);
				this.cbSelectPhotos.setState(2);
				this.applyCbPhotosState();
			} else {
				alert(this.targetData.messages);
			}
			this.icoWait.hidden = true;
		},

		/**
		 * Shows the track within a map in a control. 
		 * @param {PiLot.Model.Nav.Track} pTrack - the track to show
		 * @param {HTMLElement} pControl - the control containing the map
		 */
		showTrackAsync: async function (pTrack, pMap, pTrackControl, pPositionsLabel) {
			pPositionsLabel.innerText = pTrack ? pTrack.getPositionsCount() : "...";
			await pMap.showAsync();
			pTrackControl.setTrack(pTrack);
			pTrackControl.draw();
			pTrackControl.zoomToTrack();
		},

		showLogbook: function (pLogbookDay, pDiaryControl, pDiaryLengthControl, pLogbookEntriesControl, pLogbookEntriesCountControl) {
			let diaryText = "";
			let logbookEntries = [];
			if (pLogbookDay !== null) {
				diaryText = pLogbookDay.getDiaryText();
				logbookEntries = pLogbookDay.getLogbookEntries();
			}
			pDiaryControl.innerText = diaryText;
			pDiaryLengthControl.innerText = (diaryText || "").length;
			pLogbookEntriesCountControl.innerText = logbookEntries.length;
			pLogbookEntriesControl.clear();
			logbookEntries.forEach(function (entry) {
				let div = document.createElement('div');
				div.innerText = `${entry.getDateTime().toFormat('HH:mm')} - ${entry.getTitle()}`;
				pLogbookEntriesControl.appendChild(div);
			}.bind(this));
		},

		showPhotos: function (pPhotoInfos, pContainer, pPhotosCountControl, pShowCheckboxes) {
			pContainer.clear();
			if (pPhotoInfos) {
				let thumbnailFolder = pPhotoInfos.getFolderUrl(PublishLogbookPage.THUMBNAILSIZE);
				pPhotosCountControl.innerText = pPhotoInfos.getImagesCount();
				const idPrefix = pContainer.id || (Math.random() * 10 ^ 6).toFixed(0);
				pPhotoInfos.getImageNames().forEach(function (pPhoto) {
					const imageContainer = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.publishPagePhoto);
					const imageId = `${idPrefix}_${pPhoto}`;
					pContainer.appendChild(imageContainer);
					const image = imageContainer.querySelector('.imgPhoto');
					image.setAttribute('src', `${thumbnailFolder}${pPhoto}`);
					const cbSelectPhoto = imageContainer.querySelector('.cbSelectPhoto');
					RC.Utils.showHide(cbSelectPhoto, pShowCheckboxes);
					const lblName = imageContainer.querySelector('.lblName');
					lblName.innerText = pPhoto;
					lblName.setAttribute('title', pPhoto);
					if (pShowCheckboxes) {
						cbSelectPhoto.setAttribute('type', 'checkbox');
						cbSelectPhoto.setAttribute('name', pPhoto);
						cbSelectPhoto.setAttribute('id', imageId);
						lblName.setAttribute('for', imageId);
						cbSelectPhoto.addEventListener('change', this.cbPhoto_change.bind(this));
					}
				}.bind(this));
			}
		},

		applyCbPhotosState: function () {
			const checkboxes = this.divLocalPhotos.querySelectorAll('input[type=checkbox]');
			checkboxes.forEach(function (cb) {
				switch (this.cbSelectPhotos.getState()) {
					case 0:
						cb.checked = false;
						break;
					case 1:
						cb.checked = true;
						break;
					case 2:
						const imageName = cb.name;
						cb.checked = !this.targetData.data.photoInfos.getImageNames().includes(imageName);
				}
				
			}.bind(this));
		},

		setCbPhotosState: function () {
			const anyChecked = this.divLocalPhotos.querySelector('input[type=checkbox]:checked') !== null;
			const anyUnChecked = this.divLocalPhotos.querySelector('input[type=checkbox]:not(:checked)') !== null;
			if (anyChecked && anyUnChecked) {
				this.cbSelectPhotos.setState(2);
			} else {
				this.cbSelectPhotos.setState(anyChecked ? 1 : 0);
			}
		},

		
		refreshPublishJobAsync: async function () {
			const jobStatus = await PiLot.Model.Logbook.loadJobStatusAsync(this.targetName, this.date);
			RC.Utils.showHide(this.pnlJobInfo.querySelector('.lblStatusNone'), !jobStatus);
			RC.Utils.showHide(this.pnlJobInfo.querySelector('.lblStatusIdle'), jobStatus && jobStatus.overallStatus === 0);
			RC.Utils.showHide(this.pnlJobInfo.querySelector('.lblStatusBusy'), jobStatus && jobStatus.overallStatus === 1);
			RC.Utils.showHide(this.pnlJobInfo.querySelector('.lblStatusFinished'), jobStatus && jobStatus.overallStatus === 2);
			RC.Utils.showHide(this.pnlJobInfo.querySelector('.lblStatusError'), jobStatus && jobStatus.overallStatus === 9);
			const pnlMessages = this.pnlJobInfo.querySelector('.pnlMessages');
			pnlMessages.innerText = "";
			if (jobStatus && jobStatus.messages) {
				jobStatus.messages.forEach(m => pnlMessages.innerHTML += m + "<br />");
				pnlMessages.scrollTop = pnlMessages.scrollHeight;
			}
		},

		/**
		 * Shows a panel with data about the current publishJob. The data is automatically
		 * loaded and updated, by magic!
		 */
		showPublishJob: function () {
			this.pnlJobInfo.hidden = false;
			this.refreshPublishJobAsync();
			this.jobStatusInterval = window.setInterval(this.refreshPublishJobAsync.bind(this), 1000);
		},

		/**
		 * This first checks whether we have an active PublishJob for this target and date.
		 * If so, it will just show the job status. If not, it will send the publish Job
		 * and then show the Job Status.
		 * */
		publishDataAsync: async function () {
			const jobStatus = await PiLot.Model.Logbook.loadJobStatusAsync(this.targetName, this.date);
			if (!jobStatus || jobStatus.isFinished) {
				const publishTrackMode = this.getPublishMode(this.cbPublishTrack, null);
				const publishDiaryMode = this.getPublishMode(this.cbPublishDiary, this.cbOverwriteDiary);
				const publishLogbookMode = this.getPublishMode(this.cbPublishLogbook, this.cbOverwriteLogbook);
				let publishPhotos = [];
				for (var cb of this.divLocalPhotos.querySelectorAll('input[type=checkbox]:checked').values()) {
					publishPhotos.push(cb.name);
				};
				const publishSelection = {
					publishTrackMode: publishTrackMode,
					publishDiaryMode: publishDiaryMode,
					publishLogbookMode: publishLogbookMode,
					publishPhotos: publishPhotos
				};
				const publishResult = await PiLot.Model.Logbook.sendPublishJobAsync(this.targetName, this.date, publishSelection);
			}
			this.showPublishJob();
		},

		getPublishMode: function (pCbPublish, pCbOverwrite) {
			let result;
			if (pCbPublish.checked) {
				if (pCbOverwrite && pCbOverwrite.checked) {
					result = 1;
				} else {
					result = 2;
				}
			} else {
				result = 0;
			}
			return result;
		}
	};

	PublishLogbookPage.THUMBNAILSIZE = 128; // aww... class constants, anyone?

	/** Class DiaryCalendar
	 * extends a calendar by adding icons each day, showing what kind of diary
	 * data is available that day
	 * @param {RC.Controls.Calendar} pCalendar - The calendar this is based on
	 * @param {PiLot.Model.Logbook.diaryInfoCache} pDiaryInfoCache - not null
	 * */
	var DiaryCalendar = function (pCalendar, pDiaryInfoCache) {
		this.calendar = pCalendar;				// the calendar control this sits on
		this.diaryInfoCache = pDiaryInfoCache;  // a cache to get info about available data
		this.initialize();
	}

	DiaryCalendar.prototype = {

		/// initializes the DiaryCalender, binds to the calendar_dayRendered event
		/// of the calendar
		initialize: function () {
			this.calendar.setOnMonthRendered(this.calendar_monthRendered.bind(this));
		},

		/**
		 * handler for the month_rendered event. Here we want to add the icons for each day 
		 * showing what kind of data we have. If also days of the previous and/or next
		 * month are visible, we load this data separately (for the whole months, being lazy)
		 * */
		calendar_monthRendered: function (pYear, pMonth) {
			this.showMonthInfoAsync(pYear, pMonth);
			const firstDay = this.calendar.getFirstDay();
			if (firstDay && firstDay.month !== pMonth) {
				this.showMonthInfoAsync(firstDay.year, firstDay.month);
			}
			const lastDay = this.calendar.getLastDay();
			if (lastDay && lastDay.month !== pMonth) {
				this.showMonthInfoAsync(lastDay.year, lastDay.month);
			}
		},

		/**
		 * Loads the month info from the cache or the server and shows the icons within the 
		 * calendar as soon as we have a result
		 * @param {any} pYear
		 * @param {any} pMonth
		 */
		showMonthInfoAsync: async function (pYear, pMonth) {
			const monthInfo = await this.diaryInfoCache.getMonthInfoAsync(pYear, pMonth);
			let loopDate = DateTime.utc(pYear, pMonth, 1);
			let calendarCell = null;
			while (loopDate.month === pMonth) {
				calendarCell = this.calendar.getDayCell(loopDate);
				if (calendarCell) {
					dayInfo = monthInfo.get(loopDate.day);
					this.addCalendarIcons(dayInfo, calendarCell);
					if (!(dayInfo.hasLogbook || dayInfo.hasTrack || dayInfo.hasPhotos)) {
						calendarCell.classList.add('empty');
					}
				}
				loopDate = loopDate.plus({ days: 1 });
			}
		},

		/// adds the icons for the data available for one day. Expects the data and the
		/// control (the table cell or whatever container contains the day link)
		addCalendarIcons: function (pDayInfo, pCell) {
			const link = pCell.querySelector('a');
			link.querySelectorAll('.icons').forEach(e => e.parentNode.removeChild(e));
			const iconsDiv = RC.Utils.addDomObject('div', link, 'icons');
			if (pDayInfo.hasLogbook) this.addIcon(iconsDiv, 'icon-quill');
			if (pDayInfo.hasTrack) this.addIcon(iconsDiv, 'icon-map2');
			if (pDayInfo.hasPhotos) this.addIcon(iconsDiv, 'icon-pictures');
		},

		/// appends an icon to a control
		addIcon: function (pControl, pIcon) {
			RC.Utils.addDomObject('i', pControl, pIcon);
		}
	}

	return {
		LogbookPage: LogbookPage,
		LogbookEntries: LogbookEntries,
		LogbookEntryForm: LogbookEntryForm,
		PublishLogbookPage: PublishLogbookPage,
		DiaryCalendar: DiaryCalendar
	};

})();