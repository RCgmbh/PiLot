using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

using PiLot.Model.Boat;
using PiLot.Utils.Logger;

namespace PiLot.Config {

	/// <summary>
	/// Helper class used to read the available Boat configuration
	/// </summary>
	public class BoatConfigReader {
		
		public const String CONFIGDIR = "boats";

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public BoatConfigReader() { }

		#endregion

		/// <summary>
		/// Reads all the boat config infos from the filesystem and returns a 
		/// list of objects {name, displayName, boatImageUrl}
		/// </summary>
		public List<Object> ReadBoatConfigInfos() {
			List<Object> result = new List<Object>();
			DirectoryInfo boatConfigDir = this.GetBoatConfigDirectory();
			if (boatConfigDir.Exists) {
				BoatConfig boatConfig;
				foreach (FileInfo aFile in boatConfigDir.GetFiles()) {
					try {
						boatConfig = this.ReadBoatConfig(aFile);
						result.Add(new {
							name = aFile.Name.Substring(0, aFile.Name.Length - 5), // cut .json
							displayName = boatConfig.DisplayName,
							boatImageUrl = boatConfig.BoatImageUrl
						});
					} catch (Exception ex) {
						Logger.Log(ex, "ReadBoatConfigInfos");
					}
				}
			}
			return result;
		}

		/// <summary>
		/// Reads a boatConfig with a certain name. Returns null, if no
		/// such BoatConfig exists
		/// </summary>
		/// <param name="pName">The unique name of the BoatConfig</param>
		/// <returns>A BoatConfig or null</returns>
		public BoatConfig ReadBoatConfig(String pName) {
			BoatConfig result = null;
			if (!String.IsNullOrEmpty(pName)) {
				DirectoryInfo configDirectory = this.GetBoatConfigDirectory();
				FileInfo[] files = configDirectory.GetFiles(pName + ".json");
				if (files.Length == 1) {
					result = ReadBoatConfig(files[0]);
					result.Name = pName;
				}
			}
			return result;
		}

		/// <summary>
		/// returns the directory of BoatConfigs in the filesystem. 
		/// </summary>
		private DirectoryInfo GetBoatConfigDirectory() {
			String configRoot = ConfigHelper.GetConfigDirectory();
			return new DirectoryInfo(Path.Combine(configRoot, CONFIGDIR));
		}

		/// <summary>
		/// Reads a boatconfig from File, if the file exists. If it doesn't, or 
		/// something goes wrong, returns null
		/// </summary>
		/// <returns>A BoatConfig or null</returns>
		private BoatConfig ReadBoatConfig(FileInfo pFileInfo) {
			BoatConfig result = null;
			if (pFileInfo.Exists) {
				String fileContent = null;
				try {
					fileContent = File.ReadAllText(pFileInfo.FullName);
					result = JsonSerializer.Deserialize<BoatConfig>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error when trying to deserialize JSON. Exception: {0}, JSON:{1}", ex.Message, fileContent, LogLevels.WARNING);
				}
			}
			return result;
		}
	}
}