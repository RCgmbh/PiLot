using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;

using PiLot.Utils.Logger;
using PiLot.Model.Sensors;
using PiLot.APIProxy;

namespace PiLot.Sensors {

	/// <summary>
	/// Device for measuring the CPU temperature
	/// </summary>
	public class CPUTemperatureDevice : BaseDevice, IDevice {

		private const String FILEPATH = "/sys/class/thermal/thermal_zone0/temp";

		private String temperatureName = null;

		/// <summary>
		/// Default constructor
		/// </summary>
		/// <param name="pInterval">The interval in seconds, how requently to measure</param>
		/// <param name="pSensors">The sensor infos. Usually one entry with sensorType temperature</param>
		/// <param name="pLocalAPI">The api url where the data will be sent to</param>
		/// <param name="pLoginHelper">The one and only login helper for the application</param>
		public CPUTemperatureDevice(Int32 pInterval, List<SensorInfo> pSensors, String pLocalAPI, LoginHelper pLoginHelper) 
			: base(null, pInterval, pSensors, pLocalAPI, pLoginHelper) {
			SensorInfo? sensorInfo = pSensors.FirstOrDefault(s => s.SensorType == SensorTypes.TEMPERATURE);
			if(sensorInfo != null) {
				this.temperatureName = sensorInfo.Value.Name;
			} else {
				Logger.Log("The CPUTemperatureDevice was not assigned a SensorInfo with SensorType temperature", LogLevels.WARNING);
			}			
		}

		/// <summary>
		/// Sends the current cpuTemperature in fire and forget manner
		/// </summary>
		protected override void PerformReading() {
			if ((this.temperatureName != null) && File.Exists(FILEPATH)) {
				String content = File.ReadAllText(FILEPATH).Trim();
				if (Double.TryParse(content, out double temperature)) {
					_ = this.SaveDataAsync(this.temperatureName, temperature / 1000F);
				} else {
					Logger.Log($"Invalid content in cpu temperature file: {content}", LogLevels.WARNING);
				}
			}
		}
	}
}
