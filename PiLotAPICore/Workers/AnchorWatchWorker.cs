using System;
using System.Threading;

using PiLot.API.Helpers;
using PiLot.Config;
using PiLot.Data.Files;
using PiLot.GPIO.Devices;
using PiLot.Model.Nav;

namespace PiLot.API.Workers {

	/// <summary>
	/// That's the guy who observes any currently active AnchorWatch, and does stuffs
	/// if the distance exceeds the defined radius.
	/// </summary>
	public class AnchorWatchWorker {

		private const String APPKEY = "anchorWatchWorker";
		private const String BUZZERKEY = "buzzer";

		private AnchorWatchDataConnector dataConnector = null;
		private AnchorWatch anchorWatch = null;
		private Boolean observingGps = false;
		private Boolean alarmPlaying = false;

		LED buzzer = null;

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

		/// <summary>
		/// Returns the current anchor watch or null, if there is none
		/// </summary>
		public AnchorWatch GetAnchorWatch() {
			return this.anchorWatch;
		}

		/// <summary>
		/// Saves or updates the current anchorWatch and keeps it in cache. Passing
		/// null will delete the current AnchorWatch. CUD in one :-)
		/// </summary>
		/// <param name="pAnchorWatch">The current anchorWatch or null</param>
		public void SaveAnchorWatch(AnchorWatch pAnchorWatch) {
			if (pAnchorWatch != null) {
				this.anchorWatch = pAnchorWatch;
				this.dataConnector.SaveAnchorWatch(this.anchorWatch);
				this.EnsureObserveGps();
			} else {
				this.DeleteAnchorWatch();
			}
		}

		/// <summary>
		/// Deletes the current AnchorWatch, if there is any
		/// </summary>
		public void DeleteAnchorWatch() {
			if(this.anchorWatch != null) {
				this.dataConnector.DeleteAnchorWatch();
				this.StopObserveGps();
				this.anchorWatch = null;
			}
		}

		/// <summary>
		/// Loads the current AnchorWatch from the data source
		/// </summary>
		private void LoadAnchorWatch() {
			this.anchorWatch = this.dataConnector.ReadAnchorWatch();
			if(this.anchorWatch != null) {
				this.EnsureObserveGps();
			}
		}

		/// <summary>
		/// Makes sure the GpsCache is bein observed, so that an alarm
		/// can be triggered on the server. Call this whenever an anchorWatch
		/// is loaded or activated.
		/// </summary>
		private void EnsureObserveGps() {
			if (!this.observingGps) {
				this.observingGps = true;
				GpsCache.Instance.PositionChanged += this.GpsDataRecieved;
			}
		}

		/// <summary>
		/// Stops observing the GpsCache, just to not produce useless load
		/// during all the time we have no anchorWatch.
		/// </summary>
		private void StopObserveGps() {
			this.observingGps = false;
			GpsCache.Instance.PositionChanged -= this.GpsDataRecieved;
			this.buzzer?.Dispose();
		}

		/// <summary>
		/// Handles recieving new GpsData and makes sure the distance is
		/// checked if we have an AnchorWatch
		/// </summary>
		/// <param name="pRecord">The latest GpsRecord, not null</param>
		private void GpsDataRecieved(GpsRecord pRecord) {
			try {
				LatLon positionLatLon = new LatLon(pRecord.Latitude.Value, pRecord.Longitude.Value);
				LatLon anchorLatLon = new LatLon(this.anchorWatch.Latitude, this.anchorWatch.Longitude);
				if(positionLatLon.DistanceTo(anchorLatLon) > this.anchorWatch.Radius) {
					this.PlayAlarm();
				} else {
					this.StopAlarm();
				}
			} catch(Exception ex) {
				PiLot.Utils.Logger.Logger.Log(ex, "AnchorWatchWorker.GpsDataRecieved");
				throw;
			}
		}

		/// <summary>
		/// This instantiates the buzzer. If there is no config, no buzzer will be
		/// instantiated, and this return false.
		/// </summary>
		/// <returns>True, if a buzzer is configured, else false</returns>
		private Boolean EnsureBuzzer() {
			Boolean result = true;
			if(this.buzzer == null) {
				Int32? buzzerPin = new GPIOConfigReader().ReadSetting(BUZZERKEY);
				if(buzzerPin != null) {
					this.buzzer = new LED(null, buzzerPin.Value, ConnectionTypes.Ground);
				} else {
					result = false;
				}
			}
			return result;
		}

		/// <summary>
		/// Plays a sound on the passive buzzer connected to PIN 24 (logical 24, physical 18)
		/// </summary>
		private void PlayAlarm() {
			if (!this.alarmPlaying) {
				if (this.EnsureBuzzer()) {
					this.buzzer.Blink(500, 1000);
					this.alarmPlaying = true;
				}
			}			
		}

		/// <summary>
		/// Stops the alarm
		/// </summary>
		private void StopAlarm() {
			if (this.alarmPlaying) {
				this.alarmPlaying = false;
				this.buzzer.TurnOff();
			}
		}
	}
}
