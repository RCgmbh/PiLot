var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Boat = (function () {

	/// The boat config defines static settings for displaying
	/// an image of the boat. It is instantiated using a BoatConfig,
	/// which contains the model part, plus the raw config json
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
		this.container = pContainer;				/// the HTMLElement where this will be added
		this.onClick = pOnClick;					/// a click handler that will be bound directly onto the svg object
		this.boatImageConfig = pBoatImageConfig;	/// a config containing the imageUrl for the boat image
		this.boatSetup = null;						/// the boat setup to be shown in the image
		this.imageObject = null;					/// the HTMLElement representation of the <object>
		this.imageSvgDoc = null;					/// the document element of the svg object; null until this.imageLoaded
		this.imageLoaded = false;					/// set to true, as soon as the svg image is loaded
		this.observers = null;
		this.initialize();
	};

	BoatImageLink.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['imageLoaded']);
			if (this.container instanceof jQuery) {
				this.container = this.container.get()[0];
			}
			this.draw();
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		draw: function () {
			this.imageObject = RC.Utils.stringToNode(PiLot.Templates.Boat.boatImageLink);
			this.imageObject.addEventListener('load', this.image_load.bind(this));
			this.container.appendChild(this.imageObject);
			this.loadImage();
		},

		/// handles changes in the boatSetupForm, Expecting the sender
		/// to be the boatSetupForm
		boatSetupForm_change: function (pSender, pArg) {
			this.showBoatSetup(pSender.getBoatSetup());
		},

		/// this fires when the image is loaded. As it is also triggered when
		/// the object is added without the data being set, we need to check
		/// for the svg element being there
		image_load: function () {
			if (this.imageObject.contentDocument.querySelector('svg')) {
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

		/// click handler for the image, calls the onClick function, if
		/// there is any.
		image_click: function () {
			if (typeof this.onClick === 'function') {
				this.onClick.call();
			}
		},

		/// loads the svg object, if it hasn't been loaded before. As soon as
		/// it's loaded, if this.onClick is not null, this.onClick will be 
		/// attached to the svg itselft, and a pointer cursor style will be
		/// attached to the svg dom element within the svg object
		loadImage: function () {
			if (this.boatImageConfig !== null) {
				PiLot.log('BoatImageLink: loading svg image', 3);
				this.imageObject.setAttribute('data', this.boatImageConfig.getBoatImageUrl());
			}
		},

		/// applies the current boat setup to the image
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

		/// creates or refreshes the image, showing a certain setup, if the setup
		/// refers to the same boat config as this.
		/// pSetup is a PiLot.Model.Boat.BoatSetup
		showBoatSetup: function (pSetup) {
			if (pSetup !== null) {
				PiLot.log('BoatImageLink: showing Boat setup', 3);
				if (this.boatImageConfig === null) {
					this.boatImageConfig = new PiLot.View.Boat.BoatImageConfig(pSetup.getBoatConfig());
					this.boatSetup = pSetup;
					this.loadImage();
				} else if (pSetup.getBoatConfigName() === this.boatImageConfig.getBoatConfigName()) {
					this.boatSetup = pSetup;
					this.applyBoatSetup();
				}
			}
		},

		/// this shows the state of one feature on the image. it hides all
		/// feature guis that are not associated to that pStateId and shows all
		/// that are associated to pStateId
		showFeatureState: function (pFeatureId, pStateId) {
			var boatSvg = this.imageObject.contentDocument.querySelector('svg');
			if (boatSvg !== null) {
				var featureGuis = this.boatImageConfig.getFeatureGuis(pFeatureId);
				if (featureGuis !== null) {
					// we first hide all guis for inactive features
					this.showHideFeatureGui(boatSvg, featureGuis, pStateId, false);
					// then we show the guis for all active features. This can't be done
					// in the first loop as some guis could be hidden again afterwards
					this.showHideFeatureGui(boatSvg, featureGuis, pStateId, true);
				}
			} else {
				PiLot.log('boatSvg is null', 2);
			}
		},

		showHideFeatureGui: function (pBoatSvg, pFeatureGuis, pCurrentStateId, pDoShow) {
			pFeatureGuis.forEach(function (pGuis, pStateId) {
				if (pDoShow === (pStateId === pCurrentStateId)) {
					pGuis.split(';').forEach(function (aGui) {
						var element = pBoatSvg.getElementById(aGui);
						if (element !== null) {
							element.style.display = pDoShow ? 'block' : 'none';
						} else {
							PiLot.log('Unknown element: ' + aGui, 0);
						}
					});
				}
			});
		},

		/// attaches a boat setup form which will be shown when clicking the image
		attachForm: function (pBoatSetupForm) {
			this.onClick = function () {
				pBoatSetupForm.showHide();
			};
			this.showBoatSetup(pBoatSetupForm.getBoatSetup());
			pBoatSetupForm.on('change', this.boatSetupForm_change.bind(this));
		},

		/// detaches a boatSetupForm, so that nothing happens when clicking the
		/// image, and the image does not change when changing the form
		detachForm: function (pBoatSetupForm) {
			this.onClick = null;
			pBoatSetupForm.off('change');
		},

		/// sets a custom handler to be called on click. If a BoatSetupForm
		/// has been attached before, it will likely not work anymore
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

	/// a form allowing to change the boat settings, listing all features
	/// with dropdowns for the featureStates
	/// @param pBoatConfig: the boat config, for which the features will be shown
	/// @param pContainer: a HTMLElement object to which the form will be appended
	/// @param pShowSaveButton: if true, a button will be shown at the end of the form, triggering the "save" event
	var BoatSetupForm = function (pBoatConfig, pContainer, pShowSaveButton = false) {
		this.boatConfig = pBoatConfig;							// the boat config, containing all features and states
		this.boatSetup = null;								 	// the current boat setup, a PiLot.Model.Boat.BoatSetup
		this.container = pContainer;							// the container containing this, HTMLElement
		this.plhFeatures = null;								// the placeholder where we will add the selectors
		this.showSaveButton = pShowSaveButton;					// decides whether to show the save button
		this.selectors = null;									// a map with key = featureId, value = dropdown control ($)
		this.observers = null;									// functions to call when settings change
		this.initialize();
	};

	BoatSetupForm.prototype = {

		initialize: function () {
			this.selectors = new Map();
			this.initializeObservers();
			this.bindGlobalHandlers();
			this.draw();
		},

		bindGlobalHandlers: function () {
			document.body.addEventListener('click', this.body_click.bind(this));
			this.container.addEventListener('click', this.container_click.bind(this));
		},

		initializeObservers: function () {
			this.observers = RC.Utils.initializeObservers(['show', 'change', 'save', 'close']);
		},

		body_click: function (event) {
			$(this.container).fadeOut('fast');
			RC.Utils.notifyObservers(this, this.observers, 'close', this);
		},

		lnkSave_click: function () {
			RC.Utils.notifyObservers(this, this.observers, 'save', this);
		},

		/// stops propagation for all clicks within the container, so that 
		/// we don't close the form by triggering body_click
		container_click: function (event) {
			event.stopPropagation();
		},

		/// handles changes to a dropdown with feature states
		selFeatureStates_change: function (pFeatureId, pDropdown) {
			const stateId = Number(pDropdown.value);
			this.boatSetup.setFeatureState(pFeatureId, stateId);
			RC.Utils.notifyObservers(this, this.observers, 'change', pFeatureId);
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/// removes all registered observers for a certain event
		off: function (pEvent) {
			RC.Utils.removeObservers(this.observers, pEvent);
		},

		showHide: function () {
			if (RC.Utils.isVisible(this.container)) {
				$(this.container).fadeOut('fast');
				RC.Utils.notifyObservers(this, this.observers, 'hide', this);
			} else {
				$(this.container).fadeIn('fast');
				RC.Utils.notifyObservers(this, this.observers, 'show', this);
			}
		},

		/// draws the control based on two templates, one for the container
		/// of the entire control, one for the repeating section of dropdowns
		/// for the feature states
		draw: function () {
			const control = PiLot.Utils.Common.createNode(PiLot.Templates.Boat.boatSetupForm);
			this.container.append(control);
			this.plhFeatures = control.querySelector('.plhFeatures');
			const lnkSave = control.querySelector('.lnkSave');
			RC.Utils.toggleClass(lnkSave, 'hidden', !this.showSaveButton);
			lnkSave.addEventListener('click', this.lnkSave_click.bind(this));
			if (this.boatConfig !== null) {
				this.drawSelectors();
			}
		},

		/// sets the boatConfig and draws the feature selectors if necessary
		setBoatConfig: function (pBoatConfig) {
			if ((this.boatConfig === null) || (pBoatConfig !== this.boatConfig)) {
				this.boatConfig = pBoatConfig;
				this.drawSelectors();
			}
		},

		/// adds the dropdowns with the states for each feature
		drawSelectors: function () {
			while (this.plhFeatures.firstChild) {
				this.plhFeatures.removeChild(this.plhFeatures.lastChild);
			}
			this.selectors.clear();
			this.boatConfig.getFeatures().forEach(function (pFeature, pFeatureKey) {
				var featureSelect = RC.Utils.stringToNode(PiLot.Templates.Boat.boatFeatureSelect);
				this.plhFeatures.append(featureSelect);
				RC.Utils.setText(featureSelect.querySelector('.lblFeatureName'), pFeature.getName());
				var selFeatureStates = featureSelect.querySelector('.selFeatureStates');
				pFeature.getStates().forEach(function (aState) {
					selFeatureStates.append(new Option(aState.getName(), aState.getStateId()));
				});
				selFeatureStates.addEventListener('change', this.selFeatureStates_change.bind(this, pFeatureKey, selFeatureStates));
				this.selectors.set(pFeatureKey, selFeatureStates);
			}.bind(this));
		},

		/// sets and shows a boat setup defined by a PiLot.Model.Boat.BoatSetup, if the setup matches
		/// the current boat config
		setBoatSetup: function (pSetup) {
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

		/// returns a map with key = featureId and value = stateId for the 
		/// currently selected boat setup.
		getBoatSetup: function () {
			return this.boatSetup;
		}

	};

	/** Page containing a slider which allows to select a boat config */
	var BoatPage = function () {

		this.configs = null;		/// an array of objects {name, displayName, boatImageUrl}
		this.currentIndex = 0;		/// the currently selected config
		this.sliding = false;		/// blocks further clicks when the animation is running
		this.container = null;		/// the top-level container of this control
		this.plhConfigName = null;	/// the placeholder where we show the name of the config
		this.imageFrame = null;		/// the frame containing the image(s)
		this.oldImage = null;		/// the currently shown image
		this.newImage = null;		/// the image sliding in
		this.initialize();
	};

	BoatPage.prototype = {

		initialize: function () {
			PiLot.View.Common.setCurrentMainMenuPage(PiLot.Utils.Loader.pages.system.settings.overview);
			this.loadData().then(() => this.draw());
		},

		/// loads some data from the server. After that, we will have
		/// this.configs and this.currentIndex properly set. Cals
		/// pOnDone without any parameter when done
		loadData: async function () {
			await Promise.all([
				PiLot.Model.Boat.loadConfigInfosAsync(),
				PiLot.Model.Boat.loadCurrentConfigNameAsync()
			]).then(results => {
				this.configs = results[0];
				this.currentIndex = this.configs.findIndex(function (configInfo) { return configInfo.name === results[1] }) || this.currentIndex;
			});
		},

		/// saves the currently selected setup to the server
		saveCurrentSetup: function () {
			PiLot.Model.Boat.saveCurrentConfigNameAsync(this.configs[this.currentIndex].name);
		},

		draw: function () {
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Boat.boatPage);
			const loader = PiLot.Utils.Loader;
			loader.getContentArea().appendChild(pageContent);
			pageContent.querySelector('.lnkSettings').setAttribute('href', loader.createPageLink(loader.pages.system.settings.overview));
			this.plhConfigName = pageContent.querySelector('.plhConfigName');
			this.showConfigName();
			this.imageFrame = pageContent.querySelector('.imageFrame');
			this.oldImage = this.imageFrame.querySelector('img');
			this.oldImage.setAttribute('src', this.getCurrentImageUrl());
			pageContent.querySelector('.btnLeft').addEventListener('click', this.btnLeft_click.bind(this));
			pageContent.querySelector('.btnRight').addEventListener('click', this.btnRight_click.bind(this));
		},

		// TODO: preload the left and right image after sliding, not just load ad hoc here. And
		// get rids of them $!
		slide: function (pDirection) {
			if (!this.sliding) {
				this.sliding = true;
				this.currentIndex = (this.currentIndex - Math.sign(pDirection) + this.configs.length) % this.configs.length;
				this.saveCurrentSetup();
				$(this.plhConfigName).fadeOut(250, function () {
					this.showConfigName();
					$(this.plhConfigName).fadeIn(250);
				}.bind(this));
				var slideFunction = pDirection < 0 ? this.addRight.bind(this) : this.addLeft.bind(this);
				slideFunction(function () {
					this.oldImage.parentNode.removeChild(this.oldImage);
					this.oldImage = this.newImage;
					this.sliding = false;
				}.bind(this));
			}
		},

		addRight: function (pOnDone) {
			this.newImage = RC.Utils.stringToNode(PiLot.Templates.Boat.configSliderImageRight);
			this.imageFrame.append(this.newImage);
			this.newImage.setAttribute('src', this.getCurrentImageUrl());
			$(this.oldImage).animate({ marginLeft: "-100%" }, 500, 'swing', pOnDone);
		},

		addLeft: function (pOnDone) {
			this.newImage = RC.Utils.stringToNode(PiLot.Templates.Boat.configSliderImageLeft);
			this.imageFrame.prepend(this.newImage);
			this.newImage.setAttribute('src', this.getCurrentImageUrl());
			$(this.newImage).animate({ marginLeft: "0%" }, 500, 'swing', pOnDone);
		},

		/// shows the name of the current config in the respective placeholder
		showConfigName() {
			this.plhConfigName.innerText = this.configs[this.currentIndex].displayName;
		},

		/// returns the url of the image for the config of the currently selected config
		getCurrentImageUrl: function () {
			return this.configs[this.currentIndex].boatImageUrl;
		},

		btnLeft_click: function () {
			this.slide(-1);
		},

		btnRight_click: function () {
			this.slide(1);
		}
	};

	/// A control to use on the start page, which shows the current boat config
	/// and maybe offers quick access to config-changes which will create a logbook
	/// entry with the new config
	/// @param pContainer: a HTMLElement where the control will be inserted
	/// @param pBoatTime: The current PiLot.Model.Common.BoatTime
	/// @param pGpsObserver: A PiLot.Model.Nav.GpsObserver
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
		this.boatSetupForm = null;				// the PiLot.View.Boat.BoatSetupForm
		this.plhBoatSetupForm = null;			// the container where the boat setup form will be addded
		this.plhAlternativeSetups = null;		// the container for alternative images. 
		this.pendingImages = 0;					// a counter to keep track of unloaded images
		this.updateIntervalSeconds = 10;		// update interval in seconds for the boat setup
		this.updateInterval = null;
		this.observers = null;
		this.initialize();
	};

	StartPageBoatImage.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['imagesLoaded']);
			this.loadAndDrawAsync().then(result => {
				this.startPage.on('resize', this.startPage_resize.bind(this));
				this.startPage.on('changedLayout', this.startPage_changedLayout.bind(this));
				this.container.addEventListener('click', this.container_click.bind(this));
				PiLot.log('crating a StartPageBoatImage', 3);
			});
		},

		/// registers an observer which will be called when pEvent happens
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
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
				RC.Utils.notifyObservers(this, this.observers, 'imagesLoaded', null);
				this.ensureUpdate();
			}
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
		boatSetupForm_save: function () {
			this.createLogbookEntryAsync(this.boatSetupForm.getBoatSetup());
		},

		/** handles the show event of the boatSetupForm by stopping the update interval */
		boatSetupForm_show: function () {
			this.stopUpdate();
		},

		/** handles the close event of the boatSetupForm by starting the update interval */
		boatSetupForm_close: function () {
			this.ensureUpdate();
		},

		/// Loads the current Boat Config and draws the control
		loadAndDrawAsync: async function () {
			await this.loadCurrentSetupAsync();
			this.imageConfig = new PiLot.View.Boat.BoatImageConfig(this.boatSetup.getBoatConfig());
			this.draw();
		},

		/** loads the current boat setup and saves it to this.boatSetup, and returns the
		 *  current boatConfig
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
				this.boatSetupForm = new BoatSetupForm(null, this.plhBoatSetupForm, true);
				this.boatSetupForm.setBoatSetup(this.boatSetup);
				this.boatSetupForm.on('save', this.boatSetupForm_save.bind(this));
				this.boatSetupForm.on('show', this.boatSetupForm_show.bind(this));
				this.boatSetupForm.on('close', this.boatSetupForm_close.bind(this));
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
				this.boatImageLink.detachForm(this.boatSetupForm);
				this.boatImageLink.setOnClick(function () {
					this.startPage.setMainControl(this);
				}.bind(this));
			} else {
				if (PiLot.Permissions.canWrite()) {
					this.boatImageLink.attachForm(this.boatSetupForm);
				} else {
					this.boatImageLink.setOnClick(null);
				}
			}
		},

		/// starts an interval which will load the boat setup and assign
		/// it to the boatSetupForm
		stopUpdate: function () {
			window.clearInterval(this.updateInterval);
		},

		/** makes sure we have a running update interval */
		ensureUpdate: function () {
			if (!this.updateInterval) {
				this.updateInterval = window.setInterval(async function () {
					if (this.boatSetupForm) {
						await this.loadCurrentSetupAsync();
						this.boatImageLink.showBoatSetup(this.boatSetup);
						this.boatSetupForm.setBoatSetup(this.boatSetup);
					}
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
			for (i = 0; i < Math.min(3, boatSetups.length); i++) {
				let divAlternativeSetup = divAlternativeSetupTemplate.cloneNode(true);
				this.plhAlternativeSetups.appendChild(divAlternativeSetup);
				this.pendingImages++;
				let clickFunction = PiLot.Permissions.canWrite() ? this.createLogbookEntryAsync.bind(this, boatSetups[i]) : null;
				let alternativeSetupBoatImageLink = new PiLot.View.Boat.BoatImageLink(this.imageConfig, divAlternativeSetup, clickFunction);
				alternativeSetupBoatImageLink.on('imageLoaded', this.boatImage_loaded.bind(this));
				PiLot.log('StartPageBoatImage: showing alternative setup', 3);
				alternativeSetupBoatImageLink.showBoatSetup(boatSetups[i]);
			}
			divAlternativeSetupTemplate.remove();
		},

		/// creates a logbook entry with a certain setup, using all information that is
		/// available (gps, meteo) and redirects to the logbook page
		/// @param pBoatSetup: PiLot.Model.Boat.BoatSetup
		createLogbookEntryAsync: async function (pBoatSetup) {
			const today = RC.Date.DateOnly.fromObject(this.boatTime.now());
			const logbookDay = await PiLot.Model.Logbook.loadLogbookDayAsync(today) || new PiLot.Model.Logbook.LogbookDay(today);
			await logbookDay.autoAddEntryAsync(pBoatSetup, this.gpsObserver, true);
			const loader = PiLot.Utils.Loader;
			const page = loader.createPageLink(loader.pages.logbook.logbook);
			window.location = `${page}&editLatest=true&d=today`;
		}
	};

	return {
		BoatImageConfig: BoatImageConfig,
		BoatImageLink: BoatImageLink,
		BoatSetupForm: BoatSetupForm,
		BoatPage: BoatPage,
		StartPageBoatImage: StartPageBoatImage
	};

})();
