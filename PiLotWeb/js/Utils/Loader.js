var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * This namespace contains some logic to implement the SPA behaviour
 * */
PiLot.Utils.Loader = (function () {

	/** the query string key indicating the current page */
	const PAGEKEY = 'p';

	/** the name of the application html file */
	const HTMLFILE = 'index.html';

	/**
	 * The list of all pages, key being the query string used to load
	 * the page.
	 * */
	const pages = {
		empty: {
			key: 'empty',
			startAction: function () { }
		},
		home: {
			key: 'home',
			startAction: function () { return new PiLot.View.Common.StartPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		display: {
			key: 'display',
			startAction: function () { return new PiLot.View.Common.GenericDisplayPage(); },
			noHeader: true,
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		checklists: {
			key: 'checklists',
			startAction: function() { return new PiLot.View.Tools.ChecklistsPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		map: {
			key: 'map',
			startAction: function () { return new PiLot.View.Map.MapPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		nav: {
			key: 'nav',
			startAction: function () { return new PiLot.View.Nav.NavPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		routes: {
			key: 'routes',
			startAction: function () { return new PiLot.View.Nav.RoutesList(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		routeDetails: {
			key: 'routeDetails',
			startAction: function () { return new PiLot.View.Nav.RouteDetail(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		measurements: {
			key: 'measurements',
			startAction: function () { return new PiLot.View.Meteo.SensorsPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		logbook: {
			key: 'logbook',
			startAction: function () { return new PiLot.View.Logbook.LogbookPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canWrite(); }
		},
		diary: {
			key: 'diary',
			startAction: function () { return new PiLot.View.Diary.DiaryPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		publish: {
			key: 'publish',
			startAction: function () { return new PiLot.View.Diary.PublishDiaryPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		stats: {
			key: 'stats',
			startAction: function () { return new PiLot.View.Stats.TrackStatsPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		photos: {
			key: 'photos',
			startAction: function () { return new PiLot.View.Diary.PhotosPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		games: {
			key: 'games',
			startAction: function () { return new PiLot.View.Media.GamesOverviewPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		library: {
			key: 'library',
			startAction: function () { return new PiLot.View.Media.LibraryPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		boat: { 
			key: 'boat',
			startAction: function () { return new PiLot.View.Boat.BoatPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canChangeSettings(); }
		},
		boatTime: {
			key: 'boatTime',
			startAction: function () { return new PiLot.View.Settings.BoatTimePage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canChangeSettings(); }
		},
		language: {
			key: 'language',
			startAction: function () { return new PiLot.View.Settings.LanguagePage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		fullscreen: {
			key: 'fullscreen',
			startAction: function () { return new PiLot.View.Settings.FullscreenSettingPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		analyze: {
			key: 'analyze',
			startAction: () => new PiLot.View.Analyze.AnalyzePage(),
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		data: {
			key: 'data',
			startAction: function () { return new PiLot.View.Tools.GpsImportExportForm(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canRead(); }
		},
		tiles: {
			key: 'tiles',
			startAction: function () { return new PiLot.View.Tools.TilesDownloadForm(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canWrite(); }
		},
		pois: {
			key: 'pois',
			startAction: function () { return new PiLot.View.Tools.PoisManagementPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.canWrite(); }
		},
		wifi: {
			key: 'wifi',
			startAction: function () { return new PiLot.View.Admin.WiFiPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.hasSystemAccess(); }
		},
		services: {
			key: 'services',
			startAction: function () { return new PiLot.View.Admin.ServicesPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.hasSystemAccess(); }
		},
		logs: {
			key: 'logs',
			startAction: function () { return new PiLot.View.Admin.LogFilesPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.hasSystemAccess(); }
		},
		systemStatus: {
			key: 'systemStatus',
			startAction: function () { return new PiLot.View.Admin.SystemStatusPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.hasSystemAccess(); }
		},
		systemTime: {
			key: 'systemTime',
			startAction: function () { return new PiLot.View.Admin.BoatTimePage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.hasSystemAccess(); }
		},
		shutDown: {
			key: 'shutDown',
			startAction: function () { return new PiLot.View.Admin.ShutdownPage(); },
			accessControl: function () { return PiLot.Model.Common.Permissions.hasSystemAccess(); }
		}
	};

	/**
	 * Main entry point to dynamically load script files and load the
	 * right page content based on a querystring.
	 */
	var PageLoader = function () {
		this.page = null;
		this.pageObject = null;
		this.prepareAppAsync();

	};

	PageLoader.prototype = {

		loginForm_loginSuccess: function(){
			if(this.checkPermissions()){
				this.startApp();
			} else if (PiLot.Model.Common.Permissions.canRead()) {
				this.page = pages.home;
				this.startApp();
			} else{
				this.showAccessDenied();
			}
		},

		authHelper_logout: function(){
			if(!this.checkPermissions()){
				if(PiLot.Model.Common.Permissions.canRead()){
					this.showPage(pages.home);
				} else{
					this.showAccessDenied();
				}
			}
		},

		window_popstate: function(pEvent){
			console.log(pEvent.state);
			if(pEvent.state && pEvent.state.page){
				this.showPage(this.getPage(pEvent.state.page), pEvent.state.params, false);
			}
		},

		/**
		 * Loads the app and shows the page based on the p= query string
		 * */
		prepareAppAsync: async function () {
			this.bindHandlers();
			this.startLogging();
			this.initializeLanguage();
			await PiLot.Model.Common.AuthHelper.instance().loadPermissionsAsync();
			this.decidePage();
			if(this.checkPermissions()){
				this.startApp();
			} else {
				this.showLoginForm();
			}
		},

		startApp: function(){
			this.initializeServiceHelper();
			this.initializeBoatTime();
			this.addDefaultControls();
			const params = this.processParameters();
			this.showPage(this.page, params, false);
			this.initializeNightMode();
		},

		showLoginForm: function(){
			const loginForm = PiLot.View.Common.getLoginForm();
			loginForm.on('loginSuccess', this.loginForm_loginSuccess.bind(this));
		},

		bindHandlers: function(){
			PiLot.Model.Common.AuthHelper.instance().on('logout', this, this.authHelper_logout.bind(this));
			window.addEventListener('popstate', this.window_popstate.bind(this));
		},

		startLogging: function(){
			PiLot.log = PiLot.Utils.Common.log;
			PiLot.Utils.Common.getLogLevel();
		},

		initializeBoatTime: function(){
			PiLot.Utils.Common.BoatTimeHelper.initialize();
		},

		initializeServiceHelper: function(){
			PiLot.Service.Common.ServiceHelper.initialize();
		},

		initializeLanguage: function(){
			PiLot.Utils.Language.initializeLanguage();
		},

		initializeFullscreen: function(){
			PiLot.Utils.Presentation.Fullscreen.initialize();
		},

		initializeNightMode: function(){
			PiLot.Utils.Presentation.NightModeHandler.initialize();
		},

		decidePage: function(){
			const urlKey = RC.Utils.getUrlParameter(PAGEKEY);
			this.page = (this.getPage(urlKey) || pages.home);
		},
		
		processParameters: function(){
			const urlParams = new URLSearchParams(window.location.search);
			const params = [];
			for (const [aKey, aValue] of urlParams.entries()) {
				if(aKey !== PAGEKEY){
					params.push([aKey, aValue]);
				}
			}
			return params;
		},

		checkPermissions: function(){
			return !this.page.accessControl || this.page.accessControl();
		},

		/**
		 * Clears the page, calls the start Action, draws the default controls and does stuff that needs be done
		 * @param {String[][]} pParams - query strings to add, an array of arrays representing [key, value]
		 */
		showPage: function (pPage, pParams, pPushState = true) {
			this.page = pPage;
			// todo: disable header elements if no header
			const noHeader = !!this.page.noHeader;
			this.toggleHeader(!noHeader);
			this.unloadPage();
			getContentArea().clear();
			let url = createPageLink(this.page);
			if(pParams){
				for(let aParam of pParams){
					url = RC.Utils.setUrlParameter(url, aParam[0], aParam[1]);
				}
			}
			if(pPushState){
				window.history.pushState({page:pPage.key, params:pParams}, '', url);
			}
			this.pageObject = this.page.startAction();
			this.initializeFullscreen();
			RC.Utils.handleActiveStyles();
		},

		/**
		 * Calls the unload function of the current page, if there is one, and does some
		 * document cleanup, removing all overlays (as they tend to be created by lots of
		 * different controls).
		 */
		unloadPage: function(){
			this.pageObject && this.pageObject.unload && this.pageObject.unload();
			let overlay;
			do { // getting all of them at once and removing one by one did not work
				overlay = document.querySelector('.overlay');
				overlay && overlay.remove();
			} while (overlay)
		},

		toggleHeader: function(pVisible){
			document.getElementById('header').hidden = !pVisible;
			document.getElementById('main').classList.toggle('noHeader', !pVisible);
		},

		showAccessDenied: function(){
			this.pageObject && this.pageObject.unload && this.pageObject.unload();
			const contentArea = getContentArea();
			contentArea.clear();
			contentArea.innerText = "Access denied";
		},

		/**
		 * Draws the menu and the clock
		 * */
		addDefaultControls: function() {
			// todo: keep a reference to each, unload them in header-less mode, reload them again
			new PiLot.View.Common.Clock();
			PiLot.View.Common.ClockOffsetIcon.getInstance();
			new PiLot.View.Common.MainMenuHamburger();
			new PiLot.View.Common.UserIcon();
			new PiLot.View.Common.DayNightIcon();
			PiLot.View.Admin.WiFiIcon.getInstance();
			new PiLot.View.Nav.GPSIcon();
			PiLot.View.Common.ServiceErrorIcon.initialize();
		},

		/** @returns {Object} the object from this.pages with key = pKey */
		getPage: function(pKey){
			let result;
			for(let aPage in pages){
				if(pages[aPage].key === pKey){
					result = pages[aPage];
					break;
				}
			}
			return result;
		}
	};

	var pageLoaderInstance = null;

	PageLoader.getInstance = function(){
		pageLoaderInstance = pageLoaderInstance || new PageLoader();
		return pageLoaderInstance;
	}

	/** returns the content area of the page, where content is added dynamically */
	function getContentArea() {
		return document.getElementById('content');
	}

	/** returns the container for the header icons */
	function getIconsArea() {
		return document.querySelector('#headerButtons>#headerIcons');
	}

	/**
	 * Creates a url passing the querystring that defines which page to load
	 * @param {String} pPage - one of them Loader.pages
	 */
	function createPageLink(pPage) {
		return `${HTMLFILE}?${PAGEKEY}=${pPage.key}`;
	}

	return {
		PageLoader: PageLoader,
		pages: pages,
		getContentArea: getContentArea,
		getIconsArea: getIconsArea,
		createPageLink: createPageLink
	};

})();