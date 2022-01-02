var PiLot = PiLot || {};
PiLot.Model = PiLot.Model || {};

PiLot.Model.Meteo = (function () {

	var DataLoader = function () { };

	DataLoader.prototype = {

		loadRecentDataAsync: async function (pDataSource, pAggregateSeconds) {
			return await PiLot.Utils.Chart.loadRecentData(pDataSource, 60 * 60 * 24 * 2, pAggregateSeconds);
		},

		/** returns the temperature for the last 2 days, in an interval of 10 minutes */
		loadRecentTemperature: async function (pAggregateSeconds = 600) {
			return await PiLot.Utils.Chart.loadRecentData('temperature1', 60 * 60 * 24 * 2, pAggregateSeconds);
		},

		/** returns the pressure for the last 2 days, in an interval of 20 minutes */
		loadRecentPressure: async function (pAggregateSeconds = 3600) {
			return await PiLot.Utils.Chart.loadRecentData('pressure1', 60 * 60 * 24 * 2, pAggregateSeconds);
		},

		/** returns an array of objects with displayName, sensorType representing all meteo data sources */
		loadMeteoDataSourcesAsync: async function () {
			const response = await fetch(PiLot.Utils.Common.toApiUrl(`/SensorInfos/meteo`));
			return await response.json();
		},

		/**
		 * this returns an object with {temperature,pressure}, represinting the latest values for 
		 * the sensorst with the tag "logbook" and sensorType "temperature" or "pressure"
		 * */
		loadLogbookMeteoAsync: async function () {
			let result = { temperature: null, pressure: null };
			const sensorsJson = await PiLot.Utils.Common.getFromServerAsync(`/SensorInfos/logbook`);
			const temperatureSource = sensorsJson.find(e => e.sensorType === 'temperature');
			if (temperatureSource) {
				const temperatureData = await PiLot.Utils.Common.getFromServerAsync(`/Data/${temperatureSource.name}?maxSecondsOld=600`);
				result.temperature = temperatureData ? temperatureData.value : null;
			}
			const pressureSource = sensorsJson.find(e => e.sensorType === 'pressure');
			if (pressureSource) {
				const pressureData = await PiLot.Utils.Common.getFromServerAsync(`/Data/${pressureSource.name}?maxSecondsOld=600`);
				result.pressure = pressureData ? pressureData.value : null;
			}
			return result;
		}
	};

	/** Loads the latest sensor data from the server. returns an object with {temperature, pressure} */
	var loadLatestDataAsync = async function () {
		let result = null;
		const dataSources = 'temperature1,pressure1';
		const maxSeconds = 500;
		const data = await PiLot.Utils.Common.getFromServerAsync(`/Data?dataSources=${dataSources}&maxSecondsOld=${maxSeconds}`);
		if (Array.isArray(data) && (data.length === 2)) {
			const temperatureRecord = data[0];
			const pressureRecord = data[1];
			result = {
				temperature: temperatureRecord !== null ? temperatureRecord.value : null,
				pressure: pressureRecord !== null ? pressureRecord.value : null
			};
		} else {
			PiLot.log(`loadLatestDataAsync: Expected an array of 2 elements, but got this: ${result}`, 0);
		}
		return result;
	};

	/** 
	 *  returns the moon phase at a given DateTime. The result is an object with 
	 *  {phase, type} where phase is a continuous value from 0 to 1 where 0
	 *  is new moon and 0.5 is full moon, and type is an integral value :
	 *  0: new moon, 1: waxing crescent, 2: first quarter, 3: waxing gibbous
	 *  4: full moon, 5: waning gibbous, 6: third quarter, 7: waning crescent
	 */
	var getMoonPhase = function (pDateTime) {
		var jsDate;
		if (pDateTime instanceof DateTime) {
			jsDate = pDateTime.toJSDate();
		} else if (pDateTime instanceof Date) {
			jsDate = pDateTime; 
		}
		const phase = SunCalc.getMoonIllumination(jsDate).phase;
		var type = Math.round(phase * 8);
		type = (type == 8) ? 0 : type;	// above 7.5, we again have new moon, which is 0
		return { phase: phase, type: type };
	};	

	return {
		DataLoader: DataLoader,
		loadLatestDataAsync: loadLatestDataAsync,
		getMoonPhase: getMoonPhase
	};

})();