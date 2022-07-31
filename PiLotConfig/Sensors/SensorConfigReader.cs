using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Sensors;
using PiLot.Utils;

namespace PiLot.Config {

	/// <summary>
	/// Config connector to read information about available
	/// Sensor data sources
	/// </summary>
	public class SensorConfigReader {

		public const String FILENAME = "sensors.json";

		/// <summary>
		/// Default constructor
		/// </summary>
		public SensorConfigReader() { }

		/// <summary>
		/// Reads a list of SensorInfos, optionally filtered by a certain tag
		/// </summary>
		/// <param name="pTag">Optionally pass a tag, if you only need certain sensors</param>
		public List<SensorInfo> ReadSensorInfos(String pTag = null) {
			FileInfo sensorFile = this.GetSensorFile();
			String fileContent = File.ReadAllText(sensorFile.FullName);
			List<DeviceInfo> devices = JsonSerializer.Deserialize<List<DeviceInfo>>(fileContent);
			List<SensorInfo> result = devices.SelectMany(d => d.Sensors).ToList();
			if (pTag != null) {
				result = result.FindAll(s => s.Tags.Contains(pTag));
			}
			result.Sort((x, y) => (x.SortOrder ?? 0).CompareTo(y.SortOrder ?? 0));
			return result;
		}

		/// <summary>
		/// returns the file containing the sensors data. Throws an exception,
		/// if the file does not exist.
		/// </summary>
		private FileInfo GetSensorFile() {
			String configRoot = ConfigHelper.GetConfigDirectory();
			String path = Path.Combine(configRoot, FILENAME);
			FileInfo result = new FileInfo(path);
			Assert.IsTrue(result.Exists, $"Did not find Sensors data file at {path}");
			return result;
		}
	}
}
