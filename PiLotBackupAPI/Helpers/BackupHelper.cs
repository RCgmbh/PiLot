using System;
using System.Collections.Generic;
using System.Configuration;
using System.Globalization;
using System.IO;
using System.Linq;

using PiLot.Data.Files;
using PiLot.Model.Nav;
using PiLot.Model.Logbook;
using PiLot.Utils.Logger;

namespace PiLot.Backup.API.Helpers {

	public class BackupHelper {

		public const String DATEDIRECTORYFORMAT = "yyyyMMdd-HHmm";

		public enum DataTypes { Gps = 0, DateNumberSeries = 1, BoatConfig = 2, Route = 3, Logbook = 4 }

		/// <summary>
		/// Backup GPS Data for one day
		/// </summary>
		/// <param name="pDate">The day to which the records belong</param>
		/// <param name="pRecords">The gps records to save</param>
		public static void BackupGpsData(Date pDate, List<GpsRecord> pRecords, String pClientName, DateTime pBackupTime) {
			String backupPath = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
			new GPSDataConnector(backupPath).SavePositions(pRecords, false);
			Logger.Log("Recieved {0} GpsRecords for date {1:d} to backup", pRecords.Count, pDate, LogLevels.DEBUG);
		}

		/// <summary>
		/// Backup Logbook Data for one day
		/// </summary>
		/// <param name="pDate">The day to which the records belong</param>
		/// <param name="pRecords">The gps records to save</param>
		public static void BackupLogbookData(LogbookDay pLogbookDay, String pClientName, DateTime pBackupTime) {
			String backupPath = BackupHelper.GetBackupPath(pClientName, pBackupTime, true, true);
			new LogbookDataConnector(backupPath).SaveLogbookDay(pLogbookDay, false);
			Logger.Log("Recieved LogbookDay for date {0:d} to backup", pLogbookDay.Date, LogLevels.DEBUG);
		}

		/// <summary>
		/// Backup a single Route
		/// </summary>
		/// <param name="pRecords">The route to save</param>
		public void BackupRoute(Route pRoute) {
			//new RouteDataConnector(this.backupPath).SaveRoute(pRoute);
			//Logger.Log("Recieved Route with ID {0} to backup", pRoute.RouteID, LogLevels.DEBUG);
		}

		/// <summary>
		/// This renames the temp backup folder to its definitive name, and then removes any
		/// previous backups that aren't needed anymore
		/// </summary>
		/// <param name="pClientName"></param>
		/// <param name="pBackupTime"></param>
		public static void CommitBackup(String pClientName, DateTime pBackupTime) {
			String tempPath = BackupHelper.GetBackupPath(pClientName, pBackupTime, false, true);
			String finalPath = BackupHelper.GetBackupPath(pClientName, pBackupTime, false, false);
			Directory.Move(tempPath, finalPath);
			String clientRoot = BackupHelper.GetClientRoot(pClientName, false);
			BackupHelper.ClearPreviousBackups(clientRoot);
		}

		/// <summary>
		/// Prepares the directory for one backup set. Below here, we will expect
		/// the same structure as in /data/
		/// If the directory did not exist before, it will be pre-populated with the
		/// data from the most recent backup. Also, older backups will be deleted
		/// in order to match with the configured history structure
		/// </summary>
		private static String GetBackupPath(String pClientName, DateTime pBackupTime, Boolean pCrateIfMissing, Boolean pIsTemporary) {
			String result = null;
			String clientRoot = BackupHelper.GetClientRoot(pClientName, pCrateIfMissing);
			if(clientRoot != null) {
				String dateDirectory = pBackupTime.ToString(DATEDIRECTORYFORMAT);
				if (pIsTemporary) {
					dateDirectory = dateDirectory + "_temp";
				}
				String backupPath = Path.Combine(clientRoot, dateDirectory);
				result = backupPath;
				if (!Directory.Exists(backupPath)){
					if (pCrateIfMissing) {
						String latestBackup = BackupHelper.GetLatestBackupSet(clientRoot);
						Directory.CreateDirectory(backupPath);
						Logger.Log("New backup folder created: {0}", backupPath, LogLevels.DEBUG);
						BackupHelper.PrepopulateBackupSet(latestBackup, backupPath);
					} else {
						result = null;
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
		private static void ClearPreviousBackups(String pClientRoot) {
			List<Int32> backupSetsInterval = new ConfigHelper().GetBackupSetsInterval();
			backupSetsInterval.Sort();
			backupSetsInterval.Reverse();
			List<DirectoryInfo> backupSets = new DirectoryInfo(pClientRoot).GetDirectories().ToList();
			List<DirectoryInfo> deleteBackupSets = new List<DirectoryInfo>();
			backupSets.Sort((x, y) => x.Name.CompareTo(y.Name));
			DateTime backupTime;
			DateTime utcNow = DateTime.UtcNow;
			DateTime minDate = utcNow.AddMinutes(backupSetsInterval[0] * -1);
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
							minDate = utcNow.AddMinutes(backupSetsInterval[0] * -1);
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
		/// Below this, the different backup sets are created. If the directory does
		/// not exist and pCreateIfMissing is false, the result is null.
		/// </summary>
		/// <param name="pClient">the client name, used as directory name</param>
		private static String GetClientRoot(String pClientName, Boolean pCreateIfMissing = true) {
			String result = null;
			if (pClientName.IndexOfAny(Path.GetInvalidPathChars()) > 0) {
				throw new Exception(String.Format("Invalid characters in backupName: {0}", pClientName));
			}
			String rootFolderPath = ConfigurationManager.AppSettings["backupDir"];
			String clientPath = Path.Combine(rootFolderPath, pClientName);
			if (!Directory.Exists(clientPath) && pCreateIfMissing) {
				Directory.CreateDirectory(clientPath);
				result = clientPath;
			}
			return result;
		}
	}
}