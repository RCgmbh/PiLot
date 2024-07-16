using System;
using System.Collections.Generic;

namespace PiLot.Model.Nav {

	/// <summary>
	/// This class helps analyzing a track, especially finding the fastest periods.
	/// </summary>
	public class TrackAnalyzer {

		private Track track;
		private List<EnhancedTrackPoint> trackPoints;

		public TrackAnalyzer(Track pTrack) {
			this.track = pTrack;
			this.PreprocessTrack();
		}

		/// <summary>
		/// Returns the segments for a list of types. The result can contain zero, one
		/// or more Segments per type.
		/// </summary>
		/// <param name="pTypes">The list of types, not null</param>
		/// <returns>A list of segments, can be empty, but never null</returns>
		public List<TrackSegment> GetTrackSegments(List<TrackSegmentType> pTypes) {
			List<TrackSegment> result = new List<TrackSegment>();
			foreach(TrackSegmentType aType in pTypes) {
				TrackSegment segment = this.GetFastestTrackSegment(aType);
				if(segment != null) {
					result.Add(segment);
				}
			}			
			return result;
		}

		/// <summary>
		/// Returns the fastest segment either for a minimal distance or a minimal duration.
		/// The resulting segment can be slightly longer than required, because  of course 
		/// the TrackPoints can have any distance between them. If the track is shorter than
		/// the required distance or time, the result is null.
		/// </summary>
		/// <param name="pType">The type of track segment to find</param>
		/// <returns>The fastest segment for the type, or null</returns>
		private TrackSegment GetFastestTrackSegment(TrackSegmentType pType) {
			if (pType.Distance != null) {
				return this.GetFastestSegmentByDistance(pType);
			} else {
				return this.GetFastestSegmentByDuration(pType);
			}
		}

		/// <summary>
		/// This gets the fastest segment having a certain duration. E.g. the fastest hour.
		/// </summary>
		/// <param name="pType">The type defining the minimal duration</param>
		/// <returns>The fastest segment or null</returns>
		private TrackSegment GetFastestSegmentByDuration(TrackSegmentType pType) {
			TrackSegment result = null;
			Int32 startIndex = 0;
			Int32 endIndex = 1;
			Double duration;        // seconds
			Double distance;		// meters
			Double speed;           // m/s
			Double topSpeed = 0;    // m/s
			while (endIndex < this.trackPoints.Count) {
				duration = (this.trackPoints[endIndex].UTC - this.trackPoints[startIndex].UTC) / 1000;
				if (duration < pType.Duration) {
					endIndex++;
				} else {
					distance = this.trackPoints[endIndex].TotalDistance - this.trackPoints[startIndex].TotalDistance;
					speed = distance / duration;
					if (speed > topSpeed) {
						result = result ?? new TrackSegment(this.track.ID, pType.ID);
						result.StartUTC = this.trackPoints[startIndex].UTC;
						result.EndUTC = this.trackPoints[endIndex].UTC;
						result.StartBoatTime = this.trackPoints[startIndex].BoatTime ?? this.trackPoints[startIndex].UTC;
						result.EndBoatTime = this.trackPoints[endIndex].BoatTime ?? this.trackPoints[endIndex].UTC;
						result.Distance = distance;
						topSpeed = speed;
					}
					startIndex++;
				}
			}
			return result;
		}

		/// <summary>
		/// This gets the fastest segment having a certain distance. E.g. the fastest mile.
		/// </summary>
		/// <param name="pType">The type defining the minimal distance</param>
		/// <returns>The fastest segment or null</returns>
		private TrackSegment GetFastestSegmentByDistance(TrackSegmentType pType) {
			TrackSegment result = null;
			Int32 startIndex = 0;
			Int32 endIndex = 1;
			Double distance;		// meters
			Double speed;			// m/s
			Double topSpeed = 0;	// m/s
			while (endIndex < this.trackPoints.Count) {
				distance = this.trackPoints[endIndex].TotalDistance - this.trackPoints[startIndex].TotalDistance;
				if (distance < pType.Distance) {
					endIndex++;
				} else {
					speed = distance / ((this.trackPoints[endIndex].UTC - this.trackPoints[startIndex].UTC) / 1000);
					if(speed > topSpeed) {
						result = result ?? new TrackSegment(this.track.ID, pType.ID);
						result.StartUTC = this.trackPoints[startIndex].UTC;
						result.EndUTC = this.trackPoints[endIndex].UTC;
						result.StartBoatTime = this.trackPoints[startIndex].BoatTime ?? this.trackPoints[startIndex].UTC;
						result.EndBoatTime = this.trackPoints[endIndex].BoatTime ?? this.trackPoints[endIndex].UTC;
						result.Distance = distance;
						topSpeed = speed;
					}
					startIndex++;
				}
			}
			return result;
		}

		/// <summary>
		/// Creates a list of enhanced track points, which not only contain the
		/// positions and timestamps, but also the total distance from the first
		/// position. This makes calculating the total distance between any two 
		/// track points much faster.
		/// </summary>
		private void PreprocessTrack() {
			this.trackPoints = new List<EnhancedTrackPoint>();
			if((this.track != null) && (this.track.TrackPoints.Count > 1)) {
				EnhancedTrackPoint currentTrackPoint = null, previousTrackPoint = null;
				foreach (TrackPoint aTrackPoint in this.track.TrackPoints) {
					if (currentTrackPoint != null) {
						previousTrackPoint = currentTrackPoint;
					}
					currentTrackPoint = new EnhancedTrackPoint(aTrackPoint);
					if (previousTrackPoint != null) {
						currentTrackPoint.TotalDistance = previousTrackPoint.TotalDistance + currentTrackPoint.DistanceTo(previousTrackPoint);
					}
					this.trackPoints.Add(currentTrackPoint);
				}
			}			
		}
	}
}
