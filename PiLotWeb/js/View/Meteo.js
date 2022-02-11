var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Meteo = (function () {

	var MeteoPage = function () {
		this.controls = null;			// an array with the info controls
		this.dataLoader = null;			// the loader used to load data
		this.dataLoadInterval = null;	// one single interval to refresh all charts
		this.moonInfo = null;
		this.initialize();
	};

	MeteoPage.prototype = {

		initialize: async function () {
			this.dataLoader = new PiLot.Model.Meteo.DataLoader();
			let result = await Promise.all([
				PiLot.Model.Common.getCurrentBoatTimeAsync(),
				this.dataLoader.loadMeteoDataSourcesAsync()
			]);
			this.controls = new Array();
			this.draw(result[0], result[1]);
			this.startDataLoadAsync();
		},

		/// creates the page from the template and adds the controls, who will 
		/// draw themselves.
		draw: function (pBoatTime, pSensors) {
			const pageContent = RC.Utils.stringToNodes(PiLot.Templates.Meteo.meteoPage);
			let contentArea = PiLot.Utils.Loader.getContentArea();
			contentArea.appendChildren(pageContent);
			const chartContainer = contentArea.querySelector('.plhChartContainer');
			let control;
			pSensors.forEach(function (sensor) {
				switch (sensor.sensorType) {
					case 'temperature':
						control = new PiLot.View.Meteo.TemperatureInfo(chartContainer, pBoatTime, sensor);
						break;
					case 'humidity':
						control = new PiLot.View.Meteo.HumidityInfo(chartContainer, pBoatTime, sensor);
						break;
					case 'pressure':
						control = new PiLot.View.Meteo.PressureInfo(chartContainer, pBoatTime, sensor);
						break;
				}
				this.controls.push(control);
			}.bind(this));
			this.moonInfo = new PiLot.View.Meteo.MoonInfo(contentArea.querySelector('.plhMoon'), pBoatTime);
			if (pSensors.length < 1) {
				const plhMeteoblue = contentArea.querySelector('.plhMeteoblue');
				RC.Utils.showHide(plhMeteoblue, true);
				new MeteoblueFrame(plhMeteoblue);
			}
		},

		/// initially loads the data and then starts the interval which will
		/// keep loading current data
		startDataLoadAsync: async function () {
			await this.loadAllDataAsync();
			this.ensureDataLoadInterval();
		},

		/// this starts the interval fetching data. We don't start this immediately but
		/// only after getting the first data, in order to not flood the server
		/// with requests when he is just waking up
		ensureDataLoadInterval: function () {
			if (this.dataLoadInterval === null) {
				this.dataLoadInterval = window.setInterval(this.loadAllDataAsync.bind(this), StartPageMeteo.updateIntervalSeconds * 1000);
			}
		},

		/// loads data from the server and applies it to them controls
		loadAllDataAsync: async function () {
			let promises = this.controls.map(control => this.loadDataAsync.bind(this, control)());
			await Promise.all(promises);
		},

		loadDataAsync: async function (pControl) {
			await pControl.loadDataAsync();
		}
	};

	/**
	 * The StartPageMeteo displays a control for each sensor that has the "meteo" plus the "startPage"
	 * tag. It uses a specific priorityzation algorythm to sort the controls, base don type before the
	 * sort order defined with the sensors. Depending on the space available, more or less data is shown.
	 * @param {HTMLElement} pContainer - the container to which we append the control
	 * @param {PiLot.View.Common.StartPage} pStartPage - A reference to the startPage
	 * @param {PiLot.Model.Common.BoatTime} pBoatTime - the current boatTime
	 */
	var StartPageMeteo = function (pContainer, pStartPage, pBoatTime) {
		this.infoControls = null;
		this.container = pContainer;
		this.startPage = pStartPage;
		this.boatTime = pBoatTime;
		this.dataLoader = null;
		this.dataLoadInterval = null;
		this.initialize();
	};

	StartPageMeteo.updateIntervalSeconds = 60;

	StartPageMeteo.prototype = {

		initialize: async function () {
			this.startPage.on('changingLayout', this.startPage_changingLayout.bind(this));
			this.startPage.on('changedLayout', this.startPage_changedLayout.bind(this));
			this.startPage.on('resize', this.startPage_resize.bind(this));
			this.dataLoader = new PiLot.Model.Meteo.DataLoader();
			this.infoControls = new Array();
			let sensors = await this.dataLoader.loadMeteoDataSourcesAsync();
			sensors = sensors.filter(s => s.tags.includes('startPage'));
			sensors.sort((a, b) => this.getSensorPriority(a) - this.getSensorPriority(b));
			this.draw(sensors);
			this.startDataLoadAsync();
		},

		/// before a layout change is applied, we hide everything because
		/// otherwise it can break the layout
		startPage_changingLayout: function (pSender, pEventArgs) {
			this.hideAll();
		},

		/// ensures the right click handler and control visibility
		/// after the layout has changed
		startPage_changedLayout: function (pSender, pEventArgs) {
			var isMinimized = (!pEventArgs.sameSize && (pEventArgs.mainControl !== this));
			this.setContainerClick(isMinimized);
			this.decideControlsVisible();
		},

		/// handles resize of the page
		startPage_resize: function () {
			this.decideControlsVisible();
		},

		/// draws the control within this.container
		draw: function (pSensors) {
			let mainControl = RC.Utils.stringToNode(PiLot.Templates.Meteo.startPageMeteo);
			this.container.appendChild(mainControl);
			let infoControl;
			pSensors.forEach(function (sensor) {
				switch (sensor.sensorType) {
					case 'temperature':
						infoControl = new PiLot.View.Meteo.TemperatureInfo(mainControl, this.boatTime, sensor);
						break;
					case 'humidity':
						infoControl = new PiLot.View.Meteo.HumidityInfo(mainControl, this.boatTime, sensor);
						break;
					case 'pressure':
						infoControl = new PiLot.View.Meteo.PressureInfo(mainControl, this.boatTime, sensor);
						break;
				}
				this.infoControls.push(infoControl);
			}.bind(this));
			this.hideAll();
			this.decideControlsVisible();
			this.setContainerClick(this.startPage.isMinimized(this));
		},

		/// initially loads the data and then starts the interval which will
		/// keep loading current data
		startDataLoadAsync: async function () {
			await this.loadAllDataAsync();
			this.ensureDataLoadInterval();
		},

		/// this starts the interval fetching data. We don't start this immediately but
		/// only after getting the first data, in order to not flood the server
		/// with requests when he is just waking up
		ensureDataLoadInterval: function () {
			if (this.dataLoadInterval === null) {
				this.dataLoadInterval = window.setInterval(this.loadAllDataAsync.bind(this), StartPageMeteo.updateIntervalSeconds * 1000);
			}
		},

		/// loads data from the server and applies it to them controls
		loadAllDataAsync: async function () {
			let promises = this.infoControls.map(control => this.loadDataAsync.bind(this, control)());
			await Promise.all(promises);
		},

		loadDataAsync: async function (pControl) {
			await pControl.loadDataAsync();
		},

		/// hides all controls. This is needed, as otherwise the bounding rectangle
		/// is too big, which will result in an wrong calculation of what to show.
		hideAll: function () {
			this.infoControls.forEach(c => (('setViewMode' in c) && c.setViewMode([false, false, false, false])));
		},

		/// checks for each control if it should be visible under the given circumstances, 
		/// and shows/hides it accordingly.
		decideControlsVisible: function () {
			let height = this.container.clientHeight - 20;
			const width = this.container.clientWidth;
			if (width < 350) {
				height = height / 2;
			}
			if (width < 240) {
				height = height / 2;
			}
			let heightObj = { height: height };
			let visibilityMap = new Map();  // a map with key: control, visibility
			this.infoControls.forEach(function (c) {
				let visibility = { primaryInfo: this.decideControlVisible(heightObj, 40), secondaryInfo: false, chart: false };
				visibilityMap.set(c, visibility);
			}.bind(this));
			this.infoControls.forEach(function (c) {
				let visibility = visibilityMap.get(c);
				visibility.secondaryInfo = this.decideControlVisible(heightObj, 40);
			}.bind(this));
			this.infoControls.forEach(function (c) {
				let visibility = visibilityMap.get(c);
				visibility.chart = this.decideControlVisible(heightObj, 200);
			}.bind(this));
			this.infoControls.forEach(function (c) {
				c.setViewMode(visibilityMap.get(c));
			}.bind(this));
		},

		/* Used to sort sensors so that we first have pressure, then temperature, then humidity */
		getSensorPriority: function (pSensor) {
			let add;
			switch (pSensor.sensorType) {
				case 'pressure':
					add = 0;
					break;
				case 'temperature':
					add = 10;
					break;
				case 'humidity':
					add = 20;
					break;
				default:
					add = 30;
			}
			return add + pSensor.sortOrder
		},

		/// decides whether a control using pHeightNeeded pixels shoud be available
		/// and if so, decreases the available height
		/// @param pHeightAvailableObj: object {height}, so that it can be passed as reference
		decideControlVisible: function (pHeightAvailableObj, pHeightNeeded) {
			var result = false;
			if (pHeightAvailableObj.height >= pHeightNeeded) {
				pHeightAvailableObj.height -= pHeightNeeded;
				result = true;
			}
			return result;
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
	};

	/**
	 * A control containing numeric and graphical information about the current and
	 * historic temperature
	 * @param {HTMLElement} pParentContainer - The container within which this will be appended as child
	 * @param {PiLot.Model.Common.BoatTime} pBoatTime - The current BoatTime object, used to localize time in the chart
	 * @param {String} pViewMode - defines which parts are visible: {primaryInfo, secondaryInfo, chart}
	 * @param {String} pTitle - the title to display within the chart
	 * */

	var TemperatureInfo = function (pParentContainer, pBoatTime, pSensorInfo, pViewMode = null) {
		let chartSettings = { fillColor: 'rgba(96, 96, 209, 0.6)', yStep: 5, yRange: 20 };
		this.minMaxInfo = new MinMaxInfo(pParentContainer, pBoatTime, pSensorInfo, PiLot.Templates.Meteo.temperatureInfo, chartSettings, pViewMode);
	};

	TemperatureInfo.prototype = {

		/// shows/updates the data in the control
		showData: function (pData) {
			this.minMaxInfo.showData(pData);
		},

		/// sets which controls should be shown
		/// @param pViewMode: object with {currentValue, minValue, maxValue, chart} or an array with 4 Booleans
		setViewMode: function (pViewMode) {
			this.minMaxInfo.setViewMode(pViewMode);
		},

		/* 
		 * loads and shows the data
		 * */
		loadDataAsync: async function () {
			return await this.minMaxInfo.loadDataAsync();
		},
	}

	/**
	 * A control containing numeric and graphical information about the current and
	 * historic humidity
	 * @param {HTMLElement} pParentContainer - The container within which this will be appended as child
	 * @param {PiLot.Model.Common.BoatTime} pBoatTime - The current BoatTime object, used to localize time in the chart
	 * @param {Object} pSensorInfo - object with {sensorType, id, name, displayName, tags, sortOrder}
	 * @param {String} pViewMode - defines which parts are visible: {primaryInfo, secondaryInfo, chart}
	 * */

	var HumidityInfo = function (pParentContainer, pBoatTime, pSensorInfo, pViewMode = null) {
		let chartSettings = { fillColor: 'rgba(96, 148, 209, 0.6)', yStep: 5, yRange: 50 };
		this.minMaxInfo = new MinMaxInfo(pParentContainer, pBoatTime, pSensorInfo, PiLot.Templates.Meteo.humidityInfo, chartSettings, pViewMode);
	};

	HumidityInfo.prototype = {

		/// shows/updates the data in the control
		showData: function (pData) {
			this.minMaxInfo.showData(pData);
		},

		/// sets which controls should be shown
		/// @param pViewMode: object with {primaryInfo, secondaryInfo, chart} or an array with 3 Booleans
		setViewMode: function (pViewMode) {
			this.minMaxInfo.setViewMode(pViewMode);
		},

		/* 
		 * loads and shows the data
		 * */
		loadDataAsync: async function () {
			return await this.minMaxInfo.loadDataAsync();
		},
	}

	/**
	 * A control containing numeric and graphical information about the current and
	 * historic values
	 * @param {HTMLElement} pParentContainer - The container within which this will be appended as child
	 * @param {PiLot.Model.Common.BoatTime} pBoatTime - The current BoatTime object, used to localize time in the chart
	 * @param {Object} pSensorInfo - object with {sensorType, id, name, displayName, tags, sortOrder}
	 * @param {String} pTemplate - the html template used to draw the control
	 * @param {Object} pChartSettings - Object with {fillColor, yRange, yStep}
	 * @param {String} pViewMode - defines which parts are visible: {primaryInfo, secondaryInfo, chart}
	 * */

	var MinMaxInfo = function (pParentContainer, pBoatTime, pSensorInfo, pTemplate, pChartSettings, pViewMode = null) {
		this.parentContainer = pParentContainer;
		this.boatTime = pBoatTime;
		this.sensorInfo = pSensorInfo;
		this.viewMode = pViewMode;
		this.template = pTemplate;
		this.chartSettings = pChartSettings;
		this.divCurrentValue = null;
		this.divMinValue = null;
		this.divMaxTemperature = null;
		this.lblCurrentValue = null;
		this.lblMinValue = null;
		this.lblMaxValue = null;
		this.chartContainer = null;
		this.chart = null;
		this.initialize();
	};

	MinMaxInfo.maxAge = 1000;

	MinMaxInfo.prototype = {

		initialize: function () {
			this.viewMode = this.viewMode || { primaryInfo: true, secondaryInfo: true, chart: true };
			this.draw();
			this.applyViewMode();
		},

		/// draws the control based on the item, as a child of this.parentContainer
		draw: function () {
			var control = PiLot.Utils.Common.createNode(this.template);
			this.parentContainer.appendChild(control);
			this.divCurrentValue = control.querySelector('.divCurrentValue');
			this.divMinValue = control.querySelector('.divMinValue');
			this.divMaxValue = control.querySelector('.divMaxValue');
			this.lblCurrentValue = control.querySelector('.lblCurrentValue');
			this.lblMinValue = control.querySelector('.lblMinValue');
			this.lblMaxValue = control.querySelector('.lblMaxValue');
			this.chartContainer = control.querySelector('.divChartContainer');
			const divChart = this.chartContainer.querySelector('.divChart');
			const divChartLoading = this.chartContainer.querySelector('.divChartLoading');
			const divChartError = this.chartContainer.querySelector('.divChartError');
			var controls = { error: divChartError, loading: divChartLoading, chart: divChart };
			this.chart = new PiLot.Utils.Chart.DataChart(controls, this.chartSettings.yRange, this.chartSettings.yStep, null, "HH'h'", this.chartSettings.fillColor);
			const lblDataName = this.chartContainer.querySelector('.lblName');
			if (lblDataName) {
				lblDataName.innerText = this.sensorInfo.displayName;
			}
		},

		/* 
		 * loads and shows the data
		 * */
		loadDataAsync: async function () {
			let data = await PiLot.Utils.Chart.loadRecentData(this.sensorInfo.name, 60 * 60 * 24 * 2, 600);
			this.showData(data);
		},

		/// shows/updates the data in the control
		showData: function (pData) {
			this.showValues(pData);
			if (this.viewMode.chart) {
				this.chart.showChart(pData);
			}
		},

		/// shows the numeric values (current, min, max temperature)
		showValues: function (pData) {
			var utcNow = this.boatTime.utcNowUnix();
			if (this.viewMode.primaryInfo) {
				if ((pData.lastValueTimestamp !== null) && (utcNow - pData.lastValueTimestamp < MinMaxInfo.maxAge)) {
					this.lblCurrentValue.innerText = pData.lastValue.toFixed(1);
				} else {
					this.lblCurrentValue.innerText = "--";
				}
			}
			if (this.viewMode.secondaryInfo) {
				RC.Utils.showNumericValue(this.lblMinValue, pData.minValue, '--', 1, false);
				RC.Utils.showNumericValue(this.lblMaxValue, pData.maxValue, '--', 1, false);
			}
		},

		/// sets which controls should be shown
		/// @param pViewMode: object with {primaryInfo, secondaryInfo, chart} or an array with 3 Booleans
		setViewMode: function (pViewMode) {
			if (Array.isArray(pViewMode) && pViewMode.length == 3) {
				this.viewMode = {
					primaryInfo: pViewMode[0],
					secondaryInfo: pViewMode[1],
					chart: pViewMode[2]
				};
			} else {
				this.viewMode = pViewMode;
			}
			this.applyViewMode();
		},

		/// applies the current viewMode by showing / hiding them controls
		applyViewMode: function () {
			var changed = this.toggleVisible(this.divCurrentValue, this.viewMode.primaryInfo);
			changed = this.toggleVisible(this.divMinValue, this.viewMode.secondaryInfo) || changed;
			changed = this.toggleVisible(this.divMaxValue, this.viewMode.secondaryInfo) || changed;
			changed = this.toggleVisible(this.chartContainer, this.viewMode.chart) || changed;
			if (changed && (this.viewMode.primaryInfo || this.viewMode.secondaryInfo || this.viewMode.chart)) {
				this.loadDataAsync();
			}
		},

		/// makes sure pControl is visible or not, and returns 
		/// whether the visibility changed
		toggleVisible: function (pControl, pVisible) {
			var result = false;
			if (pControl.classList.contains('hidden') !== !pVisible) {
				pControl.classList.toggle('hidden', !pVisible);
				result = true;
			}
			return result;
		}
	};

	/**
	* A control containing numeric and graphical information about the current and
	* historic air pressure
	* @param {HTMLElement} pParentContainer - The container within which this will be appended as child
	* @param {PiLot.Model.Common.BoatTime} pBoatTime - The current BoatTime object, used to localize time in the chart
	* @param {String} pViewMode - defines which parts are visible: {primaryInfo, secondaryInfo, chart}, corresponding to trend, current value, chart
	* @param {String} pTitle - the title to display within the chart
	* */
	var PressureInfo = function (pParentContainer, pBoatTime, pSensorInfo, pViewMode = null, ) {
		this.parentContainer = pParentContainer;
		this.boatTime = pBoatTime;
		this.sensorInfo = pSensorInfo;
		this.viewMode = pViewMode;
		this.currentPressureContainer = null;
		this.iconContainer = null;
		this.trendContainer = null;
		this.lblPressure = null;
		this.lblPressureTrend = null;
		this.lblRiseFast = null;
		this.lblRise = null;
		this.lblConstant = null;
		this.lblDrop = null;
		this.lblDropFast = null;
		this.lblDropExtreme = null;
		this.chartContainer = null;
		this.chart = null;
		this.initialize();
	};

	PressureInfo.chartRange = 2000;
	PressureInfo.chartStep = 500;
	PressureInfo.maxAge = 60 * 30;	// the max age of data to show in seconds, 30 Minutes

	PressureInfo.prototype = {

		initialize: function () {
			this.viewMode = this.viewMode || { primaryInfo: true, secondaryInfo: true, chart: true };
			this.draw();
			this.applyViewMode();
		},

		draw: function () {
			var control = PiLot.Utils.Common.createNode(PiLot.Templates.Meteo.pressureInfo);
			this.parentContainer.appendChild(control);
			this.currentPressureContainer = control.querySelector('.divCurrentPressure');
			this.iconContainer = control.querySelector('.divPressureTrendIcons');
			this.trendContainer = control.querySelector('.divPressureTrend');
			this.lblPressure = control.querySelector('.lblPressure');
			this.lblPressureTrend = control.querySelector('.lblPressureTrend');
			this.lblRiseFast = this.iconContainer.querySelector('.lblRiseFast');
			this.lblRise = this.iconContainer.querySelector('.lblRise');
			this.lblConstant = this.iconContainer.querySelector('.lblConstant');
			this.lblDrop = this.iconContainer.querySelector('.lblDrop');
			this.lblDropFast = this.iconContainer.querySelector('.lblDropFast');
			this.lblDropExtreme = this.iconContainer.querySelector('.lblDropExtreme');
			this.chartContainer = control.querySelector('.divChartContainer');
			const divChart = this.chartContainer.querySelector('.divChart');
			const divChartLoading = this.chartContainer.querySelector('.divChartLoading');
			const divChartError = this.chartContainer.querySelector('.divChartError');
			var controls = { error: divChartError, loading: divChartLoading, chart: divChart };
			this.chart = new PiLot.Utils.Chart.DataChart(controls, PressureInfo.chartRange, PressureInfo.chartStep, this.PaToHPa, "HH'h'", 'rgba(96, 209, 209, 0.6)');
			const lblDataName = this.chartContainer.querySelector('.lblName');
			if (lblDataName) {
				lblDataName.innerText = this.sensorInfo.displayName;
			}
		},

		/* 
		 * loads and shows the data
		 * */
		loadDataAsync: async function () {
			let data = await PiLot.Utils.Chart.loadRecentData(this.sensorInfo.name, 60 * 60 * 24 * 2, 3600);
			this.showData(data);
		},

		showData: function (pData) {
			this.showValues(pData);
			if (this.viewMode.chart) {
				this.chart.showChart(pData);
			}
		},

		showValues: function (pData) {
			const utcNow = this.boatTime.utcNowUnix();
			if ((pData.lastValueTimestamp !== null) && (utcNow - pData.lastValueTimestamp < PressureInfo.maxAge)) {
				if (this.viewMode.secondaryInfo) {
					RC.Utils.showNumericValue(this.lblPressure, this.PaToHPa(pData.lastValue), '----', 1, false);
				}
				if (this.viewMode.primaryInfo) {
					const nonNullValues = pData.data.filter(i => i[1] !== null);
					if (nonNullValues.length > 1) {
						const deltaT = nonNullValues[nonNullValues.length - 1][0] - nonNullValues[nonNullValues.length - 2][0]; // time difference in MS
						const deltaP = nonNullValues[nonNullValues.length - 1][1] - nonNullValues[nonNullValues.length - 2][1]; // pressure difference in Pa
						const trend = this.PaToHPa(deltaP) / (deltaT / 60 / 60 / 1000); // hPa per hour
						RC.Utils.showNumericValue(this.lblPressureTrend, trend, '--', 2, false, true);
						this.lblRiseFast.classList.toggle('hidden', trend <= 0.8);
						this.lblRise.classList.toggle('hidden', trend > 0.8 || trend <= 0.2);
						this.lblConstant.classList.toggle('hidden', trend > 0.2 || trend < -0.2);
						this.lblDrop.classList.toggle('hidden', trend >= -0.2 || trend < -0.8);
						this.lblDropFast.classList.toggle('hidden', trend >= -0.8 || trend < -1.2);
						this.lblDropExtreme.classList.toggle('hidden', trend >= -1.2);
					}
				}
			}
		},

		/// sets which controls should be shown
		/// @param pViewMode: object with {primaryInfo, secondaryInfo, chart}
		///						or an array with 3 Booleans
		setViewMode: function (pViewMode) {
			if (Array.isArray(pViewMode) && pViewMode.length == 3) {
				this.viewMode = {
					primaryInfo: pViewMode[0],
					secondaryInfo: pViewMode[1],
					chart: pViewMode[2]
				};
			} else {
				this.viewMode = pViewMode;
			}
			this.applyViewMode();
		},

		/// applies the current viewMode by showing / hiding them controls. If anything changes,
		/// this will get the lates data so that content is updated immediately
		applyViewMode: function () {
			var changed = this.toggleVisible(this.currentPressureContainer, this.viewMode.secondaryInfo);
			changed = this.toggleVisible(this.trendContainer, this.viewMode.primaryInfo) || changed;
			changed = this.toggleVisible(this.iconContainer, this.viewMode.primaryInfo) || changed;
			changed = this.toggleVisible(this.chartContainer, this.viewMode.chart) || changed;
			if (changed && (this.viewMode.primaryInfo || this.viewMode.secondaryInfo || this.viewMode.chart)) {
				this.loadDataAsync();
			}
		},

		/// makes sure pControl is visible or not, and returns 
		/// whether the visibility changed
		toggleVisible: function (pControl, pVisible) {
			var result = false;
			if (pControl.classList.contains('hidden') !== !pVisible) {
				pControl.classList.toggle('hidden', !pVisible);
				result = true;
			}
			return result;
		},

		/// converts from PA to HPA
		PaToHPa: function (pValue) {
			return pValue !== null ? pValue / 100 : null;
		},
	};

	var MoonInfo = function (pContainer, pBoatTime) {

		this.container = pContainer;
		this.boatTime = pBoatTime;
		this.control = null;
		this.imgMoonNew = null;
		this.imgMoonWaxingCrescent = null;
		this.imgMoonFirstQuarter = null;
		this.imgMoonWaxingGibbous = null;
		this.imgMoonFull = null;
		this.imgMoonWaningGibbous = null;
		this.imgMoonThirdQuarter = null;
		this.imgMoonWaningCrescent = null;
		this.divTodayBar = null;
		this.initialize();

	};

	MoonInfo.prototype = {

		initialize: function () {
			this.draw();
			this.showMoonState();
		},

		draw: function () {
			this.control = RC.Utils.stringToNode(PiLot.Templates.Meteo.moonInfo);
			this.container.appendChild(this.control);
			this.imgMoonNew = this.control.querySelector('.imgMoonNew');
			this.imgMoonWaxingCrescent = this.control.querySelector('.imgMoonWaxingCrescent');
			this.imgMoonFirstQuarter = this.control.querySelector('.imgMoonFirstQuarter');
			this.imgMoonWaxingGibbous = this.control.querySelector('.imgMoonWaxingGibbous');
			this.imgMoonFull = this.control.querySelector('.imgMoonFull');
			this.imgMoonWaningGibbous = this.control.querySelector('.imgMoonWaningGibbous');
			this.imgMoonThirdQuarter = this.control.querySelector('.imgMoonThirdQuarter');
			this.imgMoonWaningCrescent = this.control.querySelector('.imgMoonWaningCrescent');
			this.divTodayBar = this.control.querySelector('.divTodayBar');
		},

		// shows the correct image and positions the bar for the current moon illumination
		showMoonState: function () { 
			var utcNow = this.boatTime.utcNow();							// utc now as luxon object
			const moonPhase = PiLot.Model.Meteo.getMoonPhase(utcNow);
			var activeImage;
			switch (moonPhase.type) {
				case 0: activeImage = this.imgMoonNew; break;
				case 1: activeImage = this.imgMoonWaxingCrescent; break;
				case 2: activeImage = this.imgMoonFirstQuarter; break;
				case 3: activeImage = this.imgMoonWaxingGibbous; break;
				case 4: activeImage = this.imgMoonFull; break;
				case 5: activeImage = this.imgMoonWaningGibbous; break;
				case 6: activeImage = this.imgMoonThirdQuarter; break;
				case 7: activeImage = this.imgMoonWaningCrescent; break;
			}
			this.control.querySelectorAll('img').forEach(i => {
				i.classList.toggle('active', i === activeImage);
			});
			var left = (((1 / 16) + moonPhase.phase) * 100) % 100; // 1/16 is the center of the new moon picture, which is phase 0.00
			this.divTodayBar.style.left = `${Math.round(left)}%`;
		}
	};

	/** shows the meteoblue weather widget within an iframe */
	var MeteoblueFrame = function (pContainer) {
		
		this.container = pContainer;
		this.latitude = null;
		this.longitude = null;
		this.initialize();

	};

	MeteoblueFrame.prototype = {

		initialize: function () {
			const utcNowMillis = RC.Date.DateHelper.utcNowMillis();
			const start = utcNowMillis - (24 * 60 * 60 * 1000);
			PiLot.Model.Nav.loadTrackAsync(start, utcNowMillis, false).then(function (pTrack) {
				if (pTrack && pTrack.getPositionsCount() > 0) {
					const lastPosition = pTrack.getLastPosition();
					this.latitude = lastPosition.getLatitude();
					this.longitude = lastPosition.getLongitude();
				}
				this.draw();
			}.bind(this));
		},

		draw: function () {
			if (this.latitude && this.longitude) {
				let template = PiLot.Templates.Meteo.meteoblueFrame;
				let layout = new PiLot.View.Common.NightModeHandler().getIsNightMode() ? 'dark' : 'light';
				template = template.replace(/\{lat\}/g, this.latitude.toFixed(3) + (this.latitude > 0 ? 'N' : 'S'));
				template = template.replace(/\{lon\}/g, this.longitude.toFixed(3) + (this.longitude > 0 ? 'E' : 'W'));
				template = template.replace(/\{layout\}/g, layout);
				const control = RC.Utils.stringToNode(template);
				this.container.appendChild(control);
			}
		}
	};

	return {
		MeteoPage: MeteoPage,
		StartPageMeteo: StartPageMeteo,
		TemperatureInfo: TemperatureInfo,
		HumidityInfo: HumidityInfo,
		PressureInfo: PressureInfo,
		MoonInfo: MoonInfo,
		MeteoblueFrame: MeteoblueFrame
	};

})();