var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * Namespace with some classes helping the UI presentatoion 
 * */

PiLot.Utils.Presentation = {

	Fullscreen :{

		settingsKey: 'PiLot.Settings.View.fullscreen',

		initialize: function(){
			if(this.getSetting() && !document.fullscreenElement){
				PiLot.View.Settings.FullscreenDialog.show();
			}
		},

		saveSetting: function(pEnabled){
			PiLot.Utils.Common.saveUserSetting(this.settingsKey, pEnabled);
		},

		getSetting: function(){
			return PiLot.Utils.Common.loadUserSetting(this.settingsKey);
		},

		setFullscreenAsync: async function(){
			await document.documentElement.requestFullscreen();
		},

		exitFullscreenAsync: async function(){
			document.fullscreenElement && await document.exitFullscreen();
		}
	},

	/** handles the day/night mode by storing and applying the current settings */
	NightModeHandler: {

		settingsKey: 'PiLot.Utils.Common.nightMode',

		initialize: function () {
			this.ensureNightMode();
		},

		/// sets the night mode on or off
		setNightMode: function (pNightMode) {
			PiLot.Utils.Common.saveUserSetting(this.settingsKey, pNightMode);
			document.body.classList.add('nightTransition');
			this.ensureNightMode();
		},

		/// makes sure we have the night class set to the body if necessary.
		ensureNightMode: function () {
			document.body.classList.toggle('night', this.getIsNightMode());
		},

		/** gets whether we currently are in nightmode */
		getIsNightMode: function () {
			return PiLot.Utils.Common.loadUserSetting(this.settingsKey) || false;
		}
	}
}