using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;
using PiLot.Utils;

namespace PiLot.Model.Nav {
	
	/// <summary>
	/// Represents a track, which consists of a series of trackPoints and additional metadata. 
	/// This offers some functionality to crop or cut a track, which is useful when reading
	/// track data for an entire day (from file), and afterwards limit the data to a certain 
	/// timeframe.
	/// This is mainly a data class, and the producers (db, GUI) are responsible to set the
	/// reduntant attributes (e.g. StartUTC, which could also be deducted from the trackpoints)
	/// correctly. The class does not perform any validation.
	/// </summary>
	public class Track {

		#region constants

		public const Int32 MINGAPSECONDS = 28800; // A new track is created, if the previous ended more than 8 h ago.

		#endregion

		#region instance variables

		private List<TrackPoint> trackPoints = null;
		private Boolean sorted = false;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public Track() {
			this.trackPoints = new List<TrackPoint>();
		}

		/// <summary>
		/// Constructor expecting a list of track points
		/// </summary>
		/// <param name="pTrackPoints">The list of track points, not null</param>
		public Track(List<TrackPoint> pTrackPoints) {
			Assert.IsNotNull(pTrackPoints);
			this.trackPoints = pTrackPoints;
		}

		#endregion

		#region public properties

		[JsonPropertyName("id")]
		public Int32? ID {
			get; set;
		}

		[JsonPropertyName("startUtc")]
		public Int64? StartUTC {
			get; set;
		}

		[JsonPropertyName("endUtc")]
		public Int64? EndUTC {
			get; set; 
		}

		[JsonPropertyName("startBoatTime")]
		public Int64? StartBoatTime {
			get; set;
		}

		[JsonPropertyName("endBoatTime")]
		public Int64? EndBoatTime {
			get; set;
		}

		[JsonPropertyName("distance")]
		public Double? Distance {
			get; set;
		}

		[JsonPropertyName("boat")]
		public String Boat {
			get; set;
		}

		[JsonPropertyName("dateCreated")]
		public Int64? DateCreated {
			get; set;
		}

		[JsonPropertyName("dateChanged")]
		public Int64? DateChanged {
			get; set;
		}

		/// <summary>
		/// Gets the list of all TrackPoints within the track 
		/// </summary>
		[JsonIgnore]
		public List<TrackPoint> TrackPoints {
			get { return this.trackPoints; }
		}

		/// <summary>
		/// Gets the first track point or null, if the track is empty
		/// </summary>
		[JsonIgnore]
		public TrackPoint FirstTrackPoint {
			get {
				TrackPoint result = null;
				if (this.trackPoints.Count > 0) {
					result = this.trackPoints[0];
				}
				return result;
			}
		}

		/// <summary>
		/// Gets the last track point or null, if the track is empty
		/// </summary>
		[JsonIgnore]
		public TrackPoint LastTrackPoint {
			get {
				TrackPoint result = null;
				if (this.trackPoints.Count > 0) {
					result = this.trackPoints.Last();
				}
				return result;
			}
		}

		/// <summary>
		/// Returns whether the Track contains at least one trackPoint.
		/// </summary>
		[JsonIgnore]
		public Boolean HasTrackPoints {
			get {
				return this.trackPoints.Count > 0;
			}
		}

		/// <summary>
		/// Returns the trackPoints as list of arrays with utc, boatTime, lat, lon.
		/// This is the default exchanging data with clients, as it's more compact
		/// than json serialized data.
		/// </summary>
		[JsonPropertyName("trackPointsArray")]
		public List<Double?[]> TrackPointsArray {
			get {
				return this.ToList();
			}
			set {
				this.TrackPointFromList(value);
			}
		}

		#endregion

		#region public methods

		/// <summary>
		/// Sorts the track points by UTC timestamp ascending
		/// </summary>
		public void SortTrackPoints() {
			if (!this.sorted) {
				this.trackPoints.Sort((x, y) => x.UTC.CompareTo(y.UTC));
				this.sorted = true;
			}
		}

		/// <summary>
		/// Adds a range of track points
		/// </summary>
		/// <param name="pTrackPoints">The range to add, not null</param>
		public void AddTrackPoints(List<TrackPoint> pTrackPoints) {
			Assert.IsNotNull(pTrackPoints);
			this.trackPoints.AddRange(pTrackPoints);
			this.sorted = false;
		}

		/// <summary>
		/// Adds a single track point 
		/// </summary>
		/// <param name="pTrackPoints">The record to add, not null</param>
		public void AddTrackPoint(TrackPoint pTrackPoints) {
			Assert.IsNotNull(pTrackPoints);
			this.trackPoints.Add(pTrackPoints);
			this.sorted = false;
		}

		/// <summary>
		/// Adds a track point defined by an array representing UTC ms, BoatTime ms, Lat, Lng
		/// </summary>
		/// <param name="pTrackPoint">ms UTC, ms BoatTime, Lat, Lng</param>
		public void AddTrackPoint(Double?[] pTrackPoint) {
			TrackPoint trackPoint = TrackPoint.FromArray(pTrackPoint);
			Assert.IsNotNull(trackPoint, "Invalid track points Array in Track.AddPosition");
			this.AddTrackPoint(trackPoint);
		}
		
		/// <summary>
		/// Removes all track points which lie outside a certain timeframe
		/// </summary>
		/// <param name="pStartTime">start time in milliseconds UTC or BoatTime</param>
		/// <param name="pEndTime">end time in milliseconds UTC or BoatTime</param>
		/// <param name="pIsBoatTime">if true, pStartTime and pEndTime are considered BoatTime, else UTC</param>
		public void Crop(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime) {
			if (pIsBoatTime) {
				this.trackPoints.RemoveAll(r => ((r.BoatTime < pStartTime) || (r.BoatTime > pEndTime)));
			} else {
				this.trackPoints.RemoveAll(r => ((r.UTC < pStartTime) || (r.UTC > pEndTime)));
			}
		}

		/// <summary>
		/// Removes all track points which lie within a certain timeframe
		/// </summary>
		/// <param name="pStartTime">start time in milliseconds UTC or BoatTime</param>
		/// <param name="pEndTime">end time in milliseconds UTC or BoatTime</param>
		/// <param name="pIsBoatTime">if true, pStartTime and pEndTime are considered BoatTime, else UTC</param>
		public void Cut(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime) {
			if (pIsBoatTime) {
				this.trackPoints.RemoveAll(r => ((r.BoatTime >= pStartTime) && (r.BoatTime <= pEndTime)));
			} else {
				this.trackPoints.RemoveAll(r => ((r.UTC >= pStartTime) && (r.UTC <= pEndTime)));
			}
		}


		/// <summary>
		/// Returns true, if a Track overlaps with a certain time period, defined by pStartTime and pEndTime.
		/// If start / end of the track is null, the track does not overlap with anything.
		/// </summary>
		/// <param name="pStartTime">The start time of the period in ms utc or boattime</param>
		/// <param name="pEndTime">The end time of the persiod in ms utc or boattime</param>
		/// <param name="pIsBoatTime">True to treat pStartTime and pEndTime as boattime, false for UTC</param>
		/// <returns></returns>
		public Boolean Overlaps(Int64 pStartTime, Int64 pEndTime, Boolean pIsBoatTime){
			Boolean result;
			if ((this.StartUTC != null) && (this.EndUTC != null)) {
				Int64 trackStart = pIsBoatTime ? this.StartBoatTime.Value : this.StartUTC.Value;
				Int64 trackEnd = pIsBoatTime ? this.EndBoatTime.Value : this.EndUTC.Value;
				result = Utils.DateAndTime.DateTimeHelper.Overlaps(trackStart, trackEnd, pStartTime, pEndTime);
			} else {
				result = false;
			}
			return result;
		}

		/// <summary>
		/// Returns a list of arrays, each array representing a track point (UTC, BoatTime, Lat, Lng).
		/// This is helpful to send data across the wire, as the array is very light when serialized.
		/// </summary>
		public List<Double?[]> ToList() {
			this.SortTrackPoints();
			return this.trackPoints.Select(r => r.ToArray()).ToList();
		}

		#endregion

		#region private methods

		/// <summary>
		/// Populates the trackpoints based an a list of arrays, as created by TrackPoint.ToArray
		/// </summary>
		/// <param name="pList">List of double arrays representing utc, boatTime, lat, lon</param>
		private void TrackPointFromList(List<Double?[]> pList) {
			this.trackPoints = pList
				.Select(i => TrackPoint.FromArray(i))
				.Where(t => t != null)
				.OrderBy(t => t.UTC)
				.ToList();
		}

		#endregion
	}
}
