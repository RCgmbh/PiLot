using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using PiLot.APIProxy;
using PiLot.Model.Sensors;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;


namespace PiLot.Sensors {

	/// <summary>
	/// Base class with common functionality for Sensor devices
	/// </summary>
	public abstract class BaseDevice {

		protected String id;
		protected Int32? nextActionTimestamp = null;
		protected Int32 interval;
		private DataProxy proxy = null;

		public BaseDevice(String pID, Int32 pInterval, List<SensorInfo> pSensors, String pLocalAPI, LoginHelper pLoginHelper) {
			this.id = pID;
			this.interval = pInterval;
			this.proxy = new DataProxy(pLocalAPI, pLoginHelper);
			this.SetupDevice(pID, pSensors);
		}

		/// <summary>
		/// override this, if you want so set up the device when being intantiated.
		/// </summary>
		protected virtual void SetupDevice(String pDeviceID, List<SensorInfo> pSensors) { }

		/// <summary>
		/// This must read the data from the sensor and save it (send it to the
		/// api). It will only be called, when the interval is over.
		/// </summary>
		protected abstract void PerformReading();

		/// <summary>
		/// Base Implementation to send data to the "data" API Endpoint
		/// </summary>
		/// <param name="pValues">Array of SensorData to send (use SensorInfo.Name for the names)</param>
		protected virtual async Task<Boolean> SaveDataAsync(SensorValue[] pValues) {
			DataProxy proxy = null;
			Boolean result = false;
			try {
				result = await this.proxy.PutSensorDataAsync(pValues);
			} catch (Exception ex) {
				Logger.Log($"Exception putting data to {proxy?.ApiControllerUrl ?? "null"}: {ex.Message}", LogLevels.ERROR);
			}
			return result;
		}

		/// <summary>
		/// Shortcut to just send one SensorValue, defined by name and value, to the API
		/// </summary>
		/// <param name="pSensorName">The name of the sensor</param>
		/// <param name="pValue">the measurement</param>
		protected virtual async Task<Boolean> SaveDataAsync(String pSensorName, Double? pValue) {
			return await this.SaveDataAsync(new SensorValue[] { new SensorValue(pSensorName, pValue) });
		}

		/// <summary>
		/// This is called whenerver the timer hits. if the interval is
		/// over, it calls PerformReading, which is supposed to read sensor
		/// data and send it to the api.
		/// </summary>
		/// <param name="pTimestamp">The current utc time in seconds from epoc</param>
		public void TimerTask() {
			Int32 timestamp = DateTimeHelper.ToUnixTime(DateTime.UtcNow);
			if ((this.nextActionTimestamp == null) || (timestamp >= this.nextActionTimestamp)) {
				this.PerformReading();
				this.nextActionTimestamp = (this.nextActionTimestamp ?? timestamp) + this.interval;
			}
		}
	}
}