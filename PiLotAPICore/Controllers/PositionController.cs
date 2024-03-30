using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;

using PiLot.API.ActionFilters;
using PiLot.API.Helpers;
using PiLot.API.Workers;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.API.Controllers {

	/// <summary>
	/// Cotroller for the current Position. While also the current position is always somewhat historical (it has
	/// a timestamp that came from the GPS reciever, and it's delivered as TrackPoint), this differs from the Track 
	/// controller in a way that it's using the GPS Cache instead of loading persisted track data.
	/// </summary>
	[ApiController]
	public class PositionController : ControllerBase {

		/// <summary>
		/// Gets the latest TrackPoint after a certain time. Only data from the cache
		/// is returned, so consider GPSCache.MAXLENGTH
		/// </summary>
		/// <param name="startTime">Only track points after this time will be returned. UTC Milliseconds</param>
		/// <returns>Array of TrackPoints, possibly empty, never null</returns>
		[Route(Program.APIROOT + "[controller]")]
		[HttpGet]
		[ServiceFilter(typeof(ReadAuthorizationFilter))]
		public TrackPoint[] GetPositions(Int64 startTime) {
			List<TrackPoint> trackPoints = GPSCache.Instance?.GetLatestTrackPoints(startTime);
			Logger.Log($"PositionController.GetPositions requested for startTime: {startTime}, delivering {trackPoints.Count} records", LogLevels.DEBUG);
			return trackPoints?.ToArray() ?? Array.Empty<TrackPoint>();
		}

		/// <summary>
		/// Allows to put a the latest position
		/// </summary>
		/// <param name="pTrackPoint">The current posistion or null</param>
		[Route(Program.APIROOT + "[controller]")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void PutPosition(TrackPoint pTrackPoint) {
			Logger.Log($"PositionController.PutPosition: TrackPoint recieved: {pTrackPoint}", LogLevels.DEBUG);
			if (pTrackPoint != null) {
				Int32? trackId = GPSCache.Instance.AddTrackPoint(pTrackPoint);
				if(trackId != null) {
					//TrackStatisticsWorker.Instance.EnsureStatistics(trackId.Value);
					TrackStatisticsHelper.UpdateStatistics(trackId.Value);
				}				
			}
		}

		/// <summary>
		/// Allows to put a the latest position. This operation can only be called from local clients, but 
		/// then does not need any credentials. This is intended to simplify the connection from the GPS 
		/// logger to the api, and make it more robust.
		/// </summary>
		/// <param name="pTrackPoint">The gpsPosition or null</param>
		[Route(Program.APIROOT + "[controller]/local")]
		[HttpPut]
		[ServiceFilter(typeof(LocalAuthorizationFilter))]
		public void PutPositionsLocal(TrackPoint pTrackPoint) {
			Logger.Log($"PositionController.PutPositionLocal: TrackPoint recieved: {pTrackPoint}", LogLevels.DEBUG);
			if (pTrackPoint != null) {
				GpsTimeSync.Instance.HandleGPSRecord(pTrackPoint);
				Int32? trackId = GPSCache.Instance.AddTrackPoint(pTrackPoint);
				if (trackId != null) {
					//TrackStatisticsWorker.Instance.EnsureStatistics(trackId.Value);
					TrackStatisticsHelper.UpdateStatistics(trackId.Value);
				}
			}
		}

		/// <summary>
		/// Allows to put a series of TrackPoints, representing the latest positions. It expects, without 
		/// verifying, that all records are newer than any records sent before. The records themselves 
		/// however need not be sorted, as we will sort them anyways.
		/// </summary>
		/// <param name="pTrackPoints">An array of TrackPoints, or null</param>
		[Route(Program.APIROOT + "[controller]/multiple")]
		[HttpPut]
		[ServiceFilter(typeof(WriteAuthorizationFilter))]
		public void PutPositions(TrackPoint[] pTrackPoints) {
			if (pTrackPoints != null) {
				GPSCache cache = GPSCache.Instance;
				List<TrackPoint> orderedTrackPoints = pTrackPoints.OrderBy(record => record.UTC).ToList();
				Int32? lastTrackId = null;
				Int32? trackId = null;
				foreach (TrackPoint aTrackPoint in orderedTrackPoints) {
					trackId = cache.AddTrackPoint(aTrackPoint);
					if (trackId != null && (lastTrackId == null || lastTrackId != trackId)){
						if(lastTrackId != null) {
							//TrackStatisticsWorker.Instance.EnsureStatistics(trackId.Value);
							TrackStatisticsHelper.UpdateStatistics(trackId.Value);
						}
						lastTrackId = trackId;
					}
				}
			}
		}
	}
}