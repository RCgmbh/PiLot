var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * Simple multilingual solution. We have one file per language (Texts.xy.js). The file contains a huge object
 * PiLot.Texts.xy, with a text per key. Each HTML Element that has a data-text or a data-title attribute will
 * be translated, which means the texts etc. will be applied, if available. 
 * */

PiLot.Utils.Presentation = {

	Fullscreen :{
		settingsKey: 'PiLot.Settings.View.fullscreen',

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
		},

		initialize: function(){
			if(this.getSetting() && !document.fullscreenElement){
				PiLot.View.Settings.FullscreenDialog.show();
			}
		}
	}
}