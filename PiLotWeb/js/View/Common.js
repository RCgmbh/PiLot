var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Common = (function () {

	const clientErrorThresholdSeconds = 10;

	/// class representing the clock which shows the current Boat Time
	var Clock = function () {
		this.lblTime = null;			/// the html element showing the time
		this.lnkWarning = null;			/// the icon which shows an invalid offset
		this.interval = null;
		this.boatTime = null;
		this.initialize();
	};

	Clock.prototype = {

		initialize: function () {
			this.draw();
			this.loadBoatTimeAsync();
		},

		/// draws the clock based on a template
		draw: function () {
			const container = document.getElementById('clock');
			container.innerHTML = PiLot.Templates.Common.clock;
			this.lblTime = container.querySelector('.lblTime');
			this.lblTime.addEventListener('mouseover', this.showTimezone.bind(this));
			this.lnkWarning = container.querySelector('.lnkWarning');
			this.lnkWarning.href = PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.system.admin.time);
		},

		/// loads the boatTime and starts the timer
		loadBoatTimeAsync: async function () {
			this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.startTimer();
			this.checkClientErrorOffset();
		},

		/// this starts a timer with an interval of 1 second, and first
		/// synchronizes it to be in sync with the full second
		startTimer: function () {
			this.showTime();
			if (this.interval) {
				window.clearInterval(this.interval);
			}
			var milliseconds = DateTime.local().millisecond;
			window.setTimeout(function () {
				this.showTime();
				window.setInterval(this.showTime.bind(this), 1000);
			}.bind(this), 1010 - milliseconds);
		},

		/// shows the current time
		showTime: function () {
			if (this.lblTime) {
				this.lblTime.innerText = this.boatTime.now().toLocaleString(DateTime.TIME_24_WITH_SECONDS);
			}
		},

		/// shows the BoatTime timezone name as tooltip
		showTimezone: function () {
			this.lblTime.title = 'Boat Time: ' + this.boatTime.getTimezoneName();
		},

		/// Checks the client error offset and shows a warning if is to big
		checkClientErrorOffset: function () {
			var clientError = this.boatTime.getClientErrorOffsetSeconds();
			RC.Utils.showHide(this.lnkWarning, Math.abs(clientError) > clientErrorThresholdSeconds);
			this.lnkWarning.title = `Client offset: ${clientError.toFixed(0)}s`;
		}
	};

	/// the start page, containing tiles / quick access items, handling the
	/// order of the items and informing them about the mode we are in. There
	/// are two modes: normal, with 4 equally sized areas, or compact, with
	/// one large main area and three small areas. Clicking on a small one
	/// then swaps the main item.
	var StartPage = function () {
		this.homeContainer = null;
		this.boatTime = null;
		this.gpsObserver = null;
		this.containers = null;				/// an array with the 4 containers where the controls have been added
		this.controls = null;				/// the PiLot.View.Whatever controls that have been added
		this.observers = null;
		this.layout = null;					/// 0: same size, 1: columns, 2: rows
		this.initialize();
	};

	StartPage.prototype = {

		initialize: function () {
			this.gpsObserver = new PiLot.Model.Nav.GPSObserver({ autoStart: false, intervalMs: 1000 });
			this.observers = RC.Utils.initializeObservers(['resize', 'changingLayout', 'changedLayout']);
			this.controls = new Array(4);
			window.addEventListener('resize', this.window_resize.bind(this));
			this.draw();
		},

		/// handles resize events of the window. Fires the resize event,
		/// and if the layout changed, fires the  changeLayout event
		window_resize: function () {
			const layout = this.getLayout();
			this.fireResize();
			if (layout != this.layout) {
				this.fireChangingLayout()
				this.layout = layout;
				this.fireChangedLayout();
			}			
		},
		/**
		 * We wait for the boatImages (the svgs) to be loaded before we start the 
		 * gps observer. This is to work around an issue of Chromium Edge, who 
		 * hiccups with long-lasting requests (the svgs) while other requests are
		 * fired. However this means if the StartPageBoatImage control loses track
		 * of them pending images, the gpsObserver might never start. So we need
		 * to keep an eye on this.
		 * */
		boatImages_loaded: function () {
			this.gpsObserver.start();
		},

		/// calls all observers that registered for pEvent. Passes this
		/// and pArg as parameters.
		notifyObservers: function (pEvent, pArg) {
			RC.Utils.notifyObservers(this, this.observers, pEvent, pArg);
		},

		/// fires the resize event
		fireResize: function () {
			this.notifyObservers('resize', null);
		},

		/// fires the changeingLayout event, which means either a change from
		/// same size to different size(or vice versa), or changing the main
		/// control will happen. Passing an argument { sameSize, mainControl }
		fireChangingLayout: function () {
			this.notifyObservers('changingLayout', { sameSize: this.layout === 0, mainControl: this.controls[0] });
		},

		/// fires the changeLayout event, which means either a change from
		/// same size to different size(or vice versa), or changing the main
		/// control just happened. Passing an argument { sameSize, mainControl }
		fireChangedLayout: function () {
			this.notifyObservers('changedLayout', { sameSize: this.layout === 0, mainControl: this.controls[0] });
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/// adds 4 divs to the container, and adds the individual items to the divs
		draw: async function () {
			let contentArea = PiLot.Utils.Loader.getContentArea();
			contentArea.appendChild(RC.Utils.stringToNode(PiLot.Templates.Common.startPage));
			this.homeContainer = contentArea.querySelector('.homeContainer');
			this.addContainers();
			this.layout = this.getLayout();
			this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.drawBoatImage();
			this.drawNavPanel();
			this.drawMeteoPanel();
			this.drawMap();
		},

		/// creats 4 containers within this.control, and adds them
		/// to this.containers. They will be used to add the
		/// controls.
		addContainers: function () {
			this.containers = new Array();
			for (var i = 0; i < 4; i++) {
				const div = document.createElement('div');
				this.homeContainer.appendChild(div);
				this.containers.push(div);
			}
		},

		/// adds the control for the boat Image
		drawBoatImage: function () {
			let boatImage = new PiLot.View.Boat.StartPageBoatImage(this.containers[2], this, this.boatTime, this.gpsObserver);
			boatImage.on('imagesLoaded', this.boatImages_loaded.bind(this));
			this.controls[2] = boatImage;
		},

		/// adds the map control
		drawMap: function () {
			this.controls[0] = new PiLot.View.Map.StartPageMap(this.containers[0], this, this.gpsObserver);
		},

		/// adds the motion Panel
		drawNavPanel: function () {
			this.controls[1] = new PiLot.View.Nav.StartPageNav(this.containers[1], this, this.boatTime, this.gpsObserver);
		},

		drawMeteoPanel: function () {
			this.controls[3] = new PiLot.View.Meteo.StartPageMeteo(this.containers[3], this, this.boatTime);
		},

		/// switches the controls order so that pControl is the first and
		/// the current first takes the place of pControl
		setMainControl: function (pControl) {
			const index = this.controls.indexOf(pControl);
			if (index > 0) {
				this.fireChangingLayout();
				this.homeContainer.removeChild(this.containers[index]);
				this.homeContainer.insertBefore(this.containers[index], this.containers[0]);
				this.containers.swap(0, index);
				this.controls.swap(0, index);
				this.fireChangedLayout();
			} else {
				PiLot.log(`could not complete setMainControl, indexOf was ${index}`, 0);
			}
		},

		/// this returns true, if not all controls have the equal size (+/-1) and pControl
		/// is not the currently maximized control
		/// @param pControl: one of the specific view controls (PiLot.View.Whatever)
		isMinimized: function (pControl) {
			return ((this.layout !== 0) && (this.controls[0] !== pControl));
		},


		/// calculates the layout. If the first and last container have more or less the same height,
		/// then it's 0 (4 equal containers). Else, we compare the height of the first container to
		/// the outer container. If there is much difference, we have a row layout, else a column
		/// layout
		getLayout: function () {
			var result = 0; // equally distributed
			var heightRatio = this.containers[0].offsetHeight / this.containers.last().offsetHeight;
			if (heightRatio > 2) { // the first container is bigger than the last 
				//var containerRatio = this.homeContainer.offsetHeight / this.containers[0].offsetHeight;
				//if (containerRatio > 1.1) { // the outer container is significantly higher than the inner
				let containerRatio = this.homeContainer.offsetHeight / this.homeContainer.offsetWidth;
				if (containerRatio > 1) {
					result = 2; // rows
				} else {
					result = 3 // columns
				}
			}
			PiLot.log(`layout is ${result}`, 3);
			return result;
		}
	};

	var mainMenuCurrentPage = null;

	/// sets the current page to higlight.
	/// this must be called before the menu is rendered
	function setCurrentMainMenuPage(pPage) {
		mainMenuCurrentPage = pPage;
	}

	/** handles the day/night mode by storing and applying the current settings */
	var NightModeHandler = function () {

		this.initialize();

	};

	NightModeHandler.prototype = {

		initialize: function () {
			this.ensureNightMode();
		},

		/// sets the night mode on or off
		setNightMode: function (pNightMode) {
			PiLot.Utils.Common.saveUserSetting('PiLot.Utils.Common.nightMode', pNightMode);
			document.body.classList.add('nightTransition');
			this.ensureNightMode();
		},

		/// makes sure we have the night class set to the body if necessary.
		ensureNightMode: function () {
			document.body.classList.toggle('night', this.getIsNightMode());
		},

		/** gets whether we currently are in nightmode */
		getIsNightMode: function () {
			return PiLot.Utils.Common.loadUserSetting('PiLot.Utils.Common.nightMode') || false;
		}

	};

	/// the main menu, containing sections and links. And also
	/// containing the day/night switch
	var MainMenu = function (pCurrentPage) {
		mainMenuCurrentPage = mainMenuCurrentPage || pCurrentPage;
		this.mainMenuControl = null;					// a html element containing the main menu items
		this.subMenuControl = null;						// a html element containing the sub menu items
		this.hamburger = null;							// a html element representing the hamburger element
		this.headerButtons = null;						// a html element representing the container with day/night switch and login icon
		this.nightModeHandler = null;
		this.isExpanded = false;
		const pages = PiLot.Utils.Loader.pages;
		this.structure = [
			{
				section: pages.home,
				links: [
					{ page: pages.home, html: '<i class="icon-home"></i>' }
				]
			}, {
				section: pages.nav,
				links: [
					{ page: pages.nav.map, html: '<i class="icon-map3"></i>' },
					{ page: pages.nav.data, html: '<i class="icon-compass3"></i>' },
					{ page: pages.nav.routes, html: '<i class="icon-linegraph"></i>' }
				]
			}, {
				section: pages.logbook,
				links: [
					{ page: pages.logbook.diary, html: '<i class="icon-book3"></i>' },
					{ page: pages.logbook.logbook, html: '<i class="icon-pen2"></i>', auth: PiLot.Permissions.canWrite }
					
				]
			}, {
				section: pages.meteo,
				links: [
					{ page: pages.meteo.overview, html: '<i class="icon-thermometer"></i>' }
				]
			}, {
				section: pages.media,
				links: [
					{ page: pages.media.games, html: '<i class="icon-gamepad"></i>' },
					{ page: pages.media.library, html: '<i class="icon-library"></i>' }
				]
			}, {
				section: pages.system,
				links: [
					{ page: pages.system.settings.overview, html: '<i class="icon-equalizer3"></i>' },
					{ page: pages.system.tools.overview, html: '<i class="icon-tools"></i>' },
					{ page: pages.system.admin.overview, html: '<i class="icon-terminal"></i>', auth: PiLot.Permissions.hasSystemAccess }
				]
			}
		];
		this.initialize();
	};

	MainMenu.prototype = {

		initialize: function () {
			this.nightModeHandler = new PiLot.View.Common.NightModeHandler();
			this.bindGlobalHandler();
			this.draw();
			const authHelper = PiLot.Model.Common.AuthHelper.instance();
			authHelper.on('login', this.authHelper_change.bind(this));
			},

		/// handles clicks on the body, collapsing the menu
		body_click: function (event) {
			if (this.isExpanded) {
				const eventSource = event.target;
				if (this.hamburger !== eventSource) {
					this.mainMenuControl.classList.toggle('expanded', false);
					this.headerButtons.classList.toggle('expanded', false);
					this.isExpanded = false;
				}
			}
		},

		authHelper_change: function () {
			this.fillMenu();
		},

		/// handles clicks on the hamburger, expand/collapsing the menu
		hamburger_click: function (e) {
			e.stopPropagation();
			this.isExpanded = !this.isExpanded;
			this.mainMenuControl.classList.toggle('expanded', this.isExpanded);
			this.headerButtons.classList.toggle('expanded', this.isExpanded);
		},

		/// handles clicks on the "day mode" button
		btnDayMode_click: function () {
			this.nightModeHandler.setNightMode(false);
		},

		/// handles clicks on the "night mode" button
		btnNightMode_click: function () {
			this.nightModeHandler.setNightMode(true);
		},

		/// binds the click handler to the body
		bindGlobalHandler: function () {
			document.body.addEventListener('click', this.body_click.bind(this));
		},

		/// draws the entire menu and submenu.
		draw: function () {
			this.hamburger = RC.Utils.stringToNode(PiLot.Templates.Common.mainMenuHamburger);
			document.querySelector('#hamburger').appendChild(this.hamburger);
			this.hamburger.addEventListener('click', this.hamburger_click.bind(this));
			this.mainMenuControl = document.querySelector('#mainMenu');
			this.subMenuControl = document.querySelector('#subMenu')
			this.headerButtons = document.querySelector('#headerButtons');
			this.fillMenu();
			let dayNightButtons = RC.Utils.stringToNodes(PiLot.Templates.Common.dayNightButtons);
			this.headerButtons.appendChildren(dayNightButtons);
			this.headerButtons.querySelector('.btnDayMode').addEventListener('click', this.btnDayMode_click.bind(this));
			this.headerButtons.querySelector('.btnNightMode').addEventListener('click', this.btnNightMode_click.bind(this));
			PiLot.Utils.Language.applyTexts(this.hamburger);
			PiLot.Utils.Language.applyTexts(this.mainMenuControl);
			PiLot.Utils.Language.applyTexts(this.subMenuControl);
			PiLot.Utils.Language.applyTexts(this.headerButtons);
		},

		fillMenu: function() {
			let sectionControl;
			let mainMenuLink;
			let subMenuLink;
			let isCurrentSection;
			let isCurrentPage;
			this.mainMenuControl.clear();
			this.subMenuControl.clear();
			this.structure.forEach(function (pElement) {
				if (typeof pElement.auth === 'undefined' || pElement.auth()) {
					sectionControl = RC.Utils.stringToNode(PiLot.Templates.Common.mainMenuSection);
					this.mainMenuControl.appendChild(sectionControl);
					isCurrentSection = (mainMenuCurrentPage === pElement.section);
					isCurrentPage = false;
					pElement.links.forEach(function (pLink, pIndex, pLinks) {
						if (typeof pLink.auth === 'undefined' || pLink.auth()) {
							mainMenuLink = RC.Utils.stringToNode(PiLot.Templates.Common.mainMenuLink);
							sectionControl.appendChild(mainMenuLink);
							mainMenuLink.innerHTML = (pLink.html);
							mainMenuLink.setAttribute('href', PiLot.Utils.Loader.createPageLink(pLink.page));
							isCurrentPage = pLink.page === mainMenuCurrentPage;
							isCurrentSection = isCurrentSection || isCurrentPage;
							mainMenuLink.classList.toggle('active', isCurrentPage);
						}
					}.bind(this));
					if (isCurrentSection && (pElement.links.length > 1)) { // create the sub menu links by simply cloning the main menu links
						sectionControl.childNodes.forEach(function (aNode) {
							subMenuLink = aNode.cloneNode(true);
							this.subMenuControl.appendChild(subMenuLink);
						}.bind(this));
					}
					sectionControl.classList.toggle('active', isCurrentSection);
				}
			}.bind(this));

		}
	};

	/// a control consisting of four buttons with arrow keys, used to play
	///	snake without keyboard.The buttons can be shown / hidden and can be
	///	freely moved on the screen.However, they don't work for too many
	/// scenarios as there seems no way of 100 % simulate a key stroke
	var TouchButtons = function (pOptions) {
		this.showButtons = false;
		this.fixButtons = false;
		this.buttonsClass = null;
		this.optionsPanel = null;
		this.btnFixButtons = null;
		this.btnShowButtons = null;
		this.buttons = new Array();
		this.initialize(pOptions);
	};

	TouchButtons.prototype = {

		initialize: function (pOptions) {
			this.readOptions(pOptions);
			this.loadSettings();
			this.draw();
			this.applyShowButtons();
			this.applyFixButtons();
		},

		readOptions: function (pOptions) {
			if (pOptions) {
				this.buttonsClass = pOptions.buttonsClass || this.buttonsClass;
			}
		},

		draw: function () {
			this.optionsPanel = $(PiLot.Templates.Common.touchButtonsOptions);
			$('body').prepend(this.optionsPanel);
			this.optionsPanel.find('.expandCollapse').on('click', this.btnExpandCollapse_click.bind(this));
			this.btnShowButtons = this.optionsPanel.find('.btnShowButtons');
			this.btnShowButtons.on('click', this.btnShowHideButtons_click.bind(this));
			this.btnFixButtons = this.optionsPanel.find('.btnFixButtons');
			this.btnFixButtons.on('click', this.btnFixButtons_click.bind(this));
			this.buttons.push(this.drawButton(PiLot.Templates.Common.touchButtonUp, "ArrowUp"));
			this.buttons.push(this.drawButton(PiLot.Templates.Common.touchButtonDown, "ArrowDown"));
			this.buttons.push(this.drawButton(PiLot.Templates.Common.touchButtonLeft, "ArrowLeft"));
			this.buttons.push(this.drawButton(PiLot.Templates.Common.touchButtonRight, "ArrowRight"));
		},

		drawButton: function (pTemplate, pKeyCode) {
			var button = $(pTemplate);
			$('body').prepend(button);
			button.find('.button').on('click', this.arrowButton_click.bind(this, button, pKeyCode));
			if (this.buttonsClass) {
				button.addClass(this.buttonsClass);
			}
			button.draggable({ handle: '.dragHandle' })
			return button;
		},

		btnShowHideButtons_click: function () {
			this.showButtons = !this.showButtons;
			this.applyShowButtons();
			this.saveSettings();
		},

		btnFixButtons_click: function () {
			this.fixButtons = !this.fixButtons;
			this.applyFixButtons();
			this.saveSettings();
		},

		arrowButton_click: function (pSender, pKey) {
			//var e = $.Event('keydown');
			var e = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: pKey });
			//e.which = pKey;
			//$(pSender).trigger(e);
			pSender[0].dispatchEvent(e);
		},

		btnExpandCollapse_click: function () {
			this.optionsPanel.classList.toggle('expanded');
		},

		loadSettings: function () {
			this.showButtons = PiLot.Utils.Common.loadUserSetting('PiLot.View.Common.TouchButtons.showButtons') || false;
			this.fixButtons = PiLot.Utils.Common.loadUserSetting('PiLot.View.Common.TouchButtons.fixButtons') || false;
		},

		saveSettings: function () {
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Common.TouchButtons.showButtons', this.showButtons);
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Common.TouchButtons.fixButtons', this.fixButtons);
		},

		applyShowButtons: function () {
			var showButtons = this.showButtons;
			this.buttons.forEach(function (button) {
				button.toggle(showButtons);
			});
			this.btnShowButtons.toggleClass('active', this.showButtons);
			this.btnFixButtons.toggle(this.showButtons);
		},

		applyFixButtons: function () {
			var fixButtons = this.fixButtons;
			this.buttons.forEach(function (button) {
				button.draggable(fixButtons ? 'disable' : 'enable');
			});
			this.btnFixButtons.toggleClass('active', this.fixButtons);
		},

		toggleOptionsPanel: function () {
			this.optionsPanel.toggleClass('expanded');
		}

	};

	/* singleton instance for loginForm (we always want to have at most one form) */
	var loginForm = null;

	/**
	 * A control used to display a login dialog, and do something
	 * as soon as the login succeeded. Usue getLoginForm instad of
	 * new LoginForm!
	 * */
	var LoginForm = function () {
		if (loginForm) {
			PiLot.Utils.Common.log('Warning: more than one login dialog have been instantiated. Use getLoginForm please', 0);
		}
		this.observers = null;
		this.control = null;
		this.pnlLoginFailed = null;
		this.pnlLoginForm = null;
		this.tbUsername = null;
		this.tbPassword = null;
		this.frmLogin = null;
		this.initialize();
	};

	LoginForm.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['loginSuccess', 'loginFailed']);
			this.draw();
		},

		/**
		 * Adds an observer which will be called once.
		 * @param {String} pEvent: loginSuccess, loginFailed
		 * @param {Function} pCallback: The callback function
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		frmLogin_submit: function (event) {
			event.preventDefault();
			this.tryLoginAsync();			
		},

		btnCancel_click: function () {
			this.closeForm();
		},

		/** draws the form and inserts it as first element in the content area */
		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Common.loginForm);
			PiLot.Utils.Loader.getContentArea().insertAdjacentElement('afterbegin', this.control);
			this.pnlLoginFailed = this.control.querySelector('.pnlLoginFailed');
			this.pnlLoginForm = this.control.querySelector('.pnlLoginForm');
			this.tbUsername = this.control.querySelector('.tbUsername');
			this.tbPassword = this.control.querySelector('.tbPassword');
			document.getElementById('frmLogin').addEventListener('submit', this.frmLogin_submit.bind(this));
			this.control.querySelector('.btnCancel').addEventListener('click', this.btnCancel_click.bind(this));
		},

		/** shows the login form */
		show: function () {
			RC.Utils.showHide(this.pnlLoginFailed, false);
			RC.Utils.showHide(this.pnlLoginForm, true);
		},

		/**
		 * Tries to log in. If the login is successful, this destroys the form and sets the global 
		 * loginForm variable to null.
		 * */
		tryLoginAsync: async function () {
			const loginSuccess = await PiLot.Model.Common.AuthHelper.instance().loginAsync(this.tbUsername.value, this.tbPassword.value);
			if (loginSuccess) {
				PiLot.log(`login succeeded`, 3);
				RC.Utils.notifyObservers(this, this.observers, 'loginSuccess', null, true);
				this.closeForm();
			} else {
				PiLot.log(`login failed`, 3);
				RC.Utils.showHide(this.pnlLoginFailed, true);
				RC.Utils.notifyObservers(this, this.observers, 'loginFailed', null, true);
			}
		},

		closeForm: function () {
			this.control.parentNode.removeChild(this.control);
			loginForm = null;
		}
	};

	/**
	 * Gets the current instance of the login Form. If there is no current
	 * instance, we create one.
	 * */
	function getLoginForm() {
		if (!loginForm) {
			loginForm = new LoginForm();
		}
		return loginForm;
	}

	/** represents an icon which, when clicked shows info about */
	var UserIcon = function () {
		this.authHelper = null;
		this.icon = null;
		this.menu = null;
		this.btnLogin = null;
		this.btnLogout = null;
		this.initialize();
	};

	UserIcon.prototype = {

		initialize: function () {
			this.authHelper = PiLot.Model.Common.AuthHelper.instance();
			this.authHelper.on('login', this.authHelper_login.bind(this));
			this.authHelper.on('logout', this.authHelper_logout.bind(this));
			this.draw();
			this.updateInfo();
		},

		icon_click: function () {
			this.menu.classList.toggle('hidden');
		},

		body_click: function (event) {
			if (!event.target.isSameOrDescendantOf(this.icon)) {
				this.hideMenu();
			}
		},

		menu_click: function (event) {
			event.stopPropagation();
		},

		btnLogin_click: function () {
			PiLot.View.Common.getLoginForm();
			this.hideMenu();
		},

		btnLogout_click: function () {
			this.authHelper.logoutAsync().then(function () {
				document.location = PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.home);
			});
		},

		authHelper_login: function () {
			this.updateInfo();
		},

		authHelper_logout: function () {
			this.updateInfo();
		},

		draw: function () {
			document.body.addEventListener('click', this.body_click.bind(this));
			const container = document.getElementById('headerButtons');
			this.icon = PiLot.Utils.Common.createNode(PiLot.Templates.Common.userMenuIcon);
			this.icon.addEventListener('click', this.icon_click.bind(this));
			this.menu = PiLot.Utils.Common.createNode(PiLot.Templates.Common.userMenu);
			this.menu.addEventListener('click', this.menu_click);
			this.btnLogin = this.menu.querySelector('.btnLogin');
			this.btnLogin.addEventListener('click', this.btnLogin_click.bind(this));
			this.btnLogout = this.menu.querySelector('.btnLogout');
			this.btnLogout.addEventListener('click', this.btnLogout_click.bind(this));
			container.appendChild(this.icon);
			container.appendChild(this.menu);
		},

		hideMenu: function () {
			RC.Utils.showHide(this.menu, false);
		},

		/** adds / removes the .active class from the icon, updates username and icons in the menu */
		updateInfo: function() {
			const permissions = this.authHelper.getPermissions();
			const username = permissions.getUsername();
			const loggedIn = username !== null;
			this.icon.classList.toggle('active', loggedIn);
			this.menu.querySelector('.lblUsername').innerText = username;
			RC.Utils.showHide(this.menu.querySelector('.lblAnonymous'), !loggedIn);
			RC.Utils.showHide(this.menu.querySelector('.icoReadAccess'), permissions.getCanRead());
			RC.Utils.showHide(this.menu.querySelector('.icoNoReadAccess'), !permissions.getCanRead());
			RC.Utils.showHide(this.menu.querySelector('.icoWriteAccess'), permissions.getCanWrite());
			RC.Utils.showHide(this.menu.querySelector('.icoNoWriteAccess'), !permissions.getCanWrite());
			RC.Utils.showHide(this.menu.querySelector('.icoSettingsAccess'), permissions.getCanChangeSettings());
			RC.Utils.showHide(this.menu.querySelector('.icoNoSettingsAccess'), !permissions.getCanChangeSettings());
			RC.Utils.showHide(this.menu.querySelector('.icoSystemAccess'), permissions.getHasSystemAccess());
			RC.Utils.showHide(this.menu.querySelector('.icoNoSystemAccess'), !permissions.getHasSystemAccess());
			RC.Utils.showHide(this.btnLogin, !loggedIn);
			RC.Utils.showHide(this.btnLogout, loggedIn);
		}
	};

	var ExpandCollapse = function (pHeader, pContent) {
		this.header = pHeader;
		this.content = pContent;
		this.lnkExpand = null;
		this.lnkCollapse = null;
		this.observers = null;
		this.initialize();
	};

	ExpandCollapse.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['expand', 'collapse']);
			this.draw();
		},

		/**
		 * Registers an observer which will be called when pEvent happens.
		 * @param {String} pEvent - "expand", "collapse"
		 * @param {Function} pCallback
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		lnkExpand_click: function (pEvent) {
			pEvent.preventDefault();
			pEvent.stopPropagation();
			this.expandCollapse(true);
		},

		lnkCollapse_click: function (pEvent) {
			pEvent.preventDefault();
			pEvent.stopPropagation();
			this.expandCollapse(false);
		},

		header_click: function (pEvent) {
			this.expandCollapse(this.content.hidden);
		},

		draw: function () {
			this.header.addEventListener('click', this.header_click.bind(this));
			this.header.classList.toggle('pointer', true);
			this.lnkExpand = PiLot.Utils.Common.createNode(PiLot.Templates.Common.expandIcon);
			this.header.insertAdjacentElement('afterbegin', this.lnkExpand);
			this.lnkExpand.hidden = !this.content.hidden;
			this.lnkExpand.addEventListener('click', this.lnkExpand_click.bind(this));
			this.lnkCollapse = PiLot.Utils.Common.createNode(PiLot.Templates.Common.collapseIcon);
			this.header.insertAdjacentElement('afterbegin', this.lnkCollapse);
			this.lnkCollapse.hidden = this.content.hidden;
			this.lnkCollapse.addEventListener('click', this.lnkCollapse_click.bind(this));
		},

		expandCollapse: function (pExpand) {
			this.content.hidden = !pExpand;
			this.lnkExpand.hidden = pExpand;
			this.lnkCollapse.hidden = !pExpand;
			RC.Utils.notifyObservers(this, this.observers, pExpand ? 'expand' : 'collapse', null);
		},

	};

	return {
		Clock: Clock,
		StartPage: StartPage,
		setCurrentMainMenuPage: setCurrentMainMenuPage,
		NightModeHandler: NightModeHandler,
		MainMenu: MainMenu,
		TouchButtons: TouchButtons,
		LoginForm: LoginForm,
		getLoginForm: getLoginForm,
		UserIcon: UserIcon,
		ExpandCollapse: ExpandCollapse
	};

})();