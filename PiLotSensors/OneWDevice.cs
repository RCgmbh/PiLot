using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Iot.Device.OneWire;
using UnitsNet;

using PiLot.Model.Sensors;
using PiLot.APIProxy;

namespace PiLot.Sensors {

	public class OneWDevice: BaseDevice, IDevice {

		private OneWireThermometerDevice iotDevice = null;
		private String temperatureName = null;

		/// <summary>
		/// Default Constructor
		/// </summary>
		/// <param name="pID">The ID of the sensor</param>
		/// <param name="pInterval">The read interval in seconds</param>
		/// <param name="pSensors">The list of sensors, which will usually be just one</param>
		/// <param name="pLocalAPI">The api url where the data will be sent to</param>
		/// <param name="pLoginHelper">The one and only login helper for the application</param>
		public OneWDevice(String pID, Int32 pInterval, List<SensorInfo> pSensors, String pLocalAPI, LoginHelper pLoginHelper)
			: base(pID, pInterval, pSensors, pLocalAPI, pLoginHelper) {
		}

		/// <summary>
		/// Calls the async PerformReadingAsync, in fire and forget manner.
		/// </summary>
		protected override void PerformReading() {
			this.PerformReadingAsync();
		}

		/// <summary>
		/// Reads the temperature and sends it to the api
		/// </summary>
		/// <returns></returns>
		private async Task PerformReadingAsync() {
			if (this.temperatureName != null) {
				Temperature temperature = await this.iotDevice.ReadTemperatureAsync();
				await this.SaveDataAsync(this.temperatureName, temperature.DegreesCelsius);
			}
		}

		/// <summary>
		/// Initializes the OneWireThermometerDevice
		/// </summary>
		/// <param name="pDeviceID">The sensor id, e.g. 28-020292457b57</param>
		/// <param name="pSensors">A list, usually containing one SensorInfo with type temperature</param>
		protected override void SetupDevice(string pDeviceID, List<SensorInfo> pSensors) {
			this.iotDevice = new OneWireThermometerDevice("w1_bus_master1", pDeviceID);
			SensorInfo? temperatureInfo = pSensors.FirstOrDefault(s => s.SensorType == SensorTypes.TEMPERATURE);
			this.temperatureName = temperatureInfo?.Name;
		}
	}
}
