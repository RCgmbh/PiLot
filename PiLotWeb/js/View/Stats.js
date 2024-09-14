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

		draw: function () {
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.trackStatsPage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			const pnlTotalDistanceChart = pageContent.querySelector('.pnlTotalDistanceChart');
			this.expandCollapseTotalDistance = new PiLot.View.Common.ExpandCollapse(
				pageContent.querySelector('.lnkTotalDistance'),
				pnlTotalDistanceChart
			);
			this.expandCollapseTotalDistance.on('expand', this.expandCollapseTotalDistance_expand.bind(this));
			this.expandCollapseTotalDistance.on('collapse', this.expandCollapseTotalDistance_collapse.bind(this));
			this.totalDistanceChart = new TotalDistanceChart(pnlTotalDistanceChart);
		},

		applyUserSettings: function () {
			this.expandCollapseTotalDistance.expandCollapse(this.userSettings.totalDistanceChartVisible);
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
		this.cblBoats = null;						// NodeList of checkboxes
		this.tblUnit = null;						// NodeList of checkboxes
		this.pnlChart = null;
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

		cbBoat_change: function(pSender){
			this.userSettings.boats = this.userSettings.boats || [];
			const index = this.userSettings.boats.indexOf(pSender.value);
			if(pSender.checked && index < 0){
				this.userSettings.boats.push(pSender.value);
			} else if(!pSender.checked && index >= 0){
				this.userSettings.boats.remove(index, index);
			}
			this.saveUserSettings();
			this.showDataAsync();
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
			this.fillBoatsListAsync(control.querySelector('.plhBoats')).then(this.applyUserSettings.bind(this));
			this.pnlChart = control.querySelector('.pnlChart');	
		},

		setDefaultValues: function(){
			this.userSettings.interval = this.userSettings.interval || 0;
			this.userSettings.timeframe = this.userSettings.timeframe || 1;
			this.userSettings.boats = this.userSettings.boats || [];
			this.userSettings.unit = this.userSettings.unit || 'nm';
		},

		loadAllBoatsAsync: async function(){
			if(this.allBoats === null){
				this.allBoats = await PiLot.Model.Boat.loadConfigInfosAsync();
				this.allBoats.sort((a, b) => a.displayName.localeCompare(b.displayName));
			}
		},

		getBoatDisplayName: function(pBoatName){
			const boatInfo = this.allBoats.find(b => b.name === pBoatName);
			return boatInfo ? boatInfo.displayName : pBoatName;
		},

		fillBoatsListAsync: async function(pPlaceholder){
			this.allBoats || await this.loadAllBoatsAsync();
			this.cblBoats = [];
			const boatNames = this.allBoats.map((b) => [b.name, b.displayName]); 
			for(aBoatName of boatNames){
				let control = PiLot.Utils.Common.createNode(PiLot.Templates.Common.checkbox);
				let checkbox = control.querySelector('input');
				checkbox.value = aBoatName[0];
				checkbox.addEventListener('change', this.cbBoat_change.bind(this, checkbox));
				control.querySelector('.lblLabel').innerText = aBoatName[1];
				pPlaceholder.appendChild(control);
				this.cblBoats.push(checkbox);
			}
		},

		applyUserSettings: function () {
			this.pnlSettings.hidden = !this.userSettings.showSettings;
			this.rblTimeframe.forEach(function(rb){rb.checked = Number(rb.value) === this.userSettings.timeframe}.bind(this));
			this.rblInterval.forEach(function(rb){rb.checked = Number(rb.value) === this.userSettings.interval}.bind(this));
			this.cblBoats.forEach(function(cb){cb.checked = this.userSettings.boats.indexOf(cb.value) >= 0}.bind(this));
			this.rblUnit.forEach(function(rb){rb.checked = rb.value === this.userSettings.unit}.bind(this));
		},

		saveUserSettings: function () {
			PiLot.Utils.Common.saveUserSetting(this.userSettingsName, this.userSettings);
		},

		loadAndShowDataAsync: async function(){
			await this.loadTracksAsync();
			await this.showDataAsync();
		},

		/** Loads the tracks according to the currently set timeframe */
		loadTracksAsync: async function () {
			let boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
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
			let end = this.end || this.mapToDay(now).addDays(1);
			this.tracks = await this.trackService.loadTracksAsync(this.start && this.start.toMillis(), end.toMillis(), true, false);
		},

		/** Processes the track data and assigns it to the chart */
		showDataAsync: async function(){
			switch (this.userSettings.timeframe) {
				case 0:	// current month
					this.showLabels = this.userSettings.interval > 0;
					break;
				case 1: // current year
					this.showLabels = this.userSettings.interval > 1;
					break;
				case 2: // all
					this.showLabels = this.userSettings.interval > 1;
					break;
			}
			let chartData = await this.processDataAsync();
			const colors = ['#ee6666', '#fc8452', '#fac858', '#91cc75', '#3ba272', '#73c0de', '#5470c6', '#9a60b4', '#ea7ccc'];
			const colorIndex = new Map();
			for(let i = 0; i < this.allBoats.length; i++){
				colorIndex.set(this.allBoats[i].name, colors[i % colors.length]); 
			}
			let series = [];
			let seriesName;
			for(let i = 0; i < chartData[0].length - 1; i++){
				seriesName = chartData[0][i + 1];
				series.push({
					name: seriesName,
					type: 'bar',
					stack: 'total',
					label: { show: this.showLabels, position: 'inside', formatter: this.formatBarLabel.bind(this) },
					itemStyle: { color: colorIndex.get(seriesName) }
					
				});
			}
			let option = {
				grid: {left: 20, right:30, bottom: 10, top:50, containLabel: true},
				animation: false,
				legend: { formatter: this.formatLegend.bind(this) },
				tooltip: { formatter: this.getTooltip.bind(this), triggerOn: 'click', enterable: true },
				dataset: { source: chartData },
				xAxis: { type: 'category', axisLabel: { formatter: this.formatXAxisLabel.bind(this)} },
				yAxis: {},
				series: series
			  };

			this.chart && echarts.dispose(this.pnlChart); // without this, it messed up the chart when changing boats. Probably my fault :-)
			this.chart = echarts.init(this.pnlChart, null, { renderer: 'svg' });
			this.chart.setOption(option);
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
		 * */
		processDataAsync: async function () {
			let result = [];
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
					const boatsIndex = new Map();
					let boatsArray = ['boats'];
					this.allBoats || await this.loadAllBoatsAsync();
					for(aBoatName of boats){
						boatsIndex.set(aBoatName, boatsArray.push(aBoatName) - 1);
					}
					result.push(boatsArray);
					const periodsIndex = new Map();
					let loopDate = startDate;
					let loopDateMillis;
					while(loopDate.isBefore(endDate)){
						loopDateMillis = loopDate.toMillis();
						let datesArray = [loopDateMillis];
						result.push(datesArray);
						periodsIndex.set(loopDateMillis, result.length - 1);
						for(let i = 0; i < boats.length; i++){
							datesArray.push('');
						}
						loopDate = this.dateIncrementFunction(loopDate);
					}
					let boatIndex, periodIndex, distanceRounded;
					for(let aTrack of this.tracks){
						if((boats.indexOf(aTrack.getBoat()) >= 0) && (aTrack.getDistance() > 0)){
							boatIndex = boatsIndex.get(aTrack.getBoat());
							periodIndex = periodsIndex.get(this.dateMappingFunction(RC.Date.DateHelper.millisToLuxon(aTrack.getStartBoatTime())).toMillis());
							result[periodIndex][boatIndex] = (result[periodIndex][boatIndex] || 0) + convertDistanceFunction(aTrack.getDistance());
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
		 * @returns {String} the formatted date
		 * */
		getDayLabel: function(pDateMS){
			const luxonDate = RC.Date.DateHelper.millisToLuxon(pDateMS, this.userLanguage);
			return luxonDate.toFormat('dd.MM.');
		},

		/** 
		 * @param {Number} pDateMS - a date in ms from epoc
		 * @returns {String} the formatted start date and end date of the week
		 * */
		getWeekLabel: function(pDateMS){
			const startLuxon = RC.Date.DateHelper.millisToLuxon(pDateMS, this.userLanguage);
			const endLuxon = startLuxon.plus({days:6});
			return `${startLuxon.toFormat('dd.MM.')} - ${endLuxon.toFormat('dd.MM.')}`;
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
	
	return {
		TrackStatsPage: TrackStatsPage
	};

})();