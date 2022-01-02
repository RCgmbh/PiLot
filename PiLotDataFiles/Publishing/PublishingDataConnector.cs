using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Publishing;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {
	
	/// <summary>
	/// Class for reading and writing sensor data from and to files
	/// </summary>
	public class PublishingDataConnector {

		private DataHelper dataHelper;
		public const String DATADIR = "publishing";
		public const String FILENAME = "targets.json";

		/// <summary>
		/// Default constructor
		/// </summary>
		public PublishingDataConnector() {
			this.dataHelper = new DataHelper();
		}

		/// <summary>
		/// Creates a PublishingDataConnector with a specific data root, useful i.e. for Backup
		/// </summary>
		/// <param name="pRootPath"></param>
		public PublishingDataConnector(String pRootPath) {
			this.dataHelper = new DataHelper(pRootPath);
		}

		/// <summary>
		/// Reads a list of PublishTargets. If there are no targets configured, it returns
		/// an empty list.
		/// </summary>
		public List<PublishTarget> ReadPublishTargets() {
			List<PublishTarget> result;
			FileInfo file = this.GetFile();
			if (file != null) {
				String fileContent = File.ReadAllText(file.FullName);
				result = JsonSerializer.Deserialize<List<PublishTarget>>(fileContent);
			} else result = new List<PublishTarget>();
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
		private FileInfo GetFile() {
			String path = Path.Combine(this.dataHelper.GetDataPath(DATADIR, true), FILENAME);
			FileInfo result = new FileInfo(path);
			if (!result.Exists) {
				Logger.Log($"Did not find PublishTargets file at {path}", LogLevels.WARNING);
				result = null;
			}
			return result;
		}
	}
}
