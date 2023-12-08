using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;

using PiLot.Backup.Client.Model;
using PiLot.Model.Photos;
using PiLot.Utils.Logger;

namespace PiLot.Backup.Client.Data {

	/// <summary>
	/// Helps reading photos for backup
	/// </summary>
	internal class PhotoDataConnector: PiLot.Data.Files.PhotoDataConnector {

		internal PhotoDataConnector() : base() { }

		/// <summary>
		/// Gets a list of images that have been changed after a certain time
		/// </summary>
		/// <param name="pChangedAfter">Photos must have been created or changed after that date</param>
		public BackupTaskData<List<ImageReference>> ReadChangedPhotos(DateTime pChangedAfter) {
			List<ImageReference> changedPhotos = new List<ImageReference>();
			Date day;
			DirectoryInfo photosRoot = new DirectoryInfo(this.helper.GetDataPath(PHOTOSROOTDIR, false));
			DirectoryInfo[] directories = photosRoot.GetDirectories();
			Int32 totalPhotos = 0;
			foreach (DirectoryInfo aDirectory in directories) {
				if (Date.TryParseExact(aDirectory.Name, PHOTODIRFORMAT, CultureInfo.InvariantCulture, DateTimeStyles.None, out day)) {
					foreach (FileInfo aFile in aDirectory.EnumerateFiles()) {
						if (aFile.LastWriteTimeUtc >= pChangedAfter) {
							changedPhotos.Add(new ImageReference() {
								Path = aFile.FullName,
								Name = aFile.Name,
								Day = day
							});
						}
						totalPhotos++;
					}
				} else {
					Logger.Log($"PhotoDataConnector: Invalid daily photos directory found: {aDirectory.Name}", LogLevels.WARNING);
				}
			}
			return new BackupTaskData<List<ImageReference>>() { 
				ChangedItems = changedPhotos,
				TotalItems = totalPhotos
			};
		}

	}
}
