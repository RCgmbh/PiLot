var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

/** In order to not have it all in the Nav namespace, there is a separate namespace for map specific views. */
PiLot.View.Map = (function () {

	/**
	 * The page containing the seamap
	 */
	var MapPage = function () {
		this.initializeAsync();
	};

	MapPage.prototype = {

		initializeAsync: async function () {
			let gpsObserver = new PiLot.Model.Nav.GPSObserver({ intervalMs: 1000 });
			let pageContent = this.draw();
			let map = new PiLot.View.Map.Seamap(pageContent, { persistMapState: true });
			await map.showAsync();
			let boatPosition = new PiLot.View.Map.MapPositionMarker(map, gpsObserver);
			Promise.all([
				PiLot.Model.Nav.loadActiveRouteAsync(),
				PiLot.Model.Common.getCurrentBoatTimeAsync()
			])
				.then(pResults => {
					if (pResults[0] !== null) {
						var routeObserver = new PiLot.Model.Nav.RouteObserver(pResults[0], gpsObserver, pResults[1], { autoCalculate: true });
						const mapRouteOptions = {
							routeObserver: routeObserver,
							showOptions: true,
							lockRoute: PiLot.Permissions.canWrite() ? undefined : true
						};
						new PiLot.View.Map.MapRoute(map, pResults[0], mapRouteOptions).draw();
					}
					var mapTrack = new PiLot.View.Map.MapTrack(map, pResults[1], gpsObserver, { autoShowTrack: true });
				});
		},

		/** draws the main page content based on the template, and returns the  */
		draw: function () {
			let pageContent = RC.Utils.stringToNode(PiLot.Templates.Map.mapPage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			return pageContent.querySelector('.navMap');
		}

	};

	/// Wraps a leaflet map. Expects pContainer as HTMLElement
	var Seamap = function (pContainer, pOptions) {
		this.mapContainer = pContainer;
		this.settingsContainer = null;
		this.icoMapLayers = null;
		this.mapLayersSettings = null;	// PiLot.View.Map.MapLayersSettings
		this.hasSettings = false;		// we need this to show the settings menu when unhiding (showing) the map
		this.contextPopup = null;
		this.leafletMap = null;
		this.isMapLoaded = false;
		this.allowSetView = true;
		this.persistMapState = true;
		this.showLayers = true;			// if false, no layers will be added but need to be added manually using addTileLayer(pUrl);
		this.mapLayers = null;			// map with key = tileSoureName, value = L.tileLayer
		this.mapPois = null;			// PiLot.View.Map.MapPois
		this.defaultLat = 54.38;
		this.defaultLng = 18.62;
		this.defaultZoom = 9;
		this.minZoom = 3;  // default minZoom
		this.maxZoom = 17; // default maxZoom
		this.maxNativeZoom = 17; // default maxNativeZoom
		this.attribution = '<a href="http://openstreetmap.com" target="_blank">OSM</a> | <a href="http://openseamap.org" target="_blank">OpenSeaMap</a>';
		this.readOptions(pOptions);
		this.initialize();
	};

	/// Map methods
	Seamap.prototype = {

		/// reads the options and assigns values to 
		readOptions: function (pOptions) {
			if (pOptions) {
				if (typeof pOptions.persistMapState === 'boolean') {
					this.persistMapState = pOptions.persistMapState;
				}
				if (typeof pOptions.showLayers === 'boolean') {
					this.showLayers = pOptions.showLayers;
				}
			}
		},

		initialize: function () {
			this.addSettingsContainer();
			this.addMapLayersIcon();
		},

		icoMapLayers_click: function (e) {
			e.preventDefault();
			this.mapLayersSettings.showAsync();
		},

		mapLayerSettings_applySettings: function () {
			this.showHideMapLayersAsync();
		},

		/// adds the sliding settings menu and attaches
		/// the expand/collapse script
		addSettingsContainer: function () {
			this.settingsContainer = RC.Utils.stringToNode(PiLot.Templates.Map.mapSettingsContainer);
			this.mapContainer.insertAdjacentElement('beforebegin', this.settingsContainer);
			this.settingsContainer.querySelector('a.expandCollapse').addEventListener('click', this.toggleSettingsContainer.bind(this));
			RC.Utils.showHide(this.settingsContainer, false);
		},

		/** Adds the icon which will open the poi/layers menu */
		addMapLayersIcon: function () {
			this.icoMapLayers = RC.Utils.stringToNode(PiLot.Templates.Map.mapLayersIcon);
			this.mapContainer.insertAdjacentElement('afterbegin', this.icoMapLayers);
			this.icoMapLayers.addEventListener('click', this.icoMapLayers_click.bind(this));
			this.mapLayersSettings = new MapLayersSettings();
			this.mapLayersSettings.on('applySettings', this.mapLayerSettings_applySettings.bind(this));
		},

		/// switches between expanded and collapsed state of the settings container
		toggleSettingsContainer: function () {
			this.settingsContainer.classList.toggle('expanded');
		},

		/** Shows the map and returns itself. It's async, because it will load the tile sources if necessary */
		showAsync: async function () {
			RC.Utils.showHide(this.mapContainer, true);
			if (this.hasSettings) {
				RC.Utils.showHide(this.settingsContainer, true);
			}
			if (!this.isMapLoaded) {
				PiLot.log("PiLot.Nav.Map.DrawMap", 3);
				this.leafletMap = new L.Map(this.mapContainer, { zoomControl: false });
				new L.control.zoom({ position: 'topright' }).addTo(this.leafletMap);
				this.addScale();
				this.addMeasureTool();
				this.mapLayers = new Map();
				if (this.showLayers) {
					await this.showHideMapLayersAsync();
				}
				var isMapStateSet = false;
				if (this.persistMapState) {
					isMapStateSet = this.applyMapState();
					this.bindHandlers();
				} if (!isMapStateSet) {
					this.applyDefaultMapState();
				}
				this.contextPopup = new MapContextPopup(this);
				this.mapPois = new MapPois(this, this.mapLayersSettings);
				this.isMapLoaded = true;
			}
			return this;
		},

		/** Removes all map layers and adds the selected ones, making sure the layers are added in the right order */
		showHideMapLayersAsync: async function () {
			const tileSources = await this.mapLayersSettings.getAllTileSourcesAsync();
			const settings = await this.mapLayersSettings.getSettingsAsync();
			Array.from(this.mapLayers.keys()).forEach(function (aKey) {
				this.removeTileLayer(aKey);
			}.bind(this));
			for (const [tileSourceName, tileSource] of tileSources) {
				if (settings.tileSourceNames.includes(tileSourceName)) {
					this.addTileLayer(tileSource);
				}
			}
		},

		/** Hides the map */
		hide: function(){
			RC.Utils.showHide(this.mapContainer, false);
			this.hideSettingsContainer();
		},

		/** Hides the settings container */
		hideSettingsContainer: function () {
			RC.Utils.showHide(this.settingsContainer, false);
		},

		/// removes the leaflet map and its handlers 
		remove: function () {
			this.leafletMap.remove();
			this.leafletMap = null;
			this.isMapLoaded = false;
		},

		/**
		 * Adds a tile layer to the map and returns the layer
		 * @param {PiLot.Model.Nav.TileSource} pTileSource
		 * @param {Boolean} pUseOnlineUrl - If true, the tiles will be loaded from the online url
		 * @returns {L.TileLayer}
		 * */
		addTileLayer: function (pTileSource, pUseOnlineUrl = false) {
			let url = pUseOnlineUrl ? pTileSource.getOnlineUrl() : pTileSource.getLocalUrl();
			if ((url.indexOf('https://') !== 0) && (url.indexOf('http://') !== 0)) {
				url = PiLot.Utils.Common.toLocalUrl(url);
			}
			var layer = L.tileLayer.fallback(
			//var layer = L.tileLayer(
				url,
				{
					minZoom: pTileSource.getMinZoom(),
					maxZoom: pTileSource.getMaxZoom(),
					maxNativeZoom: pTileSource.getMaxZoom(),
					attribution: this.attribution
				}
			);
			this.leafletMap.addLayer(layer);
			this.mapLayers.set(pTileSource.getName(), layer);
			return layer;
		},

		/**
		 * Removes a tile layer, if it has been added before
		 * @param {String} pTileSourceName
		 */
		removeTileLayer: function (pTileSourceName) {
			if (this.mapLayers.has(pTileSourceName) && this.leafletMap.hasLayer(this.mapLayers.get(pTileSourceName))) {
				this.leafletMap.removeLayer(this.mapLayers.get(pTileSourceName));
				this.mapLayers.delete(pTileSourceName);
			}			
		},

		/// adds the nauticScale to the map
		addScale: function () {
			this.leafletMap.addControl(new L.Control.ScaleNautic({
				metric: false,
				imperial: false,
				nautic: true,
				maxWidth: 250
			}));
		},

		/** Adds the polyline measure tool */
		addMeasureTool: function () {
			const options = {
				position: 'topright',
				unit: 'nauticalmiles',
				tooltipTextFinish: `${PiLot.Utils.Language.getText('clickToFinishLine')}<br/>`  ,//'Click to <b>finish line</b><br>',
				tooltipTextDelete: PiLot.Utils.Language.getText('shiftClickToDeletePoint'), // 'Press SHIFT-key and click to <b>delete point</b>',
				tooltipTextMove: `${PiLot.Utils.Language.getText('clickAndDragToMovePoint')}<br/>`, //'Click and drag to <b>move point</b><br>',
				tooltipTextResume: `<br/>${PiLot.Utils.Language.getText('ctrlClickToResume')}`, // '<br>Press CTRL-key and click to <b>resume line</b>',
				tooltipTextAdd: PiLot.Utils.Language.getText('ctrlClickToAddPoint'), // 'Press CTRL-key and click to <b>add point</b>',
				measureControlTitleOn: PiLot.Utils.Language.getText('turnOnPolylineMeasure'), // 'Turn on PolylineMeasure',   // Title for the Measure Control going to be switched on
				measureControlTitleOff: PiLot.Utils.Language.getText('turnOffPolylineMeasure'), //'Turn off PolylineMeasure', // Title for the Measure Control going to be switched off
			};
			const guiOptions = PiLot.Templates.Map.PolylineMeasure;
			for (let aField in guiOptions) {
				options[aField] = guiOptions[aField];
			}
			L.control.polylineMeasure(options).addTo(this.leafletMap);
		},

		/// binds some default event handlers to the map
		bindHandlers: function () {
			if (this.persistMapState) {
				this.leafletMap.on('zoomend', this.saveMapStatus.bind(this));
				this.leafletMap.on('moveend', this.leafletMap_moveEnd.bind(this));
			}
		},

		/// handles the end of map move. Sanitizes and saves the map position
		leafletMap_moveEnd: function () {
			this.sanitizePosition();
			this.saveMapStatus();
		},

		/// leaflet allows to have longitudes above 180 or below -180, resulting in
		/// the same place on earth having different coordinates, and 09N 010E will
		/// not be visible when centering the map to 09N 370E. Therefore we try
		/// to avoid centering the map outside of these bounds.
		sanitizePosition: function () {
			const center = this.leafletMap.getCenter()
			const lng = this.leafletMap.getCenter().lng;
			if (Math.abs(lng) > 180) {
				this.setView(center.wrap(), null);
			}
		},

		/// saves the map zoom and center to the user storage
		saveMapStatus: function () {
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.mapCenter', this.leafletMap.getCenter().wrap());
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.mapZoom', this.leafletMap.getZoom());
		},

		/// loads the map status from the user settings and applies them to the map. 
		/// returns true, if zoom and center have been set.
		applyMapState: function () {
			let result = false;
			PiLot.log('ApplyMapStatus', 3);
			const center = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.mapCenter');
			const zoom = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.mapZoom');
			if(center && zoom){
				this.setView(center, zoom);
				result = true;
			}
			return result;
		},

		/// applies a default zoom and center for the map. This is needed, as
		/// the map does not work without a center being set
		applyDefaultMapState: function () {
			const center = L.latLng(this.defaultLat, this.defaultLng);
			this.leafletMap.setView(center, this.defaultZoom);
		},

		/// sets the center and zoom of the map. both parameters can be null, which
		/// will just re-apply the current state. As an extra goodie, it will convert
		/// LatLon types to L.LatLng types
		setView: function (pCenter, pZoom) {
			if (this.allowSetView) {
				if ((pCenter !== null) && (typeof pCenter === 'LatLon')) {
					pCenter = PiLot.Nav.LatLonToLatLng(pCenter)
				}
				this.leafletMap.setView(pCenter || this.leafletMap.getCenter(), pZoom || this.leafletMap.getZoom());
			}
		},

		/// sets zoom and center of the map so that all points within pBounds are on the map
		setBounds: function (pPositions) {
			if (pPositions.length > 0) {
				if (pPositions.length == 1) {
					this.setView(pPositions[0], null);
				} else {
					this.leafletMap.fitBounds(L.latLngBounds(pPositions));
				}
			}
		},

		/// locks the map, not allowing other code to change the zoom or center
		lock: function () {
			this.allowSetView = false;
		},

		/// unlocks the map, allowing clients to change the zoom or center
		unlock: function () {
			this.allowSetView = true;
		},
		
		/// centers the map to pCenter
		setCenter: function(pCenter){
			this.setView(pCenter, null);
		},

		/// returns the leafletMap
		getLeafletMap: function() {
			return this.leafletMap;
		},

		/// returns the element which contains the map, as HTMLElement
		getMapContainer: function () {
			return this.mapContainer;
		},

		/** @returns {PiLot.View.Map.MapContextPopup} */
		getContextPopup: function () {
			return this.contextPopup;
		},

		/** @returns {PiLot.View.Map.MapPois} */
		getMapPois: function () {
			return this.mapPois;
		},

		/** allows to manually close the context popup */
		closeContextPopup: function () {
			this.contextPopup.close();
		},

		/// gets the maximal zoom supported by the map
		getMaxZoom: function () {
			return this.maxZoom;
		},

		/// gets the current zoom level of the map
		getCurrentZoom: function () {
			return this.leafletMap.getZoom();
		},

		/**
		 * Adds an item to the settings container. Each sub-control within the map must
		 * manage its own settings, and can add controls to the settings container. The
		 * settings container is only shown if it has any items in it.
		 * @param {HTMLElement} pItem - The item to add
		 */
		addSettingsItem: function (pItem) {
			this.hasSettings = true;
			this.settingsContainer.insertAdjacentElement('beforeend', pItem)
			RC.Utils.showHide(this.settingsContainer, true);
		}
	};

	/// Class MapContextPopup, encapsulates the context-popup on the map.
	/// specific links can be added to the "customContent" area of the 
	/// popup, allowing others to use the context popup
	var MapContextPopup = function (pMap) {
		this.map = pMap;
		this.popup = null;
		this.links = new Map();
		this.initialize();
	};

	MapContextPopup.prototype = {

		initialize: function () {
			this.map.getLeafletMap().on('contextmenu', this.map_onContextClick.bind(this));
		},

		/// handles the context-click on the map. updates the content of the popup and shows it.
		/// re-binds the click handler for all links, passing the map event and the click event
		/// as parameters. This way, the map event data, especially latLong, can be used in the
		/// handler.
		map_onContextClick: function (mapEvent) {
			const content = RC.Utils.stringToNode(PiLot.Templates.Map.mapPopup);
			let latLonText = PiLot.Utils.Nav.latLonToString(mapEvent.latlng);
			content.querySelector('.latLon').innerText = latLonText;
			let customContent = content.querySelector('.customContent');
			this.links.forEach(function (v, k, m) {
				k.onclick = function (clickEvent) { v(mapEvent, clickEvent) };
				customContent.appendChild(k);
			});
			this.popup = L.popup()
				.setLatLng(mapEvent.latlng)
				.setContent(content)
				.openOn(this.map.getLeafletMap());
		},

		/// adds content to the customContent area of the popup
		/// which is shown on rightclick on the map, expects the
		/// link as HTMLElement object and the onClick handler
		addLink: function (pLink, pCallback) {
			this.links.set(pLink, pCallback);
		},

		/// removes a link from the conext popup costomContent
		removeLink: function (pLink) {
			this.links.delete(pLink);
		},

		/// closes the popup
		close: function () {
			this.popup.remove();
		}
	};

	/**
	 * This control allows selecting the poi categories to show. It is also the one to ask, if
	 * you want to know what are the currently selected categories, even if the control is not
	 * being displayed, which might feel a bit weird.
	 * */
	var MapLayersSettings = function () {
		this.tileSourceNames = null;		// String[] with the selected tile sources' names
		this.allTileSources = null;			// Map, as it comes from the service (key: name, value: tileSource)
		this.tileSourceCheckboxes = null;	// Map with key = tileSource, value = checkbox
		this.showPois = false;				// Boolean, if false, no pois at all will be shown
		this.categoryIds = null;			// number[] holding the ids of the categories to show
		this.allCategories = null;			// Map, as it comes from the service (key: id, value: category)
		this.categoryCheckboxes = null;		// Map with key = category, value = {checkbox: HTMLInputControl, selectedChildren: number};
		this.featureIds = null;				// number[] holding the ids of the features to filter by
		this.allFeatures = null;			// Map, as it comes from the service (key: id, value: feature)
		this.control = null;				// HTMLElement - the outermost element
		this.cbShowPois = null;				// HTMLInputElement
		this.featuresSelector = null;		// PiLot.View.Nav.PoiFeaturesSelector
		this.observers = null;				// Used for the RC observer pattern
		this.initialize();
	};

	MapLayersSettings.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['applySettings']);
			this.ensureFeaturesAsync();
		},

		/**
		 * registers an observer which will be called when pEvent happens 
		 * @param {String} pEvent - 'applySettings'
		 * */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/** handles clicks on the dark background by closing the dialog */
		pnlOverlay_click: function () {
			this.hide();
		},

		/** makes sure that clicks are not bubbled to the background, which would close the window */
		pnlDialog_click: function (pEvent) {
			pEvent.stopPropagation();
		},

		/**
		 * Handles changes of the tile source checkboxes
		 * @param {PiLot.Model.Nav.TileSource} pTileSource
		 * @param {Event} e
		 */
		cbTileSource_change: function (pTileSource, e) {
			this.setTileSourceSelected(pTileSource, e.target.checked);
		},

		/**
		 * Handles changes of the category checkboxes
		 * @param {PiLot.Model.Nav.PoiCategory} pCategory
		 */
		cbCategory_change: function (pCategory, e) {
			this.setCategorySelected(pCategory, e.target.checked);
			this.updateRelatedCheckboxes(pCategory, e.target.checked, true, true);
		},

		btnApply_click: function (e) {
			e.preventDefault();
			this.apply();
		},

		btnCancel_click: function (e) {
			e.preventDefault();
			this.hide();
		},

		/** @returns {Object} {tileSourceNames: String[], showPois: Boolean, categoryIds: Number[], featureIds: Number[]} */
		getSettingsAsync: async function () {
			await this.loadSettingsAsync();
			return this.createSettingsObject();
		},

		/** We abuse this class to get access to the map of all tile sources, which will usually be preloaded */
		getAllTileSourcesAsync: async function () {
			await this.ensureTileSourcesAsync();
			return this.allTileSources;
		},

		/** Draws the form. Async (and therefore not called in initialize()) because it triggers loading the categories. */
		drawAsync: async function () {
			await this.loadSettingsAsync();
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapLayersSettings);
			document.body.insertAdjacentElement('afterbegin', this.control);
			PiLot.Utils.Common.bindKeyHandlers(this.control, this.hide.bind(this), this.apply.bind(this));
			this.control.addEventListener('click', this.pnlOverlay_click.bind(this));
			this.control.querySelector('.pnlDialog').addEventListener('click', this.pnlDialog_click.bind(this));
			this.cbShowPois = this.control.querySelector('.cbShowPois');
			this.cbShowPois.checked = this.showPois;
			await Promise.all([this.drawTileSourcesAsync(), this.drawCategoriesAsync(), this.drawFeaturesAsync()]);
			this.control.querySelector('.btnCancel').addEventListener('click', this.btnCancel_click.bind(this));
			this.control.querySelector('.btnApply').addEventListener('click', this.btnApply_click.bind(this));
		},

		/** Creates a checkbox list for all tile sources */
		drawTileSourcesAsync: async function () {
			await this.ensureTileSourcesAsync();
			this.tileSourceCheckboxes = new Map();
			const plhTileSources = this.control.querySelector('.plhTileSources');
			plhTileSources.clear();
			for (const [tileSourceName, tileSource] of this.allTileSources) {
				const cbControl = PiLot.Utils.Common.createNode(PiLot.Templates.Common.checkbox);
				const cbTileSource = cbControl.querySelector('.cbCheckbox');
				cbTileSource.checked = this.tileSourceNames.includes(tileSourceName);
				cbTileSource.addEventListener('change', this.cbTileSource_change.bind(this, tileSource));
				cbControl.querySelector('.lblLabel').innerText = tileSourceName;
				plhTileSources.appendChild(cbControl);				
				this.tileSourceCheckboxes.set(tileSource, cbTileSource);				
			}
		},

		/** 
		 * Loads the categories and shows them with checkbox and label, including quite a complicated indentation meccano.
		 * Also makes sure that the selectedChildren values are initialized correctly.
		 * */
		drawCategoriesAsync: async function () {
			await this.ensureCategoriesAsync();
			this.categoryCheckboxes = new Map();
			const sortedList = new PiLot.View.Nav.CategoriesList(this.allCategories).getSortedList();
			const plhCategories = this.control.querySelector('.plhCategories');
			plhCategories.clear();
			for (let i = 0; i < sortedList.length; i++) {
				const category = sortedList[i].category;
				const cbControl = PiLot.Utils.Common.createNode(PiLot.Templates.Map.poiCategoryCheckbox);
				const divIndent = cbControl.querySelector('.divIndent');
				const level = category.getLevel();
				if (level === 0) {
					divIndent.hidden = true;
				} else if (level > 1) {
					for (let i = 2; i <= level; i++) {
						divIndent.parentNode.insertBefore(divIndent.cloneNode(), divIndent);
					}
				}
				const cbCategory = cbControl.querySelector('.cbCategory');
				this.categoryCheckboxes.set(category, { checkbox: cbCategory, selectedChildren: 0 });
				const isSelected = this.categoryIds.includes(category.getId());
				cbCategory.checked = isSelected;
				if (isSelected && category.getParent()) {
					this.categoryCheckboxes.get(category.getParent()).selectedChildren++;
				}
				cbCategory.addEventListener('change', this.cbCategory_change.bind(this, category));
				cbControl.querySelector('.lblCategory').innerText = sortedList[i].title;
				plhCategories.appendChild(cbControl);
				this.updateRelatedCheckboxes(category, isSelected, true, false);
			}
		},

		drawFeaturesAsync: async function () {
			const plhFeatures = this.control.querySelector('.plhFeatures');
			this.featuresSelector = new PiLot.View.Nav.PoiFeaturesSelector();
			await this.featuresSelector.addControlAsync(plhFeatures);
			this.featuresSelector.setSelectedFeatureIds(this.featureIds);
		},

		/** 
		 *  Loads the settings from the browser. Async as it need the list of all categories,
		 *  just becaus it tries to be nice and defaults to "all"
		 * */
		loadSettingsAsync: async function () {
			await Promise.all([this.ensureTileSourcesAsync(), this.ensureCategoriesAsync(), this.ensureFeaturesAsync()]);
			const settings = PiLot.Utils.Common.loadUserSetting('mapLayers');
			this.tileSourceNames = (settings && settings.tileSourceNames) || Array.from(this.allTileSources.keys());
			this.showPois = (settings && 'showPois' in settings) ? settings.showPois : true;
			this.categoryIds = (settings && settings.categoryIds) || Array.from(this.allCategories.keys());
			this.featureIds = (settings && settings.featureIds) || [];
		},

		/** Saves the settings to the browser */
		saveSettings: function () {
			PiLot.Utils.Common.saveUserSetting('mapLayers', this.createSettingsObject());
		},

		/** Creates a simple object that is used not only to save, but also to communicate the current settings. */
		createSettingsObject: function () {
			return {
				tileSourceNames: this.tileSourceNames,
				showPois: this.showPois,
				categoryIds: this.categoryIds,
				featureIds: this.featureIds
			};
		},

		/** Makes sure the map of all tile sources has been loaded. */
		ensureTileSourcesAsync: async function () {
			this.allTileSources = this.allTileSources || await PiLot.Model.Nav.readAllTileSourcesAsync();
		},

		/** Makes sure the map of all categories has been loaded. */
		ensureCategoriesAsync: async function () {
			this.allCategories = this.allCategories || await PiLot.Service.Nav.PoiService.getInstance().getCategoriesAsync();
		},

		/** Makes sure the map of all features has been loaded. */
		ensureFeaturesAsync: async function () {
			this.allFeatures = this.allFeatures || await PiLot.Service.Nav.PoiService.getInstance().getFeaturesAsync();
		},

		/**
		 * Sets a tile source selected or unselected, by adding or removing it from the
		 * list of tileSources
		 * @param {PiLot.Model.Nav.TileSource} pTileSource
		 * @param {Boolean} pSelected
		 */
		setTileSourceSelected: function (pTileSource, pSelected) {
			const tileSourceName = pTileSource.getName();
			if (pSelected) {
				if (!this.tileSourceNames.includes(tileSourceName)) {
					this.tileSourceNames.push(tileSourceName);
				}
			} else {
				if (this.tileSourceNames.includes(tileSourceName)) {
					this.tileSourceNames.remove(this.tileSourceNames.indexOf(tileSourceName));
				}
			}
		},

		/**
		 * Set a category selected or unselected, by adding/removing its id from the list
		 * of category IDs, as necessary. Also makes sure the selectedChildren values are
		 * update correctly
		 * @param {PiLot.Model.Nav.PoiCategory} pCategory
		 * @param {boolean} pSelected
		 */
		setCategorySelected: function (pCategory, pSelected) {
			let hasChanged = false;
			if (pSelected) {
				if (!this.categoryIds.includes(pCategory.getId())) {
					this.categoryIds.push(pCategory.getId());
					hasChanged = true;
				}
			} else {
				if (this.categoryIds.includes(pCategory.getId())) {
					this.categoryIds.remove(this.categoryIds.indexOf(pCategory.getId()));
					hasChanged = true;
				}
			}
			if (hasChanged) {
				const parent = pCategory.getParent();
				if (parent) {
					this.categoryCheckboxes.get(parent).selectedChildren += (pSelected ? 1 : -1);
				}
			}
			return hasChanged;
		},

		/**
		 * Aww, I don't know, this seems a bit complicated. Basically we just want to set the
		 * parent checkbox to checked, if all children are checked, unchecked if no child is
		 * checked and indeterminate else. And we want to check/uncheck all children, if the
		 * parent is checked/unchecked. Just like a simple checkbox-tree should behave.
		 * @param {PiLot.Model.Nav.PoiCategory} pCategory - the category that has been changed
		 * @param {boolean} pIsSelected - the new state of the catgory
		 * @param {boolean} pUpdateParent - if true, we update the parent in order to reflect the changes
		 * @param {boolean} pUpdateChildren - if true, we update all children to refelect the changes
		 */
		updateRelatedCheckboxes: function (pCategory, pIsSelected, pUpdateParent, pUpdateChildren) {
			if (pCategory !== null) {
				if (pUpdateParent) {
					const parent = pCategory.getParent();
					if (parent) {
						const parentCheckboxObject = this.categoryCheckboxes.get(parent);
						const allChildrenChecked = (parent.getChildren().length === parentCheckboxObject.selectedChildren);
						const anyChildChecked = parentCheckboxObject.selectedChildren > 0;
						parentCheckboxObject.checkbox.indeterminate = (anyChildChecked && !allChildrenChecked);
						if (this.setCategorySelected(parent, anyChildChecked)) {
							parentCheckboxObject.checkbox.checked = anyChildChecked;
							this.updateRelatedCheckboxes(parent, anyChildChecked, true, false);
						}
					}
				}
				if (pUpdateChildren) {
					pCategory.getChildren().forEach(function (aChild) {
						const childCheckboxObject = this.categoryCheckboxes.get(aChild);
						childCheckboxObject.checkbox.indeterminate = false;
						if (this.setCategorySelected(aChild, pIsSelected)) {
							childCheckboxObject.checkbox.checked = pIsSelected;
							this.updateRelatedCheckboxes(aChild, pIsSelected, false, true);
						}						
					}.bind(this));
				}
			}
		},

		/** Applies the current selection and notifies observers */
		apply: function () {
			this.showPois = this.cbShowPois.checked;
			this.featureIds = this.featuresSelector.getSelectedFeatureIds();
			this.saveSettings();
			RC.Utils.notifyObservers(this, this.observers, 'applySettings', this);
			this.hide();
		},

		/** Shows the control. Async, because on first show, the form is drawn, which requires loading the categories */
		showAsync: async function () {
			if (!this.control) {
				await this.drawAsync();
			}
			document.body.classList.toggle('overflowHidden', true);
			this.control.hidden = false;
		},

		/** Hides the entire control */
		hide: function () {
			document.body.classList.toggle('overflowHidden', false);
			this.control.hidden = true;
		}
	};

	/**
	 * The class responsible for showing points of interest on the map
	 * @param {PiLot.View.Map.Seamap} pSeamap
	 * @param {PiLot.View.Map.MapLayersSettings} pSettingsControl
	 */
	var MapPois = function (pSeamap, pSettingsControl) {
		this.seamap = pSeamap;
		this.settingsControl = pSettingsControl;
		this.pois = null;							// map with key=poi.id and value={poi, marker}
		this.categoryIcons = null;					// map with key=category.id and value=icon html
		this.poiDetailControl = null;				// PiLot.View.Nav.PoiDetails
		this.poiFormControl = null;					// PiLot.View.Nav.PoiForm
		this.initializeAsync();
	};

	MapPois.prototype = {

		initializeAsync: async function () {
			this.pois = new Map();
			this.seamap.getLeafletMap().on('moveend', this.leafletMap_moveend.bind(this));
			this.seamap.getLeafletMap().on('zoomend', this.leafletMap_zoomend.bind(this));
			this.settingsControl.on('applySettings', this.settings_applySettings.bind(this));
			this.addContextPopupLink();
			await this.loadPoisAsync();
		},

		leafletMap_moveend: function () {
			this.loadPoisAsync();
			this.resizeMarkers(this.pois);
		},

		leafletMap_zoomend: function () {
			this.loadPoisAsync();
		},

		settings_applySettings: function (pSender) {
			this.clearPois();
			this.loadPoisAsync();
		},

		poiMarker_click: async function(pPoi){
			await pPoi.ensureDetailsAsync();
			if (this.poiDetailControl === null) {
				this.poiDetailControl = new PiLot.View.Nav.PoiDetails(this.getPoiForm(), this);
			}
			this.poiDetailControl.showPoi(pPoi);
		},

		poiMarker_moveEnd: async function (pPoi, pMoveEvent) {
			const latLng = pMoveEvent.target.getLatLng();
			pPoi.setLatLng(latLng.lat, latLng.lng);
			pPoi.saveAsync();
		},

		lnkAddPoi_click: async function (pMapEvent, pClickEvent) {
			this.getPoiForm().showEmpty(pMapEvent.latlng);
			this.seamap.closeContextPopup();
		},

		/** Returns the form to show poi details. Creates it, if necessary */
		getPoiForm: function(){
			this.poiFormControl = this.poiFormControl || new PiLot.View.Nav.PoiForm(this);
			return this.poiFormControl;
		},

		/**
		 * Shows a Poi on the map by drawing a marker and setting the proper size
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 * @param {boolean} pResetExisting - Set to true, if position and icon should be reset
		 * @param {boolean} pSetDraggable - Set to true, if the marker should be draggable
		 */
		showPoi: function (pPoi, pResetExisting, pSetDraggable) {
			const obj = this.drawMarker(pPoi, pResetExisting, pSetDraggable);
			this.resizeMarkers([obj]);
		},

		/**
		 * Loads the pois based on the current settings and shows them on the map. We add some buffer
		 * around the actual map bounds, so that pois outside of the actual viewport are loaded as well.
		 * */
		loadPoisAsync: async function () {
			const bounds = this.seamap.getLeafletMap().getBounds();
			const minPoint = bounds.getSouthWest();
			const maxPoint = bounds.getNorthEast();
			const deltaLat = maxPoint.lat - minPoint.lat;
			const deltaLng = maxPoint.lng - minPoint.lng;
			const minLat = Math.max(minPoint.lat - deltaLat, -90);
			const minLng = Math.max(minPoint.lng - deltaLng, -180);
			const maxLat = Math.min(maxPoint.lat + deltaLat, 90);
			const maxLng = Math.min(maxPoint.lng + deltaLng, 180);
			const settings = await this.settingsControl.getSettingsAsync();
			if (settings.showPois) {
				await this.ensureCategoryIconsAsync();
				const pois = await PiLot.Service.Nav.PoiService.getInstance().findPoisAsync(minLat, minLng, maxLat, maxLng, settings.categoryIds, settings.featureIds);
				const newPois = [];
				pois.forEach(function (p) {
					const objPoi = this.drawMarker(p, false, false);
					newPois.push(objPoi);
				}.bind(this));
				this.resizeMarkers(newPois);
			}			
		},

		/** Fills a map with the category icon html for each category */
		ensureCategoryIconsAsync: async function () {
			if (!this.categoryIcons) {
				const poiCategories = await PiLot.Service.Nav.PoiService.getInstance().getCategoriesAsync();
				this.categoryIcons = new Map();
				for (const [categoryId, category] of poiCategories) {
					this.categoryIcons.set(categoryId, PiLot.View.Nav.getPoiCategoryIcon(category.getIcon()));
				}
			}
		},

		/**
		 * Creates a leaflet marker for the poi, if it hasn't been created before, and adds the marker
		 * to the poi map.
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 * @param {Boolean} pResetExisting - Set to true, if position and icon should be reset
		 * @param {Boolean} pSetDraggable - Set to true, if the marker should be draggable
		 * @returns {Object} an object with {poi, marker}
		 */
		drawMarker: function (pPoi, pResetExisting, pSetDraggable) {
			let result;
			if (pResetExisting) {
				this.removePoi(pPoi);
			}
			if (!this.pois.has(pPoi.getId())) {
				const iconHtml = this.categoryIcons.get(pPoi.getCategory().getId());
				const icon = L.divIcon({
					className: 'poiMarker', iconSize: [null, null], html: iconHtml
				});
				const marker = L.marker(pPoi.getLatLng(), { icon: icon, draggable: pSetDraggable, autoPan: true });
				marker.addTo(this.seamap.getLeafletMap());
				marker.on('click', this.poiMarker_click.bind(this, pPoi));
				if (pSetDraggable) {
					marker.on('moveend', this.poiMarker_moveEnd.bind(this, pPoi));
				}
				result = { poi: pPoi, marker: marker };
				this.pois.set(pPoi.getId(), result);
			} else {
				result = this.pois.get(pPoi.getId());
			}
			return result;
		},

		/**
		 * Removes a poi marker from the map
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		removePoi: function (pPoi) {
			if(this.pois.has(pPoi.getId())) {
				this.pois.get(pPoi.getId()).marker.remove();
				this.pois.delete(pPoi.getId());
			}
		},

		/** Remove all pois from the map */
		clearPois: function () {
			this.pois.forEach(function (v, k) {
				v.marker.remove();
			});
			this.pois = new Map();
		},

		/**
		 * This implements a specific logic to size the markers a bit bigger on higher zoom levels.
		 * The styles are assigned directly in order to override what was set by leaflet. This might
		 * probably be done a bit more elegant one day.
		 * @param {Iterable} pPois - an iterable with {poi, marker} objects
		 */
		resizeMarkers: function (pPois) {
			const iconSize = Math.min(Math.max(this.seamap.getCurrentZoom() * 5 - 40, 12), 36);
			const lengthWidth = `${iconSize}px`;
			const margin = `${iconSize * -1}px`;
			const fontSize = `${iconSize / 24}em`;
			pPois.forEach(function (p) {
				const markerElement = p.marker.getElement();
				markerElement.style.height = lengthWidth;
				markerElement.style.width = lengthWidth;
				markerElement.style.marginTop = margin;
				markerElement.style.marginLeft = margin;
				markerElement.style.fontSize = fontSize;
			}.bind(this));
		},

		/**
		 * Opens the edit form for a certain poi
		 * @param {PiLot.Model.Nav.Poi} pPoi
		 */
		editPoi: function (pPoi) {
			this.poiFormControl.showPoi(pPoi, this);
		},

		/** Adds the "add POI" link to the context popup */
		addContextPopupLink: function () {
			if (PiLot.Permissions.canWrite()) {
				const link = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapAddPoiLink);
				this.seamap.getContextPopup().addLink(link, this.lnkAddPoi_click.bind(this));
			}			
		},
	};

	/// Class MapTrack represents the presentation of a track
	/// on the map.
	var MapTrack = function (pMap, pBoatTime, pGpsObserver, pOptions) {
		this.map = pMap;
		this.boatTime = pBoatTime;
		this.gpsObserver = pGpsObserver || null;
		this.track = null;
		this.ignoreSettings = false;
		this.trackObserver = null;
		this.seconds = null;		// if set, the last x seconds will be shown until now
		this.startTime = null;		// to be used with endTime, interpreted as boatTime
		this.endTime = null;		// to be used with startTime, interpreted as boatTime
		this.showTrack = false;
		this.autoShowTrack = false;
		this.timeScaleFactor = 1;
		this.maxTimeSteps = 1000;
		this.historicPosition = null;

		// controls
		this.lnkShowTrack = null;
		this.selTrackMode = null;
		this.pnlCustomDates = null;
		this.tbStartDate = null;
		this.calStartDate = null;
		this.calEndDate = null;
		this.timeSliderContainer = null;
		this.timeSlider = null;
		this.timeField = null;
		this.historicPositionMarker = null;
		this.polyline = null; // a leaflet L.polyLine

		this.readOptions(pOptions);
		this.initialize();
	}

	/// MapTrack methods
	MapTrack.prototype = {

		readOptions: function (pOptions) {
			if (pOptions) {
				this.ignoreSettings = pOptions.ignoreSettings || this.ignoreSettings;
				this.showTrack = pOptions.showTrack || this.showTrack;
				this.autoShowTrack = pOptions.autoShowTrack || this.autoShowTrack;
			}
		},

		initialize: function () {
			if (this.gpsObserver != null) {
				this.trackObserver = new PiLot.Model.Nav.TrackObserver(this.track, this.gpsObserver);
			}
			if (!this.ignoreSettings) {
				this.readSettings();
				this.addSettingsControl();
			}
			this.addTimeSlider();
			if (this.showTrack && this.autoShowTrack) {
				this.loadAndShowTrackAsync(false);
			}
		},

		/// reads the persisted user settings
		readSettings: function() {
			this.showTrack = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.showTrack') || this.showTrack;
			const seconds = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.trackSeconds') || this.seconds;
			let start = null;
			const startUnix = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.trackStart');
			if (startUnix) {
				start = RC.Date.DateHelper.unixToLuxon(startUnix);
			}
			let end = null;
			const endUnix = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.trackEnd');
			if (endUnix) {
				end = RC.Date.DateHelper.unixToLuxon(endUnix);
			}
			this.setTimeFrame(start, end, seconds);
		},

		/// handles click onto the show track button, showing or hiding the track
		lnkShowTrack_click: function () {
			this.showTrack = !this.showTrack;
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.showTrack', this.showTrack);
			this.lnkShowTrack.classList.toggle('active', this.showTrack);
			if (this.showTrack) {
				this.loadAndShowTrackAsync(false);
			} else {
				this.deleteFromMap();
				this.hideTimeSlider();
			}
		},

		/// handles changes in the dropdown
		selTrackMode_change: function () {
			this.readInputs();
			this.pnlCustomDates.hidden = this.selTrackMode.value !== 'null';
		},

		/// handles changes in the start or end date fields. Dates
		/// are only applied if both fields have a value selected
		calDate_change: function () {
			this.readInputs();
		},

		/// handles sliding the slider
		timeSlider_slide: function () {
			this.historicPosition = this.track.getPositionAt(this.timeSlider.value * this.timeScaleFactor);
			if (this.historicPosition !== null) {
				this.drawHistoricPosition();
			}
		},

		/**
		 * Handles adding a new position to the Track. The track is only updated, if we
		 * have "open end" or the new position is before the end
		 * @param {any} pSender
		 * @param {GPSRecord} pNewPosition - The position which was added
		 */
		track_addPosition: function (pSender, pNewPosition) {
			this.updateTimeScale();
			if (this.showTrack && ((this.endTime === null) || (pNewPosition.getUTCSeconds() <= RC.Date.DateHelper.luxonToUnix(this.endTime)))) {
				if (this.polyline) {
					this.polyline.addLatLng(pNewPosition.getLatLng());
				} else {
					this.draw();
				}
			}
		},

		/**
		 * Handles changing the lates position of the Track. The track is only updated, if we
		 * have "open end" or the changed position is before the end
		 * @param {any} pSender
		 * @param {GPSRecord} pLastPosition - The position which was updated
		 */
		track_changeLastPosition: function (pSender, pLastPosition) {
			if (this.showTrack && ((this.endTime === null) || (pLastPosition.getUTCSeconds() <= RC.Date.DateHelper.luxonToUnix(this.endTime)))) {
				if (this.polyline !== null) {
					var latLngs = this.polyline.getLatLngs();
					if (latLngs.length > 0) {
						latLngs[latLngs.length - 1] = pLastPosition.getLatLng();
						this.polyline.setLatLngs(latLngs);
					}
				} else {
					this.draw();
				}
			}
		},

		/// handles cropping positions of the track
		track_cropPositions: function (pSender) {
			this.updateTimeScale();
			if (this.showTrack) {
				this.draw();
			}
		},

		/// adds the "show Track" and its options to the settings container
		addSettingsControl: function () {
			const optionsControl = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapShowTrack);
			this.lnkShowTrack = optionsControl.querySelector('a');
			this.lnkShowTrack.classList.toggle('active', this.showTrack);
			this.lnkShowTrack.addEventListener('click', this.lnkShowTrack_click.bind(this));
			this.selTrackMode = optionsControl.querySelector('select');
			this.selTrackMode.value = this.startTime ? "null" : this.seconds || "null";
			this.selTrackMode.addEventListener('change', this.selTrackMode_change.bind(this));
			this.pnlCustomDates = optionsControl.querySelector('.pnlCustomDates');
			this.tbStartDate = optionsControl.querySelector('.tbStartDate');
			const locale = PiLot.Utils.Language.getLanguage();
			this.calStartDate = new RC.Controls.Calendar(optionsControl.querySelector('.calStartDate'), this.tbStartDate, null, this.calDate_change.bind(this), null, locale);
			this.calStartDate.date(this.startTime !== null ? this.startTime.toLocal() : null);
			this.calStartDate.showDate();
			const tbEndDate = optionsControl.querySelector('.tbEndDate');
			this.calEndDate = new RC.Controls.Calendar(optionsControl.querySelector('.calEndDate'), tbEndDate, null, this.calDate_change.bind(this), null, locale);
			if (this.startTime && this.seconds) {
				this.calEndDate.date(this.startTime.toLocal().plus({ seconds: this.seconds }).minus({ days: 1 }));
			} else {
				this.calEndDate.date(this.endTime);
			}
			this.calEndDate.showDate();
			this.pnlCustomDates.hidden = this.selTrackMode.value !== "null";
			this.map.addSettingsItem(optionsControl);
			RC.Utils.selectOnFocus(this.tbStartDate, tbEndDate);
		},

		/// adds the slider and binds events. 
		addTimeSlider: function () {
			this.timeSliderContainer = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapTrackSlider);
			this.timeSlider = this.timeSliderContainer.querySelector(".slider");
			this.map.getMapContainer().insertAdjacentElement('afterend', this.timeSliderContainer);
			this.timeSlider.addEventListener('input', this.timeSlider_slide.bind(this));
			this.timeField = this.timeSliderContainer.querySelector('.time');

		},

		/// this makes sure we have a time scale factor which allows
		/// who distribute the whole visible track to 
		updateTimeScale: function () {
			if ((this.track !== null) && this.timeSlider) {
				var trackLength = this.track.getPositionsCount();
				this.timeScaleFactor = Math.ceil(trackLength / this.maxTimeSteps);
				this.timeSlider.setAttribute("max", Math.ceil(trackLength / this.timeScaleFactor) - 1);
			}
		},

		/**
		* reads the user input, assigns the value to instance values and re-loads the track. 
	    * We can have a fixed duration, or start - end, where end is optional (and would)
	    * thus always be "now"
		*/
		readInputs: function () {
			const ddlValue = this.selTrackMode.value;
			var start = null;
			var end = null;
			var seconds = null;
			if (RC.Utils.isNumeric(ddlValue)) {
				seconds = ddlValue;
			} else {
				seconds = null;
				start = this.calStartDate.date();
				if (start !== null) {
					end = this.calEndDate.date();
					if (end !== null) {
						end = end.plus({ days: 1 });
					} 
				}
			}
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.trackStart', start !== null ? RC.Date.DateHelper.luxonToUnix(start) : null);
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.trackEnd', end !== null ? RC.Date.DateHelper.luxonToUnix(end) : null);
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.trackSeconds', seconds);
			if (seconds || start) {
				this.setTimeFrame(start, end, seconds);
				this.loadAndShowTrackAsync(true);
			}
		},

		/**
		 * This loads the track and shows it on the map as soon as it's loaded. It also does
		 * some magic to find the start and end time based on this.startTime, this.endTime
		 * and this.seconds
		 * @param {boolean} pZoomToTrack - If true, the map is automatically zoomed to the track
		 */
		loadAndShowTrackAsync: async function (pZoomToTrack) {
			let start = null;	// start in seconds from epoc, either utc or local
			let end = null;		// end in seconds from epoc, either utc or local
			let isBoatTime;
			let track = null;
			if (this.seconds !== null) {
				end = this.boatTime.utcNowUnix();
				start = end - this.seconds;
				isBoatTime = false;
			} else if (this.startTime !== null) {
				start = RC.Date.DateHelper.luxonToUnixLocal(this.startTime);
				if (this.endTime !== null) {
					end = RC.Date.DateHelper.luxonToUnixLocal(this.endTime);
				} else {
					end = this.boatTime.nowUnix();
				}
				isBoatTime = true;
			} 
			if (start && end) {
				track = await PiLot.Model.Nav.loadTrackAsync(start * 1000, end * 1000, isBoatTime);
				this.setTrack(track);
				if (this.showTrack) {
					this.draw();
					this.showTimeSlider();
					if (pZoomToTrack) {
						this.zoomToTrack();
					}
				}
			}
			return track;
		},

		/// sets the start time and seconds, and makes sure the trackObserver
		/// gets informed. We only want the trackObserver to draw live data,
		/// if the end date is not null (meaning we have a startTime xor seconds)
		setTimeFrame: function (pStartTime, pEndTime, pSeconds) {
			if (pSeconds) {
				this.seconds = pSeconds;
				this.startTime = null;
				this.endTime = null;
			} else {
				this.seconds = null;
				this.startTime = pStartTime;
				this.endTime = pEndTime;
			}
			if (this.trackObserver !== null) {
				this.trackObserver.setTrackSeconds(this.seconds);
			}
		},

		/// sets the track to display, adds handlers and updates the track of the TrackObserver
		setTrack: function (pTrack) {
			this.track = pTrack || null;
			this.historicPosition = null;
			if (this.track !== null) {
				this.track.on('addPosition', this.track_addPosition.bind(this));
				this.track.on('changeLastPosition', this.track_changeLastPosition.bind(this));
				this.track.on('cropPositions', this.track_cropPositions.bind(this));
				this.updateTimeScale();
				if (this.track.getPositionsCount() > 0) {
					this.historicPosition = this.track.getRawPositions()[0];
				}
				if (this.trackObserver != null) {
					this.trackObserver.setTrack(this.track);
				}
			}
		},
		
		/// draws this.track onto the current map.
		draw: function () {
			let positions = this.track !== null ? this.track.getRawPositions() : new Array();
			if (this.polyline === null) {
				var leafletMap = this.map.getLeafletMap();
				this.polyline = L.polyline(positions, PiLot.Templates.Map.mapTrackOptions).addTo(leafletMap);
			} else {
				this.polyline.setLatLngs(positions);
			}
		},

		/// draws the historic position marker at the current historic position
		drawHistoricPosition: function () {
			var latLng = this.historicPosition.getLatLng();
			if (this.historicPositionMarker === null) {
				var icon = L.divIcon({
					className: 'navHistoricBoatIcon', iconSize: [20, 20]
				});
				this.historicPositionMarker = L.marker(latLng, { icon: icon, zIndexOffset: 1000 });
				this.historicPositionMarker.addTo(this.map.getLeafletMap());
			} else {
				this.historicPositionMarker.setLatLng(latLng);
			}
			RC.Utils.setText(this.timeField, RC.Date.DateHelper.millisToLuxon(this.historicPosition.boatTime).toFormat('dd.MM.yyyy HH:mm'));
		},

		/// adjusts the center/zoom of the map to fit the entire track
		zoomToTrack: function () {
			if (!this.polyline.isEmpty()) {
				this.map.getLeafletMap().fitBounds(this.polyline.getBounds(), { maxZoom: 16 });
			}
		},

		/// removes the polyline from the map
		deleteFromMap: function () {
			if (this.polyline !== null) {
				this.polyline.remove();
				this.polyline = null;
			}
		},

		/// shows the time slider, if we have a track with at least one
		/// positions, otherwise hides the slider and historic position marker.
		showTimeSlider: function (pResetPosition) {
			if (this.track && this.track.getPositionsCount() > 0) {
				if (pResetPosition) {
					this.timeSlider.value = 0;
				}
				this.timeSliderContainer.hidden = false;
				this.historicPosition = this.track.getPositionAt(this.timeSlider.value)
				if (this.historicPosition != null) {
					this.drawHistoricPosition();
				}
			} else {
				this.hideTimeSlider();
			}
		},

		/// hides the time slider and the historic position marker
		hideTimeSlider: function () {
			if (this.historicPositionMarker !== null) {
				this.historicPositionMarker.remove();
				this.historicPositionMarker = null;
			}
			this.timeSliderContainer.hidden = true;
		},

		/// returns the position at the time selected by the time slider,
		/// or null if we have not track. The result is an object like
		/// {timestamp: pTimestamp,	latLng: [pLat, pLng]}
		getHistoricPosition: function () {
			return this.historicPosition;
		}
	};

	/// Class MapPositionMarker, shows the boat's current position, direction and heading on the map.
	/// It observes the current gps position and updates the marker, plus centers the map if the 
	/// auto center option is enabled.
	var MapPositionMarker = function (pMap, pGPSObserver) {
		this.map = pMap;
		this.outdatedGpsWarning = null;		// the control showing a warning if we have no current gps data
		this.gpsObserver = pGPSObserver;
		this.marker = null;
		this.cogVector = null;
		this.cogLength = 3600; // the length of the COG Vector in seconds
		this.cogVectorVisible = true;
		this.lnkOptionAutoCenter = null;
		this.lnkOptionCOGVector = null;
		this.autoCenter = false;
		this.maxAgeSeconds = 3600;
		this.initialize();
	};

	MapPositionMarker.prototype = {

		/// registers the listener for changed gps data
		initialize: function () {
			this.readSettings();
			this.gpsObserver.on('recieveGpsData', this.gpsObserver_recieceGpsData.bind(this));
			this.gpsObserver.on('outdatedGpsData', this.gpsObserver_outdatedGpsData.bind(this));
			this.addSettingsControl();
			this.addOutdatedGpsWarning();
		},

		/// reads the persisted user settings
		readSettings: function(){
			this.autoCenter = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.autoCenterPosition') || false;
			this.cogVectorVisible = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.cogVectorVisible') || false;
		},

		/// handles recieving new gps data
		gpsObserver_recieceGpsData: function () {
			this.draw();
			RC.Utils.showHide(this.outdatedGpsWarning, false);
		},

		/// shows a warning if we have no current gps data
		gpsObserver_outdatedGpsData: function () {
			RC.Utils.showHide(this.outdatedGpsWarning, true);
		},

		/// adds, but does not show the outdated GPS warning
		addOutdatedGpsWarning: function () {
			this.outdatedGpsWarning = PiLot.Utils.Common.createNode(PiLot.Templates.Map.outdatedGpsWarning);
			this.map.getMapContainer().insertAdjacentElement('beforeend', this.outdatedGpsWarning);
		},

		/// draws the marker and the cog vector onto the map
		draw: function () {
			var latestPosition = this.gpsObserver.getLatestPosition(this.maxAgeSeconds);
			if (latestPosition != null) {
				this.drawPosition(latestPosition.getLatLng());
				this.drawCOGVector(latestPosition.getLatLon());
			}			
		},

		/// draws the position marker onto the map. Expects pPosition as LatLng
		drawPosition: function (pLatLng) {
			if (this.autoCenter === true) {
				this.map.setCenter(pLatLng);
			}
			if (this.marker === null) {
				var icon = L.divIcon({
					className: 'navMyBoatIcon', iconSize: [20, 20]
				});
				this.marker = L.marker(pLatLng, { icon: icon, zIndexOffset: 1000 });
				this.marker.addTo(this.map.getLeafletMap());
			} else {
				this.marker.setLatLng(pLatLng);
			}
		},

		/// draws the coc vector onto the map
		drawCOGVector: function (pPosition) {
			if (this.cogVectorVisible) {
				var sog = this.gpsObserver.getSOG();
				var cog = this.gpsObserver.getCOG();
				if ((sog !== null) && (sog !== 0) && (cog !== null)) {
					var distance = PiLot.Utils.Common.knotsToMpS(sog) * this.cogLength; // the length of the vector in meters
					if (distance > 0) {
						var endPosition = pPosition.destinationPoint(distance, cog);
						var lineStart = PiLot.Utils.Nav.latLonToLatLng(pPosition);
						var lineEnd = PiLot.Utils.Nav.latLonToLatLng(endPosition);
						if (this.cogVector === null) {
							this.cogVector = L.polyline([lineStart, lineEnd], { color: '#8E6929' }).addTo(this.map.getLeafletMap());
						} else {
							this.cogVector.setLatLngs([lineStart, lineEnd]);
						}
					} 
				}else if(this.cogVector !== null) {
					this.cogVector.remove();
					this.cogVector = null;
				}
			}
		},

		/// removes the marker from the map
		hide: function () {
			if (this.marker !== null) {
				this.marker.remove();
				this.marker = null;
			}
		},

		/// hides the cog vector
		hideCOGVector: function () {
			if (this.cogVector !== null) {
				this.cogVector.remove();
				this.cogVector = null;
			}
		},

		/// adds the "auto center" and "show cog vector" control to the settings container
		addSettingsControl: function () {
			this.lnkOptionAutoCenter = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapAutoCenter);
			this.lnkOptionAutoCenter.classList.toggle('active', this.autoCenter);
			this.lnkOptionAutoCenter.addEventListener('click', this.lnkOptionAutoCenter_click.bind(this));
			this.map.addSettingsItem(this.lnkOptionAutoCenter);
			this.lnkOptionCOGVector = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapShowCOG);
			this.lnkOptionCOGVector.classList.toggle('active', this.cogVectorVisible);
			this.lnkOptionCOGVector.addEventListener('click', this.lnkOptionCOGVector_click.bind(this));
			this.map.addSettingsItem(this.lnkOptionCOGVector);
		},

		/// handles the click on the autoCenter link
		lnkOptionAutoCenter_click: function () {
			this.autoCenter = !this.autoCenter;
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.autoCenterPosition', this.autoCenter);
			this.lnkOptionAutoCenter.classList.toggle('active', this.autoCenter);
			this.draw();
		},

		/// handles the click on the cogVector option link
		lnkOptionCOGVector_click: function () {
			this.cogVectorVisible = !this.cogVectorVisible;
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.cogVectorVisible', this.cogVectorVisible);
			this.lnkOptionCOGVector.classList.toggle('active', this.cogVectorVisible);
			if (this.cogVectorVisible) {
				this.draw();
			} else {
				this.hideCOGVector();
			}
		}
	};

	/// class MapRoute, represents a route being drawn onto a map
	var MapRoute = function (pMap, pRoute, pOptions) {
		this.map = pMap;
		this.route = pRoute;
		this.observers = null;
		this.routeObserver = null;
		this.lnkOptionShowRoute = null;
		this.lnkOptionLockRoute = null;
		this.lnkAddWaypoint = null;
		this.showRoute = null;
		this.lockRoute = null;
		this.showOptions = true;
		this.mapWaypoints = null;
		this.blockRefresh = false;
		this.readOptions(pOptions);
		this.initialize();
	};

	MapRoute.prototype = {

		/// reads the options, if any have been passed
		readOptions: function (pOptions) {
			if (pOptions) {
				this.routeObserver = pOptions.routeObserver || this.routeObserver;
				if (typeof pOptions.showRoute !== 'undefined') {
					this.showRoute = pOptions.showRoute;
				}
				if (typeof pOptions.lockRoute !== 'undefined') {
					this.lockRoute = pOptions.lockRoute;
				}
				if (typeof pOptions.showOptions !== 'undefined') {
					this.showOptions = pOptions.showOptions;
				}
			}
		},

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['selectWaypoint', 'unselectWaypoint']);
			if (this.routeObserver !== null) {
				this.routeObserver.on('recieveGpsData', this.routeObserver_gpsChanged.bind(this));
				this.routeObserver.on('changeLeg', this.routeObserver_legChanged.bind(this));
			}
			this.readSettings();
			if (this.showOptions) {
				this.addSettingsControl();
			}
			this.addContextPopupLink();
			this.route.on('addWaypoint', this.route_addWaypoint.bind(this));
			this.route.on('deleteWaypoint', this.route_deleteWaypoint.bind(this));
			this.route.on('changeWaypoints', this.route_changeWaypoints.bind(this));
		},

		/** registers an observer which will be called when pEvent happens */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/// reads the persisted user settings
		readSettings: function() {
			if (this.showRoute === null) {
				this.showRoute = PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.showRoute') || false;
			}
			if (this.lockRoute === null) {
				this.lockRoute = this.lockRoute || PiLot.Utils.Common.loadUserSetting('PiLot.View.Map.lockRoute') || false;
			}
		},

		/// handles the click to the "show route" button, shows or removes the route
		lnkOptionShowRoute_click: function () {
			this.showRoute = !this.showRoute;
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.showRoute', this.showRoute);
			this.lnkOptionShowRoute.classList.toggle('active', this.showRoute);
			if (this.showRoute) {
				this.draw();
				this.fitMap();
			} else {
				this.deleteFromMap();
			}
		},

		/// handles the click to the "lock route" button
		lnkOptionLockRoute_click: function () {
			this.lockRoute = !this.lockRoute;
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Map.lockRoute', this.lockRoute);
			this.lnkOptionLockRoute.classList.toggle('active', this.lockRoute);
			const locked = this.lockRoute;
			if (this.mapWaypoints !== null) {
				this.mapWaypoints.forEach(function (pValue, pKey, pMap) {
					pValue.setLocked(locked);
				});
			}
			if (locked) {
				this.map.contextPopup.removeLink(this.lnkAddWaypoint);
			} else {
				this.map.getContextPopup().addLink(this.lnkAddWaypoint, this.lnkAddWaypoint_click.bind(this));
			}
		},

		/// handles the click on the add waypoint link in the context popup of the map.
		/// shows the route if necessary and adds a waypoint, even saving the route.
		/// By wrapping the position we make sure we have non lngs < -180 or > 180
		lnkAddWaypoint_click: function (mapEvent, clickEvent) {
			clickEvent.preventDefault();
			if (!this.showRoute) {
				this.showRoute = true;
			}
			this.map.contextPopup.close();
			var latlng = mapEvent.latlng.wrap();
			let wpName = `${PiLot.Utils.Language.getText('waypoint')} ${this.route.getWaypoints().length + 1}`;
			this.route.addWaypoint(new PiLot.Model.Nav.Waypoint(this.route, latlng.lat, latlng.lng, wpName));
		},

		/// handles changes to the gps data by re-drawing the route onto the map
		routeObserver_gpsChanged: function () {
			if (!this.blockRefresh) {
				this.draw(false);
			}
		},

		/// we don't need to do anything here, it's being handled by other events
		routeObserver_legChanged: function () { },

		/// redraws the route, if the change was not caused by this
		route_changeWaypoints: function (pSender, pArgs) {
			if (pSender !== this) {
				this.deleteFromMap();
				this.draw(true);
			}
		},

		/// handles adding new waypoints, redraws the entire route
		route_addWaypoint: function () {
			this.deleteFromMap();
			this.draw(false);
		},

		/// handles deleting waypoints, redraws the entire route
		route_deleteWaypoint: function () {
			this.deleteFromMap();
			this.draw(false);
		},

		route_rename: function () { },

		route_delete: function () { },

		mapWaypoint_select: function (pSender, pArg) {
			const index = this.route.getWaypoints().indexOf(pArg.getWaypoint());
			RC.Utils.notifyObservers(this, this.observers, 'selectWaypoint', index);
		},

		mapWaypoint_unselect: function (pSender, pArg) {
			RC.Utils.notifyObservers(this, this.observers, 'unselectWaypoint', null);
		},

		/// draws the route to the map, but only if this.showRoute is true
		draw: function (pResetWaypointPositions) {
			if (this.showRoute) {
				const waypoints = this.route.getWaypoints();
				let waypoint = null;
				if (this.mapWaypoints === null) {
					this.mapWaypoints = new Map();
				}
				let mapWaypoint = null;
				let liveData = null;
				let previousMapWayoint = null;
				for (let i = 0; i < waypoints.length; i++) {
					waypoint = waypoints[i];
					if (!this.mapWaypoints.has(waypoint)) {
						mapWaypoint = new MapWaypoint(this, waypoint);
						mapWaypoint.on('select', this.mapWaypoint_select.bind(this));
						mapWaypoint.on('unselect', this.mapWaypoint_unselect.bind(this));
						this.mapWaypoints.set(waypoint, mapWaypoint);
					} else {
						mapWaypoint = this.mapWaypoints.get(waypoint);
					}					
					if (this.routeObserver != null) {
						liveData = this.routeObserver.getLiveData(waypoint);
					} else {
						liveData = null;
					}
					mapWaypoint.draw(previousMapWayoint, liveData, pResetWaypointPositions);
					previousMapWayoint = mapWaypoint;
				}
			}
			RC.Utils.showHide(this.lnkAddWaypoint, this.showRoute && !this.lockRoute);
			return this;
		},

		/// adds the "show route" and "lock route" control to the settings container
		addSettingsControl: function () {
			this.lnkOptionShowRoute = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapShowRoute);
			this.lnkOptionShowRoute.classList.toggle('active', this.showRoute);
			this.lnkOptionShowRoute.addEventListener('click', this.lnkOptionShowRoute_click.bind(this));
			this.map.addSettingsItem(this.lnkOptionShowRoute);
			if (PiLot.Permissions.canWrite()) {
				this.lnkOptionLockRoute = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapLockRoute);
				this.lnkOptionLockRoute.classList.toggle('active', this.lockRoute);
				this.lnkOptionLockRoute.addEventListener('click', this.lnkOptionLockRoute_click.bind(this));
				this.map.addSettingsItem(this.lnkOptionLockRoute);
			}
		},

		/// adds an "add Waypoint" link to the map context popup
		addContextPopupLink: function () {
			if (!this.lockRoute) {
				this.lnkAddWaypoint = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapAddWaypointLink);
				this.map.getContextPopup().addLink(this.lnkAddWaypoint, this.lnkAddWaypoint_click.bind(this));
			}
		},

		/// adjust zoom and center of the map so that all waypoints are visible on the map
		fitMap: function () {
			var positions = new Array();
			this.mapWaypoints.forEach(function (pValue, pKey, pMap) {
				positions.push(pValue.getLatLng());
			});
			this.map.setBounds(positions);
			return this;
		},

		/// removes the route from the map and sets the mapWaypoints Hashtable
		/// to null, so it will be re-created on the next draw
		deleteFromMap: function () {
			this.mapWaypoints.forEach(function (pValue, pKey, pMap) {
				pValue.deleteFromMap();
			});
			this.mapWaypoints = null;
		},

		/// gets a handle to the leaflet map this is being drawn to
		getLeafletMap: function () {
			return this.map.getLeafletMap();
		},

		/// locks the map, so it won't auto-center, and interrupts
		/// re-drawing waypoints. Used during dragging of waypoints
		lock: function(){
			this.blockRefresh = true;
			this.map.lock();
		},

		/// unlocks the map, so it can again auto-center, and allows
		/// waypoints to be redrawn
		unlock: function () {
			this.blockRefresh = false;
			this.map.unlock();
		},

		/** returns whether the route is locked */
		getIsLocked: function () {
			return this.lockRoute;
		}
	};

	/// represents the waypoint being drawn onto the map. 
	var MapWaypoint = function (pMapRoute, pWaypoint) {
		this.marker = null;
		this.observers = null;
		// marker popup and controls within
		this.markerPopup = null;
		this.markerPopupContent = null;
		this.lblName = null;
		this.lblLatLng = null;
		this.lblEta = null;
		this.lblDist = null;
		this.lblBearing = null;
		this.lnkDelete = null;
		// leg and leg popup
		this.incomingLeg = null;
		this.outgoingLeg = null;
		// other controls / view objects
		this.mapRoute = pMapRoute;
		this.waypoint = pWaypoint;
		this.waypointLiveData = null;
		this.initialize();
	};

	MapWaypoint.prototype = {

		initialize: function () {
			this.observers = RC.Utils.initializeObservers(['select', 'unselect']);
			this.waypoint.on('move', this.waypoint_move.bind(this));
			this.waypoint.on('rename', this.waypoint_rename.bind(this));
		},

		/** registers an observer which will be called when pEvent happens */
		on: function (pEvent, pCallback) {
			RC.Utils.addObserver(this.observers, pEvent, pCallback);
		},

		/// handles moving the waypoint. Updates the marker,
		/// if the movement was not caused by this, and 
		/// refreshes the legs.
		waypoint_move: function (pSender, pArg) {
			if (pSender !== this) {
				this.drawMarker(true);
			}
			this.updateLegs(this.waypoint.getLatLng());
			this.updateMarkerPopup();
		},

		/// handles the rename event of the waypoint, updates the popup content
		waypoint_rename: function (pSender, pArg) {
			this.updateMarkerPopup();
		},

		/// handles starting to drag the marker. we lock the map
		marker_dragstart: function (e) {
			this.mapRoute.lock();
		},

		/// handles the marker being dragged by updating the legs
		marker_drag: function (e) {
			var latLng = e.target.getLatLng();
			this.waypoint.setLatLng(latLng, true, this);
		},

		/// handles the drag-end by informing the waypoint about its new position
		/// and unlocking the map
		marker_dragend: function (e) {
			this.mapRoute.unlock();
			this.waypoint.setLatLng(e.target.getLatLng());
		},

		/// handles clicks on the marker, showing the popup
		marker_click: function () {
			this.showMarkerPopup();
			RC.Utils.notifyObservers(this, this.observers, 'select', this);
		},

		/// handles the click on the leg by ad hoc binding a popup with 
		/// a link to insert a waypoint at the click location
		incomingLeg_click: function (e) {
			if (!this.mapRoute.getIsLocked()) {
				const legPopupContent = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapLegPopup);
				legPopupContent.querySelector('.lnkInsertWaypoint').addEventListener('click', this.lnkInsertWaypoint_click.bind(this, e));
				const legPopup = L.popup();
				legPopup.setLatLng(e.latlng).setContent(legPopupContent).openOn(this.mapRoute.getLeafletMap());
			}
		},

		/// click handler for the delete link in the waypoint popup
		lnkDelete_click: function (e) {
			e.preventDefault();
			const message = PiLot.Utils.Language.getText('confirmDeleteWaypoint').replace("{{waypointName}}", this.waypoint.name);
			if (window.confirm(message)) {
				this.waypoint.getRoute().deleteWaypoint(this.waypoint);
			}
		},

		/// inserts a waypoint before this waypoint. It gets two events, the first
		/// is the leflet event, the second is the jquery event.
		lnkInsertWaypoint_click: function (mapEvent, linkEvent) {
			linkEvent.preventDefault();
			this.mapRoute.getLeafletMap().closePopup();
			this.waypoint.insertBefore(mapEvent.latlng);
		},

		/// sets the outgoing leg
		setOutgoingLeg: function (pOutgoingLeg) {
			this.outgoingLeg = pOutgoingLeg;
		},

		getWaypoint: function () {
			return this.waypoint;
		},

		/// gets the latLng for the waypoint assigned to this
		getLatLng: function(){
			return this.waypoint.getLatLng();
		},

		/// draws the waypoint marker and the outgoing leg onto the map. 
		/// expects a previous leg (L.polyline), which will need to be
		/// updated if the waypoint is being dragged. 
		draw: function (pPreviousMapWaypoint, pWaypointLiveData, pResetPosition) {
			this.waypointLiveData = pWaypointLiveData;
			if (this.waypoint.hasPosition()) {
				this.drawMarker(pResetPosition);
				this.drawLegs(pPreviousMapWaypoint, pResetPosition);
				this.setLocked(this.mapRoute.getIsLocked());
				this.updateMarkerPopup();
			}
		},

		/// draws the marker for the waypoint, accepting live data
		/// and an option to reset the waypoint position. If pResetPosition
		/// is falsy, only the marker icon will be updated
		drawMarker: function (pResetPosition) {
			if (this.waypoint.hasPosition()) {
				let iconHtml;
				if (this.waypointLiveData && this.waypointLiveData.isNextWaypoint) {
					iconHtml = '<i class="icon-location2"></i>';
				} else if ((this.waypointLiveData !== null) && this.waypointLiveData.isPastWaypoint) {
					iconHtml = '<i class="icon-checkmark5"></i>';
				} else if ((this.waypointLiveData !== null) && this.waypointLiveData.isFinalWaypoint) {
					iconHtml = '<i class="icon-flag"></i>';
				} else {
					iconHtml = '<i class="icon-location"></i>';
				}
				const icon = L.divIcon({
					className: 'navWaypointMarker', iconSize: [36, 36], html: iconHtml
				});
				const latLon = this.waypoint.getLatLon();
				if (this.marker === null) {
					this.marker = L.marker(latLon, { icon: icon, draggable: true, autoPan: true });
					this.marker.on('dragstart', this.marker_dragstart.bind(this));
					this.marker.on('dragend', this.marker_dragend.bind(this));
					this.marker.on('drag', this.marker_drag.bind(this));
					this.marker.on('click', this.marker_click.bind(this));
					this.marker.addTo(this.mapRoute.getLeafletMap());
				} else {
					this.marker.setIcon(icon);
					if (pResetPosition) {
						this.marker.setLatLng(latLon);
					}
				}
			}
		},

		/// draws the incoming leg, and assigns it as outgoing leg to the
		/// previous mapWaypoint
		drawLegs: function (pPreviousMapWaypoint, pResetPosition) {
			var isCurrentLeg = ((this.waypointLiveData !== null) && (this.waypointLiveData.isNextWaypoint));
			var latLng = this.waypoint.getLatLng();
			if (pPreviousMapWaypoint !== null) {
				var previousWaypointLatLng = pPreviousMapWaypoint.getLatLng();
				if(previousWaypointLatLng !== null){
					var legOptions = isCurrentLeg ? PiLot.Templates.Map.mapCurrentLegOptions : PiLot.Templates.Map.mapLegOptions;
					if (this.incomingLeg === null) {
						this.incomingLeg = L.polyline([previousWaypointLatLng, latLng], legOptions).addTo(this.mapRoute.getLeafletMap());
						pPreviousMapWaypoint.setOutgoingLeg(this.incomingLeg);
					} else {
						this.incomingLeg.setStyle(legOptions);
					}
				}				
			}
			if (pResetPosition) {
				this.updateLegs(latLng);
			}
		},

		/// enables or disables the draggable behaviour of the marker
		setLocked: function (pIsLocked) {
			if (this.marker !== null) {
				if (!pIsLocked) {
					this.marker.dragging.enable();
				} else {
					this.marker.dragging.disable();
				}
			}
			if (this.incomingLeg !== null) {
				if (!pIsLocked) {
					this.incomingLeg.addEventListener('click', this.incomingLeg_click.bind(this));
				} else {
					this.incomingLeg.off();
				}
			}
		},

		/// deletes the waypoint from the map, including incoming leg and popup. This
		/// does not handle redrawing the outgoing leg, as is is thought to delete
		/// all mapWaypoints and redraw the entire route when waypoints are removed
		deleteFromMap: function(){
			if (this.incomingLeg !== null) {
				this.incomingLeg.remove();
				this.incomingLeg = null;
			}
			if (this.markerPopup !== null) {
				this.markerPopup.remove();
				this.markerPopup = null;
			}
			if (this.marker !== null) {
				this.marker.remove();
				this.marker = null;
			}
		},

		/// attaches and shows the popup to the marker.
		showMarkerPopup: function () {
			this.markerPopupContent = PiLot.Utils.Common.createNode(PiLot.Templates.Map.mapWaypointPopup);
			this.lnkDelete = this.markerPopupContent.querySelector('.lnkDelete');
			this.lnkDelete.addEventListener('click', this.lnkDelete_click.bind(this));
			this.lblName = this.markerPopupContent.querySelector('.name');
			this.lblLatLng = this.markerPopupContent.querySelector('.latLng');
			this.lblEta = this.markerPopupContent.querySelector('.eta');
			this.lblDist = this.markerPopupContent.querySelector('.dist');
			this.lblBearing = this.markerPopupContent.querySelector('.bearing');
			this.markerPopup = this.marker.bindPopup(this.markerPopupContent, { className: 'navWaypointPopup', autoPan: true }).addTo(this.mapRoute.getLeafletMap()).openPopup();
			this.markerPopup.on('popupclose', this.removeMarkerPopup.bind(this));
			this.updateMarkerPopup();
		},

		/// removes the popup from the marker. We use this to ensure not
		/// each popup is refereshed on each draw
		removeMarkerPopup: function () {
			this.marker.unbindPopup();
			this.markerPopup = null;
			RC.Utils.notifyObservers(this, this.observers, 'unselect', this);
		},

		/// updates the popup content in order to reflect waypoint properties
		/// and, if available, live data
		updateMarkerPopup: function () {
			if (this.markerPopup !== null) {
				let eta = null;
				let bearing = null;
				let distance = null;
				if (this.waypointLiveData !== null) {
					eta = this.waypointLiveData.eta;
					bearing = this.waypointLiveData.bearing;
					distance = this.waypointLiveData.miles;
				}
				const latLonText = PiLot.Utils.Nav.latLonToString(this.waypoint.getLatLon());
				const etaText = (eta !== null) ? eta.toFormat('HH:mm') : '--:--';
				const distanceText = (distance !== null) ? distance.toFixed(1) : '--';
				const bearingText = (bearing !== null) ? RC.Utils.toFixedLength(bearing, 3, 0) : '---';
				this.lblName.innerText = this.waypoint.getName();
				this.lblLatLng.innerText = latLonText;
				this.lblEta.innerText = etaText;
				this.lblDist.innerText = distanceText;
				this.lblBearing.innerText = bearingText;
				RC.Utils.showHide(this.lnkDelete, !this.mapRoute.lockRoute);
			}
		},

		/// this redraws the legs in order to match the waypoint posision
		updateLegs: function (pWaypointPosition) {
			if (this.incomingLeg !== null) {
				this.incomingLeg.setLatLngs([this.incomingLeg.getLatLngs()[0], pWaypointPosition]);
			}
			if (this.outgoingLeg !== null) {
				this.outgoingLeg.setLatLngs([pWaypointPosition, this.outgoingLeg.getLatLngs()[1]]);
			}
		}

	};

	/// a small version of the map, which is shown on the start page. This also
	/// observes size changes and shows itself as map or just as a tile, depending
	/// on the space available
	var StartPageMap = function (pContainer, pStartPage, pGpsObserver) {
		this.container = pContainer;	// the container where this will be added
		this.startPage = pStartPage;	// the start page containing this
		this.gpsObserver = pGpsObserver;// a GPS observer used for the map
		this.divMap = null;				// the div to which the map will be added
		this.map = null;				// the PiLot.View.Map.SeaMap object
		this.tile = null;				// the tile which is shown when the container is too small for the map
		this.mode = 0;					// 0: nothing shown, 1: tile shown, 2: mini map shown, 3: full featured map shown
		this.initialize();
	};

	StartPageMap.prototype = {

		initialize: function () {
			this.draw();
			this.startPage.on('resize', this.startPage_resize.bind(this));
			this.startPage.on('changedLayout', this.startPage_changedLayout.bind(this));
		},

		startPage_resize: function () {
			this.show();
		},

		/// handles the changedLayout event by making sure we have the proper click event
		/// and the map is refereshed
		startPage_changedLayout: function (pSender, pEventArgs) {
			const isMinimized = (!pEventArgs.sameSize && (pEventArgs.mainControl !== this));
			this.setContainerClick(isMinimized);
			this.show();
			this.invalidateMap();
		},

		/// creates the divMap and tile based on the template, and calls show
		draw: function () {
			RC.Utils.stringToNodes(PiLot.Templates.Map.startPageMap).forEach(function (node) {
				this.container.appendChild(node);
			}.bind(this));
			this.divMap = this.container.querySelector('.divMap');
			this.tile = this.container.querySelector('.tile');
			this.show();
			this.setContainerClick(this.startPage.isMinimized(this));
		},

		/// this sets the appropriate onclick handler to the container, either
		/// just doing nothing, or setting this as main control
		setContainerClick: function (pIsMinimized) {
			if (pIsMinimized) {
				this.container.onclick = function (e) {
					e.stopPropagation();
					this.startPage.setMainControl(this);
				}.bind(this);
			} else {
				this.container.onclick = null;
			}
		},

		/// shows eithr the map full map, the mini map or the tile, depending on available space
		show: function () {
			var newMode;
			const clientHeight = this.container.clientHeight;
			const clientWidth = this.container.clientWidth;
			if ((clientHeight < 150) || (clientWidth < 200)) {
				newMode = 1;
			} else if ((clientHeight < 300) || (clientWidth < 300)) {
				newMode = 2;
			} else {
				newMode = 3;
			}
			this.setMapMode(newMode);
		},

		/// sets the map mode, if it changed, by showing/hiding controls
		setMapMode: function (pMode) {
			if (pMode !== this.mode) {
				RC.Utils.toggleClass(this.tile, 'hidden', pMode !== 1);
				RC.Utils.toggleClass(this.divMap, 'noControls', pMode === 2);
				RC.Utils.toggleClass(this.divMap, 'hidden', pMode < 2);
				if (pMode > 1) {
					this.ensureMap();
					if (pMode < 3) {
						this.map.hideSettingsContainer();
					}
				} else {
					this.map && this.map.hide();
				}
				this.mode = pMode;
			}
		},

		/// calls invalidate on the map, in order to let leaflet do some maths
		invalidateMap: function () {
			if (this.map !== null) {
				const leafletMap = this.map.getLeafletMap();
				if (leafletMap !== null) {
					leafletMap.invalidateSize();
				}
			}
		},

		/// checks if we have a map, creates one if not, and shows it.
		ensureMap: function () {
			if (this.map === null) {
				this.map = new PiLot.View.Map.Seamap(this.divMap, { persistMapState: true });
				new PiLot.View.Map.MapPositionMarker(this.map, this.gpsObserver);
			}
			this.map.showAsync();
		}
	};

	return {
		MapPage: MapPage,
		Seamap: Seamap,
		MapContextPopup: MapContextPopup,
		MapTrack: MapTrack,
		MapRoute: MapRoute,
		MapPositionMarker: MapPositionMarker,
		StartPageMap: StartPageMap
	};

})();
