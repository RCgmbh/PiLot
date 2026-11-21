using System;
using System.Configuration;
using System.Threading;

using PiLot.API.Helpers;
using PiLot.Utils.Logger;
using PiLot.Utils.Various;

namespace PiLot.API.Workers {

	public class BatteryWatcher : IDisposable {

		private const Int32 TIMERMS = 60000;
		private const Int16 MINPERCENT = 3;

		private Timer timer = null;

		public BatteryWatcher(){
			if (this.ReadConfig()){
				Logger.Log($"BatteryWatcher: Will shutdown when battery below {MINPERCENT} %.", LogLevels.INFO);
				this.StartTimer();
			} else {
				Logger.Log("BatteryWatcher: disabled.", LogLevels.INFO);
			}
		}		

		public void Dispose() {
			this.timer?.Dispose();
			BatteryHelperSingleton.DisposeBatteryHelper();
		}

		/// <summary>
		/// Reads whether the BatteryWatcher should be activated, depending
		/// on the "enableBatteryWatcher" value in the configuration
		/// </summary>
		private Boolean ReadConfig() {
			Boolean result = false;
			String configValue = ConfigurationManager.AppSettings["enableBatteryWatcher"];
			if (!String.IsNullOrEmpty(configValue)) {
				if(Boolean.TryParse(configValue, out Boolean enableBatteryWatcher)) {
					result = true;
				}
			}
			return result;
		}

		private void StartTimer(){
			this.timer = new Timer(new TimerCallback(this.OnTimer), null, 5000, TIMERMS);
		}

		private void OnTimer(Object pTimerState) {
			this.CheckThreshold();
		}

		private void CheckThreshold(){
			try {
				BatteryHelper batteryHelper = BatteryHelperSingleton.BatteryHelper;
				BatteryInfo status = batteryHelper.GetStatus();
				if(!status.Charging && status.BatteryPercent < MINPERCENT){
					Logger.Log($"BatteryWatcher: Low battery ({status.BatteryPercent} %). Shutting down.", LogLevels.WARNING);
					batteryHelper.Shutdown();
				}
			} catch(Exception ex){
				Logger.Log(ex, "BatteryWatcher.CheckThreshold");
			}			
		}
	}
}