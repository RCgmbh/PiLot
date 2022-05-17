var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * Simple multilingual solution. We have one file per language (Texts.xy.js). The file contains a huge object
 * PiLot.Texts, with a text per key. Each HTML Element that has a data-text or a data-title attribute will be
 * translated, which means the texts etc. will be applied, if available. The loader is responsible for making
 * sure that exactly one of the language files is loaded.
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
		return PiLot.Texts[pKey] || null;
	},

	/** Returns the locale to be used in date formatting, e.g. de-ch */
	getLocale: function () {
		return PiLot.Texts.locale;
	},

	/** Sets the lang attribute of the html element to the current language */
	applyHTMLLanguage: function () {
		document.documentElement.setAttribute('lang', this.getLanguage());
	},

	/**
	 * This makes sure all elements with a data-text-key or a data-title-key 
	 * attribute are translated.
	 * @param {HTMLElement} pControl - The Element or its children will be processed.
	 */
	applyTexts: function (pControl) {
		this.translateAttributes(pControl, 'text', 'data-text');
		this.translateAttributes(pControl, 'title', 'data-title');
	},

	/**
	 * This applies all texts from the loaded resources file to either pControl, if
	 * it has a pDataAttribute attribute, or to all elements within pControl that
	 * have a pDataAttribute attribute.
	 * @param {HTMLElement} pControl - the control to translate
	 * @param {String} pDataProperty - the name of the data attribute, e.g. textKey
	 * @param {String} pDataAttribute - the name of the html attribute, e.g. data-text-key
	 */
	translateAttributes: function (pControl, pDataProperty, pDataAttribute) {
		if (pDataProperty in pControl.dataset) {
			this.translateControlAttributes(pControl, pDataProperty);
		} else {
			pControl.querySelectorAll(`[${pDataAttribute}]`).forEach(e => PiLot.Utils.Language.translateControlAttributes(e, pDataProperty));
		}
	},

	/**
	 * This applies text text from the loaded resources file to one control, based
	 * on its data-text attribute. Depending on the type of the element, the
	 * innerText will be set
	 * @param {HTMLElement} pControl - The Element that will be processed.
	 */
	translateControlAttributes: function (pControl, pDataProperty) {
		const key = pControl.dataset[pDataProperty];
		const text = PiLot.Texts[key];
		if (text) {
			switch (pDataProperty) {
				case 'text':
					pControl.innerText = text;
					break;
				case 'title':
					if (pControl instanceof HTMLInputElement) {
						pControl.placeholder = text || pControl.placeholder;
					}
					else if (pControl instanceof HTMLImageElement) {
						pControl.alt = text || pControl.alt;
					} else {
						pControl.title = text;
					}
					break;
			}
		} else {
			PiLot.log(`Unknown key: ${key}`, 0);
		}
	}
};