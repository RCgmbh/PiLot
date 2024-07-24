using System;
using System.Collections.Generic;
using System.Linq;

using PiLot.Data.Files;
using PiLot.Data.Nav;
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

		private static Object lockObject = new Object();

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
		private ITrackDataConnector trackPointDataConnector = null;

		#endregion

		#region constructors

		// hidden constructor, use the Instance getter instead
		private GPSCache() {
			this.trackPoints = new List<TrackPoint>();
			this.globalDataConnector = new GlobalDataConnector();
			this.trackPointDataConnector = DataConnectionHelper.TrackDataConnector;
			Logger.Log("GPSCache: New instance created", LogLevels.DEBUG);
		}

		/// <summary>
		/// Gets the current instance from the Application, or creates one.
		/// </summary>
		public static GPSCache Instance {
			get {
				GPSCache result = null;
				lock (lockObject) {
					Object applicationItem = Program.GetApplicationObject(APPKEY);
					if (applicationItem != null) {
						result = applicationItem as GPSCache;
					} else {
						result = new GPSCache();
						Program.SetApplicationObject(APPKEY, result);
					}
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
			Logger.Log($"GPSCache.GetLatestTrackPoints: Having {this.trackPoints.Count} items in cache, returning {result.Count} items.", LogLevels.DEBUG);
			return result;
		}

		/// <summary>
		/// Adds a track point to the list, and persits it if necessary. Only records
		/// that have latitude and longitude are processed
		/// </summary>
		/// <returns>The ID of the track to which the point was persisted, null if it was not persisted</returns>
		public Int32? AddTrackPoint(TrackPoint pTrackPoint) {
			return this.AddTrackPoints(new List<TrackPoint>(1){ pTrackPoint });
		}

		/// <summary>
		/// Allows to add a list of TrackPoints to the cache, and persists those that need to
		/// be persisted. Returns the ID of the track the trackpoints are added to, which is
		/// defined by the first trackpoint. Also sets the BoatTime for each point based on
		/// the UTC value and the current BoatTime Offset.
		/// </summary>
		/// <param name="pTrackPoints"></param>
		/// <returns></returns>
		public Int32? AddTrackPoints(List<TrackPoint> pTrackPoints) {
			Int32? result = null;
			if (pTrackPoints.Count > 0) {
				Boolean doPersist;
				Boolean doSortAll;
				Int64 deltaT;
				Double deltaX;
				List<TrackPoint> pointsToPersist = new List<TrackPoint>();
				Int64 utcOffset = this.globalDataConnector.GetBoatTime().UtcOffsetMinutes * 60 * 1000;
				lock (lockObject) {
					pTrackPoints.Sort();
					doSortAll = this.trackPoints.Count > 0 && this.trackPoints[0].UTC > pTrackPoints[0].UTC;
					foreach (TrackPoint aTrackPoint in pTrackPoints) {
						if ((aTrackPoint?.Latitude != null) && (aTrackPoint?.Longitude != null)) {
							aTrackPoint.BoatTime = aTrackPoint.UTC + utcOffset;
							this.trackPoints.Insert(0, aTrackPoint);
							this.PositionChanged?.Invoke(aTrackPoint);
							Logger.Log($"TrackPointsCache.AddTrackPoint {aTrackPoint} : Having {this.trackPoints.Count} items in cache.", LogLevels.DEBUG);
							if (this.previousSavedTrackPoint != null) {
								deltaT = aTrackPoint.UTC - this.previousSavedTrackPoint.UTC;
								deltaX = aTrackPoint.DistanceTo(previousSavedTrackPoint);
								doPersist = (deltaT >= MINDELTAT) && (deltaX > MINDISTANCE);
							} else {
								doPersist = true;
							}
							if (doPersist) {
								pointsToPersist.Add(aTrackPoint);
								this.previousSavedTrackPoint = aTrackPoint;
							}
						}
					}
					result = this.trackPointDataConnector.SaveTrackPoints(pointsToPersist, BoatCache.Instance.CurrentBoat);
					this.trackPoints.RemoveAll(tp => tp?.UTC == null); // quick fix for some weird null pointer exceptions when sorting
					if(doSortAll) {
						this.trackPoints.Sort((x, y) => y.CompareTo(x));	// sort reverse
					}
					this.CropTrackPoints();
				}
			}
			return result;
		}

		#endregion

		#region private methods

		/// <summary>
		/// This makes sure we have no more than MAXLENGTH track points in the list
		/// </summary>
		private void CropTrackPoints() {
			if (this.trackPoints.Count > MAXLENGTH) {
				this.trackPoints.RemoveRange(MAXLENGTH, this.trackPoints.Count - MAXLENGTH);
				Logger.Log($"TrackPointsCache.CropTrackPoints: Having {this.trackPoints.Count} items in cache.", LogLevels.DEBUG);
			}
		}

		#endregion
	}

	/// <summary>
	/// Delegate for an event informing about changed position data.
	/// </summary>
	public delegate void PositionChangedEventHandler(TrackPoint pLatestPosition);
}