/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

/**
 * Namespace with GUIs for settings functionality
 * */
PiLot.View.Settings = (function () {

	/**
	 * The very basic page with just tiles
	 * */
	var SettingsOverviewPage = function () {
		this.draw();
	};

	SettingsOverviewPage.prototype = {

		/** Draws the page and sets the link urls based on the Loader logic */
		draw: function () {
			let loader = PiLot.Utils.Loader;
			PiLot.View.Common.setCurrentMainMenuPage(loader.pages.settings.overview);
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Settings.settingsOverviewPage);
			loader.getContentArea().appendChild(pageContent);
			const lnkTime = pageContent.querySelector('.lnkTime');
			lnkTime.setAttribute('href', loader.createPageLink(loader.pages.boatTime));
			RC.Utils.showHide(lnkTime, PiLot.Permissions.canChangeSettings());
			const lnkBoatConfig = pageContent.querySelector('.lnkBoatConfig');
			lnkBoatConfig.setAttribute('href', loader.createPageLink(loader.pages.boat));
			RC.Utils.showHide(lnkBoatConfig, PiLot.Permissions.canChangeSettings());
			pageContent.querySelector('.lnkLanguage').setAttribute('href', loader.createPageLink(loader.pages.language));
		}
	};

	/**
	 * Represents a page which shows the current BoatTime and allows to change it
	 */
	var BoatTimePage = function () {

		this.boatTime = null;					// the current BoatTime
		this.formatString = 'yyyy-LL-dd TT';	// string used to format date/times

		this.lblBoatTime = null;				// label showing the current BoatTime
		this.lblBoatTimeOffset = null;			// label showing the UTC offset of the BoatTime
		this.btnMinus = null;					// button to reduce the BoatTime by 1 hour
		this.btnPlus = null;					// button to increase the BoatTime by 1 hour
		this.clockCanvas = null;				// the canvas where the clock will be drawn
		this.analogClock = null;				// the AnalogClock object representing the clock

		this.initializeAsync();
	};

	BoatTimePage.prototype = {

		initializeAsync: async function () {
			PiLot.View.Common.setCurrentMainMenuPage(PiLot.Utils.Loader.pages.settings);
			this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.draw();
			this.showTime();
			this.startTimer();
		},

		btnMinus_click: function () {
			this.changeBoatTime(-1);
		},

		btnPlus_click: function () {
			this.changeBoatTime(1);
		},

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			contentArea.appendChild(PiLot.Utils.Common.createNode(PiLot.Templates.Settings.boatTimePage));
			contentArea.querySelector('.lnkSettings').setAttribute('href', loader.createPageLink(loader.pages.settings));
			this.lblBoatTime = contentArea.querySelector('#lblBoatTime');
			this.lblBoatTimeOffset = contentArea.querySelector('#lblBoatTimeOffset');
			this.btnMinus = contentArea.querySelector('#btnMinus');
			this.btnMinus.onclick = this.btnMinus_click.bind(this);
			this.btnPlus = contentArea.querySelector('#btnPlus');
			this.btnPlus.onclick = this.btnPlus_click.bind(this);
			this.clockCanvas = contentArea.querySelector('#lblClientTime');
			this.analogClock = Analogclock.drawClock('clockCanvas', this.boatTime.getUtcOffsetHours(), this.boatTime.getClientErrorOffsetSeconds() * -1);
		},

		startTimer: function () {
			const milliseconds = DateTime.local().millisecond;
			window.setTimeout(function () {
				this.showTime();
				window.setInterval(this.showTime.bind(this), 1000);
			}.bind(this), 1010 - milliseconds);
		},

		changeBoatTime: function (pHours) {
			this.boatTime.setUtcOffset(this.boatTime.getUtcOffsetMinutes() + (pHours * 60));
			this.showBoatTime();
			this.analogClock.getClockOpts().hoursOffset = this.boatTime.getUtcOffsetHours();
		},

		showTime: function () {
			this.showBoatTime();
		},

		showBoatTime: function () {
			const boatTimeNow = this.boatTime.now();
            this.lblBoatTime.innerText = boatTimeNow.toFormat(this.formatString);
            this.lblBoatTimeOffset.innerText = boatTimeNow.toFormat('ZZZ');
		}
	};

	/** The page where the user can change the UI language */
	var LanguagePage = function () {
		this.initialize();
	};

	LanguagePage.prototype = {

		initialize: function () {
			this.draw();
		},

		draw: function () {
			const loader = PiLot.Utils.Loader;
			const contentArea = loader.getContentArea();
			const languagePage = PiLot.Utils.Common.createNode(PiLot.Templates.Settings.languagePage);
			contentArea.appendChild(languagePage);
			languagePage.querySelector('.lnkSettings').setAttribute('href', loader.createPageLink(loader.pages.settings));
			const ddlLanguages = contentArea.querySelector('.ddlLanguages');
			const languages = PiLot.Config.Language.availableLanguages.map(e => [e, e]);
			RC.Utils.fillDropdown(ddlLanguages, languages, null);
			ddlLanguages.value = PiLot.Utils.Language.getLanguage();
			ddlLanguages.addEventListener('change', this.ddlLanguages_change.bind(this));
		},

		ddlLanguages_change: function (pEvent) {
			PiLot.Utils.Language.setLanguage(pEvent.target.value);
			document.location = PiLot.Utils.Loader.createPageLink(PiLot.Utils.Loader.pages.settings);
		}
	};

	/// return the classes
	return {
		SettingsOverviewPage: SettingsOverviewPage,
		BoatTimePage: BoatTimePage,
		LanguagePage: LanguagePage
	};

})();