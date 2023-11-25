using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

using PiLot.Utils.Logger;

namespace PiLot.Backup.API.Helpers {

	/// <summary>
	/// Helper which reads configuration data
	/// </summary>
	public class ConfigHelper {

		private const String CONFIGFILE = "config.json";

		/// <summary>
		/// private default constructor, the class can only be used static
		/// </summary>
		private ConfigHelper() { }

		/// <summary>
		/// Reads the entire config and returns it
		/// </summary>
		public static Config ReadConfig() {
			Config result = null;
			String configPath = Path.Combine(PiLot.Config.ConfigHelper.GetConfigDirectory(), CONFIGFILE);
			Logger.Log("ConfigPath is {0}", configPath, LogLevels.DEBUG);
			if (File.Exists(configPath)) {
				try {
					String fileContent = null;
					fileContent = File.ReadAllText(configPath);
					result = JsonSerializer.Deserialize<Config>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error reading config: {0}", ex.Message, LogLevels.ERROR);
				}
			}
			return result;
		}
	}
}