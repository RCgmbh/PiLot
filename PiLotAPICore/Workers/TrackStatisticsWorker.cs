using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using PiLot.API.Helpers;
using PiLot.Data.Nav;
using PiLot.Data.Postgres.Nav;
using PiLot.Model.Nav;

namespace PiLot.API.Workers {

	/// <summary>
	/// Worker that will regularly update the statistics (also referred to
	/// as track segments) for the tracks. It will make sure the calcuation
	/// does not happen too often. When calling EnsureStatistics(), it will
	/// re-calculate the stats if it didn't for a while (INTERVALMS), or 
	/// the statistics will be re-calculated no later than after INTERVALMS
	/// 
	/// This is currently NOT being used, but I keep it just in case one day
	/// I ran into performance problems with doing this synchronously when
	/// saving position data, e.g. when decreasing the save threshhold one
	/// day.
	/// </summary>
	public class TrackStatisticsWorker {

		#region constants

		private const String APPKEY = "trackStatisticsWorker";
		private const Int32 INTERVALMS = 10000;

		#endregion

		#region instance fields

		private TrackDataConnector dataConnector = null;
		private Boolean statisticsRequested = false;
		private Task processingTask = null;
		private CancellationToken cancellationToken;
		private List<Int32> trackIds;

		#endregion

		#region constructors

		/// <summary>
		/// Private constructor. The Instance accessor should be used
		/// </summary>
		private TrackStatisticsWorker() {
			this.dataConnector = new TrackDataConnector();
			this.cancellationToken = new CancellationTokenSource().Token;
			this.trackIds = new List<Int32>();
		}

		/// <summary>
		/// Singleton accessor
		/// </summary>
		public static TrackStatisticsWorker Instance {
			get {
				TrackStatisticsWorker result = null;
				Object applicationItem = Program.GetApplicationObject(APPKEY);
				if (applicationItem != null) {
					result = applicationItem as TrackStatisticsWorker;
				} else {
					result = new TrackStatisticsWorker();
					Program.SetApplicationObject(APPKEY, result);
				}
				return result;
			}
		}

		#endregion

		#region public methods

		public void EnsureStatistics(Int32 pTrackId) {
			this.statisticsRequested = true;
			if (!this.trackIds.Contains(pTrackId)) {
				this.trackIds.Add(pTrackId);
			}
			if(this.processingTask == null || (this.processingTask.Status != TaskStatus.Running && this.processingTask.Status != TaskStatus.WaitingToRun)) {
				this.StartProcessingTask();
			}
		}

		#endregion

		/// <summary>
		/// Launches a new Task for the processing
		/// </summary>
		private void StartProcessingTask() {
			this.processingTask = Task.Run(() => this.StartProcessing(this.cancellationToken), this.cancellationToken);
		}

		/// <summary>
		/// Triggers the statistics processing in an interval, as long as it's been requested
		/// </summary>
		private void StartProcessing(CancellationToken pCancellationToken) {
			while (this.statisticsRequested && !pCancellationToken.IsCancellationRequested) {
				this.statisticsRequested = false;
				this.UpdateStatistics();
				this.processingTask.Wait(INTERVALMS);
			}
		}

		/// <summary>
		/// Does the actual work of updating the statistics. Reads all dirty tracks, calculates them statistics
		/// and saves them back to the db.
		/// </summary>
		private void UpdateStatistics() {
			//ITrackDataConnector dataConnector = DataConnectionHelper.TrackDataConnector;
			//if (dataConnector.SupportsStatistics) {
				TrackDataConnector dataConnector = new TrackDataConnector();
				while(this.trackIds.Count > 0) {
					Int32 trackId = this.trackIds.First();
					Track track = dataConnector.ReadTrack(trackId);
					List<TrackSegment> currentSegments = dataConnector.ReadTrackSegments(trackId);
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
					this.trackIds.Remove(trackId);
				}
			//}
		}
	}
}
