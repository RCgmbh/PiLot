var PiLot = PiLot || {};
PiLot.Utils = PiLot.Utils || {};

PiLot.Utils.Chart = (function () {

	/// A Chart showing timestamped data as line graph
	/// params:
	///		pControls: an object containing three divs: { error, loading, chart };
	///		pYRange: optional, The difference between yMax and yMin
	///		pYStep:	optional, The step to which yMax and yMin will be rounded
	///		pYTickFormatter: An optional custom formatter to set the timestamp text to display
	///		pXTickFormat: An optional luxon format to use for the x-Axis (time) ticks.
	var DataChart = function (pControls, pYRange = null, pYStep = null, pYTickFormatter = null, pXTickFormat = null, pFillColor = null) {
		this.controls = pControls;
		this.yRange = pYRange;
		this.yStep = pYStep;
		this.yTickFormatter = pYTickFormatter;
		this.xTickFormat = pXTickFormat;
		this.fillColor = pFillColor;
		this.boatTimeOffsets = null;
		this.initialize();
	}

	DataChart.prototype = {

		initialize: function () { },

		/**
		 * Shows the chart with the data passed as pData
		 * @param {Object} pData - an object with data: array, boatTimes: array and optionally minDate, maxDate
		 */
		showChart: function (pData) {
			this.boatTimeOffsets = pData.boatTimeOffsets;
			if (this.controls.error) {
				this.controls.error.classList.toggle('hidden', true);
			}
			if (this.controls.loading) {
				this.controls.loading.classList.toggle('hidden', true);
			}
			this.controls.chart.classList.toggle('hidden', false);
			const options = {
				series: {
					lines: { show: true, fill: true, lineWidth: 1, fillColor: this.fillColor || 'rgba(33, 107, 211, 0.6)' }
				},
				xaxis: {
					mode: "time", timezone: null, timeBase: 'milliseconds', tickFormatter: this.applyBoatTime.bind(this), showMinorTicks: false 
				},
				yaxis: {
					show: true, tickFormatter: this.yTickFormatter, autoScale: 'none'
				},
				colors: ["#000"]
			};
			if ((this.yRange !== null) && (this.yStep !== null)) {
				var yMinMax = PiLot.Utils.Chart.calculateYMinMax(pData, this.yRange, this.yStep);
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
			this.chart = $.plot(this.controls.chart, [pData.data], options)
		},

		/**
		 * this converts the utc time of a tick to boatTime, using
		 * the array of offsets, and formats the tick label either
		 * using a given this.xTickFormat or with full hours by default
		 * @param {Number} val: The timestamp in MS UTC
		 **/ 
		applyBoatTime: function (val, axis) {
			var offset = 0;
			var utcSeconds = val / 1000;
			for (var i = 0; i < this.boatTimeOffsets.length; i++) {
				if ((this.boatTimeOffsets[i].validFrom === null) || (this.boatTimeOffsets[i].validFrom <= utcSeconds)) {
					offset = this.boatTimeOffsets[i].offset;
				} else {
					break;
				}
			}
			var boatTime = RC.Date.DateHelper.unixToLuxon(utcSeconds).plus({ minutes: offset });
			return boatTime.toFormat(this.xTickFormat || "HH:mm");
		},
	};

	/// returns the recent data for a certain dataSource
	/// @param pDataSource: the name of the data source
	/// @param pTimeSpanSeconds: the timespan in seconds from series start to now
	/// @param pAggregateSeconds: the data will be aggregated in chunks of this size
	/// @returns quite a fancy structure with the data points (timestamp in UTC Millis), some max/min values, and information
	/// about the boatTime, see processData
	var loadRecentData = async function (pDataSource, pTimeSpanSeconds, pAggregateSeconds) {
		const response = await fetch(PiLot.Utils.Common.toApiUrl(`/Data/${pDataSource}?durationSeconds=${pTimeSpanSeconds}&aggregateSeconds=${pAggregateSeconds}`));
		const json = await response.json();
		var result = PiLot.Utils.Chart.processData(json);
		return result;
	};

	/// goes through a data structure recieved from loadRecentData and does some stuff
	/// @returns:
	///		data: array of arrays with timestamp in UTC milliseconds, value 
	///		minValue, maxValue: the minimal and maximal values not null
	///		minDate, maxDate: the UTC seconds of the first and last record (which can have null as value)
	///		lastValue, lastTimestamp: the latest value not null, and its timestamp in UTC seconds
	///		boatTimeOffsets: an array of {validFrom, offset} showing wich offset (in minutes) was valid
	///		from when (timestamp in seconds utc)
	var processData = function (pData) {
		var minValue = null;
		var minDate = null;
		var maxValue = null;
		var maxDate = null;
		var lastValueTimestamp = null;
		var lastValue = null;
		const data = new Array();
		const values = pData.values;
		if (Array.isArray(values)) {
			var utcMS;
			var value;
			for (var i = 0; i < values.length; i++) {
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

	/// this calculates the y-Range for the chart, so that
	/// - the difference yMax - yMin = pRange
	/// - all data is visible or..
	/// - if the data range is too big, the latest value is visible
	/// - min mod pStep = 0
	/// @param pData: a data structure with min, max, last (as returned from processData)
	/// @param pRange: the target difference between max and min
	/// @param pStep: the unit to which min will be rounded
	var calculateYMinMax = function (pData, pRange, pStep) {
		var avg = (pData.minValue + pData.maxValue) / 2;
		yMin = Math.round((avg - (pRange / 2)) / pStep) * pStep;
		yMax = yMin + pRange;
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
		loadRecentData: loadRecentData,
		processData: processData,
		calculateYMinMax: calculateYMinMax
	};

})();