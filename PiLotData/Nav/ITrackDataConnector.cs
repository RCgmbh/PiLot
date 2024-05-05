using System;
using System.Collections.Generic;

using PiLot.Model.Nav;

namespace PiLot.Data.Nav {

	public interface ITrackDataConnector {

		Boolean SupportsStatistics { get; }

		List<Track> ReadTracks(Int64 pStart, Int64 pEnd, Boolean pIsBoatTime = false, Boolean pReadTrackPoints = false);

		List<Boolean> ReadTracksMonthInfo(Int32 pYear, Int32 pMonth);

		void InsertTrack(Track pTrack);

		Int32? SaveTrackPoint(TrackPoint pTrackPoint, String pBoat);

		Int32? SaveTrackPoints(List<TrackPoint> pTrackPoints, String pBoat);
	}
}
