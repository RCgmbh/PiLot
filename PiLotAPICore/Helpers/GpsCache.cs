using System;
using System.Collections.Generic;
using System.Linq;

using PiLot.Data.Files;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.API.Helpers {

	/// <summary>
	/// A helper which caches the latest GPS Positions in order to reduce IO 
	/// Operations. But even more, it also makes sure GPS Data is persisted
	/// in a reasonable way, which means we only persist points that have a
	/// certain geographical and temporal distance
	/// </summary>
	public class GPSCache {

		#region constants

		private const String APPKEY = "gpsCache";

		private const Int32 MAXLENGTH = 150;    // max number of items to store
		private const Int64 MINDELTAT = 9500;   // minimal time between two persisted positions in ms > 9.5s
		private const Int32 MINDISTANCE = 2;    // minimal distance between two persisted positions in meters

		#endregion

		#region events

		/// <summary>
		/// This is fired as soon as a new TrackPoint is recieved (usually from the GPS).
		/// </summary>
		public event PositionChangedEventHandler PositionChanged;
		
		#endregion

		#region instance variables

		private List<TrackPoint> trackPoints = null;
		private TrackPoint previousSavedTrackPoint = null;   // the last track point we saved to disk
		private GlobalDataConnector globalDataConnector = null;
		private TrackDataConnector trackPointDataConnector = null;

		#endregion

		#region constructors

		// hidden constructor, use the Instance getter instead
		private GPSCache() {
			this.trackPoints = new List<TrackPoint>();
			this.globalDataConnector = new GlobalDataConnector();
			this.trackPointDataConnector = new TrackDataConnector();
			Logger.Log("TrackPointsCache: New instance created", LogLevels.DEBUG);
		}

		/// <summary>
		/// Gets the current instance from the Application, or creates one.
		/// </summary>
		public static GPSCache Instance {
			get {
				GPSCache result = null;
				Object applicationItem = Program.GetApplicationObject(APPKEY);
				if (applicationItem != null) {
					result = applicationItem as GPSCache;
				} else {
					result = new GPSCache();
					Program.SetApplicationObject(APPKEY, result);
				}
				return result;
			}
		}

		#endregion

		#region public methods

		/// <summary>
		/// Returns the latest track point or null, if we have no data yet
		/// </summary>
		public TrackPoint GetLatestTrackPoint() {
			return this.trackPoints.FirstOrDefault();
		}

		/// <summary>
		/// Return a list of all cached track points with the UTC
		/// timestamp greater than a given number
		/// </summary>
		/// <param name="pMinDateUTCMS">Only records with a larger UTC timestamp than this will be returned. MS UTC</param>
		public List<TrackPoint> GetLatestTrackPoints(Int64 pMinDateUTCMS) {
			List<TrackPoint> result = this.trackPoints.FindAll(r => ((r != null) && (r.UTC > pMinDateUTCMS)));
			result.Sort();
			Logger.Log($"TrackPointsCache.GetLatestTrackPoints: Having {this.trackPoints.Count} items in cache, returning {result.Count} items.", LogLevels.DEBUG);
			return result;
		}

		/// <summary>
		/// Adds a track point to the list, and persits it if necessary. Only records
		/// that have latitude and longitude are processed
		/// </summary>
		public void AddTrackPoint(TrackPoint pTrackPoint) {
			if ((pTrackPoint?.Latitude != null) && (pTrackPoint?.Longitude != null)) {
				Int64 utcOffset = this.globalDataConnector.GetBoatTime().UtcOffsetMinutes * 60 * 1000;
				pTrackPoint.BoatTime = pTrackPoint.UTC + utcOffset;
				this.trackPoints.Insert(0, pTrackPoint);
				try {
					this.trackPoints.Sort((x, y) => y.UTC.CompareTo(x.UTC));
				} catch (Exception ex){
					Logger.Log($"TrackPointsCache.AddTrackPoint: Exception {ex.Message} when adding record {pTrackPoint}.", LogLevels.ERROR);
				}
				this.PositionChanged?.Invoke(pTrackPoint);
				Logger.Log($"TrackPointsCache.AddTrackPoint: Having {this.trackPoints.Count} items in cache.", LogLevels.DEBUG);
				this.CropTrackPoints();
				this.PersistLatest();
			}
		}

		#endregion

		#region private methods

		/// <summary>
		/// This makes sure we have no more than MAXLENGTH track points in the list
		/// </summary>
		private void CropTrackPoints() {
			if (this.trackPoints.Count > MAXLENGTH) {
				this.trackPoints.RemoveRange(MAXLENGTH - 1, this.trackPoints.Count - MAXLENGTH);
				Logger.Log($"TrackPointsCache.CropTrackPoints: Having {this.trackPoints.Count} items in cache.", LogLevels.DEBUG);
			}
		}

		/// <summary>
		/// Persists the latest track point, if the distance and delta t to the previous
		/// track point are above the minimal values. If not, nothing happens.
		/// </summary>
		private void PersistLatest() {
			Boolean doPersist;
			Int64 deltaT;
			Double deltaX;
			if (this.trackPoints.Count > 0) {
				TrackPoint lastTrackPoint = this.trackPoints[0];
				if (this.previousSavedTrackPoint != null) {
					deltaT = lastTrackPoint.UTC - this.previousSavedTrackPoint.UTC;
					LatLon latestPosition = new LatLon(lastTrackPoint.Latitude.Value, lastTrackPoint.Longitude.Value);
					LatLon previousPosition = new LatLon(this.previousSavedTrackPoint.Latitude.Value, this.previousSavedTrackPoint.Longitude.Value);
					deltaX = latestPosition.DistanceTo(previousPosition);
					doPersist = (deltaT >= MINDELTAT) && (deltaX > MINDISTANCE);
				} else {
					doPersist = true;
				}
				if (doPersist) {
					this.trackPointDataConnector.SaveTrackPoint(lastTrackPoint);
					this.previousSavedTrackPoint = lastTrackPoint;
				}
			}
		}

		#endregion
	}

	/// <summary>
	/// Delegate for an event informing about changed position data.
	/// </summary>
	public delegate void PositionChangedEventHandler(TrackPoint pLatestPosition);
}