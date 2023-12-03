using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using PiLot.Backup.Client.Model;
using PiLot.Data.Files;
using PiLot.Model.Sensors;
using PiLot.Utils.Logger;

namespace PiLot.Backup.Client.Data {

	/// <summary>
	/// Helps reading sensor data to be backed up
	/// </summary>
	internal class SensorDataConnector: PiLot.Data.Files.SensorDataConnector {

		/// <summary>
		/// Creates a SensorDataConnector with a specific data root, useful i.e. for Backup
		/// </summary>
		/// <param name="pRootPath"></param>
		public SensorDataConnector(): base() {	}

		/// <summary>
		/// Reads all data that has been changed after a certain time, by just reading those files
		/// that have a younger changed after value. The result is clustered by date, giving one
		/// list of SensorDataRecords per day.
		/// </summary>
		/// <param name="pSensorName">The name of the sensor</param>
		/// <param name="pChangedAfter">The minimal changed date</param>
		/// <returns></returns>
		public BackupTaskData<Dictionary<Date, List<SensorDataRecord>>> GetChangedDailyData(String pSensorName, DateTime pChangedAfter) {
			Dictionary<Date, List<SensorDataRecord>> changedData = new Dictionary<Date, List<SensorDataRecord>>();
			string dataPath = this.dataHelper.GetDataPath(pSensorName);
			DirectoryInfo dataDir = new DirectoryInfo(dataPath);
			Int32 totalDays = 0;
			if (dataDir.Exists) {
				foreach (var aFile in dataDir.EnumerateFiles()) {
					if (Date.TryParseExact(aFile.Name, DataHelper.FILENAMEFORMAT, CultureInfo.InvariantCulture, DateTimeStyles.None, out Date date)) {
						if (aFile.LastWriteTimeUtc > pChangedAfter) {
							changedData.Add(date, this.ReadRawData(aFile));
						}
						totalDays++;
					} else {
						Logger.Log($"Filename does not represent a date: {aFile.FullName}", LogLevels.WARNING);
					}
				}
			} else {
				Logger.Log($"SensorDataConnector.GetChangedDailyData: Invalid directory: {dataPath}", LogLevels.WARNING);
			}
			return new BackupTaskData<Dictionary<Date, List<SensorDataRecord>>>() {
				ChangedItems = changedData,
				TotalItems = totalDays
			};
		}
	}
}
