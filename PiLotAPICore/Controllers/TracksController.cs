using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;
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
		/// <param name="readTrackPoints">If false, the tracks are delivered without track points</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Track> GetTracks(Int64 startTime, Int64 endTime, Boolean isBoatTime, Boolean readTrackPoints) {
			return DataConnectionHelper.TrackDataConnector.ReadTracks(startTime, endTime, isBoatTime, readTrackPoints);
		}

		/// <summary>
		/// Finds tracks within a certain range and one, many or all boats. A list of all Tracks that
		/// overlap with the period from startTime to endTime is returned.
		/// </summary>
		/// <param name="startTime">Starttime in ms utc or boatTime</param>
		/// <param name="endTime">Endtime in ms utc or boatTime</param>
		/// <param name="isBoatTime">If true, start and end are BoatTime, else UTC</param>
		/// <param name="boats">comma-separated list of boats. If empty, no filtering is done</param>
		/// <returns>a list of tracks having GoldSegments and SilverSegments set</returns>
		[Route(Program.APIROOT + "[controller]/search")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<Track> FindTracks(Int64 startTime, Int64 endTime, Boolean isBoatTime, String boats) {
			String[] boatsArray = null;
			if (!String.IsNullOrEmpty(boats)) {
				boatsArray = boats.Split(',');
			} 
			return DataConnectionHelper.TrackDataConnector.FindTracks(startTime, endTime, isBoatTime, boatsArray);
		}

		/// <summary>
		/// Gets the track by its id.
		/// </summary>
		/// <param name="id">The track id</param>
		[Route(Program.APIROOT + "[controller]/{id}")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public Track GetTrack(Int32 id) {
			ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			if (dataConnector.SupportsTrackIDs) {
				return dataConnector.ReadTrack(id);
			} else {
				return null;
			}
		}

		/// <summary>
		/// Gets the track segments for a track defined by its id.
		/// </summary>
		/// <param name="id">The track id</param>
		[Route(Program.APIROOT + "[controller]/{id}/Segments")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<TrackSegment> GetTrackSegments(Int32 id) {
			ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			if (dataConnector.SupportsStatistics) {
				return dataConnector.ReadTrackSegments(id);
			} else {
				return new List<TrackSegment>(0);
			}
		}

		/// <summary>
		/// Gets the track segments for a track defined by its id. The segments will
		/// not be read from the db, but calculated ad hoc. This is primarily used
		/// for testing
		/// </summary>
		/// <param name="pTrackId">The track id</param>
		[Route(Program.APIROOT + "[controller]/{id}/Segments/adhoc")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public List<TrackSegment> GetTrackSegmentsAdHoc(Int32 id) {
			List<TrackSegment> result = null;
			ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			if (dataConnector.SupportsTrackIDs && dataConnector.SupportsStatistics) {
				Track track = dataConnector.ReadTrack(id);
				if(track != null) {
					result = new TrackAnalyzer(track).GetTrackSegments(dataConnector.ReadTrackSegmentTypes());
				}
			} return result ?? new List<TrackSegment>(0);
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
		/// Saves a track. If there is any overlapping track, this will throw an error. The
		/// track ID is always set to null, so it's not possible to update an existing Track.
		/// This is done mainly to prevent accidential overwriting of existing tracks.
		/// </summary>
		/// <param name="Track">The track to save</param>
		/// <returns>The id of the track</returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public ActionResult PutInsert(Track track) {
			try {
				track.ID = null;
				DataConnectionHelper.TrackDataConnector.SaveTrack(track);
				if (track.ID != null) {
					TrackStatisticsHelper.UpdateStatistics(track.ID.Value, false);
				}
				return this.Ok(track.ID.Value);
			} catch (Exception ex) {
				return this.StatusCode(StatusCodes.Status500InternalServerError, ex.Message);
			}
		}

		/// <summary>
		/// Changes the boat for a track
		/// </summary>
		/// <param name="id">The track ID, not null</param>
		/// <param name="name">The name of the boat</param>
		[Route(Program.APIROOT + "[controller]/{id}/boat")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void PutBoatName(Int32 id, String name) {
			DataConnectionHelper.TrackDataConnector.SetBoat(id, name);
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
