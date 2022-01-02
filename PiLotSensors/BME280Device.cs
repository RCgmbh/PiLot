using System;
using System.Collections.Generic;
using System.Device.I2c;
using UnitsNet;
using Iot.Device.Bmxx80;
using Iot.Device.Bmxx80.PowerMode;

using PiLot.Utils;
using PiLot.Utils.Logger;
using PiLot.Model.Sensors;

namespace PiLot.Sensors {

	/// <summary>
	/// The BME280 provides temperature, pressure and humidity
	/// </summary>
	public class BME280Device: BaseDevice, IDevice {

		private const Int32 BUSID = 1;

		private Bme280 iotDevice;
		private String temperatureName = null;
		private String pressureName = null;
		private String humidityName = null;

		/// <summary>
		/// Default constructor. Use i2cdetect -y 1 to find the id. 76 means 118, 77 means 119.
		/// </summary>
		/// <param name="pID">The id of the I2C Device, usually 118 or 119 for BME280</param>
		/// <param name="pInterval">The interval to read data, in seconds</param>
		/// <param name="pSensors">The list of sensor types (see SensorTypes) and their names</param>
		public BME280Device(String pID, Int32 pInterval, List<SensorInfo> pSensors, String pLocalAPI)
			:base(pID, pInterval, pSensors, pLocalAPI) {
		}

		/// <summary>
		/// Sets up the i2c device
		/// </summary>
		/// <param name="pDeviceId">The I2C ID of the device, usually 118 or 119, as INT</param>
		/// <param name="pSensors">The list of sensors with them names, usually temperature, pressure and humidity</param>
		protected override void SetupDevice(String pDeviceId, List<SensorInfo> pSensors) {
			Assert.IsTrue(Int32.TryParse(pDeviceId, out Int32 deviceId), $"pDeviceId must be a number, but is {pDeviceId}");
			I2cConnectionSettings i2cSettings = new I2cConnectionSettings(BUSID, deviceId);
			I2cDevice i2cDevice = I2cDevice.Create(i2cSettings);
			this.iotDevice = new Bme280(i2cDevice);
			this.iotDevice.SetPowerMode(Bmx280PowerMode.Normal);
			this.iotDevice.TemperatureSampling = Sampling.HighResolution;
			this.iotDevice.PressureSampling = Sampling.HighResolution;
			this.iotDevice.HumiditySampling = Sampling.HighResolution;
			this.SetupSensors(pSensors);
		}

		/// <summary>
		/// This sets up the sensor names which are used to send the 
		/// data to the api. Reading will later only be done for those
		/// sensors that have a name.
		/// </summary>
		/// <param name="pSensors"></param>
		private void SetupSensors(List<SensorInfo> pSensors) {
			foreach(SensorInfo aSensor in pSensors) {
				switch (aSensor.SensorType){
					case SensorTypes.TEMPERATURE:
						this.temperatureName = aSensor.Name;
						break;
					case SensorTypes.PRESSURE:
						this.pressureName = aSensor.Name;
						break;
					case SensorTypes.HUMIDITY:
						this.humidityName = aSensor.Name;
						break;
					default:
						Logger.Log($"Unknown sensor type for BME280: {aSensor.SensorType}", LogLevels.WARNING);
						break;
				}
			}
		}

		/// <summary>
		/// Reads the data from the sensors, and uses SaveData to send them
		/// to the api.
		/// </summary>
		protected override void PerformReading() {
			List<SensorValue> data = this.ReadData();
			this.SaveDataAsync(data.ToArray());
		}

		/// <summary>
		/// Reads the sensor data and returns a list with the values. Only
		/// those sensors, for which a name was defined, are read. Values
		/// which can't be read from the sensor are ignored.
		/// </summary>
		protected List<SensorValue> ReadData() {
			List<SensorValue> result = new List<SensorValue>();
			if ((this.temperatureName != null) && this.iotDevice.TryReadTemperature(out Temperature temperature)) {
				result.Add(new SensorValue(this.temperatureName, temperature.DegreesCelsius));
			} 
			if ((this.pressureName != null) && this.iotDevice.TryReadPressure(out Pressure pressure)) {
				result.Add(new SensorValue(this.pressureName, pressure.Pascals));
			} 
			if ((this.humidityName != null) && this.iotDevice.TryReadHumidity(out RelativeHumidity humidity)) {
				result.Add(new SensorValue(this.humidityName, humidity.Percent));
			} 
			return result;
		}
	}
}
