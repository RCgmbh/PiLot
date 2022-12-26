using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Data;
using PiLot.Data.Files;
using PiLot.Model.Nav;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Helper to create backups of POI data
	/// </summary>
	public class PoisBackupHelper : BackupHelper, IBackupHelper {

		/// <summary>
		/// Default constructor, requires a BackupServiceProxy
		/// </summary>
		/// <param name="pProxy">The proxy used to consume the api</param>
		public PoisBackupHelper(BackupServiceProxy pProxy) : base(pProxy) { }

		/// <summary>
		/// Reads newly created GPS Data and sends a backup of the GPS records for one day to the backup service
		/// </summary>
		/// <param name="pTask">The backup task, neede to get the last Backup date</param>
		/// <param name="pBackupTime">The date of the backup</param>
		public async Task<Boolean> PerformBackupTaskAsync(BackupTask pTask, DateTime pBackupTime) {
			Boolean success = true;
			DateTime lastBackupDate = pTask.LastSuccess ?? new DateTime(0);
			Data.Postgres.Nav.PoiDataConnector dataConnector = new Data.Postgres.Nav.PoiDataConnector();
			DateTime? lastPoiChange = dataConnector.ReadLatestChange();
			if((lastPoiChange != null) && (lastPoiChange > lastBackupDate)) {
				Boolean serviceResult;
				List<Poi> allPois = dataConnector.ReadPois();
				List<PoiCategory> allCategories = dataConnector.ReadPoiCategories();
				List<PoiFeature> allFeatures = dataConnector.ReadPoiFeatures();
				serviceResult = await this.proxy.BackupPoiDataAsync(allPois, allCategories, allFeatures, pBackupTime);
				if (serviceResult) {
					Out.WriteDebug(String.Format("All POI data backupped"));
				} else {
					Out.WriteError(String.Format("Backing up POI data failed"));
					success = false;
				}
			}
			return success;
		}
	}
}