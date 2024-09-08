var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

/** Includes the GUIs for statistics and charts */
PiLot.View.Stats = (function () {

	/** 
	 * class TrackStatsPage, representing the page containing different statistics based on track data
	 * */
	var TrackStatsPage = function () {

		this.userSettingsName = 'PiLot.View.Stats.trackStatsSettings';
		this.userSettings = null;
		this.trackService = null;
		this.allBoats = null;
		// controls
		this.pnlTotalDistance = null;
		this.expandCollapseTotalDistance = null;
		this.totalDistanceChart = null;				//echart object
		
		this.initializeAsync();
	}

	TrackStatsPage.prototype = {

		initializeAsync: async function () {
			await this.loadBoatsAsync();
			this.trackService = PiLot.Service.Nav.TrackService.getInstance();
			this.userSettings = PiLot.Utils.Common.loadUserSetting(this.userSettingsName) || {};
			window.addEventListener('resize', this.window_resize.bind(this));
			this.draw();
			this.applyUserSettings();
		},

		expandCollapseTotalDistance_expand: function (pSettingsKey) {
			this.userSettings.totalDistanceChartVisible = true;
			this.loadTotalDistanceChartAsync();
			this.saveUserSettings();
		},

		expandCollapseTotalDistance_collapse: function (pSettingsKey) {
			this.userSettings.totalDistanceChartVisible = false;
			this.saveUserSettings();
		},

		window_resize: function(){
			this.totalDistanceChart && this.totalDistanceChart.resize();
		},

		draw: function () {
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.trackStatsPage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			let lnkTotalDistance = pageContent.querySelector('.lnkTotalDistance');
			this.pnlTotalDistance = pageContent.querySelector('.pnlTotalDistance');
			this.expandCollapseTotalDistance = new PiLot.View.Common.ExpandCollapse(lnkTotalDistance, this.pnlTotalDistance);
			this.expandCollapseTotalDistance.on('expand', this.expandCollapseTotalDistance_expand.bind(this));
			this.expandCollapseTotalDistance.on('collapse', this.expandCollapseTotalDistance_collapse.bind(this));
		},

		loadBoatsAsync: async function(){
			this.allBoats = await PiLot.Model.Boat.loadConfigInfosAsync();
			//this.allBoatNames = boatInfos.map((b) => [b.name, b.displayName]);
		},

		applyUserSettings: function () {
			this.expandCollapseTotalDistance.expandCollapse(this.userSettings.totalDistanceChartVisible);
			
		},

		saveUserSettings: function () {
			PiLot.Utils.Common.saveUserSetting(this.userSettingsName, this.userSettings);
		},

		loadTotalDistanceChartAsync: async function () {
			let boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.userSettings.totalDistanceTimeframe = this.userSettings.totalDistanceTimeframe || 1;
			this.userSettings.totalDistanceInterval = this.userSettings.totalDistanceInterval || 0;
			let start, end;		
			let now = boatTime.now();
			let showLabels;
			switch (this.userSettings.totalDistanceTimeframe) {
				case 0:	// current month
					start = this.mapToMonth(now);
					end = start.addMonths(1);
					showLabels = this.userSettings.totalDistanceInterval > 0;
					break;
				case 1: // current year
					start = this.mapToYear(now);
					end = start.addYears(1);
					showLabels = this.userSettings.totalDistanceInterval > 1;
					break;
				case 2: // all
					start = null;
					end = this.mapToDay(now).addDays(1);
					showLabels = this.userSettings.totalDistanceInterval > 1;
					break;
			}
			let tracks = await this.trackService.loadTracksAsync(start && start.toMillis(), end.toMillis(), true, false);
			let chartData = this.groupTracks(tracks, start, end);
			let series = [];
			for(let i = 0; i < chartData[0].length - 1; i++){
				series.push({ type: 'bar', stack: 'total',  label: { show: showLabels, position: 'inside' },});
			}
			let option = {
				grid: {left: 20, right:30, bottom: 10, top:50, containLabel: true},
				animation: false,
				legend: {},
				tooltip: {},
				dataset: { source: chartData },
				xAxis: { type: 'category' },
				yAxis: {},
				series: series
			  };

			this.totalDistanceChart = this.totalDistanceChart || echarts.init(this.pnlTotalDistance);
			this.totalDistanceChart.setOption(option);
		},

		/**
		 * Takes a list of tracks, and creates an array of arrays, first having the list of boats, and
		 * then for each timespan having an array starting with the name of the timespan, and then the
		 * total distance for each boat. This can then be passed to the chart as dataset.source.
		 * */
		groupTracks: function (pTracks, pStartDate, pEndDate) {
			let result = [];
			if(pTracks && pTracks.length){
				let dateMappingFunction, dateIncrementFunction, dateLabelFunction;
				switch(this.userSettings.totalDistanceInterval){
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
						dateLabelFunction = this.getMonthLabel;
						break;
				}
				let startDate = pStartDate;
				if(startDate === null){
					startDate = this.getMinStartDate(pTracks);
				}
				if(startDate !== null){
					startDate = dateMappingFunction(startDate);
					const endDate = dateMappingFunction(pEndDate);
					if(!this.userSettings.totalDistanceBoats || !this.userSettings.totalDistanceBoats.length){
						this.userSettings.totalDistanceBoats = this.getBoats(pTracks);
					}
					const boatsIndex = new Map();
					let boatsArray = ['boats'];
					for(aBoatName of this.userSettings.totalDistanceBoats){
						const boatInfo = this.allBoats.find(b => b.name === aBoatName);
						let displayName = boatInfo ? boatInfo.displayName : aBoatName;
						boatsIndex.set(aBoatName, boatsArray.push(displayName) - 1);
					}
					result.push(boatsArray);
					const periodsIndex = new Map();
					let loopDate = startDate;
					const language = PiLot.Utils.Language.getLanguage();
					while(loopDate.isBefore(endDate)){
						let datesArray = [dateLabelFunction(loopDate, language)];
						result.push(datesArray);
						periodsIndex.set(loopDate.toMillis(), result.length - 1);
						for(let i = 0; i < this.userSettings.totalDistanceBoats.length; i++){
							datesArray.push('');
						}
						loopDate = dateIncrementFunction(loopDate);
					}
					let boatIndex, periodIndex, distanceRounded;
					for(let aTrack of pTracks){
						if((this.userSettings.totalDistanceBoats.indexOf(aTrack.getBoat()) >= 0) && (aTrack.getDistance() > 0)){
							boatIndex = boatsIndex.get(aTrack.getBoat());
							periodIndex = periodsIndex.get(dateMappingFunction(RC.Date.DateHelper.millisToLuxon(aTrack.getStartBoatTime())).toMillis());
							distanceRounded = this.formatDistanceNm(aTrack.getDistance());
							result[periodIndex][boatIndex] = (result[periodIndex][boatIndex] || 0) + distanceRounded;
						}
					}
				}
			}
			return result;
		},

		formatDistanceNm: function(pDistance){
			return Math.round(PiLot.Utils.Nav.metersToNauticalMiles(pDistance) * 100)/100;
		},

		getMinStartDate: function(pTracks){
			let result = null;
			let minTime = null;
			let trackStart;
			for(let i = 0; i < pTracks.length; i++){
				trackStart = pTracks[i].getStartBoatTime();
				if(trackStart !== null){
					if(minTime === null){
						minTime = trackStart;
					} else{
						minTime = Math.min(trackStart, minTime);
					}
				}
			}
			if(minTime !== null){
				result = RC.Date.DateOnly.fromObject(RC.Date.DateHelper.millisToLuxon(minTime));
			}
			return result;
		},

		getBoats: function(pTracks){
			const result = [];
			for(let aTrack of pTracks){
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
		}
	}

	return {
		TrackStatsPage: TrackStatsPage
	};

})();