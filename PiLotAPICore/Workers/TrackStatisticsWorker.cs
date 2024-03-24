using System;
using System.Threading;
using System.Threading.Tasks;
using PiLot.Data.Postgres.Nav;

namespace PiLot.API.Workers {

	/// <summary>
	/// Worker that will regularly update the statistics (also referred to
	/// as track segments) for the tracks. Needs to be started by someone,
	/// then will just do its work. When needed, can be accessed by the
	/// static Instance Property
	/// </summary>
	public class TrackStatisticsWorker {

		#region constants

		private const String APPKEY = "trackStatisticsWorker";
		private const Int32 SLEEPMS = 10000;

		#endregion

		#region instance fields

		private TrackDataConnector dataConnector = null;

		#endregion

		#region constructors

		/// <summary>
		/// Private constructor. The Instance accessor should be used
		/// </summary>
		private TrackStatisticsWorker() {
			this.dataConnector = new TrackDataConnector();
			this.StartProcessingTask();
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

		/// <summary>
		/// Launches a new Task for the processing
		/// </summary>
		private void StartProcessingTask() {
			var tokenSource = new CancellationTokenSource();
			var cancellationToken = tokenSource.Token;
			Task.Factory.StartNew((token) => {
				CancellationToken ct = (CancellationToken)token;
				this.StartProcessing(ct);
			}, cancellationToken, cancellationToken);
		}

		/// <summary>
		/// Processes
		/// </summary>
		/// <returns></returns>
		private void StartProcessing(CancellationToken pCancellationToken) {
			while (!pCancellationToken.IsCancellationRequested) {
				Thread.Sleep(SLEEPMS);
			}
		}
	}
}
