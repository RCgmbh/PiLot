var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

/** In order to not have it all in the Logbook namespace, diary specific views are in this specific namespace. */
PiLot.View.Diary = (function () {

	/** 
	 * class DiaryPage, representing the page containing the diary. In this context, "diary"
	 * does not only refer to the manually entered diary text, but to all data telling the
	 * story of one day, including the logbook, the track, the diary text and the daily photos.
	 * */
	var DiaryPage = function () {
		this.currentBoatTime = null;					// the current boatTime, needed for setting default date
		this.logbookDay = null;							// the logbookDay being displayed
		this.date = null;								// the RC.Date.DateOnly currently selected
		this.diaryInfoCache = null;						// the PiLot.Model.Logbook.DiaryInfoCache used to load calendar icons and jump to previos/next day with data

		// controls
		this.lblFriendlyDate = null;					// span showing the friendly date
		this.calendar = null;							// PiLot.View.Logbook.DiaryCalendar to select the date			
		this.lnkPreviousDay = null;						// the link to go back one day
		this.lnkNextDay = null;							// the link to go to the next day
		this.editForm = null;							// PiLot.View.Logbook.LogbokEntryForm to add new or edit existing entries
		this.logbookEntriesControl = null;				// PiLot.View.Logbook.LogbookEntries control which will be added on the fly
		this.lnkAddLogbookEntry = null;					// The link to add a new logbook entry
		this.map = null;								// PiLot.View.Nav.Seamap showing the track of the day
		this.mapTrack = null;							// the PiLot.View.Map.MapTrack for the daily track
		this.pnlDiary = null;							// The panel containing diary text and distance
		this.tbDiary = null;							// The textbox for editing diary content
		this.lblDiary = null;							// The label for showing diary content readonly 
		this.diaryFontSize = null;						// the index of [0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5] for the current diary text size
		this.plhDistance = null;						// container showing the total distance of the day
		this.lblDistanceKm = null;						// the label for distance in km
		this.lblDistanceNm = null;						// the label for distance in nm
		this.pnlSpeedDiagram = null;					// panel where the speed diagram will be added
		//this.plhPhotoGallery = null;					// the placeholder where we will add the photo gallery
		this.photoGallery = null;						// PiLot.View.Diary.DiaryPhotoGallery for the daily photos
		this.photoUpload = null;						// PiLot.View.Diary.DiaryPhotoUpload
		this.lnkTop = null;								// link to go back to the page top
		this.lnkEditTrack = null;						// link that leads to the tools page where the track can be edited
		this.lnkPublish = null;							// the link leading to the publishing page for the same date

		this.initialize();
	}

	DiaryPage.diaryFontSizes = [0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5];

	DiaryPage.prototype = {

		initialize: async function () {
			this.currentBoatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.diaryInfoCache = new PiLot.Model.Logbook.DiaryInfoCache();
			this.draw();
			this.initializeDate();
		},

		/** handler for selecting a date in the calendar */
		calendar_dateSelected: function () {
			let date = RC.Date.DateOnly.fromObject(this.calendar.date());
			this.setDate(date);
		},

		/** Handler for the new item link click. Shows the form for a new entry with the latest boat setup */
		lnkAddLogbookEntry_click: function () {
			const latestBoatSetup = this.logbookDay.getLatestBoatSetup();
			this.editForm.showEmptyFormAsync(this.logbookDay, latestBoatSetup);
		},

		/** change handler for the diary field, assigns the text and saves the changes. */
		tbDiary_change: function () {
			this.logbookDay.setDiaryText(this.tbDiary.value);
			this.showDiaryText();
			this.logbookDay.saveDiaryTextAsync();
		},

		/** click handler for the bigger text link */
		lnkBiggerText_click: function () {
			this.changeDiaryFontSize(1);
		},

		/** click handler for the smaller text link */
		lnkSmallerText_click: function () {
			this.changeDiaryFontSize(-1);
		},

		/** Upload handler for the photo upload */
		photoUpload_upload: function(pSender, pArg){
			//this.showPhotosAsync();
			this.photoGallery.addPhoto(pArg);
		},

		/** Change handler for the edit mode checkbox */
		cbEditMode_change: function (e) {
			this.toggleReadOnly(!e.target.checked);
			return false;
		},

		/** draws the page and finds the controls and binds handlers */
		draw: function () {
			const diaryPage = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryPage);
			PiLot.Utils.Loader.getContentArea().appendChild(diaryPage);
			this.lblFriendlyDate = diaryPage.querySelector('.lblFriendlyDate');
			const divCalendar = diaryPage.querySelector('.logbookCalendar');
			const calendarLink = diaryPage.querySelector('.lblCalendarLink');
			const calendarDate = diaryPage.querySelector('.lblCalendarDate');
			const locale = PiLot.Utils.Language.getLocale();
			this.calendar = new RC.Controls.Calendar(divCalendar, calendarDate, calendarLink, this.calendar_dateSelected.bind(this), this.currentBoatTime.getUtcOffsetMinutes(), locale);
			new PiLot.View.Diary.DiaryCalendar(this.calendar, this.diaryInfoCache);
			this.lnkPreviousDay = diaryPage.querySelector('.lnkPreviousDay');
			this.lnkNextDay = diaryPage.querySelector('.lnkNextDay');
			this.editForm = new PiLot.View.Logbook.LogbookEntryForm(null);
			const options = { isReadOnly: false, sortDescending: false, autoFillNewItems: false };
			this.logbookEntriesControl = new PiLot.View.Logbook.LogbookEntries(diaryPage.querySelector('.plhLogbookEntries'), this.editForm, this.currentBoatTime, options);
			this.lnkAddLogbookEntry = diaryPage.querySelector('.lnkAddLogbookEntry');
			this.lnkAddLogbookEntry.addEventListener('click', this.lnkAddLogbookEntry_click.bind(this));
			this.pnlDiary = diaryPage.querySelector('.pnlDiary');
			diaryPage.querySelector('.lnkBiggerText').addEventListener('click', this.lnkBiggerText_click.bind(this));
			diaryPage.querySelector('.lnkSmallerText').addEventListener('click', this.lnkSmallerText_click.bind(this));
			this.lblDiary = diaryPage.querySelector('.lblDiary');
			this.applyDiaryFontSize();
			this.plhDistance = diaryPage.querySelector('.plhDistance');
			this.lblDistanceKm = this.plhDistance.querySelector('.lblDistanceKm');
			this.lblDistanceNm = this.plhDistance.querySelector('.lblDistanceNm');
			this.pnlEditDiary = diaryPage.querySelector('.pnlEditDiary');
			this.tbDiary = diaryPage.querySelector('.tbDiary');
			this.tbDiary.addEventListener('change', this.tbDiary_change.bind(this));
			this.map = new PiLot.View.Map.Seamap(diaryPage.querySelector('.plhMap'), { persistMapState: false });
			this.pnlSpeedDiagram = diaryPage.querySelector('.pnlSpeedDiagram');
			if(PiLot.Permissions.canWrite()){	
				const plhPhotoUpload = diaryPage.querySelector('.plhPhotoUpload');
				this.photoUpload = new DiaryPhotoUpload(plhPhotoUpload, this);
				this.photoUpload.on('upload', this.photoUpload_upload.bind(this));
			}
			const plhPhotoGallery = diaryPage.querySelector('.plhPhotoGallery');
			this.photoGallery = new DiaryPhotoGallery(plhPhotoGallery);
			this.lnkTop = diaryPage.querySelector('.lnkTop');
			const cbEditMode = diaryPage.querySelector('.cbEditMode');
			cbEditMode.addEventListener('change', this.cbEditMode_change.bind(this));
			this.lnkEditTrack = diaryPage.querySelector('.lnkEditTrack');
			this.lnkPublish = diaryPage.querySelector('.lnkPublish');
			diaryPage.querySelector('.pnlEdit').hidden = !PiLot.Permissions.canWrite();
			this.toggleReadOnly(true);
		},

		/** sets the date based on the user settings, the value from the url or now */
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
			const settingValue = PiLot.Utils.Common.loadUserSetting('PiLot.View.Diary.currentDate');
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
			await this.diaryInfoCache.preloadData(this.date.year, this.date.month);
			const previousDate = this.diaryInfoCache.getPreviousDate(this.date);
			if (previousDate) {
				this.lnkPreviousDay.onclick = function () { this.setDate(previousDate); }.bind(this);
			}
			RC.Utils.showHide(this.lnkPreviousDay, !!previousDate);
			const nextDate = this.diaryInfoCache.getNextDate(this.date);
			if (nextDate) {
				this.lnkNextDay.onclick = function () { this.setDate(nextDate); }.bind(this);
			}
			RC.Utils.showHide(this.lnkNextDay, !!nextDate);
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
				const url = `${pageUrl}&d=${qsDate}`;
				pLink.href = url;
			}
		},

		/** Loads the LogbookDay and shows its data. If no LogbookDay is found, an empty LogbookDay is show */
		loadLogbookDayAsync: async function () {
			this.logbookDay = await PiLot.Model.Logbook.loadLogbookDayAsync(this.date);
			if (this.logbookDay === null){
				this.logbookDay = new PiLot.Model.Logbook.LogbookDay(this.date);
			}
			this.showDataAsync();
		},

		/** shows the logbook data for the current LogbookDay */
		showDataAsync: async function () {
			this.showFriendlyDate();
			this.showDiaryText();
			this.logbookEntriesControl.showLogbookDay(this.logbookDay);
			await Promise.all([
				this.loadTrackAsync(),
				this.showPhotosAsync()
			]);
			this.showTopLink();
		},

		/**
		 * Switches between the read-only and the edit mode
		 * @param {Boolean} pReadOnly
		 */
		toggleReadOnly: function (pReadOnly) {
			this.logbookEntriesControl.toggleReadOnly(pReadOnly);
			this.lnkAddLogbookEntry.hidden = pReadOnly;
			this.pnlDiary.hidden = !pReadOnly;
			this.pnlEditDiary.hidden = pReadOnly;
			if(this.photoUpload){
				this.photoUpload.toggleVisible(!pReadOnly);
			}
		},

		/** shows the currently selected date in friendly form */
		showFriendlyDate: function () {
			const locale = PiLot.Utils.Language.getLocale();
			this.lblFriendlyDate.innerText = this.date.toLuxon().setLocale(locale).toLocaleString({ weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
		},

		showTopLink: function () {
			this.lnkTop.hidden = document.body.scrollHeight <= window.innerHeight;
		},

		/** changes the current day by pDays and re-loads the data. Also saves the currently selected day to the user settings */
		changeDay: function (pDays) {
			this.setDate(this.date.addDays(pDays));
		},

		/**
		 * Changes the diary font size
		 * @param {number} pChangeBy, usually -1 or 1
		 */
		changeDiaryFontSize: function (pChangeBy) {
			this.diaryFontSize = Math.max(Math.min(DiaryPage.diaryFontSizes.length - 1, this.diaryFontSize + pChangeBy), 0);
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Diary.fontSize', this.diaryFontSize);
			this.applyDiaryFontSize();
		},

		/**
		 * applies the current font size to the diary panel, by directly setting the fontSize style to 
		 * to a certain em value.
		 * */
		applyDiaryFontSize: function () {
			if (this.diaryFontSize === null) {
				this.diaryFontSize = PiLot.Utils.Common.loadUserSetting('PiLot.View.Diary.fontSize');
				if (this.diaryFontSize === null) {
					this.diaryFontSize = DiaryPage.diaryFontSizes.indexOf(1);
				}
			}
			this.pnlDiary.style.fontSize = DiaryPage.diaryFontSizes[this.diaryFontSize] + 'em';
		},

		/** sets the current date, re-loads the data and saves the currently selected day to the user settings */
		setDate: function (pDate) {
			this.date = pDate;
			this.calendar.date(this.date.toLuxon().setLocale(PiLot.Utils.Language.getLocale()));
			this.calendar.showDate();
			this.bindPreviousNextButtons();
			this.bindLnkEditTrack();
			this.bindLnkPublish();
			this.saveDate();
			const url = PiLot.Utils.Common.setQsDate(window.location, this.date);
			window.history.pushState({}, '', url);
			this.loadLogbookDayAsync();
		},

		/** accessor for this.date */
		getDate: function () {
			return this.date;
		},

		/** saves the currently selected date to the user settings */
		saveDate: function () {
			let settingsValue = null;
			if (!this.date.contains(this.currentBoatTime.now())) {
				settingsValue = this.date;
			}
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Diary.currentDate', settingsValue)
		},

		/** tries to load the track and show it on the map */
		loadTrackAsync: async function () {
			this.showDistance(null);
			const startMS = this.date.toLuxon().toMillis();
			const endMS = this.date.addDays(1).toLuxon().toMillis();
			const track = await PiLot.Model.Nav.loadTrackAsync(startMS, endMS, true);
			this.showTrackAsync(track);
			this.showDistance(track.getDistance());
			this.showSpeedDiagram(track);
		},

		/** takes a track and shows it on the map */
		showTrackAsync: async function (pTrack) {
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
		},

		/**
		 * shows the distance in km and nm. If pDistance is null, the value ... will be 
		 * shown, as this is used while loading the track. If the distance is 0, the entire
		 * panel will be hidden.
		 * @param {Number} pDistance
		 */
		showDistance: function (pDistance) {
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
		},

		/**
		 * Shows the speed diagram for the track that has been loaded, or hides it, if the
		 * track has no positions
		 * @param {PiLot.Model.Nav.Track} pTrack
		 */
		showSpeedDiagram: function (pTrack) {
			if (pTrack && pTrack.getPositionsCount() > 0) {
				this.pnlSpeedDiagram.hidden = false;
				new PiLot.View.Tools.SpeedDiagram(this.pnlSpeedDiagram, pTrack);
			} else {
				this.pnlSpeedDiagram.hidden = true;
			}
		},

		/** shows the diary text of the current logbookDay */
		showDiaryText: function () {
			this.tbDiary.value = this.logbookDay.getDiaryText();
			this.lblDiary.innerText = this.logbookDay.getDiaryText();
		},

		/**
		 * reads the value from the diary textfield, assigns it to the current LogbookDay and saves the day back to the server
		 * */
		saveDiaryText: function () {
			this.logbookDay.setDiaryText(this.tbDiary.value);
			this.logbookDay.saveDiaryTextAsync();
		},

		showPhotosAsync: async function () {
			this.photoGallery.loadPhotosAsync(this.date);
		},
	};

	/**
	 * The photo gallery for the Diary, showing thumbnails of all photos of the day, and allows to
	 * open them. In edit-mode (read-only=false), the photos can also be deleted.
	 * @param {HTMLElement} pContainer - the container where the gallery will be created
	 */
	var DiaryPhotoGallery = function (pContainer) {
		this.container = pContainer;
		this.date = null;
		this.control = null;
		this.lnkDownload = null;
		this.lnkOpenBlank = null;
		this.lnkDelete = null;
		this.plhPhotos = null;				// HTMLElement
		this.pnlPhotoScreen = null;			// HTMLElement
		this.imgFullSize = null;			// HTMLImageElement
		this.lblFileName = null;			// HTMLElement
		this.lblPhotoIndex = null;			// HTMLElement
		this.lblPhotoTotal = null;			// HTMLElement
		this.keyHandler = null;
		this.imageCollection = null;
		this.imageIndex = -1;
		this.navigationVisible = false;
		this.hideNavTimeout = null;
		this.initialize();
	};

	DiaryPhotoGallery.prototype = {

		initialize: function () {
			this.keyHandler = this.document_keydown.bind(this);
			this.draw();
		},

		lnkDelete_click: function (pEvent) {
			pEvent.preventDefault();
			const fileName = this.imageCollection.getImageNames()[this.imageIndex]
			if (window.confirm(PiLot.Utils.Language.getText('confirmDeletePhoto'))) {
				this.deletePhoto(fileName);
			}
		},

		/** Closes the currently displayed photo */
		lnkClose_click: function (pEvent) {
			this.hidePhoto();
			pEvent.preventDefault();
		},

		/**
		 * Opens the photo
		 * @param {String} pArg - the image name
		 */
		thumbnail_click: function (pArg) {
			this.showPhoto(pArg);
		},

		/** Shows the previous photo (looping through) */
		lnkPrevious_click: function (pEvent) {
			this.changePhoto(-1);
			pEvent.preventDefault();
		},

		/** Shows the next photo (looping through) */
		lnkNext_click: function (pEvent) {
			this.changePhoto(1);
			pEvent.preventDefault();
		},

		/** Shows the photo as soon as it has been loades, and triggers preloading the next one */
		image_load: function () {
			this.imgFullSize.hidden = false;
			this.preloadNextPhoto();
		},

		/** Handles clicks on the photo by showing/hiding the navigation */
		imgFullSize_click: function () {
			this.toggleNavigation(!this.navigationVisible);
		},

		/** Handles some keys. This is only bound to the document while a full photo is being displayed */
		document_keydown: function (e) {
			switch (e.key) {
				case "Escape":
					this.hidePhoto();
					break;
				case "ArrowLeft":
					this.changePhoto(-1);
					break;
				case "ArrowRight":
					this.changePhoto(1);
					break;
				case "Home":
					this.setPhotoIndex(0);
					break;
			}
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryPhotos);
			this.container.appendChild(this.control);
			this.control.querySelector('.lnkClose').addEventListener('click', this.lnkClose_click.bind(this));
			this.lnkDownload = this.control.querySelector('.lnkDownload');
			this.lnkOpenBlank = this.control.querySelector('.lnkOpenBlank');
			this.lnkDelete = this.control.querySelector('.lnkDelete');
			PiLot.Utils.Common.bindOrHideEditLink(this.lnkDelete, this.lnkDelete_click.bind(this));
			this.plhPhotos = this.container.querySelector('.plhPhotos');
			this.pnlPhotoScreen = this.container.querySelector('.pnlPhotoScreen');
			this.imgFullSize = this.container.querySelector('.imgFullSize');
			this.imgFullSize.addEventListener('load', this.image_load.bind(this));
			this.imgFullSize.addEventListener('click', this.imgFullSize_click.bind(this));
			this.container.querySelector('.lnkPrevious').addEventListener('click', this.lnkPrevious_click.bind(this));
			this.container.querySelector('.lnkNext').addEventListener('click', this.lnkNext_click.bind(this));
			this.lblFileName = this.control.querySelector('.lblFileName');
			this.lblPhotoIndex = this.control.querySelector('.lblPhotoIndex');
			this.lblPhotoTotal = this.control.querySelector('.lblPhotoTotal');
		},

		/**
		 * Loads and shows the photos for a certain date
		 * @param {RC.Date.DateOnly} pDate
		 */
		loadPhotosAsync: async function (pDate) {
			this.date = pDate;
			this.plhPhotos.clear();
			this.imageCollection = await PiLot.Model.Logbook.loadDailyImageCollectionAsync(this.date);
			this.showThumbnails();
		},
		
		/** Shows the photos based on the current imageCollection */
		showThumbnails: function(){
			this.plhPhotos.clear();
			this.toggleVisible(this.imageCollection.getImagesCount() > 0);
			this.imageCollection.getImageNames().forEach(function (anImage) {
				const onclick = this.thumbnail_click.bind(this, anImage);
				const thumbnail = new Thumbnail(this.plhPhotos, anImage, this.imageCollection, onclick);
			}.bind(this));
			this.lblPhotoTotal.innerText = this.imageCollection.getImagesCount();
		},

		/**
		 * Manually adds a photo to the collection. This is useful to avoid timing
		 * problems when uploading (the photo isn't actually saved when the upload
		 * promise resolves)
		 * @param {String} pFileName - the image file without any path prefix
		 */
		addPhoto: function(pFileName){
			this.imageCollection.addImageName(pFileName);
			this.showThumbnails();
		},

		/**
		 * Sends the delete request for a photo to the server, and removes it from
		 * the currently displayed collection (as reloading the collection might
		 * still bring the photo, not having completed the delete I/O Operation)
		 * @param {String} pFileName - The filename without any path prefix
		 */
		deletePhoto: function (pFileName) {
			PiLot.Model.Logbook.deletePhotoAsync(this.date, pFileName);
			this.imageCollection.removeImageName(pFileName);
			this.hidePhoto();
			this.showThumbnails();
		},

		/**
		 * Shows or hides the entire control. The control is automatically hidden
		 * if there are no images for the selected date.
		 * @param {Boolean} pVisible
		 */
		toggleVisible: function (pVisible) {
			this.control.hidden = !pVisible;
		},

		/**
		 * Opens a photo in full size view
		 * @param {String} pImageName - the image name, without any path prefix
		 */
		showPhoto: function (pImageName) {
			this.imageIndex = this.imageCollection.getImageNames().indexOf(pImageName);
			this.setPhotoUrl(pImageName);
			this.pnlPhotoScreen.hidden = false;
			this.showNavigation(4);
			this.lblFileName.innerText = pImageName;
			document.addEventListener('keydown', this.keyHandler);
		},

		/** Hides the full-size photo screen */
		hidePhoto: function () {
			document.removeEventListener('keydown', this.keyHandler);
			this.pnlPhotoScreen.hidden = true;
		},

		/**
		 * Shows the navigation for a few seconds, and makes sure it will be hidden automatically
		 * @param {Number} pForSeconds - The duration to show the navigation in seconds
		 */
		showNavigation: function (pForSeconds) {
			this.toggleNavigation(true);
			window.clearTimeout(this.hideNavTimeout);
			this.hideNavTimeout = window.setTimeout(this.toggleNavigation.bind(this, false), pForSeconds * 1000);
		},

		/**
		 * Shows or hides the navigation and kills the timeout that would automatically hide it.
		 * @param {any} pVisible
		 */
		toggleNavigation: function (pVisible) {
			this.navigationVisible = pVisible;
			this.pnlPhotoScreen.classList.toggle('fullscreen', !pVisible);
			window.clearTimeout(this.hideNavTimeout);
			this.hideNavTimeout = null;
		},

		/**
		 * Changes the photo shown in full size by changing its index
		 * @param {Number} pChangeBy
		 */
		changePhoto: function (pChangeBy) {
			const imageNames = this.imageCollection.getImageNames();
			this.setPhotoIndex((this.imageIndex + pChangeBy + imageNames.length) % imageNames.length);
		},

		/**
		 * Sets the photo shown in full size identified by its index in the collection
		 * @param {Number} pIndex
		 */
		setPhotoIndex: function (pIndex) {
			this.imageIndex = pIndex;
			this.setPhotoUrl(this.imageCollection.getImageNames()[this.imageIndex]);
		},

		/**
		 * Sets the url of the photo shown in full size, and sets the link urls for download and blank
		 * @param {String} pImageName - The image name, without any path prefix
		 */
		setPhotoUrl: function (pImageName) {
			this.imgFullSize.src = this.getPhotoUrl(pImageName);
			this.imgFullSize.hidden = true;
			this.lnkDownload.href = this.getOriginalImageUrl(pImageName);
			this.lnkOpenBlank.href = this.getOriginalImageUrl(pImageName);
			this.lblPhotoIndex.innerText = this.imageIndex + 1;
		},

		/** Requests the next photo of the collection from the server, so that it will be displayed quickly */
		preloadNextPhoto: function () {
			const imageNames = this.imageCollection.getImageNames();
			const imageUrl = this.getPhotoUrl(imageNames[(this.imageIndex + 1) % imageNames.length]);
			const image = new Image();
			image.src = imageUrl;
		},

		/**
		 * Calculates the url of the photo to show in full size based on the available space. Because I didn't
		 * really grasp the srcset thing.
		 * @param {String} pImageName - the image name, without any path prefix.
		 */
		getPhotoUrl: function (pImageName) {
			const imageSize = Math.max(this.pnlPhotoScreen.clientHeight, this.pnlPhotoScreen.clientWidth);
			const imageUrl = this.imageCollection.getFolderUrl(imageSize) + pImageName;
			return imageUrl;
		},

		/**
		 * Gets the url of an image in its original size
		 * @param {String} pImageName - the image name, without any path prefix.
		 */
		getOriginalImageUrl: function (pImageName) {
			return this.imageCollection.getRootUrl() + pImageName;
		}
	};

	/**
	 * Represents a single thumbnail image. 
	 * @param {HTMLElement} pContainer - the container where the images should be added
	 * @param {String} pImageName - the name of the image, without any path prefix
	 * @param {RC.ImageGallery.ImageCollection} pImageCollection - the image collection for the day
	 * @param {Function} pOnClick - the handler for the click on the image
	 */
	var Thumbnail = function (pContainer, pImageName, pImageCollection, pOnClick) {
		this.container = pContainer;					// HTMLElement
		this.imageName = pImageName;					// String (the original image name)
		this.imageCollection = pImageCollection;		// RC.ImageGallery.ImageCollection
		this.onclick = pOnClick;						// Function
		this.image = null;
		this.reloadInterval = null;
		this.initialize();
	};

	Thumbnail.prototype = {

		initialize: function () {
			this.draw();
		},

		/** If the thumbnail can not be loaded, it probably has not been generated, so we start a timer to re-check */
		image_error: function(pEvent){
			this.ensureReloadInterval();
		},

		/** If whe had an interval to re-load this thumbnail, we can now clear it */
		image_load: function(pEvent){
			if(this.reloadInterval){
				window.clearInterval(this.reloadInterval);
				this.reloadInterval = null;
			}
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryPhoto);
			this.container.appendChild(control);
			this.image = control.querySelector('.imgPhoto');
			const imageSize = Math.max(control.clientHeight, control.clientWidth);
			const imageUrl = this.imageCollection.getFolderUrl(imageSize) + this.imageName;
			this.image.src = imageUrl;
			this.image.addEventListener('click', this.onclick);
			this.image.addEventListener('load', this.image_load.bind(this));
			this.image.addEventListener('error', this.image_error.bind(this));
		},

		/** Starts on single interval to reload the image after a while */
		ensureReloadInterval: function(){
			if(!this.reloadInterval){
				this.reloadInterval = window.setInterval(this.reloadImage.bind(this), 5000);
			}
		},

		/** Tries to reload the image by just resetting the src */
		reloadImage: function(){
			this.image.src = this.image.src;
		}
	};

	/**
	 * A control to upload a photo into the diary
	 * @param {HTMLElement} pContainer - to container where the control will be added
	 * @param {PiLot.View.Logbook.LogbookPage} pLogbookPage - the logbook page, needed to get the current date
	 */
	var DiaryPhotoUpload = function (pContainer, pLogbookPage) {

		this.container = pContainer;
		this.logbookPage = pLogbookPage;
		this.control = null;
		this.filePreviewReader = null;
		this.fileDataReader = null;
		this.fileImageUpload = null;
		this.imgPreview = null;
		this.btnSend = null;
		this.pnlUploading = null;
		this.pnlUploadSuccess = null;
		this.pnlInvalidType = null;
		this.observers = null;			// observers used by RC.Utils observers pattern
		this.initialize();
	};

	DiaryPhotoUpload.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['upload']);
			this.filePreviewReader = new FileReader();
			this.filePreviewReader.onload = this.filePreviewReader_load.bind(this);
			this.fileDataReader = new FileReader();
			this.fileDataReader.onloadend = this.fileDataReader_loadend.bind(this)
			this.draw();
		},

		/**
		 * Registers an observer that will be called when pEvent happens.
		 * @param {String} pEvent - 'upload'
		 * @param {Function} pCallback - The method to call 
		 * */
		 on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		fileImageUpload_change: function (e) {
			if (this.fileImageUpload.files[0].type === 'image/jpeg') {
				this.pnlInvalidType.hidden = true;
				this.filePreviewReader.readAsDataURL(this.fileImageUpload.files[0]);
				this.imgPreview.src = '';
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
			await PiLot.Model.Logbook.uploadPhotoAsync(this.logbookPage.getDate(), file.name, this.fileDataReader.result);
			RC.Utils.notifyObservers(this, this.observers, 'upload', file.name);
			this.imgPreview.hidden = true;
			this.pnlUploading.hidden = true;
			this.pnlUploadSuccess.hidden = false;
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryPhotoUpload);
			this.container.appendChild(this.control);
			this.fileImageUpload = this.control.querySelector('.fileImageUpload');
			this.fileImageUpload.addEventListener('change', this.fileImageUpload_change.bind(this));
			this.imgPreview = this.control.querySelector('.imgPreview');
			this.btnSend = this.control.querySelector('.btnSend');
			this.btnSend.addEventListener('click', this.btnSend_click.bind(this));
			this.pnlUploading = this.control.querySelector('.pnlUploading');
			this.pnlUploadSuccess = this.control.querySelector('.pnlUploadSuccess');
			this.pnlInvalidType = this.control.querySelector('.pnlInvalidType');
		},

		/** 
		 * Shows or hides the entire control. When showing, resets the state
		 * by hiding some controls
		 * @param {Boolean} pVisible
		 * */
		toggleVisible: function(pVisible){
			this.control.hidden = !pVisible;
			if (pVisible) {
				this.imgPreview.hidden = true;
				this.pnlUploading.hidden = true;
				this.pnlUploadSuccess.hidden = true;
				this.fileImageUpload.value = "";
			}
		}
	};

	/**
	 * The publish page lists the track, diary, logbook and photos for a day
	 * and allows all this data to be published to a remote system. The current
	 * data on the remote system is displayed side-by-side with the local data.
	 * */
	var PublishDiaryPage = function () {
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

	PublishDiaryPage.prototype = {

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
			let x = PublishDiaryPage.MAXIMAGESIZE;
			let loader = PiLot.Utils.Loader;
			PiLot.View.Common.setCurrentMainMenuPage(loader.pages.logbook.logbook);
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.publishDiaryPage);
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
			this.showThumbnails(dailyPhotos, this.divLocalPhotos, this.lblLocalPhotosCount, true);
		},

		/** loads the target data to show in the publish form ("right side") */
		loadTargetDataAsync: async function () {
			this.icoWait.hidden = false;
			this.showTrackAsync(null, this.targetTrackMap, this.targetTrack, this.lblTargetPositionsCount);
			this.showLogbook(null, this.divTargetDiaryText, this.lblTargetDiaryLength, this.divTargetLogbookEntries, this.lblTargetLogbookEntriesCount)
			this.showThumbnails(null, this.divTargetPhotos, this.lblTargetPhotosCount, false);
			this.targetData = await PiLot.Model.Logbook.loadDailyDataAsync(this.targetName, this.date);
			if (this.targetData.success) {
				this.showTrackAsync(this.targetData.data.track, this.targetTrackMap, this.targetTrack, this.lblTargetPositionsCount);
				this.showLogbook(this.targetData.data.logbookDay, this.divTargetDiaryText, this.lblTargetDiaryLength, this.divTargetLogbookEntries, this.lblTargetLogbookEntriesCount)
				this.showThumbnails(this.targetData.data.photoInfos, this.divTargetPhotos, this.lblTargetPhotosCount, false);
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

		showThumbnails: function (pPhotoInfos, pContainer, pPhotosCountControl, pShowCheckboxes) {
			pContainer.clear();
			if (pPhotoInfos) {
				let thumbnailFolder = pPhotoInfos.getFolderUrl(PublishDiaryPage.THUMBNAILSIZE);
				pPhotosCountControl.innerText = pPhotoInfos.getImagesCount();
				const idPrefix = pContainer.id || (Math.random() * 10 ^ 6).toFixed(0);
				pPhotoInfos.getImageNames().forEach(function (pPhoto) {
					const imageContainer = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.publishPagePhoto);
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

	PublishDiaryPage.THUMBNAILSIZE = 128; // aww... class constants, anyone?

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
		DiaryPage: DiaryPage,
		PublishDiaryPage: PublishDiaryPage,
		DiaryCalendar: DiaryCalendar
	};

})();