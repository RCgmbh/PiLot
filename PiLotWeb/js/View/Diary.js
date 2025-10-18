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
		this.currentBoatTime = null;					// PiLot.Model.Common.BoatTime
		this.logbookDay = null;							// PiLot.Model.Logbook.LogbookDay
		this.date = null;								// RC.Date.DateOnly
		this.diaryInfoCache = null;						// PiLot.Model.Logbook.DiaryInfoCache
		this.lblFriendlyDate = null;
		this.icoLoading = null;
		this.calendar = null;							// PiLot.View.Logbook.DiaryCalendar
		this.lnkPreviousDay = null;
		this.lnkNextDay = null;
		this.diaryText = null;							// PiLot.View.Diary.DiaryText
		this.diaryLogbook = null;						// PiLot.View.Diary.DiaryLogbook
		this.diaryPhotos = null;						// PiLot.View.Diary.DiaryPhotos
		this.pnlContext = null;
		this.diaryTracksData = null;					// PiLot.View.Diary.DiaryTracksData
		this.lnkTop = null;								
		this.lnkPublish = null;
		this.initialize();
	}

	DiaryPage.prototype = {

		initialize: async function () {
			this.currentBoatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.diaryInfoCache = new PiLot.Model.Logbook.DiaryInfoCache();
			this.draw();
			this.applyPermissions();
			this.initializeDate();
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			authHelper.on('logout', this.authHelper_change.bind(this));
		},

		authHelper_change: function () {
			this.applyPermissions();
		},

		document_scrollEnd: function () {
			this.showTopLink();
		},

		calendar_dateSelected: function () {
			let date = RC.Date.DateOnly.fromObject(this.calendar.date());
			this.setDate(date);
		},

		diaryText_expandCollapse: function(){
			this.showTopLink();
		},

		diaryPhotos_expandCollapse: function(){
			this.showTopLink();
		},

		diaryTracksData_expandCollapse: function(){
			this.showTopLink();
		},

		draw: function () {
			document.addEventListener('scrollend', this.document_scrollEnd.bind(this));
			document.addEventListener('touchend', this.document_scrollEnd.bind(this));
			const diaryPage = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryPage);
			PiLot.Utils.Loader.getContentArea().appendChild(diaryPage);
			this.lblFriendlyDate = diaryPage.querySelector('.lblFriendlyDate');
			this.icoLoading = diaryPage.querySelector('.icoLoading');
			const divCalendar = diaryPage.querySelector('.logbookCalendar');
			const calendarLink = diaryPage.querySelector('.lblCalendarLink');
			const calendarDate = diaryPage.querySelector('.lblCalendarDate');
			const locale = PiLot.Utils.Language.getLanguage();
			this.calendar = new RC.Controls.Calendar(divCalendar, calendarDate, calendarLink, this.calendar_dateSelected.bind(this), this.currentBoatTime.getUtcOffsetMinutes(), locale);
			new PiLot.View.Diary.DiaryCalendar(this.calendar, this.diaryInfoCache);
			this.lnkPreviousDay = diaryPage.querySelector('.lnkPreviousDay');
			this.lnkNextDay = diaryPage.querySelector('.lnkNextDay');
			const mainContent = diaryPage.querySelector('.plhMainContent');
			this.diaryText = new DiaryText(mainContent);
			this.diaryText.on('expand', this.diaryText_expandCollapse.bind(this));
			this.diaryText.on('collapse', this.diaryText_expandCollapse.bind(this));
			this.diaryLogbook = new DiaryLogbook(mainContent, this.currentBoatTime);
			this.diaryPhotos = new DiaryPhotos(mainContent, this);
			this.diaryPhotos.on('expand', this.diaryPhotos_expandCollapse.bind(this));
			this.diaryPhotos.on('collapse', this.diaryPhotos_expandCollapse.bind(this));
			this.pnlContext = diaryPage.querySelector('.pnlContext');
			this.diaryTracksData = new DiaryTracksData(this.pnlContext, this);
			this.diaryTracksData.on('expand', this.diaryTracksData_expandCollapse.bind(this));
			this.diaryTracksData.on('collapse', this.diaryTracksData_expandCollapse.bind(this));
			this.lnkTop = diaryPage.querySelector('.lnkTop');
			this.lnkPublish = diaryPage.querySelector('.lnkPublish');
		},

		applyPermissions: function(){
			this.lnkPublish.hidden = !PiLot.Permissions.hasSystemAccess();
		},

		maximizeContextColumn: function () {
			this.pnlContext.classList.toggle('expanded', true);
			this.showTopLink();
		},

		resetContextColumn: function () {
			this.pnlContext.classList.toggle('expanded', false);
			this.showTopLink();
		},

		initializeDate: function () {
			let updateHistory = true;
			let date = PiLot.Utils.Common.parseQsDate(this.currentBoatTime);
			if (date === null) {
				date = this.loadDateFromSetting();
			} else {
				updateHistory = false;
			}
			if (date === null) {
				date = RC.Date.DateOnly.fromObject(this.currentBoatTime.now());
			}
			this.setDate(date, updateHistory);
		},

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

		bindLnkPublish: function () {
			this.lnkPublish.href = PiLot.Utils.Common.setQsDate(PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.publish), this.date)
		},

		loadLogbookDayAsync: async function () {
			this.icoLoading.hidden = false;
			this.logbookDay = await PiLot.Model.Logbook.loadLogbookDayAsync(this.date);
			if (this.logbookDay === null){
				this.logbookDay = new PiLot.Model.Logbook.LogbookDay(this.date);
			}
			await Promise.all([
				this.diaryTracksData.showDataAsync(this.date),
				this.diaryText.showData(this.logbookDay),
				this.diaryLogbook.showData(this.logbookDay)
			]);
			this.icoLoading.hidden = true;
			this.diaryPhotos.showDataAsync(this.date);	
		},

		showTopLink: function () {
			this.lnkTop.hidden = (document.body.scrollHeight <= window.innerHeight) || (window.scrollY <= 0);
		},

		/** @param {Number} pDays */
		changeDay: function (pDays) {
			this.setDate(this.date.addDays(pDays));
		},

		/**
		 * @param {RC.Date.DateOnly} pDate
		 * @param {Boolean} pUpdateHistory - set false to not add an entry with d=date to the history
		 * */
		setDate: function (pDate, pUpdateHistory = true) {
			this.date = pDate;
			this.calendar.date(this.date.toLuxon().setLocale(PiLot.Utils.Language.getLanguage()));
			this.calendar.showDate();
			this.showFriendlyDate();
			this.bindPreviousNextButtons();
			this.bindLnkPublish();
			this.saveDate();
			if (pUpdateHistory) {
				const url = PiLot.Utils.Common.setQsDate(window.location, this.date);
				window.history.pushState({}, '', url);
			}
			this.loadLogbookDayAsync();
		},

		showFriendlyDate: function () {
			const locale = PiLot.Utils.Language.getLanguage();
			this.lblFriendlyDate.innerText = this.date.toLuxon().setLocale(locale).toLocaleString({ weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
		},

		getDate: function () {
			return this.date;
		},

		saveDate: function () {
			let settingsValue = null;
			if (!this.date.contains(this.currentBoatTime.now())) {
				settingsValue = this.date;
			}
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Diary.currentDate', settingsValue)
		}
	};

	/**
	 * Control showing the diary text and allowing to edit it
	 * */
	var DiaryText = function (pContainer) {
		this.container = pContainer;
		this.logbookDay = null;
		this.control = null;
		this.lnkEditDiary = null;
		this.pnlShowDiary = null;
		this.pnlEditDiary = null;
		this.lblDiary = null;
		this.pnlNoData = null;
		this.tbDiary = null;
		this.diaryFontSize = null;						// the index of [0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5] for the current diary text size
		this.observers = null;
		this.initialize();
	}

	DiaryText.diaryFontSizes = [0.75, 0.875, 1, 1.125, 1.25, 1.375, 1.5];

	DiaryText.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['expand', 'collapse']);
			this.draw();
			this.applyPermissions();
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			authHelper.on('logout', this.authHelper_change.bind(this));
		},

		/**
		 * @param {String} pEvent - "expand", "collapse"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		authHelper_change: function () {
			this.applyPermissions();
		},

		lnkBiggerText_click: function (pSender) {
			pSender.preventDefault();
			this.changeDiaryFontSize(1);
		},

		lnkSmallerText_click: function (pSender) {
			pSender.preventDefault();
			this.changeDiaryFontSize(-1);
		},

		lnkEditDiary_click: function (pEvent) {
			pEvent.preventDefault();
			this.toggleEditDiary();
		},

		expandCollapseBox_expand: function () {
			RC.Utils.notifyObservers(this, this.observers, 'expand', null);
		},

		expandCollapseBox_collapse: function () {
			RC.Utils.notifyObservers(this, this.observers, 'collapse', null);
		},

		tbDiary_change: async function () {
			this.logbookDay.setDiaryText(this.tbDiary.value);
			await this.logbookDay.saveDiaryTextAsync();
			this.showDiaryText();
			this.checkHasData();
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryText);
			this.container.appendChild(this.control);
			this.lnkEditDiary = this.control.querySelector('.lnkEditDiary');
			this.lnkEditDiary.addEventListener('click', this.lnkEditDiary_click.bind(this));
			const expandCollapseBox = new PiLot.View.Common.ExpandCollapseBox(
				this.control.querySelector('.pnlDiary'),
				this.control.querySelector('.lnkExpandDiary'),
				this.control.querySelector('.lnkCollapseDiary'),
				'PiLot.View.Diary.diaryBoxExpanded'
			);
			expandCollapseBox.on('expand', this.expandCollapseBox_expand.bind(this));
			expandCollapseBox.on('collapse', this.expandCollapseBox_collapse.bind(this));
			this.control.querySelector('.lnkBiggerText').addEventListener('click', this.lnkBiggerText_click.bind(this));
			this.control.querySelector('.lnkSmallerText').addEventListener('click', this.lnkSmallerText_click.bind(this));
			this.pnlShowDiary = this.control.querySelector('.pnlShowDiary');
			this.lblDiary = this.control.querySelector('.lblDiary');
			this.pnlNoData = this.control.querySelector('.pnlNoData');
			this.pnlEditDiary = this.control.querySelector('.pnlEditDiary');
			this.tbDiary = this.control.querySelector('.tbDiary');
			this.tbDiary.addEventListener('change', this.tbDiary_change.bind(this));
			this.applyDiaryFontSize();
		},

		applyPermissions: function () {
			this.lnkEditDiary.hidden = !PiLot.Permissions.canWrite();
		},

		showData: function (pLogbookDay) {
			this.logbookDay = pLogbookDay;
			this.checkHasData();
			this.tbDiary.value = this.logbookDay.getDiaryText();
			this.showDiaryText();
		},

		checkHasData: function () {
			this.showHasData(this.logbookDay.getDiaryText().length > 0);
		},
		
		showHasData: function (pHasData) {
			this.control.classList.toggle('empty', !pHasData);
			this.pnlNoData.hidden = pHasData;
		},

		showDiaryText: function(){
			const diaryText = this.logbookDay.getDiaryText();
			this.lblDiary.innerText = diaryText;
			this.lblDiary.hidden = diaryText.length == 0;
		},

		saveDiaryText: function () {
			this.logbookDay.setDiaryText(this.tbDiary.value);
			this.logbookDay.saveDiaryTextAsync();
		},

		/** @param {number} pChangeBy, usually -1 or 1 */
		changeDiaryFontSize: function (pChangeBy) {
			this.diaryFontSize = Math.max(Math.min(DiaryText.diaryFontSizes.length - 1, this.diaryFontSize + pChangeBy), 0);
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Diary.fontSize', this.diaryFontSize);
			this.applyDiaryFontSize();
		},

		applyDiaryFontSize: function () {
			if (this.diaryFontSize === null) {
				this.diaryFontSize = PiLot.Utils.Common.loadUserSetting('PiLot.View.Diary.fontSize');
				if (this.diaryFontSize === null) {
					this.diaryFontSize = DiaryText.diaryFontSizes.indexOf(1);
				}
			}
			this.lblDiary.style.fontSize = DiaryText.diaryFontSizes[this.diaryFontSize] + 'em';
			this.tbDiary.style.fontSize = DiaryText.diaryFontSizes[this.diaryFontSize] + 'em';
		},

		toggleEditDiary: function () {
			this.pnlEditDiary.hidden = !this.pnlEditDiary.hidden;
			this.pnlShowDiary.hidden = !this.pnlShowDiary.hidden;
		}
	};

	/** 
	 * Control containing the logbook and link to add logbook items
	 * in a collapsable box.
	 * */
	var DiaryLogbook = function (pContainer, pCurrentBoatTime) {
		this.container = pContainer;
		this.control = null;
		this.currentBoatTime = pCurrentBoatTime;
		this.logbookDay = null;
		this.editForm = null;							// PiLot.View.Logbook.LogbokEntryForm
		this.lnkEditLogbook = null;
		this.logbookEntriesControl = null;				// PiLot.View.Logbook.LogbookEntries
		this.pnlNoData = null;
		this.lnkAddLogbookEntry = null;
		this.readOnly = true;
		this.observers = null;
		this.initialize();
	}

	DiaryLogbook.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['expand', 'collapse']);
			this.draw();
			this.applyPermissions();
			this.toggleEditLogbook(true);
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			authHelper.on('logout', this.authHelper_change.bind(this));
		},

		/**
		 * @param {String} pEvent - "expand", "collapse"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		authHelper_change: function () {
			this.applyPermissions();
		},
	
		lnkEditLogbook_click: function (pEvent) {
			pEvent.preventDefault();
			this.toggleEditLogbook();
		},

		expandCollapseBox_expand: function () {
			RC.Utils.notifyObservers(this, this.observers, 'expand', null);
		},

		expandCollapseBox_collapse: function () {
			RC.Utils.notifyObservers(this, this.observers, 'collapse', null);
		},

		lnkAddLogbookEntry_click: function (pEvent) {
			pEvent.preventDefault();
			const latestBoatSetup = this.logbookDay.getLatestBoatSetup();
			this.editForm.showEmptyFormAsync(this.logbookDay, latestBoatSetup);
		},

		editForm_save: function(){
			this.checkHasData();
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryLogbook);
			this.container.appendChild(this.control);
			this.editForm = new PiLot.View.Logbook.LogbookEntryForm(null);
			this.editForm.on('save', this.editForm_save.bind(this));
			this.lnkEditLogbook = this.control.querySelector('.lnkEditLogbook');
			this.lnkEditLogbook.addEventListener('click', this.lnkEditLogbook_click.bind(this));
			const expandCollapseBox = new PiLot.View.Common.ExpandCollapseBox(
				this.control.querySelector('.pnlLogbook'),
				this.control.querySelector('.lnkExpandLogbook'),
				this.control.querySelector('.lnkCollapseLogbook'),				
				'PiLot.View.Diary.logbookBoxExpanded'
			);
			expandCollapseBox.on('expand', this.expandCollapseBox_expand.bind(this));
			expandCollapseBox.on('collapse', this.expandCollapseBox_collapse.bind(this));
			const options = { isReadOnly: this.readOnly, sortDescending: false, autoFillNewItems: false };
			this.logbookEntriesControl = new PiLot.View.Logbook.LogbookEntries(this.control.querySelector('.plhLogbookEntries'), this.editForm, this.currentBoatTime, options);
			this.pnlNoData = this.control.querySelector('.pnlNoData');
			this.lnkAddLogbookEntry = this.control.querySelector('.lnkAddLogbookEntry');
			this.lnkAddLogbookEntry.addEventListener('click', this.lnkAddLogbookEntry_click.bind(this));
		},

		applyPermissions: function () {
			this.lnkEditLogbook.hidden = !PiLot.Permissions.canWrite();
		},

		checkHasData: function () {
			this.showHasData(this.logbookDay.hasEntries());
		},
		
		showHasData: function (pHasData) {
			this.control.classList.toggle('empty', !pHasData);
			this.pnlNoData.hidden = pHasData;
		},

		toggleEditLogbook: function(pReadOnly){
			if(pReadOnly === undefined){
				this.readOnly = !this.readOnly;
			} else{
				this.readOnly = pReadOnly;
			}
			this.logbookEntriesControl.toggleReadOnly(this.readOnly);
			this.lnkAddLogbookEntry.hidden = this.readOnly;
		},

		setLoading: function () { },

		showData: function (pLogbookDay) {
			this.logbookDay = pLogbookDay;
			this.checkHasData();
			this.logbookEntriesControl.showLogbookDay(this.logbookDay);
			this.pnlNoData.hidden = this.logbookDay.hasEntries();
		}
	};

	/** 
	 * Control containing photos for a day and the upload function in a collapsable box 
	 * @param {HTMLElement} pContainer
	 * @param {PiLot.View.Diary.DiaryPage} pDiaryPage
	 * */
	var DiaryPhotos = function (pContainer, pDiaryPage) {
		this.container = pContainer;
		this.diaryPage = pDiaryPage;
		this.control = null;
		this.lnkEditPhotos = null;
		this.pnlNoData = null;
		this.photoGallery = null;						// PiLot.View.Diary.DiaryPhotoGallery
		this.photoUpload = null;						// PiLot.View.Diary.DiaryPhotoUpload
		this.observers = null;
		this.initialize();
	}

	DiaryPhotos.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['expand', 'collapse']);
			this.draw();
			this.applyPermissions()
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			authHelper.on('logout', this.authHelper_change.bind(this));
		},

		/**
		 * @param {String} pEvent - "expand", "collapse"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},		
	
		lnkEditPhotos_click: function (pEvent) {
			pEvent.preventDefault();
			this.toggleEditPhotos();
		},

		expandCollapseBox_expand: function () {
			RC.Utils.notifyObservers(this, this.observers, 'expand', null);
		},

		expandCollapseBox_collapse: function () {
			RC.Utils.notifyObservers(this, this.observers, 'collapse', null);
		},

		photoUpload_upload: function(pSender, pArg){
			this.photoGallery.ensureAutoUpdate();
			this.showHasData(true);
		},

		photoGallery_delete: function(pSender, pArg){
			this.checkHasData();
		},

		authHelper_change: function () {
			this.applyPermissions();
		},

		draw: function () { 
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryPhotos);
			this.container.appendChild(this.control);
			this.lnkEditPhotos = this.control.querySelector('.lnkEditPhotos');
			this.lnkEditPhotos.addEventListener('click', this.lnkEditPhotos_click.bind(this));
			const expandCollapseBox = new PiLot.View.Common.ExpandCollapseBox(
				this.control.querySelector('.pnlPhotos'),
				this.control.querySelector('.lnkExpandPhotos'),
				this.control.querySelector('.lnkCollapsePhotos'),				
				'PiLot.View.Diary.photosBoxExpanded'
			);
			expandCollapseBox.on('expand', this.expandCollapseBox_expand.bind(this));
			expandCollapseBox.on('collapse', this.expandCollapseBox_collapse.bind(this));
			this.pnlNoData = this.control.querySelector('.pnlNoData');
			const plhPhotoUpload = this.control.querySelector('.plhPhotoUpload');
			this.photoUpload = new DiaryPhotoUpload(plhPhotoUpload, this.diaryPage);
			this.photoUpload.on('upload', this.photoUpload_upload.bind(this));
			this.photoUpload.toggleVisible(false);
			this.photoGallery = new DiaryPhotoGallery(this.control.querySelector('.plhPhotoGallery'));
			this.photoGallery.on('delete', this.photoGallery_delete.bind(this));
		},

		applyPermissions: function () {
			const canWrite = PiLot.Permissions.canWrite();
			this.lnkEditPhotos.hidden = !canWrite;
			!canWrite && this.toggleEditPhotos(false);
		},

		checkHasData: function () {
			this.showHasData(this.photoGallery.hasPhotos());
		},
		
		showHasData: function (pHasData) {
			this.control.classList.toggle('empty', !pHasData);
			this.pnlNoData.hidden = pHasData;
		},

		toggleEditPhotos: function(pVisible){
			this.photoUpload.toggleVisible(pVisible);
		},

		showDataAsync: async function (pDate) { 
			await this.photoGallery.showPhotosAsync(pDate);
			this.checkHasData();
		}
	};

	/**
	 * Control containing map, speed diagram and track statistics for a day 
	 * @param {HTMLElement} pContainer
	 * @param {DiaryPage} pDiaryPage - Needed to maximize/minimize the context column
	 * */
	var DiaryTracksData = function (pContainer, pDiaryPage) {
		this.container = pContainer;
		this.diaryPage = pDiaryPage;
		this.tracks = null;
		this.pnlMapBox = null;
		this.lnkEnlargeMap = null;
		this.lnkMinimizeMap = null;
		this.lnkCollapseMap = null;
		this.lnkExpandMap = null;
		this.map = null;								// PiLot.View.Nav.Seamap
		this.mapTrack = null;							// PiLot.View.Map.MapTrack
		this.pnlTracksBox = null;
		this.lnkEditTrack = null;
		this.lnkCollapseTracks = null;
		this.lnkExpandTracks = null;
		this.tracksList = null;							// PiLot.View.Nav.TracksList
		this.plhSpeedDiagram = null;
		this.trackStatistics = null;					// PiLot.View.Nav.TrackStatistics
		this.pnlAnalyzeTrack = null;
		this.lnkAnalyzeTrack = null;
		this.plhNoData = null;
		this.observers = null;
		this.initialize();
	}

	DiaryTracksData.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['expand', 'collapse']);
			this.track = null;
			this.draw();
			this.applyPermissions();
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			authHelper.on('logout', this.authHelper_change.bind(this));
		},

		/**
		 * @param {String} pEvent - "expand", "collapse"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		authHelper_change: function () {
			this.applyPermissions();
		},

		expandCollapseMapBox_expand: function () {
			RC.Utils.notifyObservers(this, this.observers, 'expand', null);
			this.invalidateMap();
		},

		expandCollapseMapBox_collapse: function () {
			RC.Utils.notifyObservers(this, this.observers, 'collapse', null);
		},

		lnkEnlargeMap_click: function (pEvent) {
			pEvent.preventDefault();
			this.enlargeMinimizeMap(true);
		},

		lnkMinimizeMap_click: function (pEvent) {
			pEvent.preventDefault();
			this.enlargeMinimizeMap(false);
		},

		expandCollapseTracksBox_expand: function () {
			RC.Utils.notifyObservers(this, this.observers, 'expand', null);
		},

		expandCollapseTracksBox_collapse: function () {
			RC.Utils.notifyObservers(this, this.observers, 'collapse', null);
		},

		tracksList_trackSelected: function (pSender, pTrack) {
			this.track = pTrack;
			this.showSpeedDiagram();
			this.showTrackStatistics();
			this.showAnalyzeTrackLink();
		},

		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryTrackData);
			this.container.appendChild(control);
			this.pnlMapBox = this.container.querySelector('.pnlMapBox');
			this.lnkEditTrack = control.querySelector('.lnkEditTrack');
			this.lnkEnlargeMap = control.querySelector('.lnkEnlargeMap');
			this.lnkEnlargeMap.addEventListener('click', this.lnkEnlargeMap_click.bind(this));
			this.lnkMinimizeMap = control.querySelector('.lnkMinimizeMap');
			this.lnkMinimizeMap.addEventListener('click', this.lnkMinimizeMap_click.bind(this));
			const expandCollapseMapBox = new PiLot.View.Common.ExpandCollapseBox(
				control.querySelector('.pnlMap'),
				control.querySelector('.lnkExpandMap'),
				control.querySelector('.lnkCollapseMap'),
				'PiLot.View.Diary.mapBoxExpanded'
			);
			expandCollapseMapBox.on('expand', this.expandCollapseMapBox_expand.bind(this));
			expandCollapseMapBox.on('collapse', this.expandCollapseMapBox_collapse.bind(this));
			this.map = new PiLot.View.Map.Seamap(control.querySelector('.plhMap'), { persistMapState: false });
			this.pnlTracksBox = this.container.querySelector('.pnlTracksBox');
			const expandCollapseTracksBox = new PiLot.View.Common.ExpandCollapseBox(
				control.querySelector('.pnlTracks'),
				control.querySelector('.lnkExpandTracks'),
				control.querySelector('.lnkCollapseTracks'),
				'PiLot.View.Diary.tracksBoxExpanded'
			);
			expandCollapseTracksBox.on('expand', this.expandCollapseTracksBox_expand.bind(this));
			expandCollapseTracksBox.on('collapse', this.expandCollapseTracksBox_collapse.bind(this));
			this.tracksList = new PiLot.View.Nav.TracksList(control.querySelector('.plhTracks'));
			this.tracksList.on('trackSelected', this.tracksList_trackSelected.bind(this));
			this.plhSpeedDiagram = control.querySelector('.plhSpeedDiagram');
			this.trackStatistics = new PiLot.View.Nav.TrackStatistics(control.querySelector('.plhTrackStatistics'));
			this.pnlAnalyzeTrack = control.querySelector('.pnlAnalyzeTrack');
			this.lnkAnalyzeTrack = control.querySelector('.lnkAnalyzeTrack');
			this.pnlNoData = control.querySelector('.pnlNoData');
		},

		applyPermissions: function () {
			this.lnkEditTrack.hidden = !PiLot.Permissions.canWrite();
			this.pnlAnalyzeTrack.hidden = !PiLot.Permissions.canWrite() || this.track === null;
		},

		applyMapBoxEmptyStyle: function () {
			this.pnlMapBox.classList.toggle('empty', !this.tracks || !this.tracks.length);
		},

		applyTracksBoxEmptyStyle: function () {
			this.pnlTracksBox.classList.toggle('empty', !this.tracks || !this.tracks.length);
		},

		showDataAsync: async function (pDate) {
			this.lnkEditTrack.href = PiLot.Utils.Common.setQsDate(PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.data), pDate)
			await this.loadTracksAsync(pDate);
		},

		enlargeMinimizeMap: function (pEnlarge) {
			if (pEnlarge) {
				this.diaryPage.maximizeContextColumn();
			} else {
				this.diaryPage.resetContextColumn();
			}
			this.lnkEnlargeMap.hidden = pEnlarge;
			this.lnkMinimizeMap.hidden = !pEnlarge;
			this.invalidateMap();
		},

		invalidateMap: function () {
			const leafletMap = this.map && this.map.getLeafletMap();
			if (leafletMap) {
				this.map.getLeafletMap().invalidateSize(false);
				this.mapTrack && this.mapTrack.zoomToTracks()
			}
		},

		loadTracksAsync: async function (pDate) {
			this.pnlAnalyzeTrack.hidden = true;
			const startMS = pDate.toLuxon().toMillis();
			const endMS = pDate.addDays(1).toLuxon().toMillis();
			this.tracks = await PiLot.Service.Nav.TrackService.getInstance().loadTracksAsync(startMS, endMS, true);
			this.applyMapBoxEmptyStyle();
			this.applyTracksBoxEmptyStyle();
			this.tracksList.showTracks(this.tracks);
			this.pnlNoData.hidden = this.tracks.length > 0;
			await this.showMapTracksAsync();
		},

		showMapTracksAsync: async function () {
			await this.map.showAsync();
			if (this.tracks.some(t => t.hasTrackPoints())) {
				if (this.mapTrack === null) {
					this.mapTrack = new PiLot.View.Map.MapTrack(this.map, true);
				}
				this.mapTrack.setTracks(this.tracks);
			} else {
				if (this.mapTrack !== null) {
					this.mapTrack.setTracks([]);
				}
			}
		},

		showSpeedDiagram: function () {
			if (this.track && this.track.getTrackPointsCount() > 0) {
				this.plhSpeedDiagram.hidden = false;
				new PiLot.View.Tools.SpeedDiagram(this.plhSpeedDiagram, this.track);
			} else {
				this.plhSpeedDiagram.hidden = true;
			}
		},

		showTrackStatistics: function () {
			const disabled = PiLot.Config.Disable && PiLot.Config.Disable.trackSections;
			if (!disabled && this.track && this.track.getTrackPointsCount() > 0) {
				this.trackStatistics.showTrackStatisticsAsync(this.track);
			} else {
				this.trackStatistics.hide();
			}
		},

		showAnalyzeTrackLink: function () {
			if (this.track) {
				this.pnlAnalyzeTrack.hidden = false;
				const url = RC.Utils.setUrlParameter(PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.analyze), 'track', this.track.getId());
				this.lnkAnalyzeTrack.href = url;
			} else {
				this.pnlAnalyzeTrack.hidden = true;
			}
		}
	};

	/**
	 * The photo gallery for the Diary, showing thumbnails of all photos of the day, and allows to
	 * open them. In edit-mode (read-only=false), the photos can also be deleted.
	 * @param {HTMLElement} pContainer - the container where the gallery will be created
	 * @param {Boolean} pTinyThumbnails - set this to true to show tiny thumbnails
	 */
	var DiaryPhotoGallery = function (pContainer, pTinyThumbnails = false) {
		this.container = pContainer;
		this.tinyThumbnails = pTinyThumbnails;
		this.date = null;
		this.control = null;
		this.pnlOptions = null;
		this.lnkDownload = null;
		this.lnkOpenBlank = null;
		this.lnkDiary = null;
		this.lnkDelete = null;
		this.plhPhotos = null;				// HTMLElement
		this.pnlPhotoScreen = null;			// HTMLElement
		this.imgFullSize = null;			// HTMLImageElement
		this.lblFileName = null;			// HTMLElement
		this.lblPhotoIndex = null;			// HTMLElement
		this.lblPhotoTotal = null;			// HTMLElement
		this.keyHandler = null;
		this.imageData = null;				// Array of {fileName, imageCollection}
		this.imageIndex = -1;
		this.navigationVisible = false;
        this.updateInterval = null;
		this.observers = null;				// observers used by RC.Utils observers pattern
		this.initialize();
	};

	DiaryPhotoGallery.prototype = {

		initialize: function () {
			this.keyHandler = this.document_keydown.bind(this);
			this.observers = RC.Utils.initializeObservers(['delete']);
			this.draw();
		},

		/**
		 * @param {String} pEvent - 'delete'
		 * @param {Function} pCallback - The method to call 
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		lnkDelete_click: function (pEvent) {
			pEvent.preventDefault();
			if (window.confirm(PiLot.Utils.Language.getText('confirmDeletePhoto'))) {
				this.deletePhoto();
			}
		},

		pnlOptions_click: function (pEvent) {
			pEvent.stopPropagation();
		},

		lnkClose_click: function (pEvent) {
			this.hidePhoto();
			pEvent.preventDefault();
		},

		/** @param {String} pArg - the image index */
		thumbnail_click: function (pArg) {
			this.showPhoto(pArg);
		},

		lnkPrevious_click: function (pEvent) {
			this.changePhoto(-1);
			pEvent.preventDefault();
			pEvent.stopPropagation();
		},

		lnkNext_click: function (pEvent) {
			this.changePhoto(1);
			pEvent.preventDefault();
			pEvent.stopPropagation();
		},

		image_load: function () {
			this.imgFullSize.hidden = false;
			this.preloadNextPhoto();
		},

		pnlPhotoScreen_click: function () {
			this.toggleNavigation(!this.navigationVisible);
		},

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
					this.setImageIndex(0);
					break;
			}
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.diaryPhotoGallery);
			this.container.appendChild(this.control);
			this.control.querySelector('.pnlOptions').addEventListener('click', this.pnlOptions_click);
			this.control.querySelector('.lnkClose').addEventListener('click', this.lnkClose_click.bind(this));
			this.lnkDownload = this.control.querySelector('.lnkDownload');
			this.lnkOpenBlank = this.control.querySelector('.lnkOpenBlank');
			this.lnkDiary = this.control.querySelector('.lnkDiary');
			this.lnkDelete = this.control.querySelector('.lnkDelete');
			PiLot.Utils.Common.bindOrHideEditLink(this.lnkDelete, this.lnkDelete_click.bind(this));
			this.plhPhotos = this.container.querySelector('.plhPhotos');
			this.plhPhotos.classList.toggle('tiny', this.tinyThumbnails);
			this.pnlPhotoScreen = this.container.querySelector('.pnlPhotoScreen');
			this.imgFullSize = this.container.querySelector('.imgFullSize');
			this.imgFullSize.addEventListener('load', this.image_load.bind(this));
			this.pnlPhotoScreen.addEventListener('click', this.pnlPhotoScreen_click.bind(this));
			this.container.querySelector('.lnkPrevious').addEventListener('click', this.lnkPrevious_click.bind(this));
			this.container.querySelector('.lnkNext').addEventListener('click', this.lnkNext_click.bind(this));
			this.lblFileName = this.control.querySelector('.lblFileName');
			this.lblPhotoIndex = this.control.querySelector('.lblPhotoIndex');
			this.lblPhotoTotal = this.control.querySelector('.lblPhotoTotal');
		},

		/** @param {RC.Date.DateOnly} pDate */
        showPhotosAsync: async function (pDate = null) {
            if (this.updateInterval) {
                window.clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
			this.date = pDate;
			await this.loadPhotosAsync();
			this.showThumbnails();
        },

        reloadPhotosAsync: async function () {
            const previousImagesCount = this.imageData.length;
			await this.loadPhotosAsync();
            if (previousImagesCount !== this.imageData.length) {
                this.showThumbnails();
            }
        },

		loadPhotosAsync: async function(){
			let imageCollections;
			if(this.date)
				imageCollections = [await PiLot.Model.Logbook.loadDailyImageCollectionAsync(this.date)];
			else{
				imageCollections = await PiLot.Model.Logbook.loadAllImageCollectionsAsync();
			}
			imageCollections.sort((x, y) => x.getName().localeCompare(y.getName()));
			this.imageData = [];
			for(let aCollection of imageCollections){
				for(let anImageName of aCollection.getImageNames()){
					this.imageData.push({fileName: anImageName, imageCollection: aCollection});
				}
			}
		},

		showThumbnails: function(){
			this.plhPhotos.clear();
			let image;
			let imageSize = null;
			for(let i = 0; i < this.imageData.length; i++) {
				const onclick = this.thumbnail_click.bind(this, i);
				image = this.imageData[i];
				const thumbnail = new Thumbnail(this.plhPhotos, image.fileName, image.imageCollection, onclick, imageSize);
				if(i === 0){
					imageSize = thumbnail.getImageSize();
				}
			};
			this.toggleVisible(this.imageData.length > 0);
			this.lblPhotoTotal.innerText = this.imageData.length;
		},

        ensureAutoUpdate: function () {
            this.updateInterval |= window.setInterval(this.reloadPhotosAsync.bind(this), 5000);
        },

		deletePhoto: function () {
			const image = this.imageData[this.imageIndex];
			PiLot.Model.Logbook.deletePhotoAsync(image.imageCollection.getName(), image.fileName);
			image.imageCollection.removeImageName(image.fileName);
			this.imageData.remove(this.imageIndex);
			this.hidePhoto();
			this.showThumbnails();
			RC.Utils.notifyObservers(this, this.observers, 'delete', image.fileName);
		},

		/** @param {Boolean} pVisible */
		toggleVisible: function (pVisible) {
			this.control.hidden = !pVisible;
		},

		/** @param {Number} pImageIndex - the index of the image in this.imageData */
		showPhoto: function (pImageIndex) {
			this.imageIndex = pImageIndex;
			this.setPhotoUrl();
            this.pnlPhotoScreen.hidden = false;
			document.body.classList.toggle('overflowHidden', true);
            this.toggleNavigation(true);
			document.addEventListener('keydown', this.keyHandler);
		},

		hidePhoto: function () {
			document.removeEventListener('keydown', this.keyHandler);
			this.pnlPhotoScreen.hidden = true;
			document.body.classList.toggle('overflowHidden', false);
		},

		/** @param {Boolean} pVisible */
		toggleNavigation: function (pVisible) {
			this.navigationVisible = pVisible;
			this.pnlPhotoScreen.classList.toggle('fullscreen', !pVisible);
		},

		/** @param {Number} pChangeBy */
		changePhoto: function (pChangeBy) {
			this.setImageIndex((this.imageIndex + pChangeBy + this.imageData.length) % this.imageData.length);
		},

		/** @param {Number} pIndex */
		setImageIndex: function (pIndex) {
			this.imageIndex = pIndex;
			this.setPhotoUrl();
		},

		setPhotoUrl: function () {
			const image = this.imageData[this.imageIndex];
			console.log(image.imageCollection.getDate());
			this.imgFullSize.src = this.getPhotoUrl(image.imageCollection, image.fileName);
			this.imgFullSize.hidden = true;
			this.lnkDownload.href = this.getOriginalImageUrl(image.imageCollection, image.fileName);
            this.lnkOpenBlank.href = this.getOriginalImageUrl(image.imageCollection, image.fileName);
			this.showDiaryLink(image.imageCollection);
            this.lblFileName.innerText = image.fileName;
			this.lblPhotoIndex.innerText = this.imageIndex + 1;
		},

		/**
		 * Shows a link to the diary page of the date of the photo, but only if the photo gallery
		 * is not being shown for one certain date.
		 * @param {PiLot.Model.Logbook.ImageCollection} pImageCollection
		 *  */
		showDiaryLink: function(pImageCollection){
			if(!this.date){
				const imageDate = pImageCollection.getDate();
				if(imageDate) {
					const pageUrl = PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.diary);
					this.lnkDiary.href = PiLot.Utils.Common.setQsDate(pageUrl, imageDate);
					this.lnkDiary.hidden = false;
				} else {
					this.lnkDiary.hidden = true;
				}
			} else {
				this.lnkDiary.hidden = true;
			}
		},

		preloadNextPhoto: function () {
			const nextImage = this.imageData[(this.imageIndex + 1) % this.imageData.length];
			const imageUrl = this.getPhotoUrl(nextImage.imageCollection, nextImage.fileName);
			const preoloadImage = new Image();
			preoloadImage.src = imageUrl;
		},

		/** 
		 * @param {PiLot.Model.Logbook.ImageCollection} pImageCollection - the collection the image belongs to
		 * @param {String} pImageName - the image name, without any path prefix. 
		 * */
		getPhotoUrl: function (pImageCollection, pImageName) {
			const imageSize = Math.max(this.pnlPhotoScreen.clientHeight, this.pnlPhotoScreen.clientWidth);
			const imageUrl = pImageCollection.getFolderUrl(imageSize) + pImageName;
			return imageUrl;
		},

		/** 
		 * @param {PiLot.Model.Logbook.ImageCollection} pImageCollection - the collection the image belongs to
		 * @param {String} pImageName - the image name, without any path prefix. 
		 * */
		getOriginalImageUrl: function (pImageCollection, pImageName) {
			return pImageCollection.getRootUrl() + pImageName;
		},

		hasPhotos: function () {
			return this.imageData.length > 0;
		}
	};

	/**
	 * @param {HTMLElement} pContainer - the container where the images should be added
	 * @param {String} pImageName - the name of the image, without any path prefix
	 * @param {PiLot.Model.Logbook.ImageCollection} pImageCollection - the collection this belongs to
	 * @param {Function} pOnClick - the handler for the click on the image
	 * @param {Number} pImageSize - pass the image size if you know it to save a lot of time
	 */
	var Thumbnail = function (pContainer, pImageName, pImageCollection, pOnClick, pImageSize = null) {
		this.container = pContainer;					// HTMLElement
		this.imageName = pImageName;					// String (the original image name)
		this.imageCollection = pImageCollection;		// PiLot.Model.Logbook.ImageCollection
		this.onclick = pOnClick;						// Function
		this.imageSize = pImageSize;
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
			this.imageSize = this.imageSize || Math.max(control.clientHeight, control.clientWidth);
			const imageUrl = this.imageCollection.getFolderUrl(this.imageSize) + this.imageName;
			this.image.src = imageUrl;
			this.image.addEventListener('click', this.onclick);
			this.image.addEventListener('load', this.image_load.bind(this));
			this.image.addEventListener('error', this.image_error.bind(this));
		},

		ensureReloadInterval: function(){
			if(!this.reloadInterval){
				this.reloadInterval = window.setInterval(this.reloadImage.bind(this), 5000);
			}
		},

		reloadImage: function(){
			this.image.src = this.image.src;
		},

		getImageSize: function(){
			return this.imageSize;
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
			this.draw();
		},

		/**
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
			for(let i = 0; i < this.fileImageUpload.files.length; i++){
				const fileDataReader = new FileReader();
				fileDataReader.onloadend = this.fileDataReader_loadend.bind(this, i);
				fileDataReader.readAsArrayBuffer(this.fileImageUpload.files[i])
			}
			this.btnSend.hidden = true;
			this.pnlUploading.hidden = false;
		},

		fileDataReader_loadend: function (pIndex, pEvent) {
			this.uploadPhotoAsync(this.fileImageUpload.files[pIndex].name, pEvent.target.result);
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

		/**  @param {Boolean} pVisible */
		toggleVisible: function(pVisible){
			if(pVisible === undefined){
				pVisible = this.control.hidden;
			}
			this.control.hidden = !pVisible;
			if (pVisible) {
				this.imgPreview.hidden = true;
				this.pnlUploading.hidden = true;
				this.pnlUploadSuccess.hidden = true;
				this.fileImageUpload.value = "";
			}
		},

		uploadPhotoAsync: async function(pFileName, pBytes){
			await PiLot.Model.Logbook.uploadPhotoAsync(this.logbookPage.getDate(), pFileName, pBytes);
			RC.Utils.notifyObservers(this, this.observers, 'upload', pFileName);
			this.imgPreview.hidden = true;
			this.pnlUploading.hidden = true;
			this.pnlUploadSuccess.hidden = false;
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
		this.cbSelectPhotos = null;			// not the checkbox itself, but an RC.Controls.TriStateCheckBox!

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

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.publishDiaryPage);
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
			this.localTrack = new PiLot.View.Map.MapTrack(this.localTrackMap, false);
			this.targetTrackMap = new PiLot.View.Map.Seamap(this.pnlPublish.querySelector('.divTargetTrack'), { persistMapState: false });
			this.targetTrack = new PiLot.View.Map.MapTrack(this.targetTrackMap, false);
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

		loadPublishTargetsAsync: async function () {
			const targets = await PiLot.Model.Logbook.loadPublishTargetsAsync();
			const ddlArray = targets.map(t => [t.name, t.displayName]);
			ddlArray.unshift(['', 'pleaseSelect']);
			PiLot.Utils.Common.fillDropdown(this.ddlPublishTarget, ddlArray);
		},

		loadLocalDataAsync: async function () {
			const startMS = this.date.toLuxon().toMillis();
			const endMS = this.date.addDays(1).toLuxon().toMillis();
			const tracks = await PiLot.Service.Nav.TrackService.getInstance().loadTracksAsync(startMS, endMS, true);
			this.showTracksAsync(tracks, this.localTrackMap, this.localTrack, this.lblLocalPositionsCount);
			const logbookDay = await PiLot.Model.Logbook.loadLogbookDayAsync(this.date);
			this.showLogbook(logbookDay, this.divLocalDiaryText, this.lblLocalDiaryLength, this.divLocalLogbookEntries, this.lblLocalLogbookEntriesCount);
			const dailyPhotos = await PiLot.Model.Logbook.loadDailyImageCollectionAsync(this.date);
			this.showThumbnails(dailyPhotos, this.divLocalPhotos, this.lblLocalPhotosCount, true);
		},

		loadTargetDataAsync: async function () {
			this.icoWait.hidden = false;
			this.showTracksAsync([], this.targetTrackMap, this.targetTrack, this.lblTargetPositionsCount);
			this.showLogbook(null, this.divTargetDiaryText, this.lblTargetDiaryLength, this.divTargetLogbookEntries, this.lblTargetLogbookEntriesCount)
			this.showThumbnails(null, this.divTargetPhotos, this.lblTargetPhotosCount, false);
			this.targetData = await PiLot.Model.Logbook.loadDailyDataAsync(this.targetName, this.date);
			if (this.targetData.success) {
				this.showTracksAsync(this.targetData.data.tracks, this.targetTrackMap, this.targetTrack, this.lblTargetPositionsCount);
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
		 * @param {PiLot.Model.Nav.Track[]} pTracks - the tracks to show
		 * @param {HTMLElement} pControl - the control containing the map
		 * @param {PiLot.View.MapTrack} pTrackControl - a MapTrack used to show the tracks on the map
		 * @param {HTMLElement} pPositionsLabel - the label showing the positions count 
		 */
		showTracksAsync: async function (pTracks, pMap, pTrackControl, pPositionsLabel) {
			let trackPointsCount = 0;
			if (pTracks) {
				pTracks.forEach(t => trackPointsCount += t.getTrackPointsCount());
			}
			pPositionsLabel.innerText = pTracks ? trackPointsCount : "...";
			await pMap.showAsync();
			pTrackControl.setTracks(pTracks);
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

		showPublishJob: function () {
			this.pnlJobInfo.hidden = false;
			this.refreshPublishJobAsync();
			this.jobStatusInterval = window.setInterval(this.refreshPublishJobAsync.bind(this), 1000);
		},

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

		initialize: function () {
			this.calendar.setOnMonthRendered(this.calendar_monthRendered.bind(this));
		},

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
		 * @param {Number} pYear
		 * @param {Number} pMonth
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

		addCalendarIcons: function (pDayInfo, pCell) {
			const link = pCell.querySelector('a');
			link.querySelectorAll('.icons').forEach(e => e.parentNode.removeChild(e));
			const iconsDiv = RC.Utils.addDomObject('div', link, 'icons');
			if (pDayInfo.hasLogbook) this.addIcon(iconsDiv, 'icon-quill');
			if (pDayInfo.hasTrack) this.addIcon(iconsDiv, 'icon-map2');
			if (pDayInfo.hasPhotos) this.addIcon(iconsDiv, 'icon-pictures');
		},

		addIcon: function (pControl, pIcon) {
			RC.Utils.addDomObject('i', pControl, pIcon);
		}
	}

	/** A page showing all photos in a zoomable gallery */
	var PhotosPage = function(){
		this.imageGallery = null;
		this.initialize();
	};

	PhotosPage.prototype = {

		initialize: function(){
			this.draw();
			this.loadImagesAsync();
		},

		draw: function(){
			const page = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.photosPage);
			PiLot.Utils.Loader.getContentArea().appendChild(page);
			this.imageGallery = new DiaryPhotoGallery(page.querySelector('.plhGallery'), true);
		},

		loadImagesAsync: async function(){
			this.imageGallery.showPhotosAsync();
		}
	};

	var RandomPhotoDisplay = function(pContainer){
		this.container = pContainer;
		this.initialize();
	};

	RandomPhotoDisplay.prototype = {

		initialize: function(){
			this.draw();
		},

		draw: function(){
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Diary.randomPhotoDisplay);
			this.container.appendChild(control);
			const imgPhoto = control.querySelector('.imgPhoto');
			PiLot.Model.Logbook.loadRandomImageAsync().then((i) => {
				imgPhoto.src = i.getRootUrl() + i.getImageNames()[0];
			});
		}

	};

	return {
		DiaryPage: DiaryPage,
		PublishDiaryPage: PublishDiaryPage,
		DiaryCalendar: DiaryCalendar,
		PhotosPage: PhotosPage,
		RandomPhotoDisplay: RandomPhotoDisplay
	};

})();