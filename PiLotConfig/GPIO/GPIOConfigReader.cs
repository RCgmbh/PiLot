using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Sensors;
using PiLot.Utils.Logger;

namespace PiLot.Config {

	/// <summary>
	/// Config connector to read information about GPIO settings (what is connected to
	/// which pin)
	/// </summary>
	public class GPIOConfigReader {

		public const String FILENAME = "gpio.json";

		/// <summary>
		/// Default constructor
		/// </summary>
		public GPIOConfigReader() { }

		/// <summary>
		/// Reads a dictionary of key and pin numbers. Returns an empty dictionary, if 
		/// no settings file exists.
		/// </summary>
		public Dictionary<String, Int32> ReadGPIOSettings() {
			Dictionary<String, Int32> result;
			FileInfo gpioFile = this.GetGPIOFile();
			if(gpioFile.Exists){
				String fileContent = File.ReadAllText(gpioFile.FullName);
				result = JsonSerializer.Deserialize<Dictionary<String, Int32>>(fileContent);
			} else {
				result = new Dictionary<String, Int32>();
			}
			return result;
		}

		/// <summary>
		/// Reads a single setting for a key.
		/// </summary>
		/// <param name="pKey">The key to look for</param>
		/// <returns>The assigned value (pin number) or null</returns>
		public Int32? ReadSetting(String pKey) {
			Int32? result = null;
			if(this.ReadGPIOSettings().TryGetValue(pKey, out Int32 setting)) {
				result = setting;
			}
			return result;
		}

		/// <summary>
		/// returns the file containing the GPIO settings. Return null, if no
		/// file exists
		/// </summary>
		private FileInfo GetGPIOFile() {
			String configRoot = ConfigHelper.GetConfigDirectory();
			String path = Path.Combine(configRoot, FILENAME);
			FileInfo result = new FileInfo(path);
			if(!result.Exists){
				Logger.Log($"GPIO file not found at {path}", LogLevels.WARNING);
				Dictionary<String, Int32> dict = new Dictionary<string, int>();
				dict.Add("test", 99);
				dict.Add("test2", 100);
				string serialized = JsonSerializer.Serialize(dict);
				File.WriteAllText(path, serialized	);
			}
			return result;
		}
	}
}
