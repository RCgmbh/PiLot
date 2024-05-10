using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;

using PiLot.Data.Files;
using PiLot.Model.Nav;
using PiLot.Model.Logbook;
using PiLot.Model.Sensors;
using PiLot.Model.Common;
using PiLot.Utils.Logger;

namespace PiLot.Backup.API.Helpers {

	public class BackupHelper {

		public const String DATEDIRECTORYFORMAT = "yyyyMMdd-HHmmss";

		/// <summary>
		/// Prepares the backup by creating the backup directory, and for partial backups
		/// copies the data from the latest backup.  
		/// </summary>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the backup set</param>
		/// <param name="pIsFullBackup">If true, data won't be copied from the previous backup set</param>
		public static void PrepareBackup(String pClientName, DateTime pBackupTime, Boolean pIsFullBackup) {
			BackupHelper.GetBackupDirectory(pClientName, pBackupTime, true, true, !pIsFullBackup);
		}

		/// <summary>
		/// Backup GPS Data for one day.
		/// </summary>
		/// <param name="pRecords">The gps records to save</param>
		/// <param name="pDay">The day the track belongs to</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupGpsData(List<TrackPoint> pRecords, System.Date pDay, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetTempDirectory(pClientName, pBackupTime);
			new TrackDataConnector(backupDirectory.FullName).SaveDailyTrack(pRecords, pDay, true);
			Logger.Log("Recieved {0} GpsRecords to backup", pRecords.Count, LogLevels.DEBUG);
		}

		/// <summary>
		/// Backup Logbook Data for one day
		/// </summary>
		/// <param name="pLogbookDay">The logbook day to save</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupLogbookData(LogbookDay pLogbookDay, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetTempDirectory(pClientName, pBackupTime);
			new LogbookDataConnector(backupDirectory.FullName).SaveLogbookDay(pLogbookDay, false);
			Logger.Log("Recieved LogbookDay for date {0:d} to backup", pLogbookDay.Date, LogLevels.DEBUG);
		}

		/// <summary>
		/// Backup a single Route
		/// </summary>
		/// <param name="pRoute">The route to save</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupRoute(Route pRoute, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetTempDirectory(pClientName, pBackupTime);
			new RouteDataConnector(backupDirectory.FullName).SaveRoute(pRoute);
			Logger.Log("Recieved Route with ID {0} to backup", pRoute.RouteID, LogLevels.DEBUG);
		}

		/// <summary>
		/// Backs up sensor data
		/// </summary>
		/// <param name="pData">The array of records to save</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pSensorName">The sensor name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupSensorData(SensorDataRecord[] pData, String pSensorName, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetTempDirectory(pClientName, pBackupTime);
			new SensorDataConnector(backupDirectory.FullName).SaveDailyData(pData.ToList(), pSensorName);
			Logger.Log($"Recieved {pData.Length} records for sensor {pSensorName} to backup", LogLevels.DEBUG);
		}

		/// <summary>
		/// Backs up pois
		/// </summary>
		/// <param name="pData">The array of records to save</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupPois(List<Poi> pData, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetTempDirectory(pClientName, pBackupTime);
			new PoiDataConnector(backupDirectory.FullName).SaveAllPois(pData);
			Logger.Log($"Recieved {pData.Count} POIs to backup", LogLevels.DEBUG);
		}

		/// <summary>
		/// Backs up poi categories
		/// </summary>
		/// <param name="pData">The array of records to save</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupPoiCategories(List<PoiCategory> pData, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetTempDirectory(pClientName, pBackupTime);
			new PoiDataConnector(backupDirectory.FullName).SaveAllCategories(pData);
			Logger.Log($"Recieved {pData.Count} poi categories to backup", LogLevels.DEBUG);
		}

		/// <summary>
		/// Backs up poi features
		/// </summary>
		/// <param name="pData">The array of records to save</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupPoiFeatures(List<PoiFeature> pData, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetTempDirectory(pClientName, pBackupTime);
			new PoiDataConnector(backupDirectory.FullName).SaveAllFeatures(pData);
			Logger.Log($"Recieved {pData.Count} poi features to backup", LogLevels.DEBUG);
		}

		/// <summary>
		/// Backs up a photo
		/// </summary>
		/// <param name="pDay">The day, used to find the right directory</param>
		/// <param name="pFileName">The original filename that will be reused</param>
		/// <param name="pBytes">The image bytes</param>
		/// <param name="pClientName">The client name</param>
		public static void BackupPhoto(System.Date pDay, String pFileName, Byte[] pBytes, String pClientName) {
			DirectoryInfo photosBackupDirectory = BackupHelper.GetClientRoot(pClientName, true);
			new PhotoDataConnector(photosBackupDirectory.FullName).SaveImage(pDay, pFileName, pBytes);
			Logger.Log("Recieved photo {0} to backup", pFileName, LogLevels.DEBUG);
		}

		/// <summary>
		/// This renames the temp backup folder to its definitive name, and then removes any
		/// previous backups that aren't needed anymore
		/// </summary>
		/// <param name="pClientName">the client name</param>
		/// <param name="pBackupTime">the backup timestamp</param>
		public static void CommitBackup(String pClientName, DateTime pBackupTime) {
			DirectoryInfo tempDirectory = BackupHelper.GetBackupDirectory(pClientName, pBackupTime, true, false, false);
			if (tempDirectory.Exists) {
				DirectoryInfo finalDirectory = BackupHelper.GetBackupDirectory(pClientName, pBackupTime, false, false, false);
				tempDirectory.MoveTo(finalDirectory.FullName);
				DirectoryInfo clientRoot = BackupHelper.GetClientRoot(pClientName, false);
				BackupHelper.ClearPreviousBackups(clientRoot, finalDirectory);
				BackupHelper.ClearTempDirectories(clientRoot);
			}			
		}

		/// <summary>
		/// This deletes the temp directory for a failed backup attempt
		/// </summary>
		/// <param name="pClientName">the client name</param>
		/// <param name="pBackupTime">the backup timestamp</param>
		public static void RollbackBackup(String pClientName, DateTime pBackupTime) {
			DirectoryInfo tempDirectory = BackupHelper.GetBackupDirectory(pClientName, pBackupTime, true, false, false);
			if (tempDirectory.Exists) {
				tempDirectory.Delete(true);
			}
		}

		/// <summary>
		/// Takes a list of data sources, and returns the total number of items for each dataSource.
		/// </summary>
		/// <param name="pDataSources">The list of data sources to summarize</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">the backup timestamp</param>
		/// <returns></returns>
		public static List<Int32> GetDataSummary(List<DataSource> pDataSources, String pClientName, DateTime pBackupTime) {
			List<Int32> result = new();
			DirectoryInfo backupDirectory = BackupHelper.GetTempDirectory(pClientName, pBackupTime);
			foreach (DataSource aDataSource in pDataSources) {
				Int32 dataCount = 0;
				switch (aDataSource.DataType) {
					case DataTypes.GPS:
						dataCount = new TrackDataConnector(backupDirectory.FullName).ReadDaysWithData();
						break;
					case DataTypes.Logbook:
						dataCount = new LogbookDataConnector(backupDirectory.FullName).ReadLogbookDaysCount();
						break;
					case DataTypes.Routes:
						dataCount = new RouteDataConnector(backupDirectory.FullName).ReadRoutesCount();
						break;
					case DataTypes.SensorData:
						dataCount = new SensorDataConnector(backupDirectory.FullName).ReadDaysWithData(aDataSource.Name);
						break;
					case DataTypes.POIs:
						dataCount = new PoiDataConnector(backupDirectory.FullName).ReadPois().Count;
						break;
					case DataTypes.Photos:
						dataCount = new PhotoDataConnector(BackupHelper.GetClientRoot(pClientName, false).FullName).ReadPhotosCount();
						break;
				}
				result.Add(dataCount);
			}
			return result;
		}

		/// <summary>
		/// Returns the backup directory where the data should be backupped to. If the directory does not
		/// exist, it will be created and prefilled with the data from the last backup set.
		/// </summary>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the backup set</param>
		/// <returns></returns>
		private static DirectoryInfo GetTempDirectory(String pClientName, DateTime pBackupTime) {
			return BackupHelper.GetBackupDirectory(pClientName, pBackupTime, true, true, true);
		}

		/// <summary>
		/// Prepares the directory for one backup set. Below here, we will expect
		/// the same structure as in the original data directory.
		/// If the directory did not exist before, it will be pre-populated with the
		/// data from the most recent backup.
		/// </summary>
		/// <param name="pClientName">The client name used to define the base path</param>
		/// <param name="pBackupTime">The backup time used to identify the backup set</param>
		/// <param name="pIsTemporary">If true, returns the _temp directory</param>
		/// <param name="pCreateIfMissing">If true, the directory will be created if its missing</param>
		/// <param name="pPrepopulate">If true, the new directory will be populated with data from last backup</param>
		private static DirectoryInfo GetBackupDirectory(String pClientName, DateTime pBackupTime, Boolean pIsTemporary, Boolean pCreateIfMissing, Boolean pPrepopulate) {
			DirectoryInfo result = null;
			DirectoryInfo clientRoot = BackupHelper.GetClientRoot(pClientName, pCreateIfMissing);
			if((clientRoot != null) && clientRoot.Exists) {
				String dateDirectory = pBackupTime.ToString(DATEDIRECTORYFORMAT);
				if (pIsTemporary) {
					dateDirectory = dateDirectory + "_temp";
				}
				result = new DirectoryInfo(Path.Combine(clientRoot.FullName, dateDirectory));
				if (!result.Exists && pCreateIfMissing) {
					String latestBackup = BackupHelper.GetLatestBackupSet(clientRoot.FullName);
					result.Create();
					Logger.Log("New backup folder created: {0}", result, LogLevels.DEBUG);
					if (pPrepopulate) {
						BackupHelper.PrepopulateBackupSet(latestBackup, result.FullName);
					}
				}
			}
			return result;
		}

		/// <summary>
		/// Gets the path to the most recent backup set or null, if there ain't any
		/// </summary>
		/// <param name="pClientRoot">The root directory for the current client</param>
		private static String GetLatestBackupSet(String pClientRoot) {
			String result = null;
			DirectoryInfo[] backupSets = new DirectoryInfo(pClientRoot).GetDirectories();
			DateTime directoryDate;
			DateTime? maxDate = null;
			foreach (DirectoryInfo aDirectory in backupSets) {
				if(
					DateTime.TryParseExact(aDirectory.Name, BackupHelper.DATEDIRECTORYFORMAT, CultureInfo.InvariantCulture, DateTimeStyles.None, out directoryDate)
					&& ((maxDate == null) || (maxDate < directoryDate))
				) {
					maxDate = directoryDate;
					result = aDirectory.FullName;
				}
			}
			return result;
		}

		/// <summary>
		/// Pre-populates the backup folder with the data from the most
		/// recent backup set 
		/// </summary>
		private static void PrepopulateBackupSet(String pLatestBackupSet, String pNewBackupPath) {
			if (pLatestBackupSet != null) {
				Logger.Log("Copying files from {0} to {1}", pLatestBackupSet, pNewBackupPath, LogLevels.DEBUG);
				new DataHelper().CopyDirectory(pLatestBackupSet, pNewBackupPath);
			}
		}

		/// <summary>
		/// Removes older backups in a way, that the remaining backup sets comply with the backup
		/// retention policy, defined by the backupSetsInterval from config.json. For each interval,
		/// we will keep the oldest backup set that is just younger than the interval in minutes.
		/// </summary>
		/// <param name="pClientRoot">the root directory for backup data for the current client</param>
		/// <param name="pLatestDirectory">the directory that has just been created. We don't want to delete it.</param>
		private static void ClearPreviousBackups(DirectoryInfo pClientRoot, DirectoryInfo pLatestDirectory) {
			List<Int32> backupSetsInterval = new List<Int32>(Program.GetConfig().BackupSetsInterval);
			backupSetsInterval.Sort();
			backupSetsInterval.Reverse();
			List<DirectoryInfo> backupSets = pClientRoot.GetDirectories().ToList();
			List<DirectoryInfo> deleteBackupSets = new List<DirectoryInfo>();
			backupSets.Sort((x, y) => x.Name.CompareTo(y.Name));
			DateTime backupTime;
			DateTime utcNow = DateTime.UtcNow;
			DateTime minDate;
			Logger.Log("Current max age in minutes is {0}", backupSetsInterval[0], LogLevels.DEBUG);
			foreach (DirectoryInfo aBackupSet in backupSets) {
				minDate = utcNow.AddMinutes(backupSetsInterval[0] * -1);
				if(
					aBackupSet.FullName != pLatestDirectory.FullName
					&& DateTime.TryParseExact(aBackupSet.Name, DATEDIRECTORYFORMAT, CultureInfo.InvariantCulture, DateTimeStyles.None, out backupTime)
				) {
					if (backupTime < minDate) {
						deleteBackupSets.Add(aBackupSet);
						Logger.Log("Backup Set {0} will be deleted.", aBackupSet.Name, LogLevels.DEBUG);
					} else {
						Logger.Log("Backup Set {0} will be kept.", aBackupSet.Name, LogLevels.DEBUG);
						if (backupSetsInterval.Count > 1) {
							backupSetsInterval.RemoveAt(0);
							Logger.Log("Current max age in minutes is {0}", backupSetsInterval[0], LogLevels.DEBUG);
						} else {
							break;
						}
					}
				}
			}
			foreach(DirectoryInfo aDirectory in deleteBackupSets) {
				aDirectory.MoveTo(aDirectory.FullName + "_delete"); // we first rename it, so it will not be used to copy data from, if the next backup starts immediately
			}
			foreach(DirectoryInfo aDirectory in pClientRoot.GetDirectories("*_delete")) {
				aDirectory.Delete(true); // it happend that directories did not get deleted immediately, so we also delete old _delete directories.
			}
		}

		/// <summary>
		/// Deletes all temp folders in the client's backup directory
		/// </summary>
		private static void ClearTempDirectories(DirectoryInfo pClientRoot) {
			foreach (DirectoryInfo aDirectory in pClientRoot.GetDirectories("*_temp")) {
				Logger.Log($"Deleting temp directory {aDirectory.FullName}", LogLevels.DEBUG);
				aDirectory.Delete(true);
			}
		}

		/// <summary>
		/// Returns the client-specific root directory 
		/// </summary>
		/// <param name="pClientName">The client name</param>
		/// <param name="pCreateIfMissing">True to create missing directories</param>
		private static DirectoryInfo GetClientRoot(String pClientName, Boolean pCreateIfMissing = true) {
			if (pClientName.IndexOfAny(Path.GetInvalidPathChars()) > 0) {
				throw new Exception(String.Format("Invalid characters in backupName: {0}", pClientName));
			}
			String rootPath = Program.GetConfig().BackupPath;
			rootPath = rootPath.Replace("~", AppContext.BaseDirectory);
			Logger.Log($"Backup root path: {rootPath}", LogLevels.DEBUG);
			String clientPath = Path.Combine(rootPath, pClientName);
			if (!Directory.Exists(clientPath)) {
				if (pCreateIfMissing) {
					Directory.CreateDirectory(clientPath);
				}
			}
			return new DirectoryInfo(clientPath);
		}
	}
}