using System;
using System.Collections.Generic;
using System.IO;

using PiLot.Backup.Client.Model;
using PiLot.Model.Logbook;

namespace PiLot.Backup.Client.Data {

	/// <summary>
	/// Helps reading Logbook data for backup
	/// </summary>
	internal class LogbookDataConnector: PiLot.Data.Files.LogbookDataConnector {

		internal LogbookDataConnector() : base() { }

		/// <summary>
		/// Returns a list of all GPS records that have been changed after a certain
		/// date, clustered by date
		/// </summary>
		/// <returns></returns>
		public BackupTaskData<List<LogbookDay>> GetChangedData(DateTime pChangedAfter) {
			List<LogbookDay> changedDailyData = new List<LogbookDay>();
			string dataPath = this.dataHelper.GetDataPath(LOGBOOKDIR);
			DirectoryInfo dataDir = new DirectoryInfo(dataPath);
			LogbookDay logbookDay;
			Int32 totalDailyData = 0;
			foreach (var aFile in dataDir.EnumerateFiles("*", SearchOption.AllDirectories)) {
				logbookDay = this.ReadLogbookDay(aFile.FullName);
				if (logbookDay != null) {
					if (aFile.LastWriteTimeUtc > pChangedAfter) {
						changedDailyData.Add(logbookDay);
					}
					totalDailyData++;
				}
			}
			return new BackupTaskData<List<LogbookDay>>() {
				ChangedItems = changedDailyData,
				TotalItems = totalDailyData
			}; ;
		}

	}
}
