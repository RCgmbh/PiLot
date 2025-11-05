var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

/**
 * Simple multilingual solution. We have one file per language (Texts.xy.js). The file contains a huge object
 * PiLot.Texts.xy, with a text per key. Each HTML Element that has a data-text or a data-title attribute will
 * be translated, which means the texts etc. will be applied, if available. 
 * */

PiLot.Utils.Language = {

	languageKey: "PiLot.Utils.Language.selectedLanguage",
	defaultLanguage: "en",
	language: null,
	texts: null,

	/**
	 * Gets the current language, and applies it
	 */
	initializeLanguage: function(){
		this.decideLanguage();
		this.applyLanguage();
	},

	/**
	 * Defines the current language, either from the setting or based on the
	 * broser language, and applies it
	 */
	decideLanguage: function(){
		this.language = null;
		const savedLanguage = Storage && localStorage.getItem(this.languageKey);
		if(savedLanguage && this.getLanguages().includes(savedLanguage)){
			this.setLanguage(savedLanguage);
		} 
		if(!this.language) {
			for(let aBrowserLanguage of navigator.languages.map(l => l.substring(0, 2).toLowerCase())){
				if(this.getLanguages().includes(aBrowserLanguage)){
					this.setLanguage(aBrowserLanguage);
					break;
				}
			}
		}
		if(!this.language){
			this.setLanguage(this.defaultLanguage);
		}
	},
	
	
	/**
	 * gets the currently selected language or the default language based on Config.js 
	 * Note: We can not use PiLot.Utils.Common.loadUserSetting, as this is used very
	 * early in the page lifecycle, when PiLot.Utils.Common won't be available yet
	 */
	getLanguage: function () {
		//return localStorage.getItem(this.languageKey) || this.defaultLanguage;
		return this.language;
	},

	/** Changes the current language and saves it to the settings */
	changeLanguage: function(pLanguage){
		localStorage.setItem(this.languageKey, pLanguage)
		this.setLanguage(pLanguage);
	},

	/**
	 * Sets the current language for the user. 
	 * @param {String} pLanguage - the language key, such as 'en'
	 */
	setLanguage: function (pLanguage) {
		if(this.getLanguages().includes(pLanguage)){
			this.language = pLanguage;
			this.texts = PiLot.Texts[pLanguage];
			this.applyLanguage();
		} else {
			console.error(`unsupported language: ${pLanguage}`);
		}		
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
		return this.texts[pKey] || null;
	},

	applyLanguage: function(){
		this.applyHTMLLanguage();
		this.applyTexts(document.documentElement);
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
		const text = this.getText(key);
		if (text) {
			switch (pDataProperty) {
				case 'text':
					pControl.innerText = text;
					break;
				case 'title':
					if ((pControl instanceof HTMLInputElement) || (pControl instanceof HTMLTextAreaElement)) {
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