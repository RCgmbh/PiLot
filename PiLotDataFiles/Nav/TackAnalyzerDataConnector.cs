using System;
using System.IO;
using System.Text.Json;
using PiLot.Model.Analyze;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files.Analyze { 
    
	public class TackAnalyzerDataConnector {

		private const String DATADIR = "analyze";
		private const String DATAFILE = "tackAnalyzerOptions.{0}.json";

		#region instance variables

		private DataHelper helper;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public TackAnalyzerDataConnector() {
			this.helper = new DataHelper();
		}

		#endregion

		/// <summary>
		/// Reads the current options for a boart. Returns null if there is none.
		/// </summary>
		public TackAnalyzerOptions ReadTackAnalyzerOptions(String pBoat) {
			TackAnalyzerOptions result = null;
			String filePath = this.GetFilePath(pBoat);
			if (File.Exists(filePath)) {
				String fileContent = null;
				try {
					fileContent = File.ReadAllText(filePath);
					result = JsonSerializer.Deserialize<TackAnalyzerOptions>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error when trying to deserialize JSON. Exception: {0}, JSON:{1}", ex.Message, fileContent, LogLevels.WARNING);
				}
			}
			return result;
		}

		/// <summary>
		/// saves the options to the datadirectory. 
		/// </summary>
		public void SaveTackAnalyzerOptions(TackAnalyzerOptions pOptions, String pBoat) {
			String json = null;
			try {
				json = JsonSerializer.Serialize(pOptions);
			} catch (Exception ex) {
				Logger.Log("Error when trying to serialize Object. Exception: {0}, Object:{1}", ex.Message, LogLevels.ERROR);
				throw;
			}
			if (json != null) {
				File.WriteAllText(this.GetFilePath(pBoat), json);
			}
		}

		/// <summary>
		/// returns the absolute path to the directory containing the TackAnalyzerOptions files in the filesystem. 
		/// </summary>
		private String GetDirectoryPath() {
			return this.helper.GetDataPath(DATADIR, true);
		}

		/// <summary>
		/// Returns the path for the TackAnalyzerOptions file for a certain boat, usually /global/tackAnalyzerOptions.boatName.json.
		/// The file will not be created, if it does not exist, so this can theoretically return an inexistant path.
		/// </summary>
		private String GetFilePath(String pBoat) {
			return Path.Combine(this.GetDirectoryPath(), String.Format(DATAFILE, pBoat));
		}

	}
}
