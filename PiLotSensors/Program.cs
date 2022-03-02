/**
 * (c) 2021 Röthenmund Consulting GmbH
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *  
 * The full license text is available at https://github.com/Didosa/pilotCore/blob/master/LICENSE.
 *  
 * THIS PROGRAM DOES IN NO WAY REPLACE SUITABLE NAVIGATION EQUIPMENT, UP-TO-DATE OFFICIAL CHARTS OR EDUCATED SEAMANSHIP.
 **/
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Text.Json;
using System.Threading;
using PiLot.APIProxy;
using PiLot.Model.Sensors;
using PiLot.Utils;
using PiLot.Utils.Logger;

namespace PiLot.Sensors {

	/// <summary>
	/// This program watches the sensors and saves sensor data by sending it to
	/// the data API. It can handle internal sensors as well as other pilot
	/// devices providing data. A json-file is used to store the configuration
	/// defining which sensors should be read in what interval etc. A sensor
	/// can provide different, e.g. a BMP180 provides temperature and pressure.
	/// </summary>
	class Program {

		private const Int32 TIMERINTERVALMS = 5000;
		private static List<IDevice> devices;

		static void Main(string[] args) {
			Program.ReadConfig();
			Logger.Log("Starting PiLot.Sensors", LogLevels.INFO);
			Program.LoadDevices();
			Program.StartTimer();
		}

		private static void ReadConfig() {
			String configLogLevel = ConfigurationManager.AppSettings["logLevel"];
			LogLevels logLevel = LogLevels.ERROR;
			Enum.TryParse<LogLevels>(configLogLevel, out logLevel);
			String logfilePath = ConfigurationManager.AppSettings["logfilePath"];
			Logger.SetupLogging(logfilePath, logLevel);
		}

		/// <summary>
		/// Loads the devices based on the config file
		/// </summary>
		private static void LoadDevices() {
			String localAPI = ConfigurationManager.AppSettings["localAPI"];
			Assert.IsFalse(String.IsNullOrEmpty(localAPI), "Config value for localAPI not found");
			LoginHelper loginHelper = null;
			String username = ConfigurationManager.AppSettings["username"];
			String password = ConfigurationManager.AppSettings["password"];
			if (!String.IsNullOrEmpty(username) && !String.IsNullOrEmpty(password)) {
				loginHelper = new LoginHelper(localAPI, username, password);
			}
			devices = new List<IDevice>();
			String sensorsConfigFile = ConfigurationManager.AppSettings["sensorsConfigFile"];
			Assert.IsTrue(File.Exists(sensorsConfigFile), $"No sensors config found at {sensorsConfigFile}");
			String fileContent = File.ReadAllText(sensorsConfigFile);
			List<DeviceInfo> deviceInfos = JsonSerializer.Deserialize<List<DeviceInfo>>(fileContent);
			foreach(DeviceInfo aDeviceInfo in deviceInfos) {
				IDevice device = Program.CreateDevice(aDeviceInfo, localAPI, loginHelper);
				if(device != null) {
					devices.Add(device);
				}
			}
		}

		/// <summary>
		/// Factory to create a device object based on the data objects
		/// </summary>
		/// <param name="pDeviceInfo">The data object containing all information</param>
		/// <returns>An IDevice based on pDeviceInfo.DeviceType</returns>
		private static IDevice CreateDevice(DeviceInfo pDeviceInfo, String pLocalAPI, LoginHelper pLoginHelper) {
			IDevice result = null;
			if (Enum.TryParse<DeviceTypes>(pDeviceInfo.DeviceType, out DeviceTypes deviceType)) {
				switch (deviceType) {
					case DeviceTypes.BME280:
						result = new BME280Device(pDeviceInfo.ID, pDeviceInfo.Interval, pDeviceInfo.Sensors, pLocalAPI, pLoginHelper);
						break;
					case DeviceTypes.OneWTemperature:
						result = new OneWDevice(pDeviceInfo.ID, pDeviceInfo.Interval, pDeviceInfo.Sensors, pLocalAPI, pLoginHelper);
						break;
					case DeviceTypes.CPUTemperature:
						result = new CPUTemperatureDevice(pDeviceInfo.Interval, pDeviceInfo.Sensors, pLocalAPI, pLoginHelper);
						break;
					case DeviceTypes.PiLot:
						result = new PiLotDevice(pDeviceInfo.ID, pDeviceInfo.Interval, pDeviceInfo.Sensors, pLocalAPI, pLoginHelper);
						break;
					default:
						Logger.Log($"DeviceType is currently not handled: {deviceType}", LogLevels.WARNING);
						break;
				}
			} else {
				Logger.Log($"Invalid DeviceType in sensors.json: {pDeviceInfo.DeviceType}", LogLevels.WARNING);
			}
			return result;
		}

		/// <summary>
		/// This is some kind of self made Timer, as the System.Threading.Timer didn't work
		/// well.
		/// </summary>
		private static void StartTimer() {
			DateTime start, end;
			while (true) {
				start = DateTime.UtcNow;
				TimerEvent();
				end = DateTime.UtcNow;
				Int32 sleepMS = TIMERINTERVALMS - (Int32)(end - start).TotalMilliseconds;
				if (sleepMS > 0) {
					Thread.Sleep(sleepMS);
				}
			}
		}

		/// <summary>
		/// Just calls TimerTask for each Device
		/// </summary>
		private static void TimerEvent() {
			foreach(IDevice aDevice in devices) {
				aDevice.TimerTask();
			}			
		}
	}
}
