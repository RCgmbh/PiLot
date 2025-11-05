/// safely initialize Namespaces
var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

/**
 * Namespace with GUIs for settings functionality
 * */
PiLot.View.Settings = (function () {

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
		this.analogClock = null;				// the AnalogClock object representing the clock

		this.initializeAsync();
	};

	BoatTimePage.prototype = {

		initializeAsync: async function () {
			this.boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.draw();
			this.showTime();
			this.startTimer();
		},

		unload: function(){
			this.stopTimer();
			this.analogClock.stop();
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
			this.lblBoatTime = contentArea.querySelector('#lblBoatTime');
			this.lblBoatTimeOffset = contentArea.querySelector('#lblBoatTimeOffset');
			this.btnMinus = contentArea.querySelector('#btnMinus');
			this.btnMinus.onclick = this.btnMinus_click.bind(this);
			this.btnPlus = contentArea.querySelector('#btnPlus');
			this.btnPlus.onclick = this.btnPlus_click.bind(this);
			this.analogClock = Analogclock.drawClock('clockCanvas', this.boatTime.getUtcOffsetHours(), this.boatTime.getClientErrorOffsetSeconds() * -1);
		},

		startTimer: function () {
			const milliseconds = DateTime.local().millisecond;
			window.setTimeout(function () {
				this.showTime();
				this.showTimeInterval = window.setInterval(this.showTime.bind(this), 1000);
			}.bind(this), 1010 - milliseconds);
		},

		stopTimer: function(){
			this.showTimeInterval && window.clearInterval(this.showTimeInterval);
			this.showTimeInterval = null;
		},

		changeBoatTime: function (pHours) {
			this.boatTime.setUtcOffset(this.boatTime.getUtcOffsetMinutes() + (pHours * 60));
			this.showBoatTime();
			this.analogClock.getClockOpts().hoursOffset = this.boatTime.getUtcOffsetHours();
			PiLot.View.Common.ClockOffsetIcon.getInstance().showStatusAsync(true);
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
		this.pnlSuccess = null;
		this.initialize();
	};

	LanguagePage.prototype = {

		initialize: function () {
			this.draw();
		},

		draw: function () {
			const contentArea = PiLot.Utils.Loader.getContentArea();
			const languagePage = PiLot.Utils.Common.createNode(PiLot.Templates.Settings.languagePage);
			contentArea.appendChild(languagePage);
			const ddlLanguages = contentArea.querySelector('.ddlLanguages');
			const languages = PiLot.Config.Language.availableLanguages.map(e => [e, e]);
			RC.Utils.fillDropdown(ddlLanguages, languages, null);
			ddlLanguages.value = PiLot.Utils.Language.getLanguage();
			ddlLanguages.addEventListener('change', this.ddlLanguages_change.bind(this));
			this.pnlSuccess = languagePage.querySelector('.pnlSuccess');
		},

		ddlLanguages_change: function (pEvent) {
			PiLot.Utils.Language.changeLanguage(pEvent.target.value);
			this.pnlSuccess.hidden = false;
		}
	};

	/// return the classes
	return {
		BoatTimePage: BoatTimePage,
		LanguagePage: LanguagePage
	};

})();