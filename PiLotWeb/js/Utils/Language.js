var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * Simple multilingual solution. We have one file per language (Texts.xy.js). The file contains a huge object
 * PiLot.Texts, with one field per key. That object contains the text, src, tooltip and alt text. Each HTML 
 * Element that has a data-key attribute will be translated, which means the texts etc. will be applied, if
 * available. The loader is responsible for making sure that exactly one of the language files is loaded.
 * */

PiLot.Utils.Language = {

	languageKey: "PiLot.Utils.Language.selectedLanguage",
	defaultLanguage: "en",

	/**
	 * gets the currently selected language or the default language based on Config.js 
	 * Note: We can not use PiLot.Utils.Common.loadUserSetting, as this is used very
	 * early in the page lifecycle, when PiLot.Utils.Common won't be available yet
	 */
	getLanguage: function () {
		return localStorage.getItem(this.languageKey) || this.defaultLanguage;
	},

	/**
	 * Sets the current language for the user. The value is not validated, but it must
	 * be one of the available language keys.
	 * Note: We can not use PiLot.Utils.Common.saveUserSetting, as this would jsonify
	 * the string, and we don't use .loadUserSetting, which would deserialize it.
	 * @param {String} pLanguage - the language key, such as 'en'
	 */
	setLanguage: function (pLanguage) {
		localStorage.setItem(this.languageKey, pLanguage)
	},

	/** Returns an array of all available language keys, based on Config.js */
	getLanguages: function () {
		return PiLot.Config.Language.availableLanguages;
	},

	/**
	 * This applies all texts from the loaded resources file to the elements that
	 * have a data-key attribute. Depending on the type of the element, the
	 * innerText, alt, title etc will be set
	 * @param {HTMLElement} pControl - The Element and its children will be processed.
	 */
	applyTexts: function (pControl) {
		if (PiLot.Texts) {
			console.time("applyTexts");
			let key;
			let obj;
			document.querySelectorAll('[data-key]').forEach(function (e) {
				key = e.dataset.key;
				obj = PiLot.Texts[key];
				if (obj) {
					e.innerText = obj.text || e.innerText || key;
					e.title = obj.tooltip || e.title;
					if (e instanceof HTMLImageElement) {
						e.src = obj.src || e.src;
						e.alt = obj.alt || e.alt || obj.tooltip;
					}
				} else {
					PiLot.log(`Unknown key: ${key}`, 0);
				}
			});
			console.timeEnd("applyTexts");
		} else {
			PiLot.log(`PiLot.Texts not set. Make sure the loader loads the right Texts.xy.js file.`, 0);
		}
	}
};