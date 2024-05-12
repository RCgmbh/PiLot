using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Nav {

	/// <summary>
	/// This allows to identify a special segment of a track, e.g. the fastest mile.
	/// It does not contain the trackPoints, as these are part of the entire track.
	/// </summary>
	public class TrackSegment {

		public TrackSegment(Int32? pTrackId, Int32 pTypeId) {
			this.TrackID = pTrackId;
			this.TypeID = pTypeId;
		}

		/// <summary>
		/// The ID of the track. 
		/// </summary>
		[JsonPropertyName("trackId")]
		public Int32? TrackID { get; private set; }

		/// <summary>
		/// The type of the TrackSegment
		/// </summary>
		[JsonPropertyName("typeId")]
		public Int32 TypeID { get; private set;	}

		/// <summary>
		/// The timestamp of the first TrackPoint in UTC
		/// </summary>
		[JsonPropertyName("startUtc")]
		public Int64 StartUTC { get;  set; }

		/// <summary>
		/// The timestamp of the last TrackPoint in UTC
		/// </summary>
		[JsonPropertyName("endUtc")]
		public Int64 EndUTC { get; set; }

		/// <summary>
		/// The timestamp of the fist TrackPoint in BoatTime
		/// </summary>
		[JsonPropertyName("startBoatTime")]
		public Int64 StartBoatTime { get; set; }

		/// <summary>
		/// The timestamp of the last TrackPoint in BoatTime
		/// </summary>
		[JsonPropertyName("endBoatTime")]
		public Int64 EndBoatTime { get; set; }

		/// <summary>
		/// The total distance of the segment in Meters
		/// </summary>
		[JsonPropertyName("distance")]
		public Double Distance {
			get {
				return this.Distance_mm / 1000d;
			}
			set {
				this.Distance_mm = (Int32)Math.Round(value * 1000d);
			}
		}

		/// <summary>
		/// The total distance of the segment in millimeters. This is used in the db,
		/// and for precise comparison of Segments
		/// </summary>
		[JsonIgnore]
		public Int32 Distance_mm {
			get; set;
		}

		/// <summary>
		/// Returns the average speed of the segment in m/s
		/// </summary>
		[JsonIgnore]
		public Double Speed {
			get {
				return this.Distance_mm / (this.EndUTC - this.StartUTC);
			}
		}

	}
}
