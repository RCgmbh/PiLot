using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Backup.Client.Data;
using PiLot.Model.Tools;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Helper class for backupping checklists
	/// </summary>
	class ChecklistBackupHelper: BackupHelper, IBackupHelper {

		/// <summary>
		/// Default constructor, requires a BackupServiceProxy
		/// </summary>
		/// <param name="pProxy">The proxy used to consume the api</param>
		public ChecklistBackupHelper(BackupServiceProxy pProxy) : base(pProxy) { }

		/// <summary>
		/// Reads the changed checklists, which is all or nothing, as they are all in one file
		/// </summary>
		/// <param name="pTask">The backup task, needed to get the last Backup date</param>
		/// <param name="pBackupTime">The date of the backup</param>
		public async Task<BackupTaskResult> PerformBackupTaskAsync(BackupTask pTask, DateTime pBackupTime) {
			Boolean success = true;
			DateTime lastBackupDate = pTask.LastSuccess ?? new DateTime(0);
			BackupTaskData<List<Checklist>> backupChecklistsData = new ChecklistDataConnector().GetChangedData(lastBackupDate);
			Boolean serviceResult;
			if(backupChecklistsData.ChangedItems.Count > 0){
				serviceResult = await this.proxy.BackupChecklistsAsync(backupChecklistsData.ChangedItems, pBackupTime);
				if (serviceResult) {
					Out.WriteDebug("Checklists backupped");
				} else {
					Out.WriteError("Backing up checklists failed");
					success = false;
				}
			}			
			return new BackupTaskResult(pTask, success, backupChecklistsData.TotalItems);
		}
	}
}
