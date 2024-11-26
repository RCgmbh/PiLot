var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Boat = (function () {

	/// The boat config defines static settings for displaying
	/// an image of the boat. It is instantiated using a BoatConfig,
	/// which contains the model part and the raw config json
	/// object with all required information
	var BoatImageConfig = function (pBoatConfig) {
		this.boatConfig = pBoatConfig;	/// the boat config, needed to get the raw config object (the one loaded from the server /data)
		this.boatImageUrl = null;		///	the app-relative url to the boat image (svg)
		this.featureGuis = null;		/// a Map [featureId, Map[stateId, svgObjectId]] containing all dynamic parts of the svg
		this.initialize();
	};

	BoatImageConfig.prototype = {

		initialize: function () {
			this.readConfig();
		},

		/// this takes the raw config, which is an object loaded from a json file on the server,
		/// and creates instance variables, i.e. the featureGuis nested maps. 
		readConfig: function () {
			var rawConfig = this.boatConfig.getRawConfig();
			this.boatImageUrl = rawConfig.boatImageUrl;
			this.featureGuis = new Map();
			var featureGuis = this.featureGuis;
			rawConfig.featureGuis.forEach(function (featureItem) {
				var stateGuis = new Map();
				featureItem.guis.forEach(function (stateItem) {
					stateGuis.set(stateItem.stateId, stateItem.svgObjectId);
				});
				featureGuis.set(featureItem.featureId, stateGuis);
			});
		},

		/// gets the app relative path of the boat image (svg)
		getBoatImageUrl: function () {
			return this.boatImageUrl;
		},

		/// gets the Map (stateId, svgObjectId) for a feature, or null,
		/// if we have no feature with the given id
		getFeatureGuis: function (pFeatureId) {
			var result = null;
			if (this.featureGuis.has(pFeatureId)) {
				result = this.featureGuis.get(pFeatureId);
			}
			return result;
		},

		getBoatConfigName() {
			return this.boatConfig.getName();
		}

	};

	/// A boat Image within a link, which represents the boat and shows
	/// the current state of the boat features. It is based on
	/// a config file on the server. It expects a BoatImageConfig. Clicking
	/// the link triggers pOnClick
	var BoatImageLink = function (pBoatImageConfig, pContainer, pOnClick) {
		this.container = pContainer;				// the HTMLElement where this will be added
		this.onClick = pOnClick;					// a click handler that will be bound directly onto the svg object
		this.boatImageConfig = pBoatImageConfig;	// a config containing the imageUrl for the boat image
		this.boatSetup = null;						// the boat setup to be shown in the image
		this.imageObject = null;					// the HTMLElement representation of the <object>
		this.imageSvgDoc = null;					// the document element of the svg object; null until this.imageLoaded
		this.imageSvg = null;						// the svg element of the image; null until this.imageLoaded
		this.imageLoaded = false;					// set to true, as soon as the svg image is loaded
		this.observers = null;
		this.initialize();
	};

	BoatImageLink.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['imageLoaded']);
			this.draw();
		},

		/**
		 * Registers an observer that will be called when pEvent happens.
		 * @param {String} pEvent - 'imageLoaded'
		 * @param {Function} pCallback - The method to call
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		draw: function () {
			this.imageObject = RC.Utils.stringToNode(PiLot.Templates.Boat.boatImageLink);
			this.imageObject.addEventListener('load', this.image_load.bind(this));
			this.container.appendChild(this.imageObject);
			this.loadImage();
		},


		/** handle the "apply" event of the form, by refreshing the image */
		boatSetupForm_apply: function (pSender, pArg) {
			this.showBoatSetup(pSender.getBoatSetup());
		},

		/**
		 * This fires when the image is loaded. As it is also triggered when the object is added without
		 * the data being set, we need to check for the svg element being there
		 * */
		image_load: function () {
			this.imageSvg = this.imageObject.contentDocument.querySelector('svg');
			if (this.imageSvg) {
				PiLot.log('BoatImageLink: image loaded', 3);
				this.imageLoaded = true;
				RC.Utils.notifyObservers(this, this.observers, 'imageLoaded', null);
				this.imageSvgDoc = this.imageObject.contentDocument;
				this.setOnClick(this.onClick);
				this.imageSvgDoc.onclick = this.image_click.bind(this);
				this.applyBoatSetup();
			} else {
				this.imageLoaded = false;
				PiLot.log('BoatImageLink: image not loaded yet', 3);
			}
		},

		/** click handler for the image, calls the onClick function, if there is any. */
		image_click: function () {
			if (typeof this.onClick === 'function') {
				this.onClick.call();
			}
		},

		/**
		 * loads the svg object, if it hasn't been loaded before. As soon as
		 * it's loaded, if this.onClick is not null, this.onClick will be 
		 * attached to the svg itselft, and a pointer cursor style will be
		 * attached to the svg dom element within the svg object
		 * */
		loadImage: function () {
			if (this.boatImageConfig !== null) {
				PiLot.log('BoatImageLink: loading svg image', 3);
				this.imageObject.setAttribute('data', this.boatImageConfig.getBoatImageUrl());
			}
		},

		/** applies the current boat setup to the image */
		applyBoatSetup: function () {
			if (this.imageLoaded && (this.boatSetup !== null)) {
				PiLot.log('BoatImageLink: applying Boat setup', 3);
				this.boatSetup.getFeatureStates().forEach(function (pValue, pKey) {
					this.showFeatureState(pKey, pValue);
				}.bind(this));
			} else {
				PiLot.log('BoatImageLink: applyBoatSetup called, but not ready yet', 3);
			}
		},

		/**
		 * creates or refreshes the image, showing a certain setup.
		 * @param {PiLot.Model.Boat.BoatSetup} - pSetup
		 * */
		showBoatSetup: function (pSetup) {
			if (pSetup !== null) {
				PiLot.log('BoatImageLink: showing Boat setup', 3);
				if (this.boatImageConfig && (pSetup.getBoatConfigName() === this.boatImageConfig.getBoatConfigName())) {
					this.boatSetup = pSetup;
					this.applyBoatSetup();
				} else {
					this.boatImageConfig = new PiLot.View.Boat.BoatImageConfig(pSetup.getBoatConfig());
					this.boatSetup = pSetup;
					this.loadImage();
				}
			}
		},

		/**
		 * This shows the state of one feature on the image. it hides all
		 * feature guis that are not associated to that pStateId and shows all
		 * that are associated to pStateId
		 * @param {Number} pFeatureId
		 * @param {Number} pStateId
		 * */
		showFeatureState: function (pFeatureId, pStateId) {
			if (this.imageSvg !== null) {
				let featureGuis = this.boatImageConfig.getFeatureGuis(pFeatureId);
				if (featureGuis !== null) {
					// we first hide all guis for inactive features
					this.showHideFeatureGui(featureGuis, pStateId, false);
					// then we show the guis for all active features. This can't be done
					// in the first loop as some guis could be hidden again afterwards
					this.showHideFeatureGui(featureGuis, pStateId, true);
				}
			} else {
				PiLot.log('boatSvg is null', 2);
			}
		},

		/**
		 * Shows or hides an element of the image based on the state of the corresponding feature
		 * @param {Map} pFeatureGuis - [featureId, Map[stateId, svgObjectId]]
		 * @param {Number} pCurrentStateId - The current state of the feature to showHide
		 * @param {Boolean} pDoShow - true to show, false to hide
		 */
		showHideFeatureGui: function (pFeatureGuis, pCurrentStateId, pDoShow) {
			pFeatureGuis.forEach(function (pGuis, pStateId) {
				if (pDoShow === (pStateId === pCurrentStateId)) {
					pGuis.split(';').forEach(function (aGui) {
						let element = this.imageSvg.getElementById(aGui);
						if (element !== null) {
							element.style.display = pDoShow ? 'block' : 'none';
						} else {
							PiLot.log('Unknown element: ' + aGui, 0);
						}
					}.bind(this));
				}
			}.bind(this));
		},

		/**
		 * Attaches a boat setup form which will be shown when clicking the image,
		 * and observe its "apply" event, so that we can the refresh the image
		 * based on the form's current setup
		 * */
		attachForm: function (pBoatSetupForm) {
			this.onClick = function () {
				pBoatSetupForm.show();
			};
			pBoatSetupForm.on('apply', this.boatSetupForm_apply.bind(this));
		},

		/** 
		 * Detaches a boatSetupForm, so that nothing happens when clicking the
		 * image, and the image does not change when changing the form
		 * */
		detachForm: function (pBoatSetupForm) {
			this.onClick = null;
			pBoatSetupForm.off('apply');
		},

		/**
		 * Sets a custom handler to be called on click. If a BoatSetupForm
		 * has been attached before, it will likely not work anymore
		 * @param {Function} pHandler - the onclick handler
		 * */
		setOnClick: function (pHandler) {
			this.onClick = pHandler;
			if (this.imageSvgDoc) {
				const svgObjects = this.imageSvgDoc.getElementsByTagName('svg');
				if (svgObjects.length > 0) {
					if (typeof this.onClick === 'function') {
						svgObjects[0].setAttribute('style', "cursor:pointer")
					} else {
						svgObjects[0].setAttribute('style', "cursor:default")
					}
				}
			}
		}
	};

	/**
	 * a form allowing to change the boat settings, listing all features
	 * with dropdowns for the featureStates
	 * @param {PiLot.Model.Boat.BoatConfig} pBoatConfig - the boat config, for which the features will be shown
	 */
	var BoatSetupForm = function (pBoatConfig) {
		this.boatConfig = pBoatConfig;							// the boat config, containing all features and states
		this.boatSetup = null;								 	// the current boat setup, a PiLot.Model.Boat.BoatSetup
		this.control = null;
		this.plhFeatures = null;								// the placeholder where we will add the selectors
		this.selectors = null;									// a map with key = featureId, value = dropdown control
		this.observers = null;									// functions to call when settings change
		this.initialize();
	};

	BoatSetupForm.prototype = {

		initialize: function () {
			this.selectors = new Map();
			this.initializeObservers();
			this.draw();
		},

		initializeObservers: function () {
			this.observers = RC.Utils.initializeObservers(['show', 'hide', 'apply']);
		},

		btnOk_click: function () {
			this.apply();
		},

		btnCancel_click: function () {
			this.cancel();			
		},

		/**
		 * @param {String} pEvent - 'show', 'hide', 'apply'
		 * @param {Function} pCallback - The method to call 
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/** @param {String} pEvent - 'show', 'hide', 'apply' */
		off: function (pEvent) {
			RC.Utils.removeObservers(this.observers, pEvent);
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Boat.boatSetupForm);
			document.body.insertAdjacentElement('afterbegin', this.control);
			PiLot.Utils.Common.bindKeyHandlers(this.control, this.cancel.bind(this), this.apply.bind(this));
			this.plhFeatures = this.control.querySelector('.plhFeatures');
			const btnOk = this.control.querySelector('.btnBoatSetupOk');
			btnOk.addEventListener('click', this.btnOk_click.bind(this));
			const btnCancel = this.control.querySelector('.btnBoatSetupCancel');
			btnCancel.addEventListener('click', this.btnCancel_click.bind(this));
			if (this.boatConfig !== null) {
				this.drawSelectors();
			}
		},

		apply: function () {
			this.readInput();
			this.hide();
			RC.Utils.notifyObservers(this, this.observers, 'apply', this);
		},

		cancel: function () {
			this.showBoatSetup(this.boatSetup);
			this.hide();
		},

		show: function () {
			this.control.hidden = false;
			const firstSelector = this.plhFeatures.querySelector('select');
			if (firstSelector) {
				firstSelector.focus();
			}
			RC.Utils.notifyObservers(this, this.observers, 'show', this);
		},

		hide: function () {
			this.control.hidden = true;
			RC.Utils.notifyObservers(this, this.observers, 'hide', this);
		},

		setBoatConfig: function (pBoatConfig) {
			if ((this.boatConfig === null) || (pBoatConfig !== this.boatConfig)) {
				this.boatConfig = pBoatConfig;
				this.drawSelectors();
			}
		},

		drawSelectors: function () {
			while (this.plhFeatures.firstChild) {
				this.plhFeatures.removeChild(this.plhFeatures.lastChild);
			}
			this.selectors.clear();
			this.boatConfig.getFeatures().forEach(function (pFeature, pFeatureId) {
				const featureSelect = RC.Utils.stringToNode(PiLot.Templates.Boat.boatFeatureSelect);
				this.plhFeatures.append(featureSelect);
				featureSelect.querySelector('.lblFeatureName').innerText = pFeature.getName();
				const selFeatureStates = featureSelect.querySelector('.selFeatureStates');
				pFeature.getStates().forEach(function (aState) {
					selFeatureStates.append(new Option(aState.getName(), aState.getStateId()));
				});
				this.selectors.set(pFeatureId, selFeatureStates);
			}.bind(this));
		},

		/** @param {PiLot.Model.Boat.BoatSetup} pSetup */
		showBoatSetup: function (pSetup) {
			if (pSetup) {
				if (this.boatConfig === null) {
					this.setBoatConfig(pSetup.getBoatConfig());
				}
				if (pSetup.getBoatConfigName() === this.boatConfig.getName()) {
					this.boatSetup = pSetup;
					if (pSetup !== null) {
						pSetup.getFeatureStates().forEach(function (pValue, pKey) {
							if (this.selectors.has(pKey)) {
								this.selectors.get(pKey).value = pValue;
							}
						}.bind(this));
					}
				}
			}
		},

		readInput: function () {
			this.selectors.forEach(function (v, k, m) {
				const stateId = Number(v.value);
				this.boatSetup.setFeatureState(k, stateId);
			}.bind(this));
		},

		/** @returns {PiLot.Model.Boat.BoatSetup} the currently selected BoatSetup */
		getBoatSetup: function () {
			return this.boatSetup;
		}
	};

	/** Shows a BoatSetup (image and featureStates) in a read-only way */
	var BoatSetupDetails = function () {
		this.control = null;
		this.boatImage = null;
		this.plhFeatures = null;
		this.initialize();
	}

	BoatSetupDetails.prototype = {

		initialize: function () {
			this.draw();
		},

		/** handles clicks on the dark background by closing the dialog */
		pnlOverlay_click: function () {
			this.hide();
		},

		/** makes sure that clicks are not bubbled to the background, which would close the window */
		pnlDialog_click: function (pEvent) {
			pEvent.stopPropagation();
		},

		lnkClose_click: function (pEvent) {
			pEvent.preventDefault();
			this.hide();
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Boat.boatSetupDetails);
			document.body.insertAdjacentElement('afterbegin', this.control);
			this.control.addEventListener('click', this.pnlOverlay_click.bind(this));
			this.control.querySelector('.pnlDialog').addEventListener('click', this.pnlDialog_click.bind(this));
			this.control.querySelector('.lnkClose').addEventListener('click', this.lnkClose_click.bind(this));
			this.boatImage = new BoatImageLink(null, this.control.querySelector('.plhImage'), null);
			this.plhFeatures = this.control.querySelector('.plhFeatures');
		},

		showBoatSetup(pSetup) {
			this.boatImage.showBoatSetup(pSetup);
			this.plhFeatures.clear();
			const boatConfig = pSetup.getBoatConfig();
			let feature;
			pSetup.getFeatureStates().forEach(function (pValue, pKey) {
				const control = PiLot.Utils.Common.createNode(PiLot.Templates.Boat.boatFeatureInfo);
				feature = boatConfig.getFeatures().get(pKey);
				control.querySelector('.lblFeatureName').innerText = feature.getName();
				control.querySelector('.lblFeatureState').innerText = feature.getStates().get(pValue).getName();
				this.plhFeatures.appendChild(control);
			}.bind(this));
			document.body.classList.toggle('overflowHidden', true);
			this.control.hidden = false;
		},

		hide: function () {
			document.body.classList.toggle('overflowHidden', false);
			this.control.hidden = true;
		}
	};

	/** Page containing all available boat images allowing to select the current boat */
	var BoatPage = function () {

		this.plhBoatImages = null;
		this.initialize();
	};

	BoatPage.prototype = {

		initialize: function () {
			this.draw();
		},

		boatImage_click: function (pBoatConfig, pControl) {
			PiLot.Model.Boat.saveCurrentConfigNameAsync(pBoatConfig.name);
			this.resetActiveStyle();
			pControl.classList.toggle('active', true);
		},

		draw: function () {
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Boat.boatPage);
			const loader = PiLot.Utils.Loader;
			loader.getContentArea().appendChild(pageContent);
			pageContent.querySelector('.lnkSettings').setAttribute('href', loader.createPageLink(loader.pages.settings));
			this.plhBoatImages = pageContent.querySelector('.plhBoatImages');
			this.loadBoatImagesAsync();
		},

		loadBoatImagesAsync: async function () {
			const config = await Promise.all([
				PiLot.Model.Boat.loadConfigInfosAsync(),
				PiLot.Model.Boat.loadCurrentConfigNameAsync()
			]);
			for (const boatConfig of config[0]) {
				const imageControl = PiLot.Utils.Common.createNode(PiLot.Templates.Boat.boatImage);
				imageControl.querySelector('img').src = boatConfig.boatImageUrl;
				imageControl.querySelector('.lblConfigName').innerText = boatConfig.displayName;
				imageControl.classList.toggle('active', boatConfig.name === config[1]);
				imageControl.addEventListener('click', this.boatImage_click.bind(this, boatConfig, imageControl));
				this.plhBoatImages.appendChild(imageControl);
			}
		},

		resetActiveStyle: function () {
			for (const control of this.plhBoatImages.querySelectorAll('div')) {
				control.classList.toggle('active', false);
			}
		}
	};

	/**
	 * The control for the start page, which shows the current boat config
	 * and maybe offers quick access to config-changes which will create a logbook
	 * entry with the new config
	 * @param {HTMLElement} pContainer - a HTMLElement where the control will be inserted
	 * @param {PiLot.View.Common.StartPage} pStartPage - The start page
	 * @param {PiLot.Model.Common.BoatTime} pBoatTime - The current boat time
	 * @param {PiLot.Model.Nav.GPSObserver} pGpsObserver - a gps observer, used for new logbook entries
	 * */
	var StartPageBoatImage = function (pContainer, pStartPage, pBoatTime, pGpsObserver) {
		this.container = pContainer;
		this.startPage = pStartPage;
		this.boatTime = pBoatTime;
		this.gpsObserver = pGpsObserver;
		this.isMinimized = null;				// true, if this is only represented as small image
		this.alternativeSetupsShown = null;		// true, if the column with alternative setups is shown
		this.alternativeSetupsLoaded = false;	// true, as soon as the alternative setups have been loaded
		this.boatSetup = null;					// the boat's current setup
		this.imageConfig = null;				// the image config which will be created based on the boat config
		this.boatImageLink = null;				// the PiLot.View.Boat.BoatImageLink
		this.logbookEntryForm
		this.plhAlternativeSetups = null;		// the container for alternative images. 
		this.pendingImages = 0;					// a counter to keep track of unloaded images
		this.updateIntervalSeconds = 10;		// update interval in seconds for the boat setup
		this.updateInterval = null;
		this.initialize();
	};

	StartPageBoatImage.prototype = {

		initialize: function () {
			this.loadAndDrawAsync().then(result => {
				this.startPage.on('resize', this.startPage_resize.bind(this));
				this.startPage.on('changedLayout', this.startPage_changedLayout.bind(this));
				this.container.addEventListener('click', this.container_click.bind(this));
				PiLot.log('crating a StartPageBoatImage', 3);
			});
		},

		container_click: function (e) {
			if (this.startPage.isMinimized(this)) {
				e.stopPropagation();
				this.startPage.setMainControl(this);
			}
		},

		startPage_resize: function () {
			this.setAlternativesColumn();
		},

		/// when all images have loaded, this will fire the imagesLoaded event and
		/// start the timer to periodically refresh the boat setup
		boatImage_loaded: function () {
			this.pendingImages--;
			if (this.pendingImages === 0) {
				this.ensureUpdate();
			}
		},

		boatImage_click: function () {
			this.showLogbookEntryFormAsync();
		},

		/**
		 * Handles the changedLayout event from the StartPage, checking if we
		 * have space for the alternative setup columns
		 */
		startPage_changedLayout: function (pSender, pEventArgs) {
			var isMinimized = (!pEventArgs.sameSize && (pEventArgs.mainControl !== this));
			if (this.isMinimized !== isMinimized) {
				this.isMinimized = isMinimized;
				this.setAlternativesColumn();
				this.ensureClickHandler();
			}
		},

		/** Handles the save event of the boat setup form creating a new Logbook entry */
		logbookEntryForm_save: async function () {
			await this.loadCurrentSetupAsync();
			this.boatImageLink.showBoatSetup(this.boatSetup);
			if (this.alternativeSetupsShown) {
				this.showAlternativeBoatSetups();
			}
		},

		/** handles the show event of the logbook entry form by stopping the update interval */
		logbookEntryForm_show: function () {
			this.stopUpdate();
		},

		/** handles the hide event of the logbook entry form by starting the update interval */
		logbookEntryForm_hide: function () {
			this.ensureUpdate();
		},

		/// Loads the current Boat Config and draws the control
		loadAndDrawAsync: async function () {
			await this.loadCurrentSetupAsync();
			this.imageConfig = new PiLot.View.Boat.BoatImageConfig(this.boatSetup.getBoatConfig());
			this.draw();
		},

		/** 
		 *  Loads the current boat setup and saves it to this.boatSetup
		 */
		loadCurrentSetupAsync: async function () {
			let today = RC.Date.DateOnly.fromObject(this.boatTime.now());
			let boatSetupResult = await PiLot.Model.Logbook.loadCurrentBoatSetupAsync(today);
			if (boatSetupResult.latestBoatSetup !== null) {
				this.boatSetup = boatSetupResult.latestBoatSetup;
			} else {
				this.boatSetup = boatSetupResult.currentBoatConfig.getDefaultSetup();
			}
		},

		/// draws the control, calls loadLogbookDay wich on success will continue drawing
		/// (boat setup, alternative setups)
		draw: function () {
			if (this.imageConfig != null) {
				this.container.appendChild(RC.Utils.stringToNode(PiLot.Templates.Boat.startPageBoatImage));
				var imageContainer = this.container.querySelector('.divImageContainer');
				this.plhAlternativeSetups = this.container.querySelector('.plhAlternativeSetups');
				this.plhBoatSetupForm = this.container.querySelector('.plhBoatSetupForm');
				this.pendingImages++;
				this.boatImageLink = new PiLot.View.Boat.BoatImageLink(this.imageConfig, imageContainer, null);
				this.boatImageLink.on('imageLoaded', this.boatImage_loaded.bind(this));
				this.boatImageLink.showBoatSetup(this.boatSetup);
				this.logbookEntryForm = new PiLot.View.Logbook.LogbookEntryForm(this.gpsObserver);
				this.logbookEntryForm.on('save', this.logbookEntryForm_save.bind(this));
				this.logbookEntryForm.on('show', this.logbookEntryForm_show.bind(this));
				this.logbookEntryForm.on('hide', this.logbookEntryForm_hide.bind(this));
				this.isMinimized = this.startPage.isMinimized(this);
				this.setAlternativesColumn();
				this.ensureClickHandler();
			}
		},

		/// this makes sure that, if the control is minimized, the click handler
		/// on the image is set apropriately, and in maximized mode, the 
		/// boatSetupForm is attached
		ensureClickHandler: function () {
			if (this.isMinimized) {
				this.boatImageLink.setOnClick(function () {
					this.startPage.setMainControl(this);
				}.bind(this));
			} else {
				if (PiLot.Permissions.canWrite()) {
					this.boatImageLink.setOnClick(this.boatImage_click.bind(this));
				} else {
					this.boatImageLink.setOnClick(null);
				}
			}
		},

		/** Stops the interval that updats the boatImage */
		stopUpdate: function () {
			window.clearInterval(this.updateInterval);
		},

		/** makes sure we have a running update interval */
		ensureUpdate: function () {
			if (!this.updateInterval) {
				this.updateInterval = window.setInterval(async function () {
					await this.loadCurrentSetupAsync();
					this.boatImageLink.showBoatSetup(this.boatSetup);
				}.bind(this), this.updateIntervalSeconds * 1000);;
			}
		},

		/// shows or hides the alternatives setup column based on some magic
		setAlternativesColumn: function () {
			const showAlternatives = !this.isMinimized && this.container.clientHeight / this.container.clientWidth < 1;
			if (showAlternatives !== this.alternativeSetupsShown) {
				if (!this.alternativeSetupsLoaded && showAlternatives) {
					this.showAlternativeBoatSetups();
				}
				this.plhAlternativeSetups.classList.toggle('hidden', !showAlternatives);
				this.alternativeSetupsShown = showAlternatives;
			}
		},

		/// adds an image for the first three boatSetups that can be chosen, 
		/// which differ from the current setup
		showAlternativeBoatSetups: function () {
			this.alternativeSetupsLoaded = true;
			const boatSetups = new Array();
			const boatConfig = this.boatSetup.getBoatConfig();
			boatConfig.getBoatSetups().forEach(aBoatSetup => {
				const isCurrent = ((this.boatSetup !== null) && (this.boatSetup.equals(aBoatSetup)));
				if (!isCurrent) {
					boatSetups.push(aBoatSetup);
				}
			});
			const divAlternativeSetupTemplate = this.container.querySelector('.divAlternativeSetup');
			this.plhAlternativeSetups.clear();
			for (i = 0; i < Math.min(3, boatSetups.length); i++) {
				let divAlternativeSetup = divAlternativeSetupTemplate.cloneNode(true);
				this.plhAlternativeSetups.appendChild(divAlternativeSetup);
				this.pendingImages++;
				let clickFunction = PiLot.Permissions.canWrite() ? this.showLogbookEntryFormAsync.bind(this, boatSetups[i]) : null;
				let alternativeSetupBoatImageLink = new PiLot.View.Boat.BoatImageLink(this.imageConfig, divAlternativeSetup, clickFunction);
				alternativeSetupBoatImageLink.on('imageLoaded', this.boatImage_loaded.bind(this));
				PiLot.log('StartPageBoatImage: showing alternative setup', 3);
				alternativeSetupBoatImageLink.showBoatSetup(boatSetups[i]);
			}
			divAlternativeSetupTemplate.remove();
		},

		/**
		 * Shows the form allowing to create a logbook entry with current data and a specific BoatSetup
		 * @param {PiLot.Model.Boat.BoatSetup} pBoatSetup - The boat setup to preset
		 */
		showLogbookEntryFormAsync: async function (pBoatSetup) {
			const today = RC.Date.DateOnly.fromObject(this.boatTime.now());
			const logbookDay = await PiLot.Model.Logbook.loadLogbookDayAsync(today) || new PiLot.Model.Logbook.LogbookDay(today);
			this.logbookEntryForm.showDefaultValuesAsync(logbookDay, pBoatSetup || this.boatSetup);
		}
	};

	return {
		BoatImageConfig: BoatImageConfig,
		BoatImageLink: BoatImageLink,
		BoatSetupForm: BoatSetupForm,
		BoatSetupDetails: BoatSetupDetails,
		BoatPage: BoatPage,
		StartPageBoatImage: StartPageBoatImage
	};

})();
