using System;
using System.Configuration;
using System.IO;

using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper class to read and write data from files. It also gives access
	/// to the data in the app.json file, where we save application-level
	/// settings. Maybe this could be separated.
	/// </summary>
	public class DataHelper {

		/// <summary>
		/// The format string used to get the filename for a data file
		/// </summary>
		public const String FILENAMEFORMAT = "yyyy-MM-dd";

		/// <summary>
		/// The name of the parent directory for all data directories
		/// </summary>
		public const String DATADIRECTORY = "data";

		private String dataRootPath = null;


		/// <summary>
		/// Default constructor
		/// </summary>
		public DataHelper() {
			this.dataRootPath = this.GetDataRoot();
		}

		/// <summary>
		/// Constructor for a specific data root path, e.g. when working with backup data
		/// </summary>
		/// <param name="pDataRootPath">the data root path, e.g. /home/backup/</param>
		public DataHelper(String pDataRootPath) {
			if (pDataRootPath != null) {
				this.dataRootPath = pDataRootPath;
			} else {
				this.dataRootPath = this.GetDataRoot();
			}
		}

		/// <summary>
		/// returns the path for a certain data source, e.g. /data/gps
		/// </summary>
		/// <param name="pDataSourceName">The data source name, e.g. gps, temperature1, routes</param>
		/// <param name="pCreateIfMissing">Optionally set true to on-the-fly create missing directories</param>
		/// <returns></returns>
		public String GetDataPath(String pDataSourceName, Boolean pCreateIfMissing = false) {
			String dataPath = Path.Combine(this.dataRootPath, pDataSourceName);
			if (!Directory.Exists(dataPath) && pCreateIfMissing) {
				Directory.CreateDirectory(dataPath);
			}
			return dataPath;
		}

		/// <summary>
		/// Returns the dataFile for a certain date and dataSource, if 
		/// that file exists. Otherwise it returns null.
		/// </summary>
		/// <param name="pDataSourceName">the folder name within /data</param>
		/// <param name="pDate">the date for which we want the data</param>
		/// <param name="pCreateIfMissing">Optionally pass true, if the file should be created automatically if missing</param>
		/// <returns>A fileInfo for an existing file or null</returns>
		public FileInfo GetDataFile(String pDataSourceName, System.Date pDate, Boolean pCreateIfMissing = false) {
			FileInfo result = null;
			String dataPath = this.GetDataPath(pDataSourceName, pCreateIfMissing);
			String filePath = Path.Combine(dataPath, pDate.ToString(DataHelper.FILENAMEFORMAT));
			try {
				FileInfo file = new FileInfo(filePath);
				if (file.Exists) {
					result = file;
				} else if (pCreateIfMissing) {
					File.WriteAllText(filePath, String.Empty);
					result = file;
				} else {
					Logger.Log("File not found in GetDataFile: {0}", filePath, LogLevels.DEBUG);
				}
			} catch (Exception ex) {
				Logger.Log(ex, "SensorDataConnector.GetDataFile");
			}
			return result;
		}

		/// <summary>
		/// Returns the Application root path by taking it from "dataDir"
		/// Web.config setting
		/// </summary>
		/// <returns>The data root path</returns>
		public String GetDataRoot() {
			return ConfigurationManager.AppSettings["dataDir"];
		}

		/// <summary>
		/// Recursively copies a Directory and its subdirectories and files to another location
		/// </summary>
		/// <param name="pFromPath">The full path of the directory to be copied</param>
		/// <param name="pToPath">The full path of the target directory</param>
		public void CopyDirectory(String pFromPath, String pToPath) {
			DirectoryInfo fromDirectory = new DirectoryInfo(pFromPath);
			if (fromDirectory.Exists) {
				if (!Directory.Exists(pToPath)) {
					Directory.CreateDirectory(pToPath);
				}
				foreach (DirectoryInfo aChild in fromDirectory.GetDirectories("*", SearchOption.TopDirectoryOnly)) {
					this.CopyDirectory(aChild.FullName, Path.Combine(pToPath, aChild.Name));
				}
				String toFilePath;
				foreach (FileInfo aFile in fromDirectory.GetFiles("*", SearchOption.TopDirectoryOnly)) {
					toFilePath = Path.Combine(pToPath, aFile.Name);
					aFile.CopyTo(toFilePath, true);
				}
			}
		}
	}
}