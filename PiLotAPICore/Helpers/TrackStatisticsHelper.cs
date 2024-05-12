using System;
using System.Collections.Generic;
using System.Linq;

using PiLot.Data.Nav;
using PiLot.Model.Nav;

namespace PiLot.API.Helpers {

    public class TrackStatisticsHelper{

        /// <summary>
		/// Updates the statistics for a track. When adding data, it will only save faster segements
		/// in order to minimize I/O. When deleting data, all existing segments will be deleted, as
		/// they could be no more valid.
		/// </summary>
		/// <param name="pTrackId">The ID of the track</param>
		/// <param name="pResetExisting">Set to true when deleting trackpoints</param>
		public static void UpdateStatistics(Int32 pTrackId, Boolean pResetExisting){
			ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			if (dataConnector.SupportsStatistics) {
				Track track = dataConnector.ReadTrack(pTrackId);
				List<TrackSegmentType> allTrackSegmentTypes = dataConnector.ReadTrackSegmentTypes();
				List<TrackSegment> newSegments = new TrackAnalyzer(track).GetTrackSegments(allTrackSegmentTypes);
				if (pResetExisting) {
					dataConnector.DeleteTrackSegments(pTrackId, null);
					foreach(TrackSegment aSegment in newSegments) {
						dataConnector.SaveTrackSegment(aSegment);
					}
				} else {
					List<TrackSegment> currentSegments = dataConnector.ReadTrackSegments(pTrackId);
					foreach (TrackSegment aNewSegment in newSegments) {
						TrackSegment currentSegment = currentSegments.FirstOrDefault(s => s.TypeID == aNewSegment.TypeID);
						if (aNewSegment != null) {
							if (currentSegment == null || aNewSegment.Speed > currentSegment.Speed) {
								dataConnector.SaveTrackSegment(aNewSegment);
							}
						}
					}
				}
			}
        }
    }
}