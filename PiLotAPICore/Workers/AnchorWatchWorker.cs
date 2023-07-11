using System;
using System.Collections.Generic;

using PiLot.API.Helpers;
using PiLot.Config;
using PiLot.Data.Files;
using PiLot.GPIO.Devices;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.API.Workers {

	/// <summary>
	/// That's the guy who observes any currently active AnchorWatch, and does stuffs
	/// if the distance exceeds the defined radius.
	/// </summary>
	public class AnchorWatchWorker {

		private const String APPKEY = "anchorWatchWorker";
		private const String BUZZERKEY = "buzzer";
		private static readonly AlarmConfig ATTENTION = new AlarmConfig(100, 1900);
		private static readonly AlarmConfig DANGER = new AlarmConfig(500, 1000);
		private static readonly AlarmConfig PANIC = new AlarmConfig(200, 200);

		/// <summary>
		/// A list that assigns an alarm config to a number. The number ist the ratio of
		/// actual distance to configured radius for the anchor watch (the higher, the
		/// further away from the anchor), allowing to play different sound patterns.
		/// </summary>
		private static List<Tuple<Double, AlarmConfig?>> ALARMS = new List<Tuple<double, AlarmConfig?>>() {
			new Tuple<Double, AlarmConfig?>( 1.5, PANIC),
			new Tuple<Double, AlarmConfig?>( 1.2, DANGER),
			new Tuple<Double, AlarmConfig?>( 1, ATTENTION),
			new Tuple<Double, AlarmConfig?>( 0, null)
		};

		private AnchorWatchDataConnector dataConnector = null;
		private AnchorWatch anchorWatch = null;
		private Boolean observingGps = false;
		private Int32? alarmIndex = null;
		private Int32? buzzerPin = null;

		LED buzzer = null;

		/// <summary>
		/// Private constructor. The Instance accessor should be used
		/// </summary>
		private AnchorWatchWorker() {
			this.ReadBuzzerPin();
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
				this.StopAlarm();
				this.buzzer?.Dispose();
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
		/// Reads the pin that's configured for the buzzer. If we have no buzzer, writes
		/// an Info into the log.
		/// </summary>
		private void ReadBuzzerPin() {
			this.buzzerPin = new GPIOConfigReader().ReadSetting(BUZZERKEY);
			if (buzzerPin == null) {
				Logger.Log("No buzzer configured, will not play alarm for anchor watch", LogLevels.INFO);
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
				Double distance = positionLatLon.DistanceTo(anchorLatLon);
				Int32 newAlarmIndex = this.anchorWatch.Radius != 0 ? AnchorWatchWorker.ALARMS.FindIndex(a => a.Item1 < distance / this.anchorWatch.Radius) : 0;
				if (newAlarmIndex != this.alarmIndex) {
					this.StopAlarm();
					this.alarmIndex = newAlarmIndex;
					this.PlayAlarm(ALARMS[newAlarmIndex].Item2);
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
				if(this.buzzerPin != null) {
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
		private void PlayAlarm(AlarmConfig? pAlarmConfig) {
			if (this.EnsureBuzzer()) {
				this.StopAlarm();
				if(pAlarmConfig != null) {
					this.buzzer.Blink(pAlarmConfig.Value.PlayMS, pAlarmConfig.Value.PauseMS);
				}				
			}
		}

		/// <summary>
		/// Stops the alarm
		/// </summary>
		private void StopAlarm() {
			this.buzzer?.TurnOff();
		}
	}

	public struct AlarmConfig {

		public AlarmConfig(Int32 pPlayMS, Int32 pPauseMS) {
			this.PlayMS = pPlayMS;
			this.PauseMS = pPauseMS;
		}

		public Int32 PlayMS { get; set; }
		public Int32 PauseMS { get; set; }

	}
}
