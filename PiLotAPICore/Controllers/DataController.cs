using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Sensors;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers general data access functionality to be reused across different application domain
	/// </summary>
	[ApiController]
	public class DataController : ControllerBase {

		/// <summary>
		/// Generic version for older clients, because in the classic API, we had
		/// overloaded get methods, which does not seem to be supported anymore.
		/// </summary>
		[HttpGet]
		[Route("api/v1/[controller]/{id}")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public Object Get(
			String id,
			[FromQuery] Int32? startTimeUnix = null,
			[FromQuery] Int32? endTimeUnix = null,
			[FromQuery] Int32? durationSeconds = null,
			[FromQuery] Int32? maxSecondsOld = null,
			[FromQuery] Int32? aggregateSeconds = null
		) {
			if(startTimeUnix != null && endTimeUnix != null && aggregateSeconds != null) {
				return this.Get(id, startTimeUnix.Value, endTimeUnix.Value, aggregateSeconds.Value);
			} else if (durationSeconds != null && aggregateSeconds != null) {
				return this.Get(id, durationSeconds.Value, aggregateSeconds.Value);
			} else if (maxSecondsOld != null) {
				return this.Get(id, maxSecondsOld.Value);
			} else {
				Logger.Log("Invalid input combination recieved in DataController.Get", LogLevels.INFO);
				return null;
			}
		}

		/// <summary>
		/// Gets historic data from a certain source, identified by dataSource
		/// </summary>
		/// <param name="dataSource">the name of the data source.</param>
		/// <param name="startTimeUnix">Seconds from epoc UTC</param>
		/// <param name="endTimeUnix">Seconds from epoc UTC</param>
		/// <param name="aggregateSeconds">The data will be aggregated into chunks summarizing n seconds</param>
		[HttpGet]
		[Route("api/v1/[controller]/{id}/historic")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public AggregatedSensorData Get(String id, [FromQuery] Int32 startTimeUnix, [FromQuery] Int32 endTimeUnix, [FromQuery] Int32 aggregateSeconds) {
			return this.GetHistoricData(id, startTimeUnix, endTimeUnix, aggregateSeconds);
		}

		/// <summary>
		/// Gets historic data from now back. Use it with /Data/datasource?durationSeconds&aggregateSeconds
		/// </summary>
		/// <param name="id">the name of the data Source</param>
		/// <param name="durationSeconds">The duration to be covered in seconds</param>
		/// <param name="aggregateSeconds">The data will be aggregated into chunks summarizing n seconds</param>
		/// <returns>The aggregated data</returns>
		[HttpGet]
		[Route("api/v1/[controller]/{id}/recent")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public AggregatedSensorData Get(String id, [FromQuery] Int32 durationSeconds, [FromQuery] Int32 aggregateSeconds) {
			Int32 unixNow = DateTimeHelper.UnixNow;
			return this.GetHistoricData(id, unixNow - durationSeconds, unixNow, aggregateSeconds);
		}

		/// <summary>
		/// Gets the lates reading for a sensor, if the record is not more than maxSeconds
		/// old. If the sensor does not exist. If there is no such sensor, or no current
		/// reading, it returns null
		/// </summary>
		/// <param name="id">The name of the data source</param>
		/// <returns>the max age of the latest record in seconds</returns>
		[HttpGet]
		[Route("api/v1/[controller]/{id}/latest")]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public SensorDataRecord Get(String id, [FromQuery] Int32 maxSecondsOld) {
			return new SensorDataConnector().GetLatestValue(id, maxSecondsOld);
		}

		/// <summary>
		/// This takes an array of current sensor values and saves them.
		/// </summary>
		/// <param name="data">Array of {sensorName, value} objects</param>
		[HttpPut]
		[Route("api/v1/[controller]")]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void PutSensorData(SensorValue[] data) {
			new SensorDataConnector().SaveData(data);
		}

		/// <summary>
		/// Gets aggregated historic data for a sensor and a certain time
		/// </summary>
		/// <param name="dataSource">Name of the data source</param>
		/// <param name="startTimeUnix">Start time in seconds since epoc UTC</param>
		/// <param name="endTimeUnix">End time in seconds since epoc UTC</param>
		/// <param name="aggregateSeconds">the values are aggregated into chunks of n seconds</param>
		private AggregatedSensorData GetHistoricData(String dataSource, Int32 startTimeUnix, Int32 endTimeUnix, Int32 aggregateSeconds) {
			DateTime requestStart = DateTime.UtcNow;
			Logger.Log("Request for Data: {0}", dataSource, LogLevels.DEBUG);
			AggregatedSensorData result = new SensorDataConnector().ReadSensorData(dataSource, startTimeUnix, endTimeUnix, aggregateSeconds, false);
			Logger.Log("Request for Data: {0} took {1}ms", dataSource, (DateTime.UtcNow - requestStart).TotalMilliseconds, LogLevels.DEBUG);
			return result;
		}

	}
}
