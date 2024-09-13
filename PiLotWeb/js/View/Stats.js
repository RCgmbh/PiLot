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

	var TotalDistanceChart = function(pContainer){
		this.container = pContainer;
		this.userSettingsName = 'PiLot.View.Stats.TotalDistanceChart';
		this.userSettings = null;
		this.trackService = null;
		this.allBoats = null;
		this.tracks = null;							// Array of PiLot.Model.Nav.Track
		this.start = null;							// RC.Date.DateOnly
		this.end = null;							// RC.Date.DateOnly
		// controls
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
			window.addEventListener('resize', this.window_resize.bind(this));
			this.setDefaultValues();
			this.draw();
		},

		window_resize: function(){
			this.chart && this.chart.resize();
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
			let showLabels;
			switch (this.userSettings.timeframe) {
				case 0:	// current month
					showLabels = this.userSettings.interval > 0;
					break;
				case 1: // current year
					showLabels = this.userSettings.interval > 1;
					break;
				case 2: // all
					showLabels = this.userSettings.interval > 1;
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
					label: { show: showLabels, position: 'inside', formatter: this.formatLabel },
					itemStyle: { color: colorIndex.get(seriesName) }
					
				});
			}
			let option = {
				grid: {left: 20, right:30, bottom: 10, top:50, containLabel: true},
				animation: false,
				legend: { formatter: this.formatLegend.bind(this) },
				tooltip: {},
				dataset: { source: chartData },
				xAxis: { type: 'category' },
				yAxis: {},
				series: series
			  };

			this.chart && echarts.dispose(this.pnlChart); // without this, it messed up the chart when changing boats. Probably my fault :-)
			this.chart = echarts.init(this.pnlChart, null, { renderer: 'svg' });
			this.chart.setOption(option);
		},

		formatLabel: function(pData){
			const value = pData.data[pData.seriesIndex + 1];
			return value ? Math.round(value * 100) / 100 : '';
		},

		formatLegend: function(pName){
			const boatInfo = this.allBoats.find(b => b.name === pName);
			return boatInfo ? boatInfo.displayName : pName;
		},

		/**
		 * Takes the current tracks, and creates an array of arrays, first having the list of boats, and
		 * then for each timespan having an array starting with the name of the timespan, and then the
		 * total distance for each boat. This can then be passed to the chart as dataset.source.
		 * */
		processDataAsync: async function () {
			let result = [];
			if(this.tracks && this.tracks.length){
				let dateMappingFunction, dateIncrementFunction, dateLabelFunction;
				switch(this.userSettings.interval){
					case 0:		// per day
						dateMappingFunction = this.mapToDay;
						dateIncrementFunction = this.addDay;
						dateLabelFunction = this.getDayLabel;
						break;
					case 1:		// per week
						dateMappingFunction = this.mapToWeek;
						dateIncrementFunction = this.addWeek;
						dateLabelFunction = this.getWeekLabel;
						break;
					case 2:		// per month
						dateMappingFunction = this.mapToMonth;
						dateIncrementFunction = this.addMonth;
						dateLabelFunction = this.getMonthLabel;
						break;
					case 3:		// per year
						dateMappingFunction = this.mapToYear;
						dateIncrementFunction = this.addYear;
						dateLabelFunction = this.getYearLabel;
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
					endDate = timeframe && dateIncrementFunction(dateMappingFunction(timeframe.end));
				}
				if(startDate !== null){
					startDate = dateMappingFunction(startDate);
					endDate = dateMappingFunction(endDate);
					let boats;
					if(this.userSettings.boats && this.userSettings.boats.length){
						boats = Array.from(this.userSettings.boats);
					} else{
						boats = this.getTrackBoats();
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
					const language = PiLot.Utils.Language.getLanguage();
					while(loopDate.isBefore(endDate)){
						let datesArray = [dateLabelFunction(loopDate, language)];
						result.push(datesArray);
						periodsIndex.set(loopDate.toMillis(), result.length - 1);
						for(let i = 0; i < boats.length; i++){
							datesArray.push('');
						}
						loopDate = dateIncrementFunction(loopDate);
					}
					let boatIndex, periodIndex, distanceRounded;
					for(let aTrack of this.tracks){
						if((boats.indexOf(aTrack.getBoat()) >= 0) && (aTrack.getDistance() > 0)){
							boatIndex = boatsIndex.get(aTrack.getBoat());
							periodIndex = periodsIndex.get(dateMappingFunction(RC.Date.DateHelper.millisToLuxon(aTrack.getStartBoatTime())).toMillis());
							result[periodIndex][boatIndex] = (result[periodIndex][boatIndex] || 0) + convertDistanceFunction(aTrack.getDistance());
						}
					}
				}
			}
			return result;
		},

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

		getTrackBoats: function(){
			const result = [];
			for(let aTrack of this.tracks){
				if(result.indexOf(aTrack.getBoat()) < 0){
					result.push(aTrack.getBoat());
				}
			}
			return result;
		},

		addDay: function(pDate){
			return pDate.addDays(1);
		},

		addWeek: function(pDate){
			return pDate.addDays(7);
		},

		addMonth: function(pDate){
			return pDate.addMonths(1);
		},

		addYear: function(pDate){
			return pDate.addYears(1);
		},

		mapToDay: function(pDate){
			return RC.Date.DateOnly.fromObject(pDate);
		},

		mapToWeek: function(pDate){
			let luxonDate = pDate.isLuxonDateTime ? pDate : pDate.toLuxon();
			while(luxonDate.weekday !== 1){
				luxonDate = luxonDate.plus({days: -1});
			}
			return RC.Date.DateOnly.fromObject(luxonDate);
		},

		mapToMonth: function(pDate){
			return RC.Date.DateOnly.fromObject({ year: pDate.year, month: pDate.month, day: 1 });
		},

		mapToYear: function(pDate){
			return RC.Date.DateOnly.fromObject({ year: pDate.year, month: 1, day: 1 });
		},

		getDayLabel: function(pDate, pLocale){
			const luxonDate = pDate.toLuxon(pLocale);
			return luxonDate.toFormat('dd.MM.');
		},

		getWeekLabel: function(pDate, pLocale){
			const startLuxon = pDate.toLuxon(pLocale);
			const endLuxon = pDate.addDays(6).toLuxon(pLocale);
			return `${startLuxon.toFormat('dd.MM.')} - ${endLuxon.toFormat('dd.MM.')}`;
		},

		getMonthLabel: function(pDate, pLocale){
			const luxonDate = pDate.toLuxon(pLocale);
			return luxonDate.toFormat('LLL yyyy');
		},

		getYearLabel: function(pDate, pLocale){
			return `${pDate.year}`;
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