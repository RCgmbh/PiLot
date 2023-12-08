using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Backup.Client.Data;
using PiLot.Model.Nav;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Helper class for backupping Routes
	/// </summary>
	class RouteBackupHelper: BackupHelper, IBackupHelper {

		/// <summary>
		/// Default constructor, requires a BackupServiceProxy
		/// </summary>
		/// <param name="pProxy">The proxy used to consume the api</param>
		public RouteBackupHelper(BackupServiceProxy pProxy) : base(pProxy) { }

		/// <summary>
		/// Reads newly created Routes and sends each of them to the backup service
		/// </summary>
		/// <param name="pTask">The backup task, neede to get the last Backup date</param>
		/// <param name="pBackupTime">The date of the backup</param>
		public async Task<BackupTaskResult> PerformBackupTaskAsync(BackupTask pTask, DateTime pBackupTime) {
			Boolean success = true;
			DateTime lastBackupDate = pTask.LastSuccess ?? new DateTime(0);
			BackupTaskData<List<Route>> backupRouteData = new RouteDataConnector().GetChangedData(lastBackupDate);
			Boolean serviceResult;
			foreach (Route aRoute in backupRouteData.ChangedItems) {
				serviceResult = await this.proxy.BackupRouteAsync(aRoute, pBackupTime);
				if (serviceResult) {
					Out.WriteDebug(String.Format("Route with ID {0} backupped", aRoute.RouteID));
				} else {
					Out.WriteError(String.Format("Backing up route with ID {0} failed", aRoute.RouteID));
					success = false;
				}
			}
			return new BackupTaskResult(pTask, success, backupRouteData.TotalItems);
		}
	}
}
