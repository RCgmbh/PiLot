using System;

namespace PiLot.Model.Nav {

	/// <summary>
	/// This is a special type of TrackPoint, which additionally has information about
	/// the total distance, which helps for track analysis.
	/// </summary>
	public class EnhancedTrackPoint: TrackPoint {

		public EnhancedTrackPoint(TrackPoint pTrackPoint) : base(pTrackPoint.Latitude, pTrackPoint.Longitude) {
			this.UTC = pTrackPoint.UTC;
			this.BoatTime = pTrackPoint.BoatTime;
			this.Altitude = pTrackPoint.Altitude;
			this.LatitudeError = pTrackPoint.LatitudeError;
			this.LongitudeError = pTrackPoint.LongitudeError;
			this.AltitudeError = pTrackPoint.AltitudeError;
		}

		public Double TotalDistance { get; set; } = 0;

	}
}
