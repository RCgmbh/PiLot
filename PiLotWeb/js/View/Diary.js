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
		this.logbookEntriesControl = null;				// PiLot.View.Logbook.LogbookEntries control which will be added on the fly
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
		this.plhPhotos = null;							// the placeholder where we will add the photo gallery
		this.imageGallery = null;						// RC.Controls.ImageGallery.Gallery for the daily photos
		this.plhImageUpload = null;						// placeholder where the image upload component will be added
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

		/** change handler for the diary field, assigns the text and saves the changes. */
		tbDiary_change: function () {
			this.logbookDay.setDiaryText(this.tbDiary.value);
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

		lnkEdit_click: function () {
			// todo
		},

		/** draws the page and finds the controls and binds handlers */
		draw: function () {
			const diaryControl = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryPage);
			PiLot.Utils.Loader.getContentArea().appendChild(diaryControl);
			this.lblFriendlyDate = diaryControl.querySelector('.lblFriendlyDate');
			const divCalendar = diaryControl.querySelector('.logbookCalendar');
			const calendarLink = diaryControl.querySelector('.lblCalendarLink');
			const calendarDate = diaryControl.querySelector('.lblCalendarDate');
			const locale = PiLot.Utils.Language.getLocale();
			this.calendar = new RC.Controls.Calendar(divCalendar, calendarDate, calendarLink, this.calendar_dateSelected.bind(this), this.currentBoatTime.getUtcOffsetMinutes(), locale);
			new PiLot.View.Logbook.DiaryCalendar(this.calendar, this.diaryInfoCache);
			this.lnkPreviousDay = diaryControl.querySelector('.lnkPreviousDay');
			this.lnkNextDay = diaryControl.querySelector('.lnkNextDay');
			const options = { isReadOnly: true, sortDescending: false, autoFillNewItems: false };
			this.logbookEntriesControl = new PiLot.View.Logbook.LogbookEntries(diaryControl, this.currentBoatTime, options);
			this.pnlDiary = diaryControl.querySelector('.pnlDiary');
			this.tbDiary = diaryControl.querySelector('.tbDiary');
			this.tbDiary.addEventListener('change', this.tbDiary_change.bind(this));
			diaryControl.querySelector('.lnkBiggerText').addEventListener('click', this.lnkBiggerText_click.bind(this));
			diaryControl.querySelector('.lnkSmallerText').addEventListener('click', this.lnkSmallerText_click.bind(this));
			this.lblDiary = diaryControl.querySelector('.lblDiary');
			this.applyDiaryFontSize();
			this.plhDistance = diaryControl.querySelector('.plhDistance');
			this.lblDistanceKm = this.plhDistance.querySelector('.lblDistanceKm');
			this.lblDistanceNm = this.plhDistance.querySelector('.lblDistanceNm');
			this.map = new PiLot.View.Map.Seamap(diaryControl.querySelector('.plhMap'), { persistMapState: false });
			this.pnlSpeedDiagram = diaryControl.querySelector('.pnlSpeedDiagram');
			this.plhPhotos = diaryControl.querySelector('.plhPhotos');
			this.plhImageUpload = diaryControl.querySelector('.plhImageUpload');
			const lnkEdit = diaryControl.querySelector('.lnkEdit');
			RC.Utils.showHide(lnkEdit, PiLot.Model.Common.Permissions.canWrite());
			lnkEdit.addEventListener('click', this.lnkEdit_click.bind(this));
			this.lnkEditTrack = diaryControl.querySelector('.lnkEditTrack');
			RC.Utils.showHide(this.lnkEditTrack, PiLot.Model.Common.Permissions.canWrite());
			this.lnkPublish = diaryControl.querySelector('.lnkPublish');
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
			const settingValue = PiLot.Utils.Common.loadUserSetting('PiLot.View.Logbook.Diary.currentDate');
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
			this.showData();
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

		/**
		 * If we have a photos panel, this tries to load photos for the day,
		 * and creates an image gallery with the photos shows them in the image gallery
		 */
		loadPhotosAsync: async function () {
			/*let imageCollection = await PiLot.Model.Logbook.loadDailyImageCollectionAsync(this.logbookDay.getDay());
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
			}*/
		},

		/** shows the logbook data for the current LogbookDay */
		showData: function () {
			this.showFriendlyDate();
			this.showDiaryText();
			this.logbookEntriesControl.showLogbookDay(this.logbookDay);
			this.loadTrackAsync();
			this.loadPhotosAsync();
		},

		/** shows the currently selected date in friendly form */
		showFriendlyDate: function () {
			const locale = PiLot.Utils.Language.getLocale();
			this.lblFriendlyDate.innerText = this.date.toLuxon().setLocale(locale).toLocaleString({ weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
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
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Logbook.Diary.fontSize', this.diaryFontSize);
			this.applyDiaryFontSize();
		},

		/**
		 * applies the current font size to the diary panel, by directly setting the fontSize style to 
		 * to a certain em value.
		 * */
		applyDiaryFontSize: function () {
			if (this.diaryFontSize === null) {
				this.diaryFontSize = PiLot.Utils.Common.loadUserSetting('PiLot.View.Logbook.Diary.fontSize');
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
			this.setLogbookPhotosDate();
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
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Logbook.Diary.currentDate', settingsValue)
		},

		/** makes sure we have a LogbookDay, creates one if necessary */
		/*ensureLogbookDay: function () {
			if (this.logbookDay === null) {
				this.logbookDay = new PiLot.Logbook.Model.LogbookDay();
			}
		},*/

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
			const diaryText = this.logbookDay.getDiaryText(); //(this.logbookDay !== null ? this.logbookDay.getDiaryText() : '');
			if (diaryText !== '') {
				RC.Utils.showHide(this.lblDiary, true);
			}
			this.lblDiary.innerText = diaryText;
		},

		/**
		 * reads the value from the diary textfield, assigns it to the current LogbookDay and saves the day back to the server
		 * */
		saveDiaryText: function () {
			//this.ensureLogbookDay();
			this.logbookDay.setDiaryText(this.tbDiary.value);
			this.logbookDay.saveDiaryTextAsync();
		},

		/** Sets the current date to the LogbookPhotos, if we have one */
		setLogbookPhotosDate: function () {
			/*if (this.logbookPhotos !== null) {
				this.logbookPhotos.setDate(this.date);
			}*/
		}
	};

	/**
	 * A control to upload a photo into the diary
	 * @param {HTMLElement} pContainer - to container where the control will be added
	 * @param {PiLot.View.Logbook.LogbookPage} pLogbookPage - the logbook page, needed to get the current date
	 */
	var DiaryImageUpload = function (pContainer, pLogbookPage) {

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

	DiaryImageUpload.prototype = {

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
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.diaryImageUpload);
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

	var LogbookPhoto = function (pContainer, pImageName, pImageCollection) {
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
			let x = PublishLogbookPage.MAXIMAGESIZE;
			let loader = PiLot.Utils.Loader;
			PiLot.View.Common.setCurrentMainMenuPage(loader.pages.logbook.logbook);
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Logbook.publishDiaryPage);
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
				let thumbnailFolder = pPhotoInfos.getFolderUrl(PublishDiaryPage.THUMBNAILSIZE);
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