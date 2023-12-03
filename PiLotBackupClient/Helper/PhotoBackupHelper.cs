using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Backup.Client.Data;
using PiLot.Model.Photos;
using PiLot.Utils.Logger;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Helper to create backups of Photos
	/// </summary>
	public class PhotoBackupHelper : BackupHelper, IBackupHelper {

		/// <summary>
		/// Default constructor, requires a BackupServiceProxy
		/// </summary>
		/// <param name="pProxy">The proxy used to consume the api</param>
		public PhotoBackupHelper(BackupServiceProxy pProxy):base(pProxy) { }

		/// <summary>
		/// Reads newly created or changed photos and sends them to the backup service
		/// </summary>
		/// <param name="pTask">The backup task, needed to get the last Backup date</param>
		/// <param name="pBackupTime">The date of the backup</param>
		public async Task<BackupTaskResult> PerformBackupTaskAsync(BackupTask pTask, DateTime pBackupTime) {
			Boolean success = true;
			DateTime lastBackupDate = pTask.LastSuccess ?? new DateTime(0);
			BackupTaskData<List<ImageReference>> backupPhotosData = new PhotoDataConnector().ReadChangedPhotos(lastBackupDate);
			Boolean serviceResult;
			Byte[] bytes = null;
			ImageData imageData = null;
			foreach(ImageReference aPhoto in backupPhotosData.ChangedItems) {
				try {
					bytes = File.ReadAllBytes(aPhoto.Path);
				} catch(Exception ex) {
					Logger.Log(ex, "PhotosBackupHelper.PerformBackupTaskAsync");
					success = false;
					break;
				}
				if(bytes != null) {
					imageData = new ImageData() { 
						Bytes = bytes,
						Day = aPhoto.Day,
						Name = aPhoto.Name
					};
					serviceResult = await this.proxy.BackupPhotoAsync(imageData);
					if (serviceResult) {
						Out.WriteDebug($"Photo backupped: {imageData.Name}");
					} else {
						Out.WriteError($"Photo backup failed for photo {imageData.Name}");
						success = false;
					}
				}
			}
			return new BackupTaskResult(success, backupPhotosData.TotalItems);
		}
	}
}