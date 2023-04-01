using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.IO;
using System.Linq;

using PiLot.Data.Files;
using PiLot.Model.Nav;
using PiLot.Model.Logbook;
using PiLot.Model.Sensors;
using PiLot.Utils.Logger;

namespace PiLot.Backup.API.Helpers {

	public class BackupHelper {

		public const String DATEDIRECTORYFORMAT = "yyyyMMdd-HHmm";

		/// <summary>
		/// Backup GPS Data for one day
		/// </summary>
		/// <param name="pRecords">The gps records to save</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupGpsData(List<GpsRecord> pRecords, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
			new GPSDataConnector(backupDirectory.FullName).SavePositions(pRecords, true);
			Logger.Log("Recieved {0} GpsRecords to backup", pRecords.Count, LogLevels.DEBUG);
		}

		/// <summary>
		/// Backup Logbook Data for one day
		/// </summary>
		/// <param name="pLogbookDay">The logbook day to save</param>
		/// <param name="pClientName">The client name</param>
		/// <param name="pBackupTime">The timestamp of the current backup set</param>
		public static void BackupLogbookData(LogbookDay pLogbookDay, String pClientName, DateTime pBackupTime) {
			DirectoryInfo backupDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
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
			DirectoryInfo backupDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
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
			DirectoryInfo backupDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
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
			DirectoryInfo backupDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
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
			DirectoryInfo backupDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
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
			DirectoryInfo backupDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
			new PoiDataConnector(backupDirectory.FullName).SaveAllFeatures(pData);
			Logger.Log($"Recieved {pData.Count} poi features to backup", LogLevels.DEBUG);
		}

		/// <summary>
		/// This renames the temp backup folder to its definitive name, and then removes any
		/// previous backups that aren't needed anymore
		/// </summary>
		/// <param name="pClientName"></param>
		/// <param name="pBackupTime"></param>
		public static void CommitBackup(String pClientName, DateTime pBackupTime) {
			DirectoryInfo tempDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, false, true);
			if (tempDirectory.Exists) {
				DirectoryInfo finalDirectory = BackupHelper.GetBackupPath(pClientName, pBackupTime, false, false);
				tempDirectory.MoveTo(finalDirectory.FullName);
				DirectoryInfo clientRoot = BackupHelper.GetClientRoot(pClientName, false);
				BackupHelper.ClearPreviousBackups(clientRoot);
			}			
		}

		/// <summary>
		/// Prepares the directory for one backup set. Below here, we will expect
		/// the same structure as in /data/
		/// If the directory did not exist before, it will be pre-populated with the
		/// data from the most recent backup. Also, older backups will be deleted
		/// in order to match with the configured history structure
		/// </summary>
		private static DirectoryInfo GetBackupPath(String pClientName, DateTime pBackupTime, Boolean pCrateIfMissing, Boolean pIsTemporary) {
			DirectoryInfo backupPath = null;
			DirectoryInfo clientRoot = BackupHelper.GetClientRoot(pClientName, pCrateIfMissing);
			if((clientRoot != null) && clientRoot.Exists) {
				String dateDirectory = pBackupTime.ToString(DATEDIRECTORYFORMAT);
				if (pIsTemporary) {
					dateDirectory = dateDirectory + "_temp";
				}
				backupPath = new DirectoryInfo(Path.Combine(clientRoot.FullName, dateDirectory));
				if (!backupPath.Exists){
					if (pCrateIfMissing) {
						String latestBackup = BackupHelper.GetLatestBackupSet(clientRoot.FullName);
						backupPath.Create();
						Logger.Log("New backup folder created: {0}", backupPath, LogLevels.DEBUG);
						BackupHelper.PrepopulateBackupSet(latestBackup, backupPath.FullName);
					} 
				}
			}
			return backupPath;
		}

		/// <summary>
		/// Gets the path to the most recent backup set or null, if there ain't any
		/// </summary>
		/// <param name="pClientRoot">The root directory for the current client</param>
		private static String GetLatestBackupSet(String pClientRoot) {
			String result = null;
			List<DirectoryInfo> backupSets = new DirectoryInfo(pClientRoot).GetDirectories().ToList();
			if (backupSets.Count > 0) {
				String latestBackupName = backupSets.Max(b => b.Name);
				result = backupSets.First(b => b.Name == latestBackupName).FullName;
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
		private static void ClearPreviousBackups(DirectoryInfo pClientRoot) {
			List<Int32> backupSetsInterval = new ConfigHelper().GetBackupSetsInterval();
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
				if(DateTime.TryParseExact(aBackupSet.Name, DATEDIRECTORYFORMAT, CultureInfo.InvariantCulture, DateTimeStyles.None, out backupTime)) {
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
				} else {
					Logger.Log($"Invalid date directory found: {aBackupSet.FullName}", LogLevels.WARNING);
				}
			}
			foreach(DirectoryInfo aDirectory in deleteBackupSets) {
				aDirectory.Delete(true);
			}
		}

		/// <summary>
		/// Returns the root directory path for the backup data for a certain client.
		/// Below this, the different backup sets are created. 
		/// </summary>
		/// <param name="pClientName">the client name, used as directory name</param>
		/// <param name="pCreateIfMissing">If true, the directory will be created if it does not exist yet</param>
		private static DirectoryInfo GetClientRoot(String pClientName, Boolean pCreateIfMissing = true) {
			if (pClientName.IndexOfAny(Path.GetInvalidPathChars()) > 0) {
				throw new Exception(String.Format("Invalid characters in backupName: {0}", pClientName));
			}
			String rootFolderPath = ConfigurationManager.AppSettings["backupDir"];
			rootFolderPath = rootFolderPath.Replace("~", AppContext.BaseDirectory);
			Logger.Log($"Backup root folder: {rootFolderPath}", LogLevels.DEBUG);
			String clientPath = Path.Combine(rootFolderPath, pClientName);
			if (!Directory.Exists(clientPath)) {
				if (pCreateIfMissing) {
					Directory.CreateDirectory(clientPath);
				} 
			}
			return new DirectoryInfo(clientPath);
		}
	}
}