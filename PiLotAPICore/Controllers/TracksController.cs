using System;
using System.Collections.Generic;
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
		/// Reads tracks within a certain range. A list of all Tracks that
		/// overlap with the period from startTime to endTime is returned.
		/// </summary>
		/// <param name="startTime">Starttime in ms utc or boatTime</param>
		/// <param name="endTime">Endtime in ms utc or boatTime</param>
		/// <param name="isBoatTime">If true, start and end are BoatTime, else UTC</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Track> GetTracks(Int64 startTime, Int64 endTime, Boolean isBoatTime) {
			List<Track> tracks = new PiLot.Data.Postgres.Nav.TrackDataConnector().ReadTracks(startTime, endTime, isBoatTime, true);
			return tracks;
		}

		/// <summary>
		/// Gets the track segments for a track defined by a certain range
		/// </summary>
		/// <param name="startTime">Starttime in ms utc or boatTime</param>
		/// <param name="endTime">Endtime in ms utc or boatTime</param>
		/// <param name="isBoatTime">If true, start and end are BoatTime, else UTC</param>
		[Route(Program.APIROOT + "[controller]/Segments")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<TrackSegment> GetTrackSegments(Int32 startTime, Int64 endTime, Boolean isBoatTime) {
			Track track = new TrackDataConnector().ReadTrack(startTime, endTime, isBoatTime);
			// todo: read persisted track segments, make sure the track is analyzed before. Then just
			// load the segments based on the track id, loading the TrackSegmentTypes will not be needed.
			List<TrackSegmentType> types = new PiLot.Data.Postgres.Nav.TrackDataConnector().ReadTrackSegmentTypes();
			List<TrackSegment> segments = new TrackAnalyzer(track).GetTrackSegments(types);
			return segments;
		}

		/// <summary>
		/// Gets the track segments for a track defined by its id.
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		[Route(Program.APIROOT + "[controller]/{id}/Segments")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<TrackSegment> GetTrackSegments(Int32 id) {
			// todo: don't read the track first, but directly read the persisted segments
			List<TrackSegment> segments;
			Track track = new PiLot.Data.Postgres.Nav.TrackDataConnector().ReadTrack(id);
			if (track != null) {
				List<TrackSegmentType> types = new PiLot.Data.Postgres.Nav.TrackDataConnector().ReadTrackSegmentTypes();
				segments = new TrackAnalyzer(track).GetTrackSegments(types);
			} else {
				segments = new();
			}
			return segments;
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
