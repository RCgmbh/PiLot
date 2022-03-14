using System;
using System.Collections.Generic;
using System.Device.I2c;
using UnitsNet;
using Iot.Device.Bmp180;

using PiLot.APIProxy;
using PiLot.Utils;
using PiLot.Utils.Logger;
using PiLot.Model.Sensors;

namespace PiLot.Sensors {

	/// <summary>
	/// The BMP180 provides temperature and pressure
	/// </summary>
	public class BMP180Device: BaseDevice, IDevice {

		private const Int32 BUSID = 1;

		private Bmp180 iotDevice;
		private String temperatureName = null;
		private String pressureName = null;

		/// <summary>
		/// Default constructor. Use i2cdetect -y 1 to find the id. 77 means means 119.
		/// </summary>
		/// <param name="pID">The id of the I2C Device, if empty 119 is used</param>
		/// <param name="pInterval">The interval to read data, in seconds</param>
		/// <param name="pSensors">The list of sensor types (see SensorTypes) and their names</param>
		/// <param name="pLocalAPI">The api url where the data will be sent to</param>
		/// <param name="pLoginHelper">The one and only login helper for the application</param>
		public BMP180Device(String pID, Int32 pInterval, List<SensorInfo> pSensors, String pLocalAPI, LoginHelper pLoginHelper)
			:base(pID, pInterval, pSensors, pLocalAPI, pLoginHelper) {
		}

		/// <summary>
		/// Sets up the i2c device
		/// </summary>
		/// <param name="pDeviceId">The I2C ID of the device. If omitted, defaults to 119</param>
		/// <param name="pSensors">The list of sensors with them names, usually temperature, pressure and humidity</param>
		protected override void SetupDevice(String pDeviceId, List<SensorInfo> pSensors) {
			Int32 deviceId;
			if (!Int32.TryParse(pDeviceId, out deviceId)) {
				deviceId = Bmp180.DefaultI2cAddress;
			}
			I2cConnectionSettings i2cSettings = new I2cConnectionSettings(BUSID, deviceId);
			I2cDevice i2cDevice = I2cDevice.Create(i2cSettings);
			this.iotDevice = new Bmp180(i2cDevice);
			this.iotDevice.SetSampling(Sampling.HighResolution);
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
			if (this.temperatureName != null) {
				Temperature temperature = this.iotDevice.ReadTemperature();
				result.Add(new SensorValue(this.temperatureName, temperature.DegreesCelsius));
			} 
			if (this.pressureName != null) {
				Pressure pressure = this.iotDevice.ReadPressure();
				result.Add(new SensorValue(this.pressureName, pressure.Pascals));
			} 
			return result;
		}
	}
}
