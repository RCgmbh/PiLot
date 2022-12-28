using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

using PiLot.Backup.Client.Model;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Reads and updates configuration data (Backup Targets, Backup Tasks)
	/// </summary>
	class ConfigHelper {

		private Config config = null;

		public ConfigHelper() {
			this.ReadConfig();
		}

		/// <summary>
		/// The list of all targets, where backup data is stored
		/// </summary>
		public List<BackupTarget> BackupTargets{
			get { return this.config.BackupTargets; }
		}

		/// <summary>
		/// Reads the entire config into this.config.
		/// </summary>
		private void ReadConfig() {
			this.config = null;
			String configPath = this.ConfigPath;
			Out.WriteDebug("ConfigPath is {0}", configPath);
			if (File.Exists(configPath)) {
				try {
					String fileContent = null;
					fileContent = File.ReadAllText(configPath);
					this.config = JsonSerializer.Deserialize<Config>(fileContent);
				}
				catch(Exception ex) {
					Out.WriteError("Error reading config: {0}", ex.Message);
					this.config = null;
				}
			} else {
				Out.WriteError($"No config file found at {configPath}");
			}
			if(this.config == null) {
				this.config = new Config();
			}
		}

		/// <summary>
		/// saves the entire config back to the json file
		/// </summary>
		public void SaveConfig() {
			String json = null;
			try {
				JsonSerializerOptions options = new JsonSerializerOptions() { WriteIndented = true };
				json = JsonSerializer.Serialize(this.config, options);
			} catch (Exception ex) {
				Out.WriteError("Error when trying to serialize Object: {0}", ex.Message);
			}
			if (json != null) {
				File.WriteAllText(this.ConfigPath, json);
			}
		}

		/// <summary>
		/// Gets the absolute path to the settings file
		/// </summary>
		private String ConfigPath {
			get {
				return Path.Combine(AppContext.BaseDirectory, "config.json");
			}
		}
	}
}
