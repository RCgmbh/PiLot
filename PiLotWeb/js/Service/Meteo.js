var PiLot = PiLot || {};
PiLot.Service = PiLot.Service || {};

PiLot.Service.Meteo = (function () {

	var DataLoader = function () { };

	DataLoader.prototype = {

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

	return {
		DataLoader: DataLoader,
	};

})();