using System;
using System.Text.Json.Serialization;

using PiLot.Utils;

namespace PiLot.Model.Nav {

	/// <summary>
	/// This allows to identify a special segment of a track, e.g. the fastest mile.
	/// It does not contain the trackPoints, as these are part of the entire track.
	/// </summary>
	public class TrackSegment {

		private Track track;

		public TrackSegment(Track pTrack, Int32 pTypeId) {
			this.Track = pTrack;
			this.TypeID = pTypeId;
		}

		/// <summary>
		/// The track this belongs to. Not null.
		/// </summary>
		[JsonIgnore]
		public Track Track {
			get { return this.track; }
			set {
				Assert.IsNotNull(value, "TrackSegment.Track must not be null");
				this.track = value;
			}
		}

		/// <summary>
		/// The ID of the track. 
		/// </summary>
		[JsonPropertyName("trackId")]
		public Int32 TrackID {
			get { return -1; }
		}

		/// <summary>
		/// The type of the TrackSegment
		/// </summary>
		[JsonPropertyName("typeId")]
		public Int32 TypeID {
			get;
		}

		/// <summary>
		/// The timestamp of the first TrackPoint in UTC
		/// </summary>
		[JsonPropertyName("startUtc")]
		public Int64 StartUTC { get; set; }

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
		public Double Distance { get; set; }

	}
}
