var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

PiLot.Utils.Chart = (function () {

	/**
	 * A Chart showing timestamped data as line graph
	 * @param {Object} pControls - an object containing two divs: { loading, chart };
	 * @param {Number} pYRange - optional, The difference between yMax and yMin. Can be passed in showChart()
	 * @param {Number} pYStep - optional, The step to which yMax and yMin will be rounded
	 * @param {Function} pYTickFormatter - An optional custom formatter to set the y-value text to display
	 * */
	var DataChart = function (pControls, pYRange = null, pYStep = null, pYTickFormatter = null, pFillColor = null) {
		this.controls = pControls;
		this.yRange = pYRange;
		this.yStep = pYStep;
		this.yTickFormatter = pYTickFormatter;
		this.xTickFormat = null;
		this.fillColor = pFillColor;
		this.boatTimeOffsets = null;
		this.locale = null;
		this.initialize();
	}

	DataChart.prototype = {

		initialize: function () {
			this.locale = PiLot.Utils.Language.getLanguage();
		},

		/**
		 * Shows the chart with the data passed as pData
		 * @param {Object} pData - an object with data: array, boatTimes: array and optionally minDate, maxDate
		 * @param {Number} pYRange - optionally pass an Y-Range (if it differs from the initially set value)
		 */
		showChart: function (pData, pYRange) {
			this.yRange = pYRange || this.yRange;
			this.boatTimeOffsets = pData.boatTimeOffsets;
			if (this.controls.loading) {
				this.controls.loading.hidden = true;
			}
			this.controls.chart.hidden = false;
			const options = {
				series: {
					lines: { show: true, fill: true, lineWidth: 1, fillColor: this.fillColor || 'rgba(33, 107, 211, 0.6)' }
				},
				xaxis: {
					mode: "time", timezone: null, timeBase: 'milliseconds', tickFormatter: this.applyBoatTime.bind(this), showMinorTicks: false 
				},
				yaxis: {
					show: true, tickFormatter: this.yTickFormatter, autoScale: 'none', labelWidth: 32
				},
				colors: ["#000"]
			};
			if ((this.yRange !== null) && (this.yStep !== null)) {
				const yMinMax = PiLot.Utils.Chart.calculateYMinMax(pData, this.yRange, this.yStep);
				options.yaxis.min = yMinMax.yMin;
				options.series.lines.fillTowards = yMinMax.yMin;
				options.yaxis.max = yMinMax.yMax;
			} else {
				options.yaxis.autoScale = 'loose';
			}
			if ('minDate' in pData) {
				options.xaxis.min = pData.minDate;
			} 
			if ('maxDate' in pData) {
				options.xaxis.max = pData.maxDate;
			}
			this.xTickFormat = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' };
			if (('minDate' in pData) && ('maxDate' in pData) && pData.maxDate - pData.minDate > 172800000) { // show day for ranges > 48h
				this.xTickFormat = { month: '2-digit', day: '2-digit' };
			}
			this.chart = $.plot(this.controls.chart, [pData.data], options)
		},

		/** Shows the loading control and hides the chart. It will be shown as soon as showChart() is called. */
		showLoading: function () {
			if (this.controls.loading) {
				this.controls.chart.hidden = true;
				this.controls.loading.hidden = false;
			}
		},

		/**
		 * this converts the utc time of a tick to boatTime, using the array
		 * of offsets, and formats the tick label using this.xTickFormat 
		 * @param {Number} val: The timestamp in MS UTC
		 **/ 
		applyBoatTime: function (pTimestamp) {
			let offset = 0;
			const utcSeconds = pTimestamp / 1000;
			for (let i = 0; i < this.boatTimeOffsets.length; i++) {
				if ((this.boatTimeOffsets[i].validFrom === null) || (this.boatTimeOffsets[i].validFrom <= utcSeconds)) {
					offset = this.boatTimeOffsets[i].offset;
				} else {
					break;
				}
			}
			const boatTime = RC.Date.DateHelper.unixToLuxon(utcSeconds, this.locale).plus({ minutes: offset });
			return boatTime.toLocaleString(this.xTickFormat);
		},
	};

	/**
	 * Returns the recent data for a certain dataSource
	 * @param {String} pDataSource - the name of the data source
	 * @param {Number} pTimeSpanSeconds - the timespan in seconds from series start to now
	 * @param {Number} pAggregateSeconds - the data will be aggregated in chunks of this size
	 * @return {Object} quite a fancy structure with the data points (timestamp in UTC Millis), some max/min values, and information about the boatTime, see processData
	 * */
	var loadRecentDataAsync = async function (pDataSource, pTimeSpanSeconds, pAggregateSeconds) {
		const data = await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/Data/${pDataSource}/recent?durationSeconds=${pTimeSpanSeconds}&aggregateSeconds=${pAggregateSeconds}`);
		const result = PiLot.Utils.Chart.processData(data);
		return result;
	};

	/**
	 * Returns the historic data for a certain dataSource
	 * @param {String} pDataSource - the name of the data source
	 * @param {Number} pStartTime - the start time in seconds BoatTime
	 * @param {Number} pEndTime - the end time in seconds BoatTime
	 * @param {Number} pAggregateSeconds - the data will be aggregated in chunks of this size
	 * @return {Object} quite a fancy structure with the data points (timestamp in UTC Millis), some max/min values, and information about the boatTime, see processData
	 * */
	var loadHistoricDataAsync = async function (pDataSource, pStartTime, pEndTime, pAggregateSeconds) {
		const data = await PiLot.Service.Common.ServiceHelper.getFromServerAsync(`/Data/${pDataSource}/historic?startTimeUnix=${pStartTime}&endTimeUnix=${pEndTime}&aggregateSeconds=${pAggregateSeconds}`);
		const result = PiLot.Utils.Chart.processData(data);
		return result;
	};

	/**
	 * Goes through a data structure recieved from loadRecentData and calculates min, max, boatTimes etc.
	 * @returns {Object} - {data, minValue, maxValue, minDate, maxDate, lastValue, lastTimestamp, boatTimeOffsets}
	 *		data: array of arrays with timestamp in UTC milliseconds, value 
	 *		minValue, maxValue: the minimal and maximal values not null
	 *		minDate, maxDate: the UTC seconds of the first and last record (which can have null as value)
	 *		lastValue, lastTimestamp: the latest value not null, and its timestamp in UTC seconds
	 *		boatTimeOffsets: an array of {validFrom, offset} showing wich offset (in minutes) was valid from when (timestamp in seconds utc)
	 * */
	var processData = function (pData) {
		let minValue = null;
		let minDate = null;
		let maxValue = null;
		let maxDate = null;
		let lastValueTimestamp = null;
		let lastValue = null;
		const data = new Array();
		const values = pData.values;
		if (Array.isArray(values)) {
			let utcMS;
			let value;
			for (let i = 0; i < values.length; i++) {
				var item = values[i];
				if (item.length == 2) {
					if (RC.Utils.isNumeric(item[0])) {
						utcMS = item[0] * 1000;
						if (i === 0) {
							minDate = utcMS;
						} else if (i === values.length - 1) {
							maxDate = utcMS;
						}
						if (RC.Utils.isNumeric(item[1])) {
							minValue = minValue === null ? item[1] : Math.min(minValue, item[1]);
							maxValue = maxValue === null ? item[1] : Math.max(maxValue, item[1]);
							value = Number(item[1]);
							lastValue = value;
							lastValueTimestamp = item[0];
						} else {
							value = null;
						}
						data.push([utcMS , value]);
					}
				} else PiLot.log(`Invalid data length recieved in processData: ${values}, expected was an array with length 2`, 0);
			};
		} else {
			PiLot.log(`Invalid data recieved in processData: ${pData}, expected was an object with values = array`, 0);
		}
		return {
			data: data,
			minValue: minValue,
			maxValue: maxValue,
			minDate: minDate,
			maxDate: maxDate,
			lastValue: lastValue,
			lastValueTimestamp: lastValueTimestamp,
			boatTimeOffsets: pData.boatTimeOffsets
		};
	};

	/**
	 * This calculates the y-Range for the chart, so that
	 * - the difference yMax - yMin = pRange
	 * - all data is visible or..
	 * - if the data range is too big, the latest value is visible
	 * - min mod pStep = 0
	 *  @param {Object} pData - a data structure with min, max, last (as returned from processData)
	 *  @param {Number} pRange - the target difference between max and min
	 *  @param {Number} pStep - the unit to which min will be rounded
	 *  */
	var calculateYMinMax = function (pData, pRange, pStep) {
		const avg = (pData.minValue + pData.maxValue) / 2;
		let yMin = Math.round((avg - (pRange / 2)) / pStep) * pStep;
		let yMax = yMin + pRange;
		if (pData.lastValue !== null) {
			while (pData.lastValue < yMin) {
				yMin -= pStep;
				yMax = yMin + pRange;
			}
			while (pData.lastValue > yMax) {
				yMax += pStep;
				yMin = yMax - pRange;
			}
		}
		return { yMin: yMin, yMax: yMax };
	};

	return {
		DataChart: DataChart,
		loadRecentDataAsync: loadRecentDataAsync,
		loadHistoricDataAsync: loadHistoricDataAsync,
		processData: processData,
		calculateYMinMax: calculateYMinMax
	};

})();