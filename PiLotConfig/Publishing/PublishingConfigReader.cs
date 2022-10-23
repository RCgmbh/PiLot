using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Publishing;
using PiLot.Utils.Logger;

namespace PiLot.Config {
	
	/// <summary>
	/// Class for reading and writing sensor configuration from files
	/// </summary>
	public class PublishingConfigReader {

		public const String FILENAME = "publishingTargets.json";

		/// <summary>
		/// Default constructor
		/// </summary>
		public PublishingConfigReader() { }

		/// <summary>
		/// Reads a list of PublishTargets. If there are no targets configured, it returns
		/// an empty list.
		/// </summary>
		public List<PublishTarget> ReadPublishTargets() {
			List<PublishTarget> result;
			FileInfo file = this.GetConfigFile();
			if (file.Exists) {
				String fileContent = File.ReadAllText(file.FullName);
				result = JsonSerializer.Deserialize<List<PublishTarget>>(fileContent);
			} else { 
				result = new List<PublishTarget>();
			}
			return result;
		}

		/// <summary>
		/// Returns the PublishInfo with Name = pName, or null, if the
		/// Target does not exist.
		/// </summary>
		/// <param name="pName">The Name of the PublishTarget. Case sensitive!</param>
		/// <returns>A publishTarget or null</returns>
		public PublishTarget GetPublishTarget(String pName) {
			List <PublishTarget> publishTargets = this.ReadPublishTargets();
			return publishTargets.FirstOrDefault(t => t.Name == pName);
		}

		/// <summary>
		/// returns the file containing the publishTargets. Returns null,
		/// if the file does not exist.
		/// </summary>
		private FileInfo GetConfigFile() {
			String configRoot = ConfigHelper.GetConfigDirectory();
			String path = Path.Combine(configRoot, FILENAME);
			FileInfo result = new FileInfo(path);
			if (!result.Exists) {
				Logger.Log($"Did not find PublishTargets file at {path}", LogLevels.WARNING);
				result = null;
			}
			return result;
		}
	}
}
