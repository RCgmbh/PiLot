using System;
using System.IO;
using System.Text.Json;

using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Reads and saves Routes inlcuding Waypoints 
	/// </summary>
	public class AnchorWatchDataConnector {

		private const String DATADIR = "global";
		private const String DATAFILE = "anchorWatch.json";

		#region instance variables

		private DataHelper helper;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public AnchorWatchDataConnector() {
			this.helper = new DataHelper();
		}

		#endregion

		/// <summary>
		/// Reads the current AnchorWatch. Returns null if there is none.
		/// </summary>
		public AnchorWatch ReadAnchorWatch() {
			AnchorWatch result = null;
			String filePath = this.GetFilePath();
			if (File.Exists(filePath)) {
				String fileContent = null;
				try {
					fileContent = File.ReadAllText(filePath);
					result = JsonSerializer.Deserialize<AnchorWatch>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error when trying to deserialize JSON. Exception: {0}, JSON:{1}", ex.Message, fileContent, LogLevels.WARNING);
				}
			}
			return result;
		}

		/// <summary>
		/// saves pRoute as json to the datadirectory. if pRoute is null, then nothing happens.
		/// For the route and for each waypoint, an ID is created if necessary
		/// </summary>
		public void SaveAnchorWatch(AnchorWatch pAnchorWatch) {
			if (pAnchorWatch != null) {
				String json = null;
				try {
					json = JsonSerializer.Serialize(pAnchorWatch);
				} catch (Exception ex) {
					Logger.Log("Error when trying to serialize Object. Exception: {0}, Object:{1}", ex.Message, LogLevels.ERROR);
					throw;
				}
				if (json != null) {
					File.WriteAllText(this.GetFilePath(), json);
				}
			}
		}

		/// <summary>
		/// Deletes the current AnchorWatch, if there is any
		/// </summary>
		public void DeleteAnchorWatch() {
			FileInfo file = new FileInfo(this.GetFilePath());
			if (file.Exists) {
				file.Delete();
			}
		}	

		/// <summary>
		/// returns the absolute path to the directory containing the anchorWatch file in the filesystem. 
		/// </summary>
		private String GetDirectoryPath() {
			return this.helper.GetDataPath(DATADIR, true);
		}

		/// <summary>
		/// Returns the path for the anchorWatch file, usually /global/anchorWatch.json. The file
		/// will not be created, if it does not exist, so this can theoretically return an
		/// inexistand path.
		/// </summary>
		private String GetFilePath() {
			return Path.Combine(this.GetDirectoryPath(), DATAFILE);
		}
	}
}