using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Backup.Client.Data;
using PiLot.Model.Logbook;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Helper to create backups of Logbook Data
	/// </summary>
	public class LogbookBackupHelper : BackupHelper, IBackupHelper {

		/// <summary>
		/// Default constructor, requires a BackupServiceProxy
		/// </summary>
		/// <param name="pProxy">The proxy used to consume the api</param>
		public LogbookBackupHelper(BackupServiceProxy pProxy):base(pProxy) { }

		/// <summary>
		/// Reads newly created Logbook Data and sends it to the backup service
		/// </summary>
		/// <param name="pTask">The backup task, neede to get the last Backup date</param>
		/// <param name="pBackupTime">The date of the backup</param>
		public async Task<BackupTaskResult> PerformBackupTaskAsync(BackupTask pTask, DateTime pBackupTime) {
			Boolean success = true;
			DateTime lastBackupDate = pTask.LastSuccess ?? new DateTime(0);
			BackupTaskData<List<LogbookDay>> backupLogbookData = new LogbookDataConnector().GetChangedData(lastBackupDate);
			Boolean serviceResult;
			foreach (LogbookDay aDay in backupLogbookData.ChangedItems) {
				serviceResult = await this.proxy.BackupLogbookDayAsync(aDay, pBackupTime);
				if (serviceResult) {
					Out.WriteDebug(String.Format("LogbookDay backupped for date {0:d}", aDay.Date));
				} else {
					Out.WriteError(String.Format("LogbookDay backup failed for date {0:d}", aDay.Date));
					success = false;
				}
			}
			return new BackupTaskResult(pTask, success, backupLogbookData.TotalItems);
		}
	}
}