﻿using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Backup.Client.Data;
using PiLot.Model.Nav;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Helper to create backups of GPS Data
	/// </summary>
	public class GpsBackupHelper : BackupHelper, IBackupHelper {

		/// <summary>
		/// Default constructor, requires a BackupServiceProxy
		/// </summary>
		/// <param name="pProxy">The proxy used to consume the api</param>
		public GpsBackupHelper(BackupServiceProxy pProxy) : base(pProxy) { }

		/// <summary>
		/// Reads newly created GPS Data and sends a backup of the GPS records for one day to the backup service
		/// </summary>
		/// <param name="pTask">The backup task, neede to get the last Backup date</param>
		/// <param name="pBackupTime">The date of the backup</param>
		public async Task<BackupTaskResult> PerformBackupTaskAsync(BackupTask pTask, DateTime pBackupTime) {
			Boolean success = true;
			DateTime lastBackupDate = pTask.LastSuccess ?? new DateTime(0);
			BackupTaskData<Dictionary<Date, Track>> gpsData = new GPSDataConnector().GetChangedDailyData(lastBackupDate);
			Boolean serviceResult;
			foreach (Date aDate in gpsData.ChangedItems.Keys) {
				serviceResult = await this.proxy.BackupDailyTrackAsync(gpsData.ChangedItems[aDate], aDate, pBackupTime);
				if (serviceResult) {
					Out.WriteDebug(String.Format("Track backupped for date {0:d}", aDate));
				} else {
					Out.WriteError(String.Format("Backing up track for date {0:d} failed", aDate));
					success = false;
				}
			}
			return new BackupTaskResult(pTask, success, gpsData.TotalItems);
		}
	}
}