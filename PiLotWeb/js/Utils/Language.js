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
	 * Gets the text for pKey in the current language, or null.
	 * @param {String} pKey - The key of the requested element 
	 */
	getText: function (pKey) {
		let obj = PiLot.Texts[pKey];
		return obj ? obj.text : null;
	},

	/** Sets the lang attribute of the html element to the current language */
	applyHTMLLanguage: function () {
		document.documentElement.setAttribute('lang', this.getLanguage());
	},

	/**
	 * This applies all texts from the loaded resources file to either pControl, if 
	 * has a data-key attribute, or to all elements within pControl that
	 * have a data-key attribute. Depending on the type of the element, the
	 * innerText, alt, title etc will be set
	 * @param {HTMLElement} pControl - The Element or its children will be processed.
	 */
	applyTexts: function (pControl) {
		if ("key" in pControl.dataset) {
			this.applyTextsToControl(pControl);
		} else {
			pControl.querySelectorAll('[data-key]').forEach(e => PiLot.Utils.Language.applyTextsToControl(e));
		}
	},

	/**
	 * This applies text text from the loaded resources file to one control, based
	 * on its data-key attribute. Depending on the type of the element, the
	 * innerText, alt, title etc will be set
	 * @param {HTMLElement} pControl - The Element that will be processed.
	 * @param {String} pKey - optionally pass the key instead of reading data-key
	 */
	applyTextsToControl: function (pControl, pKey = null) {
		const key = pKey || pControl.dataset.key;
		const obj = PiLot.Texts[key];
		if (obj) {
			if (obj.text) {
				pControl.innerText = obj.text;
			}
			if (obj.tooltip) {
				pControl.title = obj.tooltip;
			}
			if (pControl instanceof HTMLImageElement) {
				pControl.src = obj.src || pControl.src;
				pControl.alt = obj.alt || pControl.alt || obj.tooltip;
			}
			if (pControl instanceof HTMLInputElement) {
				pControl.placeholder = obj.placeholder || pControl.placeholder;
			}
		} else {
			PiLot.log(`Unknown key: ${key}`, 0);
		}
	}
};