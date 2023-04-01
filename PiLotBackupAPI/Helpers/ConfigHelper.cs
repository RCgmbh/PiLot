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

		private Config config = null;

		/// <summary>
		/// default constructor
		/// </summary>
		public ConfigHelper() {
			this.ReadConfig();
		}

		/// <summary>
		/// Gets a copy of the BackupSetsInterval array as List
		/// </summary>
		public List<Int32> GetBackupSetsInterval(){
			return new List<Int32>(this.config.BackupSetsInterval);
		}		

		/// <summary>
		/// Reads the entire config into this.config.
		/// </summary>
		private void ReadConfig() {
			this.config = null;
			String configPath = this.ConfigPath;
			Logger.Log("ConfigPath is {0}", configPath, LogLevels.DEBUG);
			if (File.Exists(configPath)) {
				try {
					String fileContent = null;
					fileContent = File.ReadAllText(configPath);
					this.config = JsonSerializer.Deserialize<Config>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error reading config: {0}", ex.Message, LogLevels.ERROR);
					this.config = null;
				}
			}
			if (this.config == null) {
				this.config = new Config();
			}
		}

		/// <summary>
		/// Gets the absolute path to the config file
		/// </summary>
		private String ConfigPath {
			get {
				return Path.Combine(PiLot.Config.ConfigHelper.GetConfigDirectory(), CONFIGFILE);
			}
		}
	}
}