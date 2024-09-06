var PiLot = PiLot || {};
PiLot.View = PiLot.View || {};

/** Includes the GUIs for statistics and charts */
PiLot.View.Stats = (function () {

	/** 
	 * class TrackStatsPage, representing the page containing different statistics based on track data
	 * */
	var TrackStatsPage = function () {

		this.userSettings = null;
		this.trackService = null;
		// controls
		this.pnlTotalDistance = null;
		this.expandCollapseTotalDistance = null;
		this.totalDistanceChart = null;				//echart object
		
		this.initialize();
	}

	TrackStatsPage.prototype = {

		initialize: function () {
			this.trackService = PiLot.Service.Nav.TrackService.getInstance();
			this.userSettings = PiLot.Utils.Common.loadUserSetting('PiLot.View.Stats.trackStatsSettings') || {};
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

		draw: function () {
			let pageContent = PiLot.Utils.Common.createNode(PiLot.Templates.Stats.trackStatsPage);
			PiLot.Utils.Loader.getContentArea().appendChild(pageContent);
			let lnkTotalDistance = pageContent.querySelector('.lnkTotalDistance');
			this.pnlTotalDistance = pageContent.querySelector('.pnlTotalDistance');
			this.expandCollapseTotalDistance = new PiLot.View.Common.ExpandCollapse(lnkTotalDistance, this.pnlTotalDistance);
			this.expandCollapseTotalDistance.on('expand', this.expandCollapseTotalDistance_expand.bind(this));
			this.expandCollapseTotalDistance.on('collapse', this.expandCollapseTotalDistance_collapse.bind(this));
		},

		applyUserSettings: function () {
			this.expandCollapseTotalDistance.expandCollapse(this.userSettings.totalDistanceChartVisible);
			
		},

		saveUserSettings: function () {
			PiLot.Utils.Common.saveUserSetting('PiLot.View.Stats.trackStatsSettings', this.userSettings);
		},

		loadTotalDistanceChartAsync: async function () {
			let boatTime = await PiLot.Model.Common.getCurrentBoatTimeAsync();
			this.userSettings.totalDistanceTimeframe = this.userSettings.totalDistanceTimeframe || 1;
			let start, end;		
			let now = boatTime.now();
			switch (this.userSettings.totalDistanceTimeframe) {
				case 0:	// current month
					start = RC.Date.DateOnly.fromObject({ year: now.year, month: now.month, day: 1 });
					end = start.addMonths(1);
					break;
				case 1: // current year
					start = RC.Date.DateOnly.fromObject({ year: now.year, month: 1, day: 1 });
					end = start.addYears(1);
					break;
				case 2: // all
					start = RC.Date.DateOnly.fromObject({ year: 1970, month: 1, day: 1 }); //💩
					end = now;
					break;
			}
			let tracks = await this.trackService.loadTracksAsync(start.toMillis(), end.toMillis(), true, false);
			console.log(tracks);
			let chartData = [[]];
			for (let aTrack of tracks) {
			}
			this.totalDistanceChart ||= echarts.init(this.pnlTotalDistance);
		},

		/**
		 * Takes a list of tracks, and creates an object, which can be assigned to the chart, holding
		 * all data required to draw the chart.
		 * */
		groupTracks: function (pTracks) {

			// create map with key = date(depending on grouping setting), value = array of fixed length(as many item as boats have been selected, containing each an array of the tracks for that boat
			// keep track of the minimal date
			// create an array with objects of { date, boatTracks }
			// fill the array, starting at minimal date or at the beginning of the time period.Add the elements from the map for each date
			// prepare the series array, one array per selected boat
			// loop through the array:
			// puth the dates to chart.xAxis.data
			// push the values of boatTracks to series[boatIndex].data

		}

	}

	return {
		TrackStatsPage: TrackStatsPage
	};

})();