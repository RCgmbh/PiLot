using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Cotroller which delivers the current Position
	/// </summary>
	[ApiController]
	public class PositionController : ControllerBase {

		/// <summary>
		/// Gets the latest GPS records after a certain time. Only data from the cache
		/// is returned, so consider GPSCache.MAXLENGTH
		/// </summary>
		/// <param name="startTime">Only records after this time will be returned. UTC Milliseconds</param>
		/// <returns>Array of GPSRecords, possibly empty, never null</returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public GpsRecord[] Get(Int64 startTime) {
			List<GpsRecord> records = GpsCache.Instance?.GetLatestRecords(startTime);
			Logger.Log($"GPS Record requested for startTime: {startTime}, delivering {records.Count} records", LogLevels.DEBUG);
			return records?.ToArray() ?? new GpsRecord[0];
		}

		/// <summary>
		/// Allows to put a gps position
		/// </summary>
		/// <param name="pRecord">The gpsPosition or null</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void PutGpsRecord(GpsRecord pRecord) {
			Logger.Log($"GPS Record recieved: {pRecord}", LogLevels.DEBUG);
			if (pRecord != null) {
				GpsCache.Instance.AddRecord(pRecord);
			}
		}

		/// <summary>
		/// Allows to put a gps position. This operation can only be called from local clients, 
		/// but then does not need any credentials. This is intended to simplify the connection
		/// from the GPS logger to the api, and make it more robust.
		/// </summary>
		/// <param name="pRecord">The gpsPosition or null</param>
		[Route(Program.APIROOT + "[controller]/local")]
		[HttpPut]
		[ServiceFilter(typeof(LocalAuthorizationFilter))]
		public void PutGpsRecordLocal(GpsRecord pRecord) {
			Logger.Log($"GPS Record recieved: {pRecord}", LogLevels.DEBUG);
			if (pRecord != null) {
				GpsTimeSync.Instance.HandleGPSRecord(pRecord);
				GpsCache.Instance.AddRecord(pRecord);
			}
		}

		/// <summary>
		/// Allows to put a series of GPS Records. It expects, without verifying, that all 
		/// records are newer than any records sent before. The records themselves however
		/// need not be sorted, as we will sort them anyways.
		/// </summary>
		/// <param name="pRecords">An array of GpsRecords, or null</param>
		[Route(Program.APIROOT + "[controller]/multiple")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void PutGpsRecords(GpsRecord[] pRecords) {
			if (pRecords != null) {
				GpsCache cache = GpsCache.Instance;
				List<GpsRecord> records = pRecords.OrderBy(record => record.UTC).ToList();
				records.ForEach(record => cache.AddRecord(record));
			}
		}
	}
}