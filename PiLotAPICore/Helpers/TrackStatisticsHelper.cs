using System;
using System.Collections.Generic;
using System.Linq;

using PiLot.Data.Nav;
using PiLot.Data.Postgres.Nav;
using PiLot.Model.Nav;

namespace PiLot.API.Helpers {

    public class TrackStatisticsHelper{

        public static void UpdateStatistics(Int32 pTrackId){
			//ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			//if (dataConnector.SupportsStatistics) {
				TrackDataConnector dataConnector = new TrackDataConnector();
				Track track = dataConnector.ReadTrack(pTrackId);
				List<TrackSegment> currentSegments = dataConnector.ReadTrackSegments(pTrackId);
				List<TrackSegmentType> allTrackSegmentTypes = dataConnector.ReadTrackSegmentTypes();
				List<TrackSegment> newSegments = new TrackAnalyzer(track).GetTrackSegments(allTrackSegmentTypes);
				foreach (TrackSegmentType aType in allTrackSegmentTypes) {
					TrackSegment currentSegment = currentSegments.FirstOrDefault(s => s.TypeID == aType.ID);
					TrackSegment newSegment = newSegments.FirstOrDefault(s => s.TypeID == aType.ID);
					if (newSegment != null) {
						if (currentSegment == null || newSegment.Distance_mm > currentSegment.Distance_mm) {
							dataConnector.SaveTrackSegment(newSegment);
						}
					} else {
						if (currentSegment != null) {
							dataConnector.DeleteTrackSegment(currentSegment);
						}
					}
				}
			//}
        }
    }

}