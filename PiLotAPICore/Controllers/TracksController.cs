using System;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
using PiLot.Data.Files;
using PiLot.Model.Nav;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Offers access to read and modify recorded GPS Data
	/// </summary>
	[ApiController]
	public class TracksController : ControllerBase {

		/// <summary>
		/// Reads positions within a certain range
		/// </summary>
		/// <param name="startTime">Starttime in ms utc or boatTime</param>
		/// <param name="endTime">Endtime in ms utc or boatTime</param>
		/// <param name="isBoatTime">If true, start and end are BoatTime, else UTC</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public Track GetTrack(Int64 startTime, Int64 endTime, Boolean isBoatTime) {
			Track track = new TrackDataConnector().ReadTrack(startTime, endTime, isBoatTime);
			return track;
		}

		/// <summary>
		/// Gets the track segments for a track defined by a certain range
		/// </summary>
		/// <param name="startTime">Starttime in ms utc or boatTime</param>
		/// <param name="endTime">Endtime in ms utc or boatTime</param>
		/// <param name="isBoatTime">If true, start and end are BoatTime, else UTC</param>
		[Route(Program.APIROOT + "[controller]/segments")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public TrackSegment GetFastestMile(Int64 startTime, Int64 endTime, Boolean isBoatTime) {
			Track track = new TrackDataConnector().ReadTrack(startTime, endTime, isBoatTime);
			TrackSegmentType type = new TrackSegmentType(-1, 3600, null, null);
			TrackSegment segment = new TrackAnalyzer(track).GetFastestTrackSegment(type);
			return segment;
		}

		/// <summary>
		/// Sends a track to the server
		/// </summary>
		/// <param name="positions">Array of UTC, BoatTime, Lat, Lng</param>
		/// <param name="doOverwrite">true: any existing position within min/max utc of pTrack will be deleted</param>
		/// <returns>The id of the track</returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Int32 Put(Track pTrack) {
			new TrackDataConnector().SaveTrack(pTrack);
			return -1;
		}

		/// <summary>
		/// Deletes track points within a certain range
		/// </summary>
		/// <param name="startTime">Starttime in ms utc or boatTime</param>
		/// <param name="endTime">Endtime in ms utc or boatTime</param>
		/// <param name="isBoatTime">If true, start and end are BoatTime, else UTC</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void DeleteTrackPoints(Int64 startTime, Int64 endTime, Boolean isBoatTime) {
			new TrackDataConnector().DeleteTrackPoints(startTime, endTime, isBoatTime);
		}
	}
}
