using System;
using System.Collections.Generic;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Backup.Client.Data;
using PiLot.Model.Nav;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Helper to create backups of GPS Data, a.k.a. Tracks
	/// </summary>
	public class GpsBackupHelper : BackupHelper, IBackupHelper {

		/// <summary>
		/// Default constructor, requires a BackupServiceProxy
		/// </summary>
		/// <param name="pProxy">The proxy used to consume the api</param>
		public GpsBackupHelper(BackupServiceProxy pProxy) : base(pProxy) { }

		/// <summary>
		/// Reads newly created or changed tracks and sends them to the backup service
		/// </summary>
		/// <param name="pTask">The backup task, needed to get the last Backup date</param>
		/// <param name="pBackupTime">The date of the backup</param>
		public async Task<BackupTaskResult> PerformBackupTaskAsync(BackupTask pTask, DateTime pBackupTime) {
			Boolean success = true;
			DateTime lastBackupDate = pTask.LastSuccess ?? new DateTime(0);
			TrackDataConnector dataConnector = new TrackDataConnector();
			BackupTaskData<List<Int32>> trackData = dataConnector.GetChangedTracks(lastBackupDate);
			Boolean serviceResult;
			foreach (Int32 aTrackID in trackData.ChangedItems) {
				Track track = dataConnector.ReadTrack(aTrackID);
				serviceResult = await this.proxy.BackupTrackAsync(track, pBackupTime);
				if (serviceResult) {
					Out.WriteDebug($"Track backupped for track id {aTrackID}");
				} else {
					Out.WriteError($"Backing up track for track id {aTrackID} failed");
					success = false;
				}
			}
			return new BackupTaskResult(pTask, success, trackData.TotalItems);
		}
	}
}