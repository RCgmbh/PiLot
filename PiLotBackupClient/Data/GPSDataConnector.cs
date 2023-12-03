using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

using PiLot.Backup.Client.Model;
using PiLot.Data.Files;
using PiLot.Model.Nav;
using PiLot.Utils.Logger;

namespace PiLot.Backup.Client.Data {
	
	/// <summary>
	/// Helps reading GPS data for backup
	/// </summary>
	internal class GPSDataConnector: PiLot.Data.Files.GPSDataConnector {

		internal GPSDataConnector() : base() { }

		/// <summary>
		/// Returns a list of all daily GPS tracks that have been changed after a certain
		/// date, clustered by date
		/// </summary>
		/// <returns>A Dictionary with the track for each UTC Day</returns>
		public BackupTaskData<Dictionary<Date, Track>> GetChangedDailyData(DateTime pChangedAfter) {
			Dictionary<Date, Track> changedDailyData = new Dictionary<Date, Track>();
			string dataPath = this.helper.GetDataPath(DATASOURCENAME);
			DirectoryInfo dataDir = new DirectoryInfo(dataPath);
			Int32 totalDailyData = 0;
			if (dataDir.Exists) {
				foreach (var aFile in dataDir.EnumerateFiles()) {
					if (Date.TryParseExact(aFile.Name, DataHelper.FILENAMEFORMAT, CultureInfo.InvariantCulture, DateTimeStyles.None, out Date date)) {
						if (aFile.LastWriteTimeUtc > pChangedAfter) {
							changedDailyData.Add(date, this.ReadRecordsFromFile(aFile));
						}
						totalDailyData++;
					}
				}
			} else {
				Logger.Log($"GPSDataConnector.GetChangedDailyData: gps directory not found at {dataPath}", LogLevels.WARNING);
			}
			return new BackupTaskData<Dictionary<Date, Track>>() {
				ChangedItems = changedDailyData,
				TotalItems = totalDailyData
			};
		}

	}
}
