var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

PiLot.View.Meteo = (function () {

	var SensorsPage = function () {
		this.startDate = null;
		this.endDate = null;
		this.pnlNoSensors = null;
		this.pnlData = null;
		this.ddlDateRange = null;		// Dropdown
		this.pnlSelectDate = null;
		this.lblLoading = null;
		this.rblTimeMode = null;		// NodeList (radio buttons)
		this.lblFromDate = null;
		this.lblToDate = null;
		this.calendar = null;			// RC.Controls.Calendar
		this.plhChartsContainer = null;
		this.controls = null;			// an array with the info controls
		this.dataLoader = null;			// the loader used to load data
		this.dataLoadInterval = null;	// one single interval to refresh all charts
		this.initialize();
	};


	SensorsPage.dateRanges = [
		{ duration: { days: 1   }, aggregateSecondsTemperature: 600,   aggregateSecondsPressure: 3600,  yRangeTemperature: 20, yRangePressure: 2000 },
		{ duration: { days: 2   }, aggregateSecondsTemperature: 600,   aggregateSecondsPressure: 3600,  yRangeTemperature: 20, yRangePressure: 2000 },
		{ duration: { weeks: 1  }, aggregateSecondsTemperature: 1800,  aggregateSecondsPressure: 3600,  yRangeTemperature: 30, yRangePressure: 7000 },
		{ duration: { months: 1 }, aggregateSecondsTemperature: 3600,  aggregateSecondsPressure: 3600,  yRangeTemperature: 30, yRangePressure: 7000 },
		{ duration: { months: 3 }, aggregateSecondsTemperature: 21600, aggregateSecondsPressure: 21600, yRangeTemperature: 40, yRangePressure: 7000 },
		{ duration: { years: 1  }, aggregateSecondsTemperature: 86400, aggregateSecondsPressure: 86400, yRangeTemperature: 50, yRangePressure: 7000 }
	];

	/** The index of the dateRanges array to chose by default */
	SensorsPage.defaultRange = 1;

	SensorsPage.updateIntervalSeconds = 60;

	SensorsPage.prototype = {

		initialize: async function () {
			this.dataLoader = new PiLot.Service.Meteo.DataLoader();
			this.controls = new Array();
			this.draw();
			await this.loadSensorsAsync();
			this.startDataLoadAsync();
		},

		unload: function(){
			this.stopDataLoad();
		},

		rblTimeMode_change: async function (pTarget) {
			if (pTarget.value === 'historic') {
				this.pnlSelectDate.hidden = false;
				const today = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime().today();
				this.startDate = this.calendar.date() || today.addDays(1).toLuxon(PiLot.Utils.Language.getLanguage()).minus({ seconds: this.getIntervalSeconds() });
				this.updateEndDate();
				this.showDates();
			} else {
				this.pnlSelectDate.hidden = true;
				this.startDate = null;
				this.endDate = null;
			}			
			await this.loadAllDataAsync(true);
		},

		ddlDateRange_change: async function () {
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Meteo.selectedSensorRange', this.ddlDateRange.selectedIndex);
			this.updateEndDate();
			this.showDates();
			await this.loadAllDataAsync(true);
		},

		lnkPrevious_click: function () {
			this.moveTimeFrameAsync(-1);
		},

		lnkNext_click: function () {
			this.moveTimeFrameAsync(1);
		},

		calendar_change: async function (pCalendar, pDate) {
			this.startDate = pDate;
			this.updateEndDate();
			this.showDates();
			await this.loadAllDataAsync(true);
		},

		draw: function () {
			PiLot.Utils.Common.log(`Starting to draw meteo page`, 3);
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Meteo.sensorsPage);
			let contentArea = PiLot.Utils.Loader.getContentArea();
			contentArea.appendChild(pageContent);
			this.pnlData = contentArea.querySelector('.pnlData');
			this.pnlNoSensors = contentArea.querySelector('.pnlNoSensors');
			this.rblTimeMode = document.getElementsByName('rblTimeMode');
			for (const rbTimeMode of this.rblTimeMode) {
				rbTimeMode.addEventListener('change', this.rblTimeMode_change.bind(this, rbTimeMode));
			}
			this.ddlDateRange = contentArea.querySelector('.ddlDateRange');
			this.lblLoading = contentArea.querySelector('.lblLoading');
			this.populateDateRanges();
			this.ddlDateRange.addEventListener('change', this.ddlDateRange_change.bind(this));
			this.pnlSelectDate = contentArea.querySelector('.pnlSelectDate');
			this.lblFromDate = contentArea.querySelector('.lblFromDate');
			this.lblToDate = contentArea.querySelector('.lblToDate');
			contentArea.querySelector('.lnkPrevious').addEventListener('click', this.lnkPrevious_click.bind(this));
			contentArea.querySelector('.lnkNext').addEventListener('click', this.lnkNext_click.bind(this));
			const pnlCalendar = contentArea.querySelector('.pnlCalendar');
			const lnkCalendar = contentArea.querySelector('.lnkCalendar');
			const locale = PiLot.Utils.Language.getLanguage();
			const utcOffset = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime().getUtcOffsetMinutes();
			this.calendar = new RC.Controls.Calendar(pnlCalendar, null, lnkCalendar, this.calendar_change.bind(this), utcOffset, locale);
			this.plhChartsContainer = contentArea.querySelector('.plhChartsContainer');
		},

		/** Fills the dropdown with date ranges and sets the selected range from the user settings or the default index. */
		populateDateRanges: function () {
			const durations = [];
			for (const range of SensorsPage.dateRanges) {
				const duration = luxon.Duration.fromObject(range.duration);
				const seconds = duration.toMillis() / 1000;
				durations.push([seconds, PiLot.Utils.Common.durationToHuman(duration)]);
			}
			RC.Utils.fillDropdown(this.ddlDateRange, durations);
			this.ddlDateRange.selectedIndex = PiLot.Utils.Common.loadUserSetting('PiLot.View.Meteo.selectedSensorRange');
			if (this.ddlDateRange.selectedIndex < 0) {
				this.ddlDateRange.selectedIndex = SensorsPage.defaultRange;
			}
		},

		/**
		 * Loads the sensors from the config, and adds the appropriate controls based on the sensor type.
		 * Populates this.controls with all them created controls.
		 * */
		loadSensorsAsync: async function () {
			const sensors = await this.dataLoader.loadMeteoDataSourcesAsync();
			if (sensors.length > 0) {
				let control;
				for (const sensor of sensors) {
					switch (sensor.sensorType) {
						case 'temperature':
							control = new PiLot.View.Meteo.TemperatureInfo(this.plhChartsContainer, sensor);
							break;
						case 'humidity':
							control = new PiLot.View.Meteo.HumidityInfo(this.plhChartsContainer, sensor);
							break;
						case 'pressure':
							control = new PiLot.View.Meteo.PressureInfo(this.plhChartsContainer, sensor);
							break;
					}
					this.controls.push(control);
				};
			} else {
				this.pnlData.hidden = true;
				this.pnlNoSensors.hidden = false;
			}
		},

		/**
		 * Initially loads the data and then starts the interval which will keep loading current data
		 * */
		startDataLoadAsync: async function () {
			await this.loadAllDataAsync();
			this.ensureDataLoadInterval();
		},

		/**
		 * This starts the interval fetching data. We don't start this immediately but
		 * only after getting the first data, in order to not flood the server
		 *  with requests when he is just waking up
		 * */
		ensureDataLoadInterval: function () {
			if (this.dataLoadInterval === null) {
				this.dataLoadInterval = window.setInterval(this.loadAllDataAsync.bind(this), SensorsPage.updateIntervalSeconds * 1000);
			}
		},

		/** Stops the interval which automatically refreshes the data */
		stopDataLoad: function () {
			if (this.dataLoadInterval) {
				window.clearInterval(this.dataLoadInterval);
				this.dataLoadInterval = null;
			}
		},

		/** 
		 * Loads data from the server and applies it to them controls
		 * @param{Boolean} pShowLoading - Allows to show the hourglass while loading
		 * */
		loadAllDataAsync: async function (pShowLoading = false) {
			pShowLoading && (this.lblLoading.hidden = false);
			let promises = this.controls.map(control => this.loadDataAsync.bind(this, control)());
			await Promise.all(promises);
			pShowLoading && (this.lblLoading.hidden = true);
		},

		/**
		 * Loads the data in one control
		 * @param {Object} pControl - the PiLot.View.Meteo.XYInfo control
		 */
		loadDataAsync: async function (pControl) {
			let timeSpanSeconds = this.getIntervalSeconds();
			let rangeInfo = SensorsPage.dateRanges[this.ddlDateRange.selectedIndex];
			await pControl.loadDataAsync(timeSpanSeconds, this.startDate, rangeInfo);
		},

		/**
		 * Moves start and end date forwards or backwards, and refreshes the data
		 * @param {Number} pBy - fractions of the current interval
		 */
		moveTimeFrameAsync: async function (pBy) {
			const seconds = this.getIntervalSeconds() * pBy;
			this.startDate = this.startDate.plus({ seconds: seconds });
			this.calendar.date(this.startDate);
			this.updateEndDate();
			this.showDates();
			await this.loadAllDataAsync(true);
		},

		/** Updates the end date based on startDate and interval */
		updateEndDate: function () {
			if (this.startDate) {
				this.endDate = this.startDate.plus({ seconds: this.getIntervalSeconds() });
			} else {
				this.endDate = null;
			}
		},

		/** Gets the duration of the current interval in seconds */
		getIntervalSeconds: function () {
			return Number(this.ddlDateRange.value);
		},

		/** Shows the start date and end date */
		showDates: function () {
			if (this.startDate) {
				this.lblFromDate.innerText = this.startDate.toLocaleString(DateTime.DATE_SHORT);
				this.lblToDate.innerText = this.endDate.minus({ days: 1 }).toLocaleString(DateTime.DATE_SHORT);
			}
		}
	};

	/**
	 * The StartPageMeteo displays a control for each sensor that has the "meteo" plus the "startPage"
	 * tag. It uses a specific prioritization algorythm to sort the controls, base don type before the
	 * sort order defined with the sensors. Depending on the space available, more or less data is shown.
	 * @param {HTMLElement} pContainer - the container to which we append the control
	 * @param {PiLot.View.Common.StartPage} pStartPage - A reference to the startPage
	 */
	var StartPageMeteo = function (pContainer, pStartPage) {
		this.infoControls = null;
		this.container = pContainer;
		this.startPage = pStartPage;
		this.dataLoader = null;
		this.dataLoadInterval = null;
		this.initialize();
	};

	StartPageMeteo.prototype = {

		initialize: async function () {
			this.startPage.on('changingLayout', this, this.startPage_changingLayout.bind(this));
			this.startPage.on('changedLayout', this, this.startPage_changedLayout.bind(this));
			this.startPage.on('resize', this, this.startPage_resize.bind(this));
			this.dataLoader = new PiLot.Service.Meteo.DataLoader();
			this.infoControls = new Array();
			let sensors = await this.dataLoader.loadMeteoDataSourcesAsync();
			sensors = sensors.filter(s => s.tags.includes('startPage'));
			sensors.sort((a, b) => this.getSensorPriority(a) - this.getSensorPriority(b));
			this.draw(sensors);
			this.startDataLoadAsync();
		},

		unload: function(){
			this.stopDataLoad();
		},

		/// before a layout change is applied, we hide everything because
		/// otherwise it can break the layout
		startPage_changingLayout: function (pArgs) {
			this.hideAll();
		},

		/// ensures the right click handler and control visibility
		/// after the layout has changed
		startPage_changedLayout: function (pArgs) {
			var isMinimized = (!pArgs.sameSize && (pArgs.mainControl !== this));
			this.setContainerClick(isMinimized);
			this.decideControlsVisible();
		},

		/// handles resize of the page
		startPage_resize: function (pArgs) {
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
						infoControl = new PiLot.View.Meteo.TemperatureInfo(mainControl, sensor);
						break;
					case 'humidity':
						infoControl = new PiLot.View.Meteo.HumidityInfo(mainControl, sensor);
						break;
					case 'pressure':
						infoControl = new PiLot.View.Meteo.PressureInfo(mainControl, sensor);
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
				this.dataLoadInterval = window.setInterval(this.loadAllDataAsync.bind(this), SensorsPage.updateIntervalSeconds * 1000);
			}
		},

		/** Stops the interval which automatically refreshes the data */
		stopDataLoad: function () {
			if (this.dataLoadInterval) {
				window.clearInterval(this.dataLoadInterval);
				this.dataLoadInterval = null;
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

		/**
		 * Hides all controls. This is needed, as otherwise the bounding rectangle
		 * is too big, which will result in an wrong calculation of what to show.
		 * */
		hideAll: function () {
			this.infoControls.forEach(c => (('setViewMode' in c) && c.setViewMode([false, false, false])));
		},

		/**
		 * Near-AI heuristics magic that checks for each control if it should be visible 
		 * under the given circumstances, and shows/hides it accordingly. Maybe one day
		 * we will just try to show each control and see if it stretches the box, and if
		 * so, hide it again. That might be a bit simpler.
		 * */
		decideControlsVisible: function () {
			this.hideAll();
			let height = this.container.clientHeight - 20;
			const width = this.container.clientWidth;
			let heightObj = { height: height };
			let visibilityMap = new Map();  // a map with key: control, visibility
			this.infoControls.forEach(function (c) {
				let visibility = { primaryInfo: this.decideControlVisible(heightObj, width < 185 ? width < 140 ? 130 : 92 : 72), secondaryInfo: false, chart: false };
				visibilityMap.set(c, visibility);
			}.bind(this));
			this.infoControls.forEach(function (c) {
				let visibility = visibilityMap.get(c);
				visibility.secondaryInfo = this.decideControlVisible(heightObj, width < 440 ? width < 185 ? 165 : 75 : 0);
			}.bind(this));
			this.infoControls.forEach(function (c) {
				let visibility = visibilityMap.get(c);
				visibility.chart = this.decideControlVisible(heightObj, 220);
			}.bind(this));
			this.infoControls.forEach(function (c) {
				c.setViewMode(visibilityMap.get(c));
			});
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

		/** 
		 * Decides whether a control using pHeightNeeded pixels shoud be available
		 * and if so, decreases the available height
		 * @param {Object} pHeightAvailableObj - object {height}, so that it can be passed as reference
		 * */
		decideControlVisible: function (pHeightAvailableObj, pHeightNeeded) {
			var result = false;
			if (pHeightAvailableObj.height >= pHeightNeeded) {
				pHeightAvailableObj.height -= pHeightNeeded;
				result = true;
			}
			return result;
		},

		/** Sets the appropriate onclick handler to the container, either just doing nothing, or setting this as main control */
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
	 * @param {String} pViewMode - defines which parts are visible: {primaryInfo, secondaryInfo, chart}
	 * @param {String} pTitle - the title to display within the chart
	 * */
	var TemperatureInfo = function (pParentContainer, pSensorInfo, pViewMode = null) {
		let chartSettings = { fillColor: 'rgba(96, 96, 209, 0.6)', yStep: 5, yRange: 20 };
		this.minMaxInfo = new MinMaxInfo(pParentContainer, pSensorInfo, PiLot.Templates.Meteo.temperatureInfo, chartSettings, pViewMode);
	};

	TemperatureInfo.prototype = {

		/**
		 * Sets which controls should be shown
		 * @param {Object} pViewMode - object with {primaryInfo, secondaryInfo, chart} or an array with 3 Booleans
		 * */
		setViewMode: function (pViewMode) {
			this.minMaxInfo.setViewMode(pViewMode);
		},

		/**
		 * Loads and shows the data
		 * @param {Number} pTimeSpanSeconds - The total timespan to cover, in seconds
		 * @param {Number} pStartTime - Optionally pass a start time in seconds UTC. If empty, the most recent data will be loaded
		 * @param {Object} pRangeInfo - Optionally pass an element with {aggregateSecondsTemperature, yRangeTemperature}
		 */
		loadDataAsync: async function (pTimeSpanSeconds, pStartTime, pRangeInfo) {
			let aggregateSeconds = pRangeInfo ? pRangeInfo.aggregateSecondsTemperature : SensorsPage.dateRanges[SensorsPage.defaultRange].aggregateSecondsTemperature;
			let yRange = pRangeInfo ? pRangeInfo.yRangeTemperature : SensorsPage.dateRanges[SensorsPage.defaultRange].yRangeTemperature;
			const data = await this.minMaxInfo.loadDataAsync(pTimeSpanSeconds, pStartTime, aggregateSeconds);
			this.minMaxInfo.showData(data, yRange);
		}
	}

	/**
	 * A control containing numeric and graphical information about the current and
	 * historic humidity
	 * @param {HTMLElement} pParentContainer - The container within which this will be appended as child
	 * @param {Object} pSensorInfo - object with {sensorType, id, name, displayName, tags, sortOrder}
	 * @param {String} pViewMode - defines which parts are visible: {primaryInfo, secondaryInfo, chart}
	 * */
	var HumidityInfo = function (pParentContainer, pSensorInfo, pViewMode = null) {
		let chartSettings = { fillColor: 'rgba(96, 148, 209, 0.6)', yStep: 5, yRange: 80 };
		this.minMaxInfo = new MinMaxInfo(pParentContainer, pSensorInfo, PiLot.Templates.Meteo.humidityInfo, chartSettings, pViewMode);
	};

	HumidityInfo.prototype = {

		/**
		 * Sets which controls should be shown
		 * @param {Object} pViewMode - object with {primaryInfo, secondaryInfo, chart} or an array with 3 Booleans
		 * */
		setViewMode: function (pViewMode) {
			this.minMaxInfo.setViewMode(pViewMode);
		},

		/** 
		 * Loads and shows the data
		 * @param {Number} pTimeSpanSeconds - The total timespan to cover, in seconds
		 * @param {Number} pStartTime - Optionally pass a start time in seconds UTC. If empty, the most recent data will be loaded
		 * @param {Object} pRangeInfo - Optionally pass an element with {aggregateSecondsTemperature, yRangeTemperature}
		 * */
		loadDataAsync: async function (pTimeSpanSeconds, pStartTime, pRangeInfo) {
			let aggregateSeconds = pRangeInfo ? pRangeInfo.aggregateSecondsTemperature : SensorsPage.dateRanges[SensorsPage.defaultRange].aggregateSecondsTemperature;
			const data = await this.minMaxInfo.loadDataAsync(pTimeSpanSeconds, pStartTime, aggregateSeconds);
			this.minMaxInfo.showData(data, null);
		}
	}

	/**
	 * A control containing numeric and graphical information about the current and
	 * historic values
	 * @param {HTMLElement} pParentContainer - The container within which this will be appended as child
	 * @param {Object} pSensorInfo - object with {sensorType, id, name, displayName, tags, sortOrder}
	 * @param {String} pTemplate - the html template used to draw the control
	 * @param {Object} pChartSettings - Object with {fillColor, yRange, yStep}
	 * @param {String} pViewMode - defines which parts are visible: {primaryInfo, secondaryInfo, chart}
	 * */
	var MinMaxInfo = function (pParentContainer, pSensorInfo, pTemplate, pChartSettings, pViewMode = null) {
		this.parentContainer = pParentContainer;
		this.sensorInfo = pSensorInfo;
		this.viewMode = pViewMode;
		this.timeSpanSeconds = null;
		this.template = pTemplate;
		this.chartSettings = pChartSettings;
		this.control = null;
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
			const defaultRange = SensorsPage.dateRanges[SensorsPage.defaultRange];
			this.timeSpanSeconds = luxon.Duration.fromObject(defaultRange.duration).toMillis() / 1000;
			this.draw();
			this.applyViewMode();
		},

		/** Draws the control based on the this.template, as a child of this.parentContainer */
		draw: function () {
			this.control = PiLot.Utils.Common.createNode(this.template);
			this.parentContainer.appendChild(this.control);
			this.divCurrentValue = this.control.querySelector('.divCurrentValue');
			this.divMinValue = this.control.querySelector('.divMinValue');
			this.divMaxValue = this.control.querySelector('.divMaxValue');
			this.lblCurrentValue = this.control.querySelector('.lblCurrentValue');
			this.lblMinValue = this.control.querySelector('.lblMinValue');
			this.lblMaxValue = this.control.querySelector('.lblMaxValue');
			this.chartContainer = this.control.querySelector('.divChartContainer');
			const divChart = this.chartContainer.querySelector('.divChart');
			const divChartLoading = this.chartContainer.querySelector('.divChartLoading');
			var controls = { loading: divChartLoading, chart: divChart };
			this.chart = new PiLot.Utils.Chart.DataChart(controls, this.chartSettings.yRange, this.chartSettings.yStep, null, this.chartSettings.fillColor);
			const lblDataName = this.chartContainer.querySelector('.lblName');
			if (lblDataName) {
				lblDataName.innerText = this.sensorInfo.displayName;
			}
		},

		/**
		 * Loads and shows the data
		 * @param {Number} pTimeSpanSeconds - The total timespan to cover, in seconds
		 * @param {DateTime} pStartTime - Optionally pass a start time as luxon. If empty, the most recent data will be loaded
		 * @param {Object} pRangeInfo - Optionally pass an element with {aggregateSecondsTemperature, yRangeTemperature}
		 */
		loadDataAsync: async function (pTimeSpanSeconds, pStartTime, pAggregateSeconds) {
			this.timeSpanSeconds = pTimeSpanSeconds || this.timeSpanSeconds;
			let data;
			let aggregateSeconds = pAggregateSeconds || 600;
			if (pStartTime) {
				let startTimeSeconds = RC.Date.DateHelper.luxonToUnix(pStartTime);
				data = await PiLot.Utils.Chart.loadHistoricDataAsync(this.sensorInfo.name, startTimeSeconds, startTimeSeconds + this.timeSpanSeconds, aggregateSeconds);
			} else {
				data = await PiLot.Utils.Chart.loadRecentDataAsync(this.sensorInfo.name, this.timeSpanSeconds, aggregateSeconds);
			}
			return data;
		},

		/**
		 * Shows/updates the data in the control
		 * @param {Object} pData - The data as it has been loaded by the Chart 
		 * @param {Number} pYRange - Optionally pass a total range for the values axis
		 */
		showData: function (pData, pYRange) {
			this.showValues(pData);
			if (this.viewMode.chart) {
				this.chart.showChart(pData, pYRange);
			}
		},

		/**
		 * Shows the numeric values (current, min, max value)
		 * @param {Object} pData
		 * */
		showValues: function (pData) {
			const utcNow = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime().utcNowUnix();
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

		/**
		 * Sets which controls should be shown
		 * @param {Object} pViewMode: Object with {primaryInfo, secondaryInfo, chart} or an array with 3 Booleans
		 * */
		setViewMode: function (pViewMode) {
			if (Array.isArray(pViewMode) && pViewMode.length >= 3) {
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

		/** Applies the current viewMode by showing / hiding them controls */
		applyViewMode: function () {
			let changed = this.toggleVisible(this.divCurrentValue, this.viewMode.primaryInfo);
			changed = this.toggleVisible(this.divMinValue, this.viewMode.secondaryInfo) || changed;
			changed = this.toggleVisible(this.divMaxValue, this.viewMode.secondaryInfo) || changed;
			changed = this.toggleVisible(this.chartContainer, this.viewMode.chart) || changed;
			if (changed) {
				if (this.viewMode.primaryInfo || this.viewMode.secondaryInfo || this.viewMode.chart) {
					this.control.hidden = false;
					this.loadDataAsync().then(d => this.showData(d));
				} else {
					this.control.hidden = true;
				}
			}
		},

		/**
		 * Makes sure pControl is visible or not, and returns whether the visibility changed
		 * */
		toggleVisible: function (pControl, pVisible) {
			let result = false;
			if (pControl.hidden !== !pVisible) {
				pControl.hidden = !pVisible;
				result = true;
			}
			return result;
		}
	};

	/**
	* A control containing numeric and graphical information about the current and
	* historic air pressure
	* @param {HTMLElement} pParentContainer - The container within which this will be appended as child
	* @param {Object} pSensorInfo - object with {sensorType, id, name, displayName, tags, sortOrder}
	* @param {String} pViewMode - defines which parts are visible: {primaryInfo, secondaryInfo, chart}, corresponding to trend, current value, chart
	* */
	var PressureInfo = function (pParentContainer, pSensorInfo, pViewMode = null) {
		this.parentContainer = pParentContainer;
		this.sensorInfo = pSensorInfo;
		this.viewMode = pViewMode;
		this.timeSpanSeconds = null;
		this.yRange = null;
		this.control = null;
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

	PressureInfo.chartStep = 500;
	PressureInfo.maxAge = 1800;		// the max age of data to show in seconds, 30 Minutes

	PressureInfo.prototype = {

		initialize: function () {
			this.viewMode = this.viewMode || { primaryInfo: true, secondaryInfo: true, chart: true };
			const defaultRange = SensorsPage.dateRanges[SensorsPage.defaultRange];
			this.yRange = defaultRange.yRangePressure;
			this.timeSpanSeconds = luxon.Duration.fromObject(defaultRange.duration).toMillis() / 1000;
			this.draw();
			this.applyViewMode();
		},

		draw: function () {
			this.control = PiLot.Utils.Common.createNode(PiLot.Templates.Meteo.pressureInfo);
			this.parentContainer.appendChild(this.control);
			this.currentPressureContainer = this.control.querySelector('.divCurrentPressure');
			this.iconContainer = this.control.querySelector('.divPressureTrendIcons');
			this.trendContainer = this.control.querySelector('.divPressureTrend');
			this.lblPressure = this.control.querySelector('.lblPressure');
			this.lblPressureTrend = this.control.querySelector('.lblPressureTrend');
			this.lblRiseFast = this.iconContainer.querySelector('.lblRiseFast');
			this.lblRise = this.iconContainer.querySelector('.lblRise');
			this.lblConstant = this.iconContainer.querySelector('.lblConstant');
			this.lblDrop = this.iconContainer.querySelector('.lblDrop');
			this.lblDropFast = this.iconContainer.querySelector('.lblDropFast');
			this.lblDropExtreme = this.iconContainer.querySelector('.lblDropExtreme');
			this.chartContainer = this.control.querySelector('.divChartContainer');
			const divChart = this.chartContainer.querySelector('.divChart');
			const divChartLoading = this.chartContainer.querySelector('.divChartLoading');
			var controls = { loading: divChartLoading, chart: divChart };
			this.chart = new PiLot.Utils.Chart.DataChart(controls, this.yRange, PressureInfo.chartStep, this.PaToHPa, 'rgba(96, 209, 209, 0.6)');
			const lblDataName = this.chartContainer.querySelector('.lblName');
			if (lblDataName) {
				lblDataName.innerText = this.sensorInfo.displayName;
			}
		},

		/**
		 * Loads and shows the data
		 * @param { Number } pTimeSpanSeconds - The total timespan to cover, in seconds
		 * @param {DateTime} pStartTime - Optionally pass a start time as luxon. If empty, the most recent data will be loaded
		 * @param { Object } pRangeInfo - Optionally pass an element with { aggregateSecondsPressure, yRangePresure }
		 * */
		loadDataAsync: async function (pTimeSpanSeconds, pStartTime, pRangeInfo) {
			this.timeSpanSeconds = pTimeSpanSeconds || this.timeSpanSeconds;
			let aggregateSeconds = pRangeInfo ? pRangeInfo.aggregateSecondsPressure : SensorsPage.dateRanges[1].aggregateSecondsPressure;
			let data;
			if (pStartTime) {
				let startTimeSeconds = RC.Date.DateHelper.luxonToUnix(pStartTime);
				data = await PiLot.Utils.Chart.loadHistoricDataAsync(this.sensorInfo.name, startTimeSeconds, startTimeSeconds + this.timeSpanSeconds, aggregateSeconds);
			} else {
				data = await PiLot.Utils.Chart.loadRecentDataAsync(this.sensorInfo.name, this.timeSpanSeconds, aggregateSeconds);
			}
			this.showData(data, pRangeInfo);
		},

		/**
		 * Shows/updates the data in the control
		 * @param {Object} pData - The data as it has been loaded by the Chart
		 * @param {Object} pRangeInfo - Optionally pass an element with { yRangePresure }
		 */
		showData: function (pData, pRangeInfo) {
			this.showValues(pData);
			if (this.viewMode.chart) {
				let yRange = pRangeInfo ? pRangeInfo.yRangePressure : null;
				this.chart.showChart(pData, yRange);
			}
		},

		/**
		 * Shows the numeric values and the chart, depending on the viewMode
		 * @param {Object} pData - The data as it has been loaded by the Chart
		 */
		showValues: function (pData) {
			const boatTime = PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime();
			const utcNow = boatTime.utcNowUnix();
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

		/**
		 * Sets which controls should be shown
		 * @param {Object} pViewMode - object with {primaryInfo, secondaryInfo, chart} (Booleans) or an array with 3 Booleans
		 * */
		setViewMode: function (pViewMode) {
			if (Array.isArray(pViewMode) && pViewMode.length >= 3) {
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

		/**
		 * Applies the current viewMode by showing / hiding them controls. If anything changes,
		 * this will get the lates data so that content is updated immediately
		 * */
		applyViewMode: function () {
			let changed = this.toggleVisible(this.currentPressureContainer, this.viewMode.secondaryInfo);
			changed = this.toggleVisible(this.trendContainer, this.viewMode.primaryInfo) || changed;
			changed = this.toggleVisible(this.iconContainer, this.viewMode.primaryInfo) || changed;
			changed = this.toggleVisible(this.chartContainer, this.viewMode.chart) || changed;
			if (changed) {
				if (this.viewMode.primaryInfo || this.viewMode.secondaryInfo || this.viewMode.chart) {
					this.control.hidden = false;
					this.loadDataAsync();
				} else {
					this.control.hidden = true;
				}
			}
		},

		/**
		 * Makes sure pControl is visible or not, and returns whether the visibility changed
		 * */
		toggleVisible: function (pControl, pVisible) {
			let result = false;
			if (pControl.hidden !== !pVisible) {
				pControl.hidden = !pVisible;
				result = true;
			}
			return result;
		},

		/** converts from PA to HPA */
		PaToHPa: function (pValue) {
			let result = null;
			if (pValue !== null) {
				result = pValue / 100;
			}
			return result;
		},
	};

	return {
		SensorsPage: SensorsPage,
		StartPageMeteo: StartPageMeteo,
		TemperatureInfo: TemperatureInfo,
		HumidityInfo: HumidityInfo,
		PressureInfo: PressureInfo
	};

})();