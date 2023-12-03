using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Backup.Client.Data;
using PiLot.Model.Sensors;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Helper class for backupping Routes
	/// </summary>
	class SensorDataBackupHelper: BackupHelper, IBackupHelper {

		/// <summary>
		/// Default constructor, requires a BackupServiceProxy
		/// </summary>
		/// <param name="pProxy">The proxy used to consume the api</param>
		public SensorDataBackupHelper(BackupServiceProxy pProxy) : base(pProxy) { }

		/// <summary>
		/// Reads newly created Routes and sends each of them to the backup service
		/// </summary>
		/// <param name="pTask">The backup task, neede to get the last Backup date</param>
		/// <param name="pBackupTime">The date of the backup</param>
		public async Task<BackupTaskResult> PerformBackupTaskAsync(BackupTask pTask, DateTime pBackupTime) {
			Boolean success = true;
			DateTime lastBackupDate = pTask.LastSuccess ?? new DateTime(0);
			BackupTaskData<Dictionary<Date, List<SensorDataRecord>>> backupSensorData = new SensorDataConnector().GetChangedDailyData(pTask.DataSource, lastBackupDate);
			Boolean serviceResult;
			foreach (Date aDate in backupSensorData.ChangedItems.Keys) {
				serviceResult = await this.proxy.BackupSensorDataAsync(backupSensorData.ChangedItems[aDate], pTask.DataSource, pBackupTime);
				if (serviceResult) {
					Out.WriteDebug(String.Format($"Sensor data backupped for sensor {pTask.DataSource} and date {aDate:d}"));
				} else {
					Out.WriteError(String.Format($"Backing up sensor data for sensor {pTask.DataSource} and date {aDate:d} failed"));
					success = false;
				}
			}
			return new BackupTaskResult(success, backupSensorData.TotalItems);
		}
	}
}
