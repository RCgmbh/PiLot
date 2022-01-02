using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.Data.Files;
using PiLot.Model.Nav;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers access to read and modify recorded GPS Data
	/// </summary>
	[ApiController]
	public class TrackController : ControllerBase {

		[Route("api/v1/Track")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Double?[]> Get(Int64 startTime, Int64 endTime, Boolean isBoatTime) {
			Track track = new GPSDataConnector().ReadTrack(startTime, endTime, isBoatTime);
			return track.ToList();
		}

		/// <summary>
		/// Deletes positions within a certain range
		/// </summary>
		/// <param name="startTime">Starttime in ms utc or boatTime</param>
		/// <param name="endTime">Endtime in ms utc or boatTime</param>
		/// <param name="isBoatTime">If true, start and end are BoatTime, else UTC</param>
		[Route("api/v1/Track")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void Delete(Int64 startTime, Int64 endTime, Boolean isBoatTime) {
			new GPSDataConnector().DeletePositions(startTime, endTime, isBoatTime);
		}

		/// <summary>
		/// Sends a track to the server, optionally allowing to delete any existing
		/// position data for the timespan covered by the track (which usually does
		/// make sense)
		/// </summary>
		/// <param name="positions">Array of UTC, BoatTime, Lat, Lng</param>
		/// <param name="doOverwrite">true: any existing position within min/max utc of pTrack will be deleted</param>
		[Route("api/v1/Track")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void Put(List<Double?[]> positions, Boolean doOverwrite) {
			new GPSDataConnector().SavePositions(positions, doOverwrite);
		}
	}
}
