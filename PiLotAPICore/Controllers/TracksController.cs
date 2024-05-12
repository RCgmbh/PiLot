using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
using PiLot.Data.Nav;
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
			List<Track> tracks = DataConnectionHelper.TrackDataConnector.ReadTracks(startTime, endTime, isBoatTime, true);
			return tracks;
		}

		/// <summary>
		/// Gets the track segments for a track defined by its id.
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		[Route(Program.APIROOT + "[controller]/{id}/Segments")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<TrackSegment> GetTrackSegments(Int32 id) {
			ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			if (dataConnector.SupportsStatistics) {
				return DataConnectionHelper.TrackDataConnector.ReadTrackSegments(id);
			} else {
				return new List<TrackSegment>(0);
			}
		}

		/// <summary>
		/// Gets summarized data for each day a month. The result is an array of booleans,
		/// indicating for each day whether there is a track.
		/// </summary>
		[Route(Program.APIROOT + "[controller]/{year}/{month}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public Boolean[] Get(Int32 year, Int32 month) {
			return DataConnectionHelper.TrackDataConnector.ReadTracksMonthInfo(year, month).ToArray();
		}

		/// <summary>
		/// Saves a track. The Track must have ID=null. Any existing track for the same
		/// boat that overlaps this track will be deleted
		/// </summary>
		/// <param name="Track">The track to save, ID must be null</param>
		/// <returns>The id of the track</returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public Int32 PutInsert(Track pTrack) {
			DataConnectionHelper.TrackDataConnector.InsertTrack(pTrack);
			return pTrack.ID.Value;
		}

		/// <summary>
		/// Deletes track points within a certain range
		/// </summary>
		/// <param name="id">The id of the track from which data should be deleted</param>
		/// <param name="startTime">Starttime in ms utc or boatTime</param>
		/// <param name="endTime">Endtime in ms utc or boatTime</param>
		/// <param name="isBoatTime">If true, start and end are BoatTime, else UTC</param>
		[Route(Program.APIROOT + "[controller]/{id}/TrackPoints")]
		[HttpDelete]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void DeleteTrackPoints(Int32 id, Int64 startTime, Int64 endTime, Boolean isBoatTime) {
			DataConnectionHelper.TrackDataConnector.DeleteTrackPoints(id, startTime, endTime, isBoatTime);
			TrackStatisticsHelper.UpdateStatistics(id, true);
		}
	}
}
