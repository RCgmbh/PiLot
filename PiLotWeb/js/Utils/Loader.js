var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * This namespace contains some logic to dynamically load scripts and
 * pages. This is my pseudo-SPA approach, where the same html page is 
 * used for each view, but is always reloaded (which I think is just
 * healthier for Browsers). It also offers some simple require.js like
 * functionality (I did not like the framework because it made me define
 * dependencies betweeen scripts, while I think a priority based approach
 * is easier to handle, and I think I can do this with far less code)
 * */
PiLot.Utils.Loader = (function () {

	/** the query string key indicating the current page */
	const PAGEKEY = 'p';

	/** the name of the application html file */
	const HTMLFILE = 'index.html';

	/**
	 * The list of all pages, key being the query string used to load
	 * the page. Keep in mind that this structure will be extended by
	 * the PermissionsHelper, who will add the authorisation functions
	 * for restricted pages. This is not done here, as the Common.Model
	 * namespace containing the permissions logic will not be available
	 * yet. 
	 * */
	const pages = {
		empty: {key: 'empty'},
		home: {key: 'home'},
		map: {key: 'map'},
		nav: {key: 'nav'},
		routes: {key: 'routes'},
		routeDetails: {key: 'routeDetails'},
		measurements: {key: 'measurements'},
		logbook: { key: 'logbook'},
		diary: {key: 'diary'},
		publish: {key: 'publish'},
		stats: {key: 'stats'},
		games: {key: 'games'},
		library: {key: 'library'},
		settings: {key: 'settings'},
		boat: { key: 'boat'},
		boatTime: { key: 'boatTime'},
		language: {key: 'language'},
		tools: {key: 'tools'},
		analyze: {key: 'analyze'},
		data: {key: 'data'},
		tiles: { key: 'tiles'},
		pois: { key: 'pois'},
		admin: { key: 'admin'},
		wifi: { key: 'wifi'},
		services: { key: 'services'},
		logs: { key: 'logs'},
		systemStatus: { key: 'systemStatus'},
		systemTime: { key: 'systemTime'},
		shutDown: { key: 'shutDown'}
	};

	/// we define arrays of scripts, each with its priority. Scripts
	/// with a lower number for priority will be loaded before scripts
	/// with a higher number. 

	const defaultScripts = [
		{ url: 'js/3rdParty/luxon/polyfill.js', priority: 1 },
		{ url: 'js/3rdParty/luxon/luxon.js', priority: 1 },
		{ url: 'js/3rdParty/divers/moment.min.js', priority: 1 },
		{ url: 'js/3rdParty/RC/RC.Utils.js', priority: 1 },
		{ url: 'js/3rdParty/RC/RC.Date.js', priority: 5 },
		{ url: 'js/3rdParty/RC/RC.Controls.js', priority: 10 },
		{ url: 'js/Config.js', priority: 1 },
		{ url: 'js/Model/Common.js', priority: 8 },
		{ url: 'js/Utils/Common.js', priority: 5 },
		{ url: 'js/Utils/Audio.js', priority: 5 },
		{ url: 'js/Templates/Common.js', priority: 10 },
		{ url: 'js/View/Common.js', priority: 10 },
		{ url: 'js/Model/Admin.js', priority: 10 },
		{ url: 'js/View/Admin.js', priority: 10 },
		{ url: 'js/Templates/Admin.js', priority: 10 },
		{ url: 'js/Model/Nav.js', priority: 10 },
		{ url: 'js/View/Nav.js', priority: 10 },
		{ url: 'js/Templates/Nav.js', priority: 10 },
		{ url: 'js/3rdParty/geodesy/vector3d.js', priority: 1 },
		{ url: 'js/3rdParty/geodesy/latlon-ellipsoidal.js', priority: 5 },
		{ url: 'js/3rdParty/geodesy/latlon-vincenty.js', priority: 10 },
		{ url: 'js/3rdParty/leaflet/leaflet.js', priority: 1 }
	];

	const navScripts = [
		{ url: 'js/3rdParty/geodesy/vector3d.js', priority: 1 },
		{ url: 'js/3rdParty/geodesy/latlon-ellipsoidal.js', priority: 5 },
		{ url: 'js/3rdParty/geodesy/latlon-vincenty.js', priority: 10 },
		{ url: 'js/3rdParty/leaflet/leaflet.js', priority: 1 },
		{ url: 'js/3rdParty/leaflet/leaflet.nauticscale.js', priority: 10 },
		{ url: 'js/3rdParty/leaflet/fallback.js', priority: 10 },
		{ url: 'js/3rdParty/leaflet/Leaflet.PolylineMeasure.js', priority: 5 },
		{ url: 'js/Service/Nav.js', priority: 10 },
		{ url: 'js/Model/Nav.js', priority: 10 },
		{ url: 'js/View/Nav.js', priority: 10 },
		{ url: 'js/View/Map.js', priority: 10 },
		{ url: 'js/Templates/Nav.js', priority: 10 },
		{ url: 'js/Templates/Map.js', priority: 10 },
		{ url: 'js/Utils/Nav.js', priority: 10 }
	];

	const meteoScripts = [
		{ url: 'js/3rdParty/divers/suncalc.js', priority: 1 },
		{ url: 'js/Service/Meteo.js', priority: 10 },
		{ url: 'js/Model/Meteo.js', priority: 10 },
		{ url: 'js/Templates/Meteo.js', priority: 10 },
		{ url: 'js/View/Meteo.js', priority: 10 }
	];

	const flotScripts = [
		{ url: 'js/3rdParty/jQuery/jquery-3.3.1.min.js', priority: 1 },
		{ url: 'js/3rdParty/flot/jquery.canvaswrapper.js', priority: 6 },
		{ url: 'js/3rdParty/flot/jquery.flot.js', priority: 7 },
		{ url: 'js/3rdParty/flot/jquery.flot.uiConstants.js', priority: 8 },
		{ url: 'js/3rdParty/flot/jquery.flot.saturated.js', priority: 8 },
		{ url: 'js/3rdParty/flot/jquery.flot.browser.js', priority: 8 },
		{ url: 'js/3rdParty/flot/jquery.colorhelpers.js', priority: 8 },
		{ url: 'js/3rdParty/flot/jquery.flot.drawSeries.js', priority: 10 },
		{ url: 'js/3rdParty/flot/jquery.flot.categories.js', priority: 10 },
		{ url: 'js/3rdParty/flot/jquery.flot.time.js', priority: 10 },
		{ url: 'js/3rdParty/flot/jquery.flot.symbol.js', priority: 10 },
		{ url: 'js/3rdParty/flot/jquery.flot.resize.js', priority: 10 },
		{ url: 'js/3rdParty/flot/flotHelper.js', priority: 10 },
		{ url: 'js/Utils/Chart.js', priority: 10 }
	];

	const echartsScripts = [
		//{ url: 'js/3rdParty/echarts/echarts.js', priority: 7 }
		{ url: 'js/3rdParty/echarts/echarts.min.js', priority: 7 },
	];

	const boatScripts = [
		{ url: 'js/Model/Boat.js', priority: 10 },
		{ url: 'js/Templates/Boat.js', priority: 10 },
		{ url: 'js/View/Boat.js', priority: 10 }
	];

	const logbookScripts = [
		{ url: 'js/3rdParty/RC/RC.ImageGallery.js', priority: 10 },
		{ url: 'js/Model/Logbook.js', priority: 10 },
		{ url: 'js/Templates/Logbook.js', priority: 10 },
		{ url: 'js/Templates/Diary.js', priority: 10 },
		{ url: 'js/View/Logbook.js', priority: 10 },
		{ url: 'js/View/Diary.js', priority: 10 },
		{ url: 'js/3rdParty/divers/zingtouch.js', priority: 5}
	];

	const statsScripts = [
		{ url: 'js/Templates/Stats.js', priority: 10 },
		{ url: 'js/View/Stats.js', priority: 10 }		
	];

	const mediaScripts = [
		{ url: 'js/View/Media.js', priority: 10 },
		{ url: 'js/Templates/Media.js', priority: 10 }
	];

	const settingsScripts = [
		{ url: 'js/View/Settings.js', priority: 10 },
		{ url: 'js/Templates/Settings.js', priority: 10 },
		{ url: 'js/3rdParty/divers/analogclock.js', priority: 10 }
	];

	const toolsScripts = [
		{ url: 'js/Model/Tools.js', priority: 10 },
		{ url: 'js/View/Tools.js', priority: 10 },
		{ url: 'js/Templates/Tools.js', priority: 10 }
	];

	const adminScripts = [
		{ url: 'js/Model/Admin.js', priority: 10 },
		{ url: 'js/View/Admin.js', priority: 10 },
		{ url: 'js/Templates/Admin.js', priority: 10 },
		{ url: 'js/3rdParty/divers/analogclock.js', priority: 10 }
	];

	const analyzeScripts = [
		{ url: 'js/Model/Analyze.js', priority: 10 },
		{ url: 'js/View/Analyze.js', priority: 10 },
		{ url: 'js/Templates/Analyze.js', priority: 10 }
	];

	/**
	 * Main entry point to dynamically load script files and load the
	 * right page content based on a querystring.
	 */
	var PageLoader = function () {
		this.page = null;
		this.loadPage();

	};

	PageLoader.prototype = {

		loadPage: function () {
			PiLot.Utils.Language.applyHTMLLanguage();
			const urlKey = RC.Utils.getUrlParameter(PAGEKEY);
			this.page = this.getPage(urlKey) || pages.home;
			let pageScripts = this.getPageScripts();
			this.addLanguageReference(pageScripts.dependencies);
			new PiLot.Utils.Loader.ScriptLoader(pageScripts.dependencies, this.onScriptsLoaded.bind(this, pageScripts.startAction));
		},

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
		* Defines the scripts needed for each page, and the action to be called when all scripts
	    * have loaded. It will return both of them in one object {dependencies, startAction};
	    * I would have found a configuration-based approach somehow nicer than the code-based
	    * one, but this is way cheaper. 
		* */
		getPageScripts: function() {
			let dependencies;
			let startAction;
			switch (this.page) {
				case pages.empty:
					dependencies = [defaultScripts];
					startAction = function () { };
					break;
				case pages.home:
					dependencies = [defaultScripts, navScripts, meteoScripts, boatScripts, logbookScripts, flotScripts];
					startAction = function () { new PiLot.View.Common.StartPage(); };
					break;
				case pages.map:
					dependencies = [defaultScripts, navScripts];
					startAction = function () { new PiLot.View.Map.MapPage(); };
					break;
				case pages.nav:
					dependencies = [defaultScripts, navScripts];
					startAction = function () { new PiLot.View.Nav.NavPage(); };
					break;
				case pages.routes:
					dependencies = [defaultScripts, navScripts];
					startAction = function () { new PiLot.View.Nav.RoutesList(); };
					break;
				case pages.routeDetails:
					dependencies = [defaultScripts, navScripts];
					startAction = function () { new PiLot.View.Nav.RouteDetail(); };
					break;
				case pages.measurements:
					dependencies = [defaultScripts, meteoScripts, flotScripts, navScripts];
					startAction = function () { new PiLot.View.Meteo.SensorsPage(); };
					break;
				case pages.logbook:
					dependencies = [defaultScripts, navScripts, meteoScripts, boatScripts, logbookScripts];
					startAction = function () { new PiLot.View.Logbook.LogbookPage(); };
					break;
				case pages.diary:
					dependencies = [defaultScripts, navScripts, boatScripts, logbookScripts, toolsScripts, flotScripts];
					startAction = function () { new PiLot.View.Diary.DiaryPage(); };
					break;
				case pages.publish:
					dependencies = [defaultScripts, navScripts, boatScripts, logbookScripts];
					startAction = function () { new PiLot.View.Diary.PublishDiaryPage(); };
					break;
				case pages.stats:
					dependencies = [defaultScripts, navScripts, boatScripts, echartsScripts, statsScripts];
					startAction = function () { new PiLot.View.Stats.TrackStatsPage(); };
					break;
				case pages.games:
					dependencies = [defaultScripts, mediaScripts];
					startAction = function () { new PiLot.View.Media.GamesOverviewPage(); }
					break;
				case pages.library:
					dependencies = [defaultScripts, mediaScripts];
					startAction = function () { new PiLot.View.Media.LibraryPage(); }
					break;
				case pages.tools:
					dependencies = [defaultScripts, toolsScripts];
					startAction = function () { new PiLot.View.Tools.ToolsOverviewPage(); };
					break;
				case pages.analyze:
					dependencies = [defaultScripts, navScripts, logbookScripts, logbookScripts, analyzeScripts];
					startAction = () => new PiLot.View.Analyze.AnalyzePage(); 
					break;
				case pages.data:
					dependencies = [defaultScripts, navScripts, flotScripts, toolsScripts, boatScripts];
					startAction = function () { new PiLot.View.Tools.GpsImportExportForm(); };
					break;
				case pages.tiles:
					dependencies = [defaultScripts, navScripts, toolsScripts];
					startAction = function () { new PiLot.View.Tools.TilesDownloadForm(); };
					break;
				case pages.pois:
					dependencies = [defaultScripts, navScripts, toolsScripts];
					startAction = function () { new PiLot.View.Tools.PoisManagementPage(); };
					break;
				case pages.settings:
					dependencies = [defaultScripts, settingsScripts];
					startAction = function () { new PiLot.View.Settings.SettingsOverviewPage(); };
					break;
				case pages.boatTime:
					dependencies = [defaultScripts, settingsScripts];
					startAction = function () { new PiLot.View.Settings.BoatTimePage(); };
					break;
				case pages.boat:
					dependencies = [defaultScripts, boatScripts];
					startAction = function () { new PiLot.View.Boat.BoatPage(); };
					break;
				case pages.language:
					dependencies = [defaultScripts, settingsScripts];
					startAction = function () { new PiLot.View.Settings.LanguagePage(); };
					break;
				case pages.admin:
					dependencies = [defaultScripts, adminScripts];
					startAction = function () { new PiLot.View.Admin.AdminOverviewPage(); };
					break;
				case pages.wifi:
					dependencies = [defaultScripts, adminScripts];
					startAction = function () { new PiLot.View.Admin.WiFiPage(); };
					break;
				case pages.services:
					dependencies = [defaultScripts, adminScripts];
					startAction = function () { new PiLot.View.Admin.ServicesPage(); };
					break;
				case pages.systemStatus:
					dependencies = [defaultScripts, adminScripts, flotScripts];
					startAction = function () { new PiLot.View.Admin.SystemStatusPage(); }
					break;
				case pages.logs:
					dependencies = [defaultScripts, adminScripts];
					startAction = function () { new PiLot.View.Admin.LogFilesPage(); }
					break;
				case pages.systemTime:
					dependencies = [defaultScripts, adminScripts];
					startAction = function () { new PiLot.View.Admin.BoatTimePage(); };
					break;
				case pages.shutDown:
					dependencies = [defaultScripts, adminScripts];
					startAction = function () { new PiLot.View.Admin.ShutdownPage(); };
					break;
				default:
					startAction = function () { alert(`Unknown page: ${page}`); };
					break;

			}
			let dependenciesFlat = new Array();
			dependencies.forEach(function (item) {
				item.forEach(function (innerItem) {
					if (!dependenciesFlat.includes(innerItem)) {
						dependenciesFlat.push(innerItem);
					}
				});				
			});
			return { dependencies: dependenciesFlat, startAction: startAction };
		},

		/**
		 * This adds the language-specific texts depending on the current language
		 * @param {Array} pDependencies - The flat array with dependencies: Array of {url, priority}
		 */
		addLanguageReference: function (pDependencies) {
			const langKey = PiLot.Utils.Language.getLanguage();
			pDependencies.push({ url: `js/Texts/${langKey}.js`, priority: 1 });
		},

		/**
		 * This is called, as soon as all script dependencies have loaded. It does
		 * some preparation work, calls the start function of the page, and adds
		 * the menu and clock (this is done at the end so that the start action
		 * can set the active menu item manually if it wants to do so)
		 * @param {Function} pStartAction - the action to call to initialize the current page
		 */
		onScriptsLoaded: async function (pStartAction) {
			PiLot.log = PiLot.Utils.Common.log;
			PiLot.Utils.Common.getLogLevel(); // todo: can we do this on demand? why here??
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			await authHelper.loadPermissionsAsync()
			if (authHelper.getPermissions().getCanRead()) {
				this.showPage(pStartAction);
			} else {
				const loginForm = PiLot.View.Common.getLoginForm();
				loginForm.on('loginSuccess', this.showPage.bind(this, pStartAction));
			}
		},

		/**
		 * Calls the start Action, draws the default controls and does stuff that needs be done
		 * @param {any} pStartAction
		 */
		showPage: function (pStartAction) {
			pStartAction();
			this.addDefaultControls();
			RC.Utils.handleActiveStyles();
		},

		/**
		 * Draws the menu and the clock
		 * */
		addDefaultControls: function() {
			new PiLot.View.Common.Clock();
			PiLot.View.Common.ClockOffsetIcon.getInstance();
			new PiLot.View.Common.MainMenuHamburger();
			new PiLot.View.Common.UserIcon();
			new PiLot.View.Common.DayNightIcon();
			PiLot.View.Admin.WiFiIcon.getInstance();
			new PiLot.View.Nav.GPSIcon();
		}
	};

	/** @callback onLoadedCallback - a simple parameterless function **/
	/**
	 * This helps with dynamically loading javascript references. It loads
	 * scripts based on a priority, allowing to first load base scripts, on
	 * which other scripts might depend. As we dynamically add the scripts
	 * tags to the head, the browser seems not to ensure that files are 
	 * processed in a given order, instead processes every file, as soon
	 * as it is loaded, thus sometimes looking to early and stumbles.
	 * @param {any} pScriptReferences - Array of objects with {url: string, priority: int >= 0} 
	 * @param {onLoadedCallback} pOnLoaded - the function to call when all scripts have been loaded
	 */
	var ScriptLoader = function (pScriptReferences, pOnLoaded) {
		this.onLoaded = pOnLoaded;
		this.pendingScripts = 0;				// when 0, all scripts of a group of scripts with the same priority have been loaded
		this.referencesByPriority = null;		// an array of {piority: int, references: Array of string}, clustering the dependencies by priority
		this.loadScripts(pScriptReferences);
	};

	ScriptLoader.prototype = {

		/**
		 * Main entry point. This will start do dynamically load
		 * the script references, which when done triggers onDone
	     * @param {Array} pReferences - an array of {priority: Int, url: String}
		 * */
		loadScripts: function (pReferences) {
			this.groupByPriority(pReferences);
			this.loadNextPriority();
		},

		/**
		 * Converts this.scriptReferences, of which each has a priority, into
		 * groups of scripts with the same priority
		 * @param {Array} pReferences - an array of {priority: Int, url: String}
		 * */
		groupByPriority: function (pReferences) {
			const map = new Map(); // we first use a map for grouping because of the quick access
			for (let i = 0; i < pReferences.length; i++) {
				if (!map.has(pReferences[i].priority)) {
					map.set(pReferences[i].priority, new Array());
				}
				map.get(pReferences[i].priority).push(pReferences[i].url);
			}
			this.referencesByPriority = new Array();
			map.forEach(function (v, k) {
				this.referencesByPriority.push({ priority: k, references: v });
			}.bind(this));
			this.referencesByPriority.sort((a, b) => b.priority - a.priority); // we sort descending, which makes it easy to pop
		},

		/**
		 * Loads all scripts for the currently highest priority. When done, calls
		 * this.onLoaded
		 * */
		loadNextPriority: function () {
			if (this.referencesByPriority.length > 0) {
				const references = this.referencesByPriority.pop().references;
				references.forEach(function (r) {
					this.addScriptReference(r);
				}.bind(this));
			} else {
				this.onLoaded();
			}
		},

		/**
		 * Adds a script reference for a js file. Attaches a load handler
		 * which will check if that is the last script, and if so, call 
		 * the onScriptsLoaded function, which will do the right stuffs 
		 * depending on the current page. Note: I tried doing all this in
		 * one flush (adding several script elements to the head), but
		 * this did not trigger loading the script files.
		 * @param {string} pFileUrl - The url of the file to load 
		 */
		addScriptReference: function (pFileUrl) {
			const head = document.querySelector('head');
			if (!head.querySelector(`[src="${pFileUrl}"]`)) {
				let scriptElement = document.createElement('script');
				scriptElement.src = pFileUrl;
				scriptElement.type = 'text/javascript';
				scriptElement.addEventListener('load', this.onScriptLoaded.bind(this));
				this.pendingScripts++;
				head.append(scriptElement);
			}
		},

		/**
		 * this is called for each script on load. If all scripts for the
		 * priority have been loaded, it goes to the next priority. If
		 * there is no priority left, it calls the this.onLoaded
		 * */
		onScriptLoaded: function () {
			this.pendingScripts--;
			if (this.pendingScripts === 0) {
				this.loadNextPriority();
			}
		}
	};

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
		ScriptLoader: ScriptLoader,
		pages: pages,
		getContentArea: getContentArea,
		getIconsArea: getIconsArea,
		createPageLink: createPageLink
	};

})();