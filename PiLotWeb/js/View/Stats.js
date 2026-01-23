var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

/** Includes the GUIs for statistics and charts */
PiLot.View.Stats = (function () {

	/** 
	 * class TrackStatsPage, representing the page containing different statistics based on track data
	 * */
	var TrackStatsPage = function () {

		this.userSettingsName = 'PiLot.View.Stats.TrackStatsPage';
		this.userSettings = null;
		this.totalDistanceChart = null;
		this.fastestSegmentsChart = null;

		this.initialize();
	}

	TrackStatsPage.prototype = {

		initialize: function () {
			this.draw();
			this.userSettings = PiLot.Utils.Common.loadUserSetting(this.userSettingsName) || {};
			this.applyUserSettings();
		},
		
		expandCollapseTotalDistance_expand: function () {
			this.userSettings.totalDistanceChartVisible = true;
			this.saveUserSettings();
			this.totalDistanceChart.loadAndShowDataAsync();
		},

		expandCollapseTotalDistance_collapse: function () {
			this.userSettings.totalDistanceChartVisible = false;
			this.saveUserSettings();
		},

		expandCollapseFastestSegments_expand: function () {
			this.userSettings.fastestSegmentsChartVisible = true;
			this.saveUserSettings();
			this.fastestSegmentsChart.loadAndShowDataAsync();
		},

		expandCollapseFastestSegments_collapse: function () {
			this.userSettings.fastestSegmentsChartVisible = false;
			this.saveUserSettings();
		},

		draw: function () {
			const pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.trackStatsPage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			const pnlTotalDistanceChart = pageContent.querySelector('.pnlTotalDistanceChart');
			this.expandCollapseTotalDistance = new PiLot.View.Common.ExpandCollapse(
				pageContent.querySelector('.lnkTotalDistance'),
				pnlTotalDistanceChart
			);
			this.expandCollapseTotalDistance.on('expand', this, this.expandCollapseTotalDistance_expand.bind(this));
			this.expandCollapseTotalDistance.on('collapse', this, this.expandCollapseTotalDistance_collapse.bind(this));
			this.totalDistanceChart = new TotalDistanceChart(pnlTotalDistanceChart);

			const pnlFastestSegmentsChart = pageContent.querySelector('.pnlFastestSegmentsChart');
			this.expandCollapseFastestSegments = new PiLot.View.Common.ExpandCollapse(
				pageContent.querySelector('.lnkFastestSegments'),
				pnlFastestSegmentsChart
			);
			this.expandCollapseFastestSegments.on('expand', this, this.expandCollapseFastestSegments_expand.bind(this));
			this.expandCollapseFastestSegments.on('collapse', this, this.expandCollapseFastestSegments_collapse.bind(this));
			this.fastestSegmentsChart = new FastestSegmentsChart(pnlFastestSegmentsChart);
		},

		applyUserSettings: function () {
			this.expandCollapseTotalDistance.expandCollapse(this.userSettings.totalDistanceChartVisible);
			this.expandCollapseFastestSegments.expandCollapse(this.userSettings.fastestSegmentsChartVisible);
		},

		saveUserSettings: function () {
			PiLot.Utils.Common.saveUserSetting(this.userSettingsName, this.userSettings);
		}
	}

	/**
	 * Draws a diagram showing the total distance by boat, grouped by time intervals
	 * @param {HTMLElement} pContainer 
	 */
	var TotalDistanceChart = function(pContainer){
		this.container = pContainer;
		this.userSettingsName = 'PiLot.View.Stats.TotalDistanceChart';
		this.userSettings = null;
		this.trackService = null;
		this.allBoats = null;
		this.tracks = null;							// Array of PiLot.Model.Nav.Track
		this.start = null;							// RC.Date.DateOnly
		this.end = null;							// RC.Date.DateOnly
		this.dateMappingFunction = null;
		this.dateIncrementFunction = null;
		this.dateLabelFunction = null;
		this.showBarLabels = false;
		this.userLanguage = null;
		// controls
		this.lnkToggleSettings = null;
		this.pnlSettings = null;
		this.rblTimeframe = null;					// Array of radiobuttons
		this.rblInterval = null;					// NodeList of radiobuttons
		this.boatSelector = null;					// BoatSelector
		this.rblUnit = null;						// NodeList of checkboxes
		this.pnlChart = null;
		this.pnlNoData = null;
		this.chart = null;							//echart object
		
		this.initialize();
	}

	TotalDistanceChart.prototype = {

		initialize: function () {
			this.trackService = PiLot.Service.Nav.TrackService.getInstance();
			this.userSettings = PiLot.Utils.Common.loadUserSetting(this.userSettingsName) || {};
			this.userLanguage = PiLot.Utils.Language.getLanguage();
			window.addEventListener('resize', this.window_resize.bind(this));
			this.setDefaultValues();
			this.draw();
		},

		window_resize: function(){
			this.chart && this.chart.resize();
		},

		lnkToggleSettings_click: function(pEvent){
			pEvent.preventDefault();
			this.pnlSettings.hidden = !this.pnlSettings.hidden;
			this.userSettings.showSettings = !this.pnlSettings.hidden;
			this.saveUserSettings();
		},

		rblTimeframe_change: function(pSender){
			this.userSettings.timeframe = Number(pSender.value);
			this.saveUserSettings();
			this.loadAndShowDataAsync();
		},

		rblInterval_change: function(pSender){
			this.userSettings.interval = Number(pSender.value);
			this.saveUserSettings();
			this.showDataAsync();
		},

		boatSelector_change: function(pData){
			this.userSettings.boats = this.boatSelector.getSelectedBoats();
			this.saveUserSettings();
			this.loadAndShowDataAsync();
		},

		rblUnit_change: function(pSender){
			this.userSettings.unit = pSender.value;
			this.saveUserSettings();
			this.showDataAsync();
		},

		draw: function () {
			let control = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.totalDistanceChart);
			this.container.appendChild(control);
			this.lnkToggleSettings = control.querySelector('.lnkToggleSettings');
			this.lnkToggleSettings.addEventListener('click', this.lnkToggleSettings_click.bind(this));
			this.pnlSettings = control.querySelector('.pnlSettings');
			this.rblTimeframe = control.querySelectorAll('.rblTimeframe');
			for(let rbTimeframe of this.rblTimeframe){
				rbTimeframe.addEventListener('change', this.rblTimeframe_change.bind(this, rbTimeframe));
			}
			this.rblInterval = control.querySelectorAll('.rblInterval');
			for(let rbInterval of this.rblInterval){
				rbInterval.addEventListener('change', this.rblInterval_change.bind(this, rbInterval));
			}
			this.rblUnit = control.querySelectorAll('.rblUnit');
			for(let rbUnit of this.rblUnit){
				rbUnit.addEventListener('change', this.rblUnit_change.bind(this, rbUnit));
			}
			this.boatSelector = new BoatSelector(control.querySelector('.plhBoats'));
			this.boatSelector.on('change', this, this.boatSelector_change.bind(this));
			Promise.all([
				this.boatSelector.fillBoatsListAsync(),
				this.loadAllBoatsAsync()
			]).then(results => this.applyUserSettings());
			this.pnlChart = control.querySelector('.pnlChart');
			this.pnlNoData = control.querySelector('.pnlNoData');
		},

		setDefaultValues: function(){
			this.userSettings.interval = this.userSettings.interval || 0;
			this.userSettings.timeframe = this.userSettings.timeframe || 0;
			this.userSettings.boats = this.userSettings.boats || [];
			this.userSettings.unit = this.userSettings.unit || 'nm';
		},

		loadAllBoatsAsync: async function(){
			if(this.allBoats === null){
				this.allBoats = await PiLot.Service.Boat.BoatConfigService.getInstance().getBoatConfigsAsync();
			}
		},

		getBoatDisplayName: function(pBoatName){
			const boatInfo = this.allBoats.find(b => b.name === pBoatName);
			return boatInfo ? boatInfo.displayName : pBoatName;
		},

		applyUserSettings: function () {
			this.pnlSettings.hidden = !this.userSettings.showSettings;
			this.rblTimeframe.forEach(function(rb){rb.checked = Number(rb.value) === this.userSettings.timeframe}.bind(this));
			this.rblInterval.forEach(function(rb){rb.checked = Number(rb.value) === this.userSettings.interval}.bind(this));
			this.boatSelector.setSelectedBoats(this.userSettings.boats);
			this.rblUnit.forEach(function(rb){rb.checked = rb.value === this.userSettings.unit}.bind(this));
		},

		saveUserSettings: function () {
			PiLot.Utils.Common.saveUserSetting(this.userSettingsName, this.userSettings);
		},

		loadAndShowDataAsync: async function(){
			await this.loadTracksAsync();
			await this.showDataAsync();
		},

		/** 
		 * Loads the tracks according to the currently set timeframe. The result from 
		 * the api is further filtered to those tracks starting within the given time-
		 * frame, as the api would also return tracks that start before, and just
		 * end within or after the timeframe. Actually we should in those cases take
		 * the part of the track within the timeframe, but as we work with pre-calculated
		 * distances, this would add quite some complexity.
		 * */
		loadTracksAsync: async function () {
			let boatTime = await PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime();
			let now = boatTime.now();
			switch (this.userSettings.timeframe) {
				case 0:	// current month
					this.start = this.mapToMonth(now);
					this.end = this.start.addMonths(1);
					break;
				case 1: // current year
					this.start = this.mapToYear(now);
					this.end = this.start.addYears(1);
					break;
				case 2: // all
					this.start = null;
					this.end = null;
					break;
			}
			const startMillis = this.start ? this.start.toMillis() : null;
			const endMillis = (this.end || this.mapToDay(now).addDays(1)).toMillis();
			const tracks = await this.trackService.loadTracksAsync(startMillis, endMillis, true, false);
			this.tracks = tracks.filter(t => (startMillis === null || t.getStartBoatTime() >= startMillis) && (t.getEndBoatTime() <= endMillis));
		},

		/** Processes the track data and assigns it to the chart */
		showDataAsync: async function () {
			switch (this.userSettings.timeframe) {
				case 0:	// current month
					this.showLabels = this.userSettings.interval > 0;
					break;
				case 1: // current year
					this.showLabels = this.userSettings.interval > 1;
					break;
				case 2: // all
					this.showLabels = this.userSettings.interval > 2;
					break;
			}
			this.allBoats || await this.loadAllBoatsAsync();
			let chartData = await this.processDataAsync();
			if (chartData.hasData) {
				this.pnlChart.hidden = false;
				this.pnlNoData.hidden = true;
				const colors = ['#ee6666', '#fc8452', '#fac858', '#91cc75', '#3ba272', '#73c0de', '#5470c6', '#9a60b4', '#ea7ccc'];
				const colorIndex = new Map();
				for (let i = 0; i < this.allBoats.length; i++) {
					colorIndex.set(this.allBoats[i].name, colors[i % colors.length]);
				}
				let series = [];
				let seriesName;
				for (let i = 0; i < chartData.data[0].length - 1; i++) {
					seriesName = chartData.data[0][i + 1];
					series.push({
						name: seriesName,
						type: 'bar',
						stack: 'total',
						label: { show: this.showLabels, position: 'inside', formatter: this.formatBarLabel.bind(this) },
						itemStyle: { color: colorIndex.get(seriesName) }

					});
				}
				let option = {
					grid: { left: 20, right: 30, bottom: 10, top: 50, containLabel: true },
					animation: false,
					legend: { formatter: this.formatLegend.bind(this) },
					tooltip: { formatter: this.getTooltip.bind(this), triggerOn: 'click', enterable: true },
					dataset: { source: chartData.data },
					xAxis: { type: 'category', axisLabel: { formatter: this.formatXAxisLabel.bind(this) } },
					yAxis: {},
					series: series
				};

				this.chart && echarts.dispose(this.pnlChart); // without this, it messed up the chart when changing boats. Probably my fault :-)
				this.chart = echarts.init(this.pnlChart, null);
				this.chart.setOption(option);
			} else {
				this.pnlChart.hidden = true;
				this.pnlNoData.hidden = false;
			}
		},

		/** shows the distance per bar in a readable form */
		formatBarLabel: function(pData){
			return this.roundDistance(pData.data[pData.seriesIndex + 1]);
		},

		/** Shows the boat display names in the legend */
		formatLegend: function(pName){
			return this.getBoatDisplayName(pName);
		},

		/** Shows the date labels on the x axix */
		formatXAxisLabel: function(pData){
			return this.dateLabelFunction(Number(pData));
		},

		/** Creates the tooltip content based on a template */
		getTooltip: function(pData){
			const template = PiLot.Templates.Stats.totalDistanceChartTooltip;
			const boatName =  this.getBoatDisplayName(pData.seriesName);
			const distance = this.roundDistance(pData.data[pData.seriesIndex + 1]);
			const unit = PiLot.Utils.Language.getText(this.userSettings.unit);
			const dateString = this.dateLabelFunction(Number(pData.name));
			return (template
				.replace('{boat}', boatName)
				.replace('{date}', dateString)
				.replace('{distance}', distance)
				.replace('{unit}', unit)
			);
			
		},

		/** Rounds a distance to two decimal places */
		roundDistance: function(pDistance){
			return (pDistance && RC.Utils.isNumeric(pDistance)) ? Math.round(pDistance * 100) / 100 : pDistance;
		},

		/**
		 * Takes the current tracks, and creates an array of arrays, first having the list of boats, and
		 * then for each timespan having an array starting with the name of the timespan, and then the
		 * total distance for each boat. This can then be passed to the chart as dataset.source.
		 * @returns {Object} with hasData:Boolean, data:Array
		 * */
		processDataAsync: async function () {
			let result = { hasData: false, data: [] };
			if(this.tracks && this.tracks.length){
				switch(this.userSettings.interval){
					case 0:		// per day
						this.dateMappingFunction = this.mapToDay;
						this.dateIncrementFunction = this.addDay;
						this.dateLabelFunction = this.getDayLabel;
						break;
					case 1:		// per week
						this.dateMappingFunction = this.mapToWeek;
						this.dateIncrementFunction = this.addWeek;
						this.dateLabelFunction = this.getWeekLabel;
						break;
					case 2:		// per month
						this.dateMappingFunction = this.mapToMonth;
						this.dateIncrementFunction = this.addMonth;
						this.dateLabelFunction = this.getMonthLabel;
						break;
					case 3:		// per year
						this.dateMappingFunction = this.mapToYear;
						this.dateIncrementFunction = this.addYear;
						this.dateLabelFunction = this.getYearLabel;
						break;
				}
				let convertDistanceFunction;
				switch(this.userSettings.unit){
					case 'nm':
						convertDistanceFunction = this.convertDistanceNm;
						break;
					case 'km':
						convertDistanceFunction = this.convertDistanceKm;
						break;
				}
				let startDate = this.start;
				let endDate = this.end;
				if(startDate === null){
					const timeframe = this.getTimeframeFromTracks();
					startDate = timeframe && timeframe.start;
					endDate = timeframe && this.dateIncrementFunction(this.dateMappingFunction(timeframe.end));
				}
				if(startDate !== null){
					startDate = this.dateMappingFunction(startDate);
					endDate = this.dateMappingFunction(endDate);
					let boats;
					if(this.userSettings.boats && this.userSettings.boats.length){
						boats = Array.from(this.userSettings.boats);
					} else{
						boats = this.getBoatsFromTracks();
					}
					boats.sort(function(a, b){return this.getBoatDisplayName(a).localeCompare(this.getBoatDisplayName(b))}.bind(this));
					const boatsIndex = new Map();
					let boatsArray = ['boats'];
					for(aBoatName of boats){
						boatsIndex.set(aBoatName, boatsArray.push(aBoatName) - 1);
					}
					result.data.push(boatsArray);
					const periodsIndex = new Map();
					let loopDate = startDate;
					let loopDateMillis;
					while(loopDate.isBefore(endDate)){
						loopDateMillis = loopDate.toMillis();
						let datesArray = [loopDateMillis];
						result.data.push(datesArray);
						periodsIndex.set(loopDateMillis, result.data.length - 1);
						for(let i = 0; i < boats.length; i++){
							datesArray.push('');
						}
						loopDate = this.dateIncrementFunction(loopDate);
					}
					let boatIndex, periodIndex, distanceRounded;
					for(let aTrack of this.tracks){
						if ((boats.indexOf(aTrack.getBoat()) >= 0) && (aTrack.getDistance() > 0)) {
							result.hasData = true;
							boatIndex = boatsIndex.get(aTrack.getBoat());
							periodIndex = periodsIndex.get(this.dateMappingFunction(RC.Date.DateHelper.millisToLuxon(aTrack.getStartBoatTime())).toMillis());
							result.data[periodIndex][boatIndex] = (result.data[periodIndex][boatIndex] || 0) + convertDistanceFunction(aTrack.getDistance());
						}
					}
				}
			}
			return result;
		},

		/** Gets the earliest start date and the latest end date from all tracks */
		getTimeframeFromTracks: function(){
			let result = null;
			let minStart = null;
			let maxEnd = null;
			let trackStart;
			let trackEnd;
			for(let i = 0; i < this.tracks.length; i++){
				trackStart = this.tracks[i].getStartBoatTime();
				if(trackStart !== null){
					if(minStart === null){
						minStart = trackStart;
					} else{
						minStart = Math.min(trackStart, minStart);
					}
				}
				trackEnd = this.tracks[i].getEndBoatTime();
				if(trackEnd !== null){
					if(maxEnd === null){
						maxEnd = trackEnd;
					} else{
						maxEnd = Math.max(trackEnd, maxEnd);
					}
				}
			}
			if((minStart !== null) && (maxEnd != null)){
				result =  {
					start: RC.Date.DateOnly.fromObject(RC.Date.DateHelper.millisToLuxon(minStart)),
					end: RC.Date.DateOnly.fromObject(RC.Date.DateHelper.millisToLuxon(maxEnd))
				};
			}
			return result;
		},

		/** Gets the list of all boat names from all tracks */
		getBoatsFromTracks: function(){
			const result = [];
			for(let aTrack of this.tracks){
				if(result.indexOf(aTrack.getBoat()) < 0){
					result.push(aTrack.getBoat());
				}
			}
			return result;
		},

		/** 
		 * @param {RC.Date.DateOnly} pDate 
		 * @returns {RC.Date.DateOnly} pDate plus one Day
		 * */
		addDay: function(pDate){
			return pDate.addDays(1);
		},

		/** 
		 * @param {RC.Date.DateOnly} pDate 
		 * @returns {RC.Date.DateOnly} pDate plus one Week
		 * */
		addWeek: function(pDate){
			return pDate.addDays(7);
		},

		/** 
		 * @param {RC.Date.DateOnly} pDate 
		 * @returns {RC.Date.DateOnly} pDate plus one Month
		 * */
		addMonth: function(pDate){
			return pDate.addMonths(1);
		},

		/** 
		 * @param {RC.Date.DateOnly} pDate 
		 * @returns {RC.Date.DateOnly} pDate plus one Year
		 * */
		addYear: function(pDate){
			return pDate.addYears(1);
		},

		/** 
		 * @param {Object} pDate - Object with day, month, year (RC.Date.DateOnly or luxon DateTime)
		 * @returns {RC.Date.DateOnly} a Date without time
		 * */
		mapToDay: function(pDate){
			return RC.Date.DateOnly.fromObject(pDate);
		},

		/** 
		 * @param {Object} pDate - Object with day, month, year (RC.Date.DateOnly or luxon DateTime)
		 * @returns {RC.Date.DateOnly} the monday of the week containing pDate
		 * */
		mapToWeek: function(pDate){
			let luxonDate = pDate.isLuxonDateTime ? pDate : pDate.toLuxon();
			while(luxonDate.weekday !== 1){
				luxonDate = luxonDate.plus({days: -1});
			}
			return RC.Date.DateOnly.fromObject(luxonDate);
		},

		/** 
		 * @param {Object} pDate - Object with day, month, year (RC.Date.DateOnly or luxon DateTime)
		 * @returns {RC.Date.DateOnly} the first day of the month containing pDate
		 * */
		mapToMonth: function(pDate){
			return RC.Date.DateOnly.fromObject({ year: pDate.year, month: pDate.month, day: 1 });
		},

		/** 
		 * @param {Object} pDate - Object with day, month, year (RC.Date.DateOnly or luxon DateTime)
		 * @returns {RC.Date.DateOnly} january first of the year containing pDate
		 * */
		mapToYear: function(pDate){
			return RC.Date.DateOnly.fromObject({ year: pDate.year, month: 1, day: 1 });
		},

		/** 
		 * @param {Number} pDateMS - a date in ms from epoc
		 * @returns {String} the formatted date, including the year if 
		 * */
		getDayLabel: function(pDateMS){
			const luxonDate = RC.Date.DateHelper.millisToLuxon(pDateMS, this.userLanguage);
			return luxonDate.toFormat(this.userSettings.timeframe == 2 ? 'dd.MM.yy' : 'dd.MM');
		},

		/** 
		 * @param {Number} pDateMS - a date in ms from epoc
		 * @returns {String} the formatted start date and end date of the week
		 * */
		getWeekLabel: function(pDateMS){
			const startLuxon = RC.Date.DateHelper.millisToLuxon(pDateMS, this.userLanguage);
			const endLuxon = startLuxon.plus({days:6});
			const format1 = 'dd.MM';
			const format2 = this.userSettings.timeframe == 2 ? 'dd.MM.yy' : format1;
			return `${startLuxon.toFormat(format1)}-${endLuxon.toFormat(format2)}`;
		},

		/** 
		 * @param {Number} pDateMS - a date in ms from epoc
		 * @returns {String} the month an year
		 * */
		getMonthLabel: function(pDateMS){
			const luxonDate = RC.Date.DateHelper.millisToLuxon(pDateMS, this.userLanguage);
			return luxonDate.toFormat('LLL yyyy');
		},

		/** 
		 * @param {Number} pDateMS - a date in ms from epoc
		 * @returns {String} the year
		 * */
		getYearLabel: function(pDateMS){
			const luxonDate = RC.Date.DateHelper.millisToLuxon(pDateMS, this.userLanguage);
			return luxonDate.toFormat('yyyy');
		},

		convertDistanceNm: function(pDistance){
			return PiLot.Utils.Nav.metersToNauticalMiles(pDistance);
		},

		convertDistanceKm: function(pDistance){
			return pDistance / 1000;
		}
	};

	/**
	 * Draws a diagram showing the fastest segments, either over all or a certain timeframe
	 * (current month, current year, all), for one or many boats.
	 * @param {HTMLElement} pContainer 
	 */
	var FastestSegmentsChart = function (pContainer) {
		this.container = pContainer;
		this.userSettingsName = 'PiLot.View.Stats.FastestSegmentsChart';
		this.userSettings = null;
		this.trackService = null;
		this.allBoats = null;
		this.trackSegments = null;					// Array of PiLot.Model.Nav.TrackSegment
		this.start = null;							// RC.Date.DateOnly
		this.end = null;							// RC.Date.DateOnly
		// controls
		this.lnkToggleSettings = null;
		this.pnlSettings = null;
		this.ddlSegmentTypes = null;				// Dropdown with all segment types
		this.rblTimeframe = null;					// Array of radiobuttons
		this.boatSelector = null;					// PiLot.View.Stats.BoatSelector
		this.rblUnit = null;						// NodeList of checkboxes
		this.pnlNoData = null;
		this.pnlChart = null;
		this.pnlLegend = null;
		this.plhData = null;

		this.initialize();
	}

	FastestSegmentsChart.prototype = {

		initialize: function () {
			this.trackService = PiLot.Service.Nav.TrackService.getInstance();
			this.userSettings = PiLot.Utils.Common.loadUserSetting(this.userSettingsName) || {};
			this.setDefaultValues();
			this.draw();
		},

		lnkToggleSettings_click: function (pEvent) {
			pEvent.preventDefault();
			this.pnlSettings.hidden = !this.pnlSettings.hidden;
			this.userSettings.showSettings = !this.pnlSettings.hidden;
			this.saveUserSettings();
		},

		ddlSegmentTypes_change: function (pSender) {
			this.userSettings.segmentType = Number(pSender.value);
			this.saveUserSettings();
			this.loadAndShowDataAsync();
		},

		rblTimeframe_change: function (pSender) {
			this.userSettings.timeframe = Number(pSender.value);
			this.saveUserSettings();
			this.loadAndShowDataAsync();
		},

		boatSelector_change: function(pData){
			this.userSettings.boats = this.boatSelector.getSelectedBoats();
			this.saveUserSettings();
			this.loadAndShowDataAsync();
		},

		rblUnit_change: function (pSender) {
			this.userSettings.unit = pSender.value;
			this.saveUserSettings();
			this.showDataAsync();
		},

		bar_click: function(pDate, pEvent){
			pEvent.preventDefault();
			const params = [PiLot.Utils.Common.getQsDateArray(pDate)];
			PiLot.Utils.Loader.PageLoader.getInstance().showPage(PiLot.Utils.Loader.pages.diary, params);
		},

		draw: function () {
			let control = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.fastestSegmentsChart);
			this.container.appendChild(control);
			this.lnkToggleSettings = control.querySelector('.lnkToggleSettings');
			this.lnkToggleSettings.addEventListener('click', this.lnkToggleSettings_click.bind(this));
			this.pnlSettings = control.querySelector('.pnlSettings');
			this.ddlSegmentTypes = control.querySelector('.ddlSegmentTypes');
			this.ddlSegmentTypes.addEventListener('change', this.ddlSegmentTypes_change.bind(this, this.ddlSegmentTypes));
			this.rblTimeframe = control.querySelectorAll('.rblTimeframe');
			for (let rbTimeframe of this.rblTimeframe) {
				rbTimeframe.addEventListener('change', this.rblTimeframe_change.bind(this, rbTimeframe));
			}
			this.boatSelector = new BoatSelector(control.querySelector('.plhBoats'));
			this.boatSelector.on('change', this, this.boatSelector_change.bind(this));
			this.rblUnit = control.querySelectorAll('.rblUnit');
			for (let rbUnit of this.rblUnit) {
				rbUnit.addEventListener('change', this.rblUnit_change.bind(this, rbUnit));
			}
			Promise.all([
				this.boatSelector.fillBoatsListAsync(),
				this.loadAllBoatsAsync(),
				this.fillSegmentTypesAsync()
			]).then(results => this.applyUserSettings());
			this.pnlNoData = control.querySelector('.pnlNoData');
			this.pnlChart = control.querySelector('.pnlChart');
			this.pnlLegend = control.querySelector('.pnlLegend');
			this.plhData = control.querySelector('.plhData');
		},

		setDefaultValues: function () {
			this.userSettings.segmentType = this.userSettings.segmentType || null;
			this.userSettings.timeframe = this.userSettings.timeframe || 0;
			this.userSettings.boats = this.userSettings.boats || [];
			this.userSettings.unit = this.userSettings.unit || 'nm';
		},

		/** Populates this.allBoats, which is needed to get the display names  */
		loadAllBoatsAsync: async function () {
			if (this.allBoats === null) {
				this.allBoats = await PiLot.Service.Boat.BoatConfigService.getInstance().getBoatConfigsAsync();
			}
		},

		getBoatDisplayName: function (pBoatName) {
			const boatInfo = this.allBoats.find(b => b.name === pBoatName);
			return boatInfo ? boatInfo.displayName : pBoatName;
		},

		fillSegmentTypesAsync: async function(){
			const allTypes = await this.trackService.getTrackSegmentTypesAsync();
			const language = PiLot.Utils.Language.getLanguage();
			const ddlData = [];
			allTypes.forEach(function (v, k, m) { ddlData.push([v.getId(), v.getLabel(language)]); });
			RC.Utils.fillDropdown(this.ddlSegmentTypes, ddlData, null);
		},

		applyUserSettings: function () {
			this.pnlSettings.hidden = !this.userSettings.showSettings;
			this.ddlSegmentTypes.value = this.userSettings.segmentType;
			this.rblTimeframe.forEach(function (rb) { rb.checked = Number(rb.value) === this.userSettings.timeframe }.bind(this));
			this.boatSelector.setSelectedBoats(this.userSettings.boats);
			this.rblUnit.forEach(function (rb) { rb.checked = rb.value === this.userSettings.unit }.bind(this));
		},

		saveUserSettings: function () {
			PiLot.Utils.Common.saveUserSetting(this.userSettingsName, this.userSettings);
		},

		/** Loads and shows the data, if a segment type as been set */
		loadAndShowDataAsync: async function () {
			if (this.userSettings.segmentType !== null) {
				await this.loadTrackSegmentsAsync();
				await this.showDataAsync();
			} else {
				this.pnlChart.hidden = true;
				this.pnlNoData.hidden = false;
			}
		},

		/** 
		 * Loads the segments based on the current settings.
		 * */
		loadTrackSegmentsAsync: async function () {
			let boatTime = await PiLot.Utils.Common.BoatTimeHelper.getCurrentBoatTime();
			let now = boatTime.now();
			switch (this.userSettings.timeframe) {
				case 0:	// current month
					this.start = RC.Date.DateOnly.fromObject({ year: now.year, month: now.month, day: 1 });
					this.end = this.start.addMonths(1);
					break;
				case 1: // current year
					this.start = RC.Date.DateOnly.fromObject({ year: now.year, month: 1, day: 1 });;
					this.end = this.start.addYears(1);
					break;
				case 2: // all
					this.start = null;
					this.end = null;
					break;
			}
			const startMillis = this.start ? this.start.toMillis() : null;
			const endMillis = this.end ? this.end.toMillis() : null;
			const boats = (this.userSettings.boats && this.userSettings.boats.length) ? this.userSettings.boats : null;
			this.trackSegments = await this.trackService.findTrackSegmentsAsync(
				this.userSettings.segmentType,
				startMillis,
				endMillis, 
				true, 
				boats,
				20
			);
		},

		/** Processes the track segments data and assigns it to the chart */
		showDataAsync: async function () {
			const colors = ['#ee6666', '#fc8452', '#fac858', '#91cc75', '#3ba272', '#73c0de', '#5470c6', '#9a60b4', '#ea7ccc'];
			const colorIndex = new Map();
			this.allBoats || await this.loadAllBoatsAsync();
			for (let i = 0; i < this.allBoats.length; i++) {
				colorIndex.set(this.allBoats[i].name, colors[i % colors.length]);
			}
			if (this.trackSegments && this.trackSegments.length) {
				this.pnlChart.hidden = false;
				this.showLegend(colorIndex);
				this.showBars(colorIndex);
			} else {
				this.pnlChart.hidden = true;
			}
			this.pnlNoData.hidden = !this.pnlChart.hidden;
		},

		showLegend: function (pColorIndex) {
			this.pnlLegend.clear();
			let boats;
			if (this.userSettings.boats && this.userSettings.boats.length) {
				boats = Array.from(this.userSettings.boats);
			} else {
				boats = this.getBoatsFromTrackSegments();
			}
			boats.sort(function (a, b) { return this.getBoatDisplayName(a).localeCompare(this.getBoatDisplayName(b)) }.bind(this));
			for (let aBoat of boats) {
				const node = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.fastestSegmentsLegendItem);
				node.querySelector('.divColor').style.backgroundColor = pColorIndex.get(aBoat);
				node.querySelector('.lblText').innerText = this.getBoatDisplayName(aBoat);
				this.pnlLegend.appendChild(node);
			}
		},

		showBars: function (pColorIndex) {
			this.plhData.clear();
			const maxWidth = 80;
			const maxSpeed = this.trackSegments[0].getSpeed();
			const factor = maxWidth / maxSpeed;
			const loader = PiLot.Utils.Loader;
			const utils = PiLot.Utils.Common;
			let trackSegment, startTime;
			let bar, lnkBarText, date;
			const convertSpeedFunction = this.userSettings.unit == "kn" ? this.convertSpeedKn : this.convertSpeedKmh
			for(let i = 0; i < this.trackSegments.length; i++){
				trackSegment = this.trackSegments[i];
				startTime = trackSegment.getStartBoatTime();
				date = RC.Date.DateOnly.fromObject(startTime);
				const node = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.fastestSegmentsDataItem);
				lnkBarText = node.querySelector('.lnkBarText');
				lnkBarText.innerText = startTime.toLocaleString(DateTime.DATE_SHORT);
				lnkBarText.href = `${loader.createPageLink(loader.pages.diary)}&${utils.qsDateKey}=${utils.getQsDateValue(date)}`;
				lnkBarText.addEventListener('click', this.bar_click.bind(this, date));
				node.querySelector('.lblBarLabel').innerText = convertSpeedFunction(trackSegment.getSpeed()).toFixed(2);
				bar = node.querySelector('.divBar');
				bar.style.width = `${(factor * trackSegment.getSpeed()).toFixed(2)}%`;
				bar.style.backgroundColor = pColorIndex.get(trackSegment.getBoat());
				this.plhData.appendChild(node);
			}
		},

		/** Rounds a distance to two decimal places */
		roundDistance: function (pDistance) {
			return (pDistance && RC.Utils.isNumeric(pDistance)) ? Math.round(pDistance * 100) / 100 : pDistance;
		},

		/** Gets the list of all boat names from the current trackSegments */
		getBoatsFromTrackSegments: function () {
			const result = [];
			for (let aTrackSegment of this.trackSegments) {
				if (result.indexOf(aTrackSegment.getBoat()) < 0) {
					result.push(aTrackSegment.getBoat());
				}
			}
			return result;
		},

		convertSpeedKn: function (pSpeed) {
			return PiLot.Utils.Nav.metersToNauticalMiles(pSpeed) * 3600;
		},

		convertSpeedKmh: function (pSpeed) {
			return pSpeed * 3.6;
		}
	};

	/*var TimeframeSelector = function(pContainer, pUniqueName){
		this.container = pContainer;
		this.observable = null;
		this.initialize();
	};

	TimeframeSelector.prototype = {

		initialize: function(){
			this.observable = new PiLot.Utils.Common.Observable(['change']);
			this.draw();
		},

		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		draw: function(){
			let control = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.timeframeSelector);
			this.container.appendChild(control);
			this.fillBoatsListAsync();
		}
	};*/

	var BoatSelector = function(pContainer){
		this.container = pContainer;
		this.cblBoats = null;
		this.initialize();
	};

	BoatSelector.prototype = {

		initialize: function(){
			this.observable = new PiLot.Utils.Common.Observable(['change']);
			this.draw();
		},

		on: function(pEvent, pObserver, pFunction){
			this.observable.addObserver(pEvent, pObserver, pFunction)
		},

		cbBoat_change: function(pSender){
			this.observable.fire('change', {boat: pSender.value, checked: pSender.checked});
		},

		draw: function(){},

		fillBoatsListAsync: async function () {
			const allBoats = await PiLot.Service.Boat.BoatConfigService.getInstance().getBoatConfigsAsync();
			this.cblBoats = [];
			const boatNames = allBoats.map((b) => [b.name, b.displayName]);
			for (aBoatName of boatNames) {
				let control = PiLot.Utils.Common.createNode(PiLot.Templates.Common.checkbox);
				let checkbox = control.querySelector('input');
				checkbox.value = aBoatName[0];
				checkbox.addEventListener('change', this.cbBoat_change.bind(this, checkbox));
				control.querySelector('.lblLabel').innerText = aBoatName[1];
				this.container.appendChild(control);
				this.cblBoats.push(checkbox);
			}
		},

		setSelectedBoats: function(pBoats){
			this.cblBoats.forEach(function (cb) {
				cb.checked = pBoats.indexOf(cb.value) >= 0;
			}.bind(this));
		},

		getSelectedBoats: function(pBoats){
			const result = [];
			for(let aCheckbox of this.cblBoats){
				aCheckbox.checked && result.push(aCheckbox.value);
			}
			return result;
		}

	};
	
	return {
		TrackStatsPage: TrackStatsPage
	};

})();