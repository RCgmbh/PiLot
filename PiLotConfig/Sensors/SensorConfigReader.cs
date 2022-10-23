using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Sensors;
using PiLot.Utils;
using PiLot.Utils.Logger;

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
		/// Reads a list of SensorInfos, optionally filtered by a certain tag. Returns an empty
		/// list, if the sensors config file does not exist.
		/// </summary>
		/// <param name="pTag">Optionally pass a tag, if you only need certain sensors</param>
		public List<SensorInfo> ReadSensorInfos(String pTag = null) {
			List<SensorInfo> result;
			FileInfo sensorFile = this.GetSensorFile();
			if(sensorFile.Exists){
				String fileContent = File.ReadAllText(sensorFile.FullName);
				List<DeviceInfo> devices = JsonSerializer.Deserialize<List<DeviceInfo>>(fileContent);
				result = devices.SelectMany(d => d.Sensors).ToList();
				if (pTag != null) {
					result = result.FindAll(s => s.Tags.Contains(pTag));
				}
				result.Sort((x, y) => (x.SortOrder ?? 0).CompareTo(y.SortOrder ?? 0));
			} else {
				result = new List<SensorInfo>();
			}
			return result;
		}

		/// <summary>
		/// returns the file containing the sensors data. Return null, if no
		/// file exists
		/// </summary>
		private FileInfo GetSensorFile() {
			String configRoot = ConfigHelper.GetConfigDirectory();
			String path = Path.Combine(configRoot, FILENAME);
			FileInfo result = new FileInfo(path);
			if(!result.Exists){
				Logger.Log($"Sensors file not found at {path}", LogLevels.WARNING);
			}
			return result;
		}
	}
}
