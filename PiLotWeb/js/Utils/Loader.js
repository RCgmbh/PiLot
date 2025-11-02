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
			startAction: function () { return new PiLot.View.Common.StartPage(); }
		},
		display: {
			key: 'display',
			startAction: function () { return new PiLot.View.Common.GenericDisplayPage(); },
			noHeader: true
		},
		checklists: {
			key: 'checklists',
			startAction: function() { return new PiLot.View.Tools.ChecklistsPage(); }
		},
		map: {
			key: 'map',
			startAction: function () { return new PiLot.View.Map.MapPage(); }
		},
		nav: {
			key: 'nav',
			startAction: function () { return new PiLot.View.Nav.NavPage(); }
		},
		routes: {
			key: 'routes',
			startAction: function () { return new PiLot.View.Nav.RoutesList(); }
		},
		routeDetails: {
			key: 'routeDetails',
			startAction: function () { return new PiLot.View.Nav.RouteDetail(); }
		},
		measurements: {
			key: 'measurements',
			startAction: function () { return new PiLot.View.Meteo.SensorsPage(); }
		},
		logbook: {
			key: 'logbook',
			startAction: function () { return new PiLot.View.Logbook.LogbookPage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getCanWrite(); }
		},
		diary: {
			key: 'diary',
			startAction: function () { return new PiLot.View.Diary.DiaryPage(); }
		},
		publish: {
			key: 'publish',
			startAction: function () { return new PiLot.View.Diary.PublishDiaryPage(); }
		},
		stats: {
			key: 'stats',
			startAction: function () { return new PiLot.View.Stats.TrackStatsPage(); }
		},
		photos: {
			key: 'photos',
			startAction: function () { return new PiLot.View.Diary.PhotosPage(); }
		},
		games: {
			key: 'games',
			startAction: function () { return new PiLot.View.Media.GamesOverviewPage(); }
		},
		library: {
			key: 'library',
			startAction: function () { return new PiLot.View.Media.LibraryPage(); }
		},
		settings: {
			key: 'settings',
			startAction: function () { return new PiLot.View.Settings.SettingsOverviewPage(); }
		},
		boat: { 
			key: 'boat',
			startAction: function () { return new PiLot.View.Boat.BoatPage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getCanChangeSettings(); }
		},
		boatTime: {
			key: 'boatTime',
			startAction: function () { return new PiLot.View.Settings.BoatTimePage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getCanChangeSettings(); }
		},
		language: {
			key: 'language',
			startAction: function () { return new PiLot.View.Settings.LanguagePage(); }
		},
		tools: {
			key: 'tools',
			startAction: function () { return new PiLot.View.Tools.ToolsOverviewPage(); }
		},
		analyze: {
			key: 'analyze',
			startAction: () => new PiLot.View.Analyze.AnalyzePage()
		},
		data: {
			key: 'data',
			startAction: function () { return new PiLot.View.Tools.GpsImportExportForm(); }
		},
		tiles: {
			key: 'tiles',
			startAction: function () { return new PiLot.View.Tools.TilesDownloadForm(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getCanWrite(); }
		},
		pois: {
			key: 'pois',
			startAction: function () { return new PiLot.View.Tools.PoisManagementPage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getCanWrite(); }
		},
		wifi: {
			key: 'wifi',
			startAction: function () { return new PiLot.View.Admin.WiFiPage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getHasSystemAccess(); }
		},
		services: {
			key: 'services',
			startAction: function () { return new PiLot.View.Admin.ServicesPage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getHasSystemAccess(); }
		},
		logs: {
			key: 'logs',
			startAction: function () { return new PiLot.View.Admin.LogFilesPage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getHasSystemAccess(); }
		},
		systemStatus: {
			key: 'systemStatus',
			startAction: function () { return new PiLot.View.Admin.SystemStatusPage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getHasSystemAccess(); }
		},
		systemTime: {
			key: 'systemTime',
			startAction: function () { return new PiLot.View.Admin.BoatTimePage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getHasSystemAccess(); }
		},
		shutDown: {
			key: 'shutDown',
			startAction: function () { return new PiLot.View.Admin.ShutdownPage(); },
			accessControl: function () { return PiLot.Model.Common.AuthHelper.instance().getPermissions().getHasSystemAccess(); }
		}
	};

	/**
	 * Main entry point to dynamically load script files and load the
	 * right page content based on a querystring.
	 */
	var PageLoader = function () {
		this.page = null;
		this.pageObject = null;
		this.loadApp();

	};

	PageLoader.prototype = {

		loginForm_loginSuccess: function(pPage, pParams){
			this.addDefaultControls();
			this.showPage(pPage, pParams);
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
		loadApp: function () {
			let urlKey;
			PiLot.Utils.Language.applyHTMLLanguage();
			urlKey = RC.Utils.getUrlParameter(PAGEKEY);
			const urlParams = new URLSearchParams(window.location.search);
			const params = [];
			for (const [aKey, aValue] of urlParams.entries()) {
				if(aKey !== PAGEKEY){
					params.push([aKey, aValue]);
				}
			}
			this.preparePage(this.getPage(urlKey) || pages.home, params);
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
		},

		/**
		 * This does some preparation work, checks permissions and calls the start
		 * function of the page
		 */
		preparePage: async function (pPage, pParams) {
			PiLot.log = PiLot.Utils.Common.log;
			PiLot.Utils.Common.getLogLevel(); // todo: can we do this on demand? why here??
			window.addEventListener('popstate', this.window_popstate.bind(this));
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			await authHelper.loadPermissionsAsync()
			if (authHelper.getPermissions().getCanRead()) {
				this.addDefaultControls();
				this.showPage(pPage, pParams);
			} else {
				const loginForm = PiLot.View.Common.getLoginForm();
				loginForm.on('loginSuccess', this.loginForm_loginSuccess.bind(this, pPage, pParams));
			}
		},

		/**
		 * Clears the page, calls the start Action, draws the default controls and does stuff that needs be done
		 * @param {String[][]} pParams - query strings to add, an array of arrays representing [key, value]
		 */
		showPage: function (pPage, pParams, pPushState = true) {
			this.page = pPage;
			// todo: disable header elements if no header
			const noHeader = !!this.page.noHeader;
			document.getElementById('header').hidden = noHeader;
			document.getElementById('main').classList.toggle('noHeader', noHeader);
			this.pageObject && this.pageObject.unload && this.pageObject.unload();
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
			RC.Utils.handleActiveStyles();
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