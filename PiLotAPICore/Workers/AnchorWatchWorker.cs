using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using PiLot.API.Helpers;
using PiLot.Data.Files;
using PiLot.Model.Nav;
using PiLot.Model.Photos;
using PiLot.Utils.Logger;

namespace PiLot.API.Workers {

	/// <summary>
	/// That's the guy who observes any currently active AnchorWatch, and does stuffs
	/// if the distance exceeds the defined radius.
	/// </summary>
	public class AnchorWatchWorker {

		private const String APPKEY = "anchorWatchWorker";

		private AnchorWatchDataConnector dataConnector = null;
		private AnchorWatch anchorWatch = null;
		private Boolean observingGps = false;

		/// <summary>
		/// Private constructor. The Instance accessor should be used
		/// </summary>
		private AnchorWatchWorker() {
			this.dataConnector = new AnchorWatchDataConnector();
			this.LoadAnchorWatch();
		}

		/// <summary>
		/// Singleton accessor
		/// </summary>
		public static AnchorWatchWorker Instance {
			get {
				AnchorWatchWorker result = null;
				Object applicationItem = Program.GetApplicationObject(APPKEY);
				if (applicationItem != null) {
					result = applicationItem as AnchorWatchWorker;
				} else {
					result = new AnchorWatchWorker();
					Program.SetApplicationObject(APPKEY, result);
				}
				return result;
			}
		}

		public AnchorWatch GetAnchorWatch() {
			return this.anchorWatch;
		}

		public void SaveAnchorWatch(AnchorWatch pAnchorWatch) {
			this.anchorWatch = pAnchorWatch;
			this.dataConnector.SaveAnchorWatch(this.anchorWatch);
			this.EnsureObserveGps();
		}

		public void DeleteAnchorWatch() {
			if(this.anchorWatch != null) {
				this.dataConnector.DeleteAnchorWatch();
				this.StopObserveGps();
			}
		}

		private void LoadAnchorWatch() {
			this.anchorWatch = this.dataConnector.ReadAnchorWatch();
			if(this.anchorWatch != null) {
				this.EnsureObserveGps();
			}
		}

		private void EnsureObserveGps() {
			if (!this.observingGps) {
				this.observingGps = true;
				GpsCache.Instance.PositionChanged += this.GpsDataRecieved;
			}
		}

		private void StopObserveGps() {
			this.observingGps = false;
			GpsCache.Instance.PositionChanged -= this.GpsDataRecieved;
		}

		private void GpsDataRecieved(GpsRecord pRecord) {
			Logger.Log($"GPS Data recieved: {pRecord.ToString()}", LogLevels.INFO);
		}
	}
}
