var FlotHelper = {

	// STATIC FIELDS
	dataSeriesInfos: new Array(),
	refreshIntervalMs: 10000,
	refreshInterval : null,
	isDataFetchStarted: false,
	graphColors: new Array('#1155ff', '#9977ff', '#cc00ff', '#ff0077', '#ff6600', '#ffbb00', '#ffff00', '#aaff00', '#00ff00', '#00ff88', '#00ffff', '#0099ff', '#9999ff', '#ffaaff', '#ff9977', '#aaffaa', '#99ddff'),

	/// CLASSES

	/// A GraphContainer holds information about the controls which will show
	/// the graph (or error or loading info), as well as the options used to show
	/// the graph. It is initialized using the HTML-ID of an outer element, and
	/// will load the respective containers by their CSS class attributes
	GraphContainer: function (pContainerElement, pFlotOptions) {
		this.graphData = new Array();
		this.containerElement = pContainerElement;
		this.dataDiv = pContainerElement.find('.chartContainer');
		this.errorDiv = pContainerElement.find('.chartError');;
		this.waitDiv = pContainerElement.find('.chartWait');;
		this.flotOptions = pFlotOptions;
	},

	/// A DataSeriesInfo contains all information about a certain graph and its data, data source etc.
	/// One GraphContainer can have multiple dataSeries to display.
	DataSeriesInfo: function (pGraphContainer, pWSUrl, pWSParams, pOnLoadFunction) {
		this.graphContainer = pGraphContainer;
		this.wsUrl = pWSUrl;
		this.wsParams = pWSParams;
		this.dataSeries = null;
		this.dataSeriesLoaded = false;
		this.onLoadFunction = pOnLoadFunction;
	},

	/// STATIC METHODS

	/// pushes a data series object onto the array and returns the 
	/// series' index in the array.
	AddDataSeries: function (pDataSeries) {
		FlotHelper.dataSeriesInfos.push(pDataSeries);
		return FlotHelper.dataSeriesInfos.length - 1;
	},

	/// starts an interval to call FetchAllData, if refreshIntervalMS is greater than 0
	StartFetchAllData: function () {
		if (!FlotHelper.isDataFetchStarted) {
			FlotHelper.isDataFetchStarted = true;
			FlotHelper.FetchAllData();
			window.clearInterval(FlotHelper.refreshInterval);
			if (FlotHelper.refreshIntervalMs > 0) {
				FlotHelper.refreshInterval = window.setInterval(function () { FlotHelper.FetchAllData(); }, FlotHelper.refreshIntervalMs);
			}
		}
	},

	/// calls fetchData for each dataSeries
	FetchAllData: function () {
		for (var i = 0; i < FlotHelper.dataSeriesInfos.length; i++) {
			FlotHelper.FetchData(i);
		}
	},

	/// triggers an ajax call for the DataSeries at pDataSeriesIndex
	FetchData: function (pDataSeriesIndex) {
		$.ajax({
			url: FlotHelper.dataSeriesInfos[pDataSeriesIndex].wsUrl,
			type: 'POST',
			data: FlotHelper.dataSeriesInfos[pDataSeriesIndex].wsParams,
			contentType: "application/json; charset=utf-8",
			dataType: "json",
			success: FlotHelper.GetLoadSuccess(pDataSeriesIndex),
			error: FlotHelper.GetLoadError(pDataSeriesIndex)
		});
	},

	/// this returns the loadSuccess function. We can't just use success: function(response) { chartsHelper_loadSuccess(response, i); }
	/// because it has the wrong scope.
	/// TODO: use bind(), stupid! And anyways, make this a proper object
	GetLoadSuccess: function (chartIndex) {
		return function (response) {
			FlotHelper.LoadSuccess(response, chartIndex);
		}
	},

	/// this returns the loadError function. We can't just use error: function() { chartsHelper_loadError(i); }
	/// because it has the wrong scope.
	/// TODO: use bind(), stupid! And anyways, make this a proper object
	GetLoadError: function(chartIndex) {
		return function () {
			FlotHelper.LoadError(chartIndex);
		}
	},

	/// handles successful load, pushes the recieved data into the seriesInfo.dataSeries
	LoadSuccess: function (pData, pSeriesIndex) {
		PiLot.log('FlotHelper: LoadSuccess', 3);
		if (pSeriesIndex != -1) {
			var seriesInfo = FlotHelper.dataSeriesInfos[pSeriesIndex];
			if (!seriesInfo.dataSeriesLoaded) {
				seriesInfo.dataSeries = ({ data: pData.d.DataPoints });
				seriesInfo.graphContainer.graphData.push(seriesInfo.dataSeries);
				seriesInfo.dataSeriesLoaded = true;
			} else {
				seriesInfo.dataSeries.data = pData.d.DataPoints;
			}
			if (seriesInfo.onLoadFunction != null) {
				seriesInfo.onLoadFunction(pData, seriesInfo);
			}
			FlotHelper.ShowGraph(seriesInfo.graphContainer);
		}
	},

	/// shows the dataDiv, hides the waitDiv and ErrorDiv
	ShowGraph: function (pGraphContainer) {
		if (pGraphContainer.waitDiv.is(':visible')) pGraphContainer.waitDiv.hide();
		if (pGraphContainer.errorDiv.is(':visible')) pGraphContainer.errorDiv.hide();
		if (!pGraphContainer.dataDiv.is(':visible')) pGraphContainer.dataDiv.fadeIn('fast');
		$.plot(pGraphContainer.dataDiv, pGraphContainer.graphData, pGraphContainer.flotOptions);
	},

	/// handles error in loading the data by showing the error div
	LoadError: function(pSeriesIndex) {
		if (pSeriesIndex != -1) {
			var seriesInfo = FlotHelper.dataSeriesInfos[pSeriesIndex];
			seriesInfo.graphContainer.dataDiv.hide();
			seriesInfo.graphContainer.waitDiv.hide();
			seriesInfo.graphContainer.errorDiv.show();
		}
	},

	/// gets the color for pIndex.
	GetColor: function (pIndex) {
		return FlotHelper.graphColors[(pIndex % graphColors.length)];
	}
}

/// waits for a short while so that everyone has the opportunity to add
/// his DataSeries, then starts the fetcher
/// TODO: Call this explicitly, and not on ready, and not with jQuery
$(document).ready(function () {
	window.setTimeout(function () { FlotHelper.StartFetchAllData(); }, 50);
});