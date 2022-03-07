using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Logbook;
using PiLot.Model.Boat;
using PiLot.Model.Nav;
using PiLot.Utils;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper used to load/save Logbook data from file
	/// </summary>
	public class LogbookDataConnector {

		public const String LOGBOOKDIR = "logbook";

		/// the maximum number of days to go back when looking for the latest boatSetup
		private const Int32 BOATSETUPMAXDAYS = 10;

		#region instance variables

		private DataHelper dataHelper;
		private String dataRoot = null;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public LogbookDataConnector() {
			this.dataHelper = new DataHelper();
		}

		/// <summary>
		/// Creates a new LogbookDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		public LogbookDataConnector(String pDataRoot) {
			this.dataHelper = new DataHelper(pDataRoot);
			this.dataRoot = pDataRoot;
		}

		#endregion

		/// <summary>
		/// Reads a logbookDay from the file system. Returns null, if there is no entry
		/// for that day.
		/// </summary>
		/// <param name="pDay">The day for which we want the LogbookDay</param>
		public LogbookDay ReadLogbookDay(Date pDay) {
			return this.ReadLogbookDay(new Model.Common.Date(pDay.Year, pDay.Month, pDay.Day));
		}

		/// <summary>
		/// Reads a logbookDay from the file system. Returns null, if there is no entry
		/// for that day.
		/// </summary>
		/// <param name="pDay">The day for which we want the LogbookDay</param>
		public LogbookDay ReadLogbookDay(Model.Common.Date pDay) {
			String path = this.GetLogbookFilePath(pDay, false);
			return this.ReadLogbookDay(path);
		}

		/// <summary>
		/// Returns the logbook day for the current date based on boatTime,
		/// or null, if there is no LogbookDay
		/// </summary>
		public LogbookDay ReadCurrentLogbookDay() {
			Model.Common.Date boatTimeNow = new GlobalDataConnector().GetBoatTime().Today;
			return this.ReadLogbookDay(boatTimeNow);
		}

		/// <summary>
		/// Reads a logbook day from the content of a json file
		/// </summary>
		/// <param name="pFilePath">the path to the file</param>
		/// <returns>A LogbookDay or null, if the file does not exist or can not be parsed</returns>
		public LogbookDay ReadLogbookDay(String pFilePath) {
			LogbookDay result = null;
			if (File.Exists(pFilePath)) {
				String fileContent = null;
				try {
					fileContent = File.ReadAllText(pFilePath);
					result = JsonSerializer.Deserialize<LogbookDay>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error when trying to deserialize JSON. Exception: {0}, JSON:{1}", ex.Message, fileContent, LogLevels.WARNING);
				}
			}
			return result;
		}

		/// <summary>
		/// Reads the latest BoatSetup within LogbookEntries before or at pDate, where
		/// the BoatSetup corresponds to the BoatConfig named pBoatConfig. Goes back a
		/// certain number of days, see BOATSETUPMAXDAYS and returns null, if nothing
		/// is found
		/// </summary>
		/// <param name="pDate">the day from which we search</param>
		/// <param name="pBoatConfigName">The name of the boatConfig</param>
		/// <returns>The latest BoatSetup or null</returns>
		public BoatSetup ReadLatestBoatSetup(Date pDate, String pBoatConfigName) {
			BoatSetup result = null;
			LogbookDay logbookDay;
			LogbookEntry logbookEntry;
			Date date = pDate;
			for (var i = 0; i < BOATSETUPMAXDAYS; i++) {
				logbookDay = this.ReadLogbookDay(date);
				if (logbookDay != null) {
					logbookEntry = logbookDay.LogbookEntries.LastOrDefault(e => (e.BoatSetup != null) && (e.BoatSetup.BoatConfigName == pBoatConfigName));
					if (logbookEntry != null) {
						result = logbookEntry.BoatSetup;
						break;
					}
				}
				date = date.AddDays(-1);
			}
			return result;
		}

		/// <summary>
		/// Reads logbook metadata for a certain month, returning wheter we have
		/// a track, a diary text, lobook entries and photos for each day of the month.
		/// </summary>
		/// <param name="pYear">The year</param>
		/// <param name="pMonth">The month of the year, in c#-style (1-based index)</param>
		/// <returns>List of Objects with hasTrack, hasLobgook, hasPhotos </returns>
		public List<Object> ReadLogbookMonthInfo(Int32 pYear, Int32 pMonth) {
			List<Object> result = new List<Object>();
			Date loopDate = new Date(pYear, pMonth, 1);
			Track track = new GPSDataConnector().ReadTrack(DateTimeHelper.ToJSTime(loopDate), DateTimeHelper.ToJSTime(loopDate.AddMonths(1)), true);
			Boolean hasTrack, hasLogbook, hasPhotos;
			Int64 minMS, maxMS;
			LogbookDay logbookDay;
			PhotoDataConnector photoData = new PhotoDataConnector(this.dataRoot);
			while (loopDate.Month == pMonth) {
				minMS = DateTimeHelper.ToJSTime(loopDate);
				maxMS = DateTimeHelper.ToJSTime(loopDate.AddDays(1));
				hasTrack = track.GpsRecords.Exists(r => (r.BoatTime != null) && (r.BoatTime >= minMS) && (r.BoatTime <= maxMS));
				logbookDay = this.ReadLogbookDay(loopDate);
				hasLogbook = new FileInfo(this.GetLogbookFilePath(new Model.Common.Date(loopDate), false)).Exists;
				hasPhotos = photoData.HasPhotos(loopDate);
				result.Add(new {
					hasTrack,
					hasLogbook,
					hasPhotos
				});
				loopDate = loopDate.AddDays(1);
			}
			return result;
		}

		/// <summary>
		/// saves pLogbookDay as json to the datadirectory. if pLogbookDay is null, then nothing happens.
		/// If the file exists, it will be replaced. Any LogbookEntry with EntryId null will get an ID
		/// </summary>
		/// <param name="pLogbookDay">The logbook day to save</param>
		/// <param name="pUpdateDateChanged">Optionally set false to not update the DateChanged attribute</param>
		public void SaveLogbookDay(LogbookDay pLogbookDay, Boolean pUpdateDateChanged = true) {
			if (pLogbookDay != null) {
				if (pLogbookDay.HasData) {
					if (pUpdateDateChanged) {
						pLogbookDay.DateChanged = DateTimeHelper.ToUnixTime(DateTime.UtcNow);
					}
					pLogbookDay.LogbookEntries.ForEach(e => {
						if (e.EntryID == null) {
							e.EntryID = this.CreateLogbookEntryID(e, pLogbookDay);
						}
					});
					pLogbookDay.LogbookEntries.Sort((x, y) => x.Utc.CompareTo(y.Utc));
					String json = null;
					try {
						json = JsonSerializer.Serialize(pLogbookDay);
					} catch (Exception ex) {
						Logger.Log("Error when trying to serialize Object. Exception: {0}, Object:{1:d}", ex.Message, pLogbookDay.Date, LogLevels.WARNING);
						throw;
					}
					if (json != null) {
						File.WriteAllText(this.GetLogbookFilePath(pLogbookDay.Date, true), json);
					}
				} else {
					this.DeleteEmptyLogbookDay(pLogbookDay);
				}
			}
		}

		/// <summary>
		/// Saves a logbookEntry , which is a bit tricky because we just have full logbook days.
		/// So we get the day, add or replace the entry and save the entire day.
		/// </summary>
		/// <param name="pEntry">The entry to save</param>
		/// <returns>true, if the entry was added, false if it was updated</returns>
		public Boolean SaveLogbookEntry(LogbookEntry pEntry) {
			Model.Common.Date entryDate = new Model.Common.Date(DateTimeHelper.FromUnixTime(pEntry.BoatTime));
			LogbookDay logbookDay = this.ReadLogbookDay(entryDate);
			if (logbookDay == null) {
				logbookDay = new LogbookDay(entryDate);
			}
			Boolean result = logbookDay.SetEntry(pEntry);
			this.SaveLogbookDay(logbookDay);
			return result;
		}

		/// <summary>
		/// Saves a bunch of LogbookEntries. Optionally allows to delete the existing entries. 
		/// If the Entries come from a different Logbook Day, you might want to set the EntryID 
		/// to null first. Otherwise, existing entries with the same EntryID will be replaced.
		/// </summary>
		/// <param name="pEntries">A list of Entries to add</param>
		/// <param name="pDate">The date, must match with the date used for the EntryIDs of pEntries</param>
		/// <param name="pDeleteExisting">If true, all existing Entries will be deleted</param>
		public void SaveEntries(List<LogbookEntry> pEntries, Model.Common.Date pDate, Boolean pDeleteExisting) {
			LogbookDay logbookDay = this.ReadLogbookDay(pDate);
			if (logbookDay == null) {
				logbookDay = new LogbookDay(pDate);
			}
			if (pDeleteExisting) {
				logbookDay.LogbookEntries.Clear();
			}
			foreach (LogbookEntry anEntry in pEntries) {
				Assert.IsTrue(anEntry.EntryID == null || this.EntryIDToDate(anEntry.EntryID).Equals(pDate), "Date mismatch in LogbookDataConnector.SaveEntries");
				logbookDay.SetEntry(anEntry);
			}
			this.SaveLogbookDay(logbookDay);
		}

		/// <summary>
		/// Deletes a logbookEntry by finding the LogbookDay based on the 
		/// sophisticated id logic, then removing the item and saving the
		/// day back to disk.
		/// </summary>
		/// <param name="pEntryID">The entry ID</param>
		/// <returns>True, if the item was found (and deleted)</returns>
		public Boolean DeleteLogbookEntry(Int32 pEntryID) {
			Boolean result = false;
			LogbookDay logbookDay = this.ReadLogbookDay(this.EntryIDToDate(pEntryID));
			if (logbookDay != null) {
				LogbookEntry logbookEntry = logbookDay.GetEntry(pEntryID);
				if (logbookEntry != null) {
					result = true;
					logbookDay.LogbookEntries.Remove(logbookEntry);
					if (logbookDay.HasData) {
						this.SaveLogbookDay(logbookDay);
					} else {
						this.DeleteEmptyLogbookDay(logbookDay);
					}
				}
			}
			return result;
		}

		/// <summary>
		/// Saves or overwrites the diaryText for a day.
		/// </summary>
		/// <param name="pText">The text to write</param>
		/// <param name="pDate">The day</param>
		/// <param name="pLogbookDay">The LogbookDay where the text will be added</param>
		/// <param name="pAppendText">If true, the new text will be appended to any existing text</param>
		/// <returns>True, if a new LogbookDay was created, false if the text was replaced</returns>
		public Boolean SaveDiaryText(DiaryText pText, Model.Common.Date pDate, out LogbookDay pLogbookDay, Boolean pAppendText = false) {
			Boolean isNew = false;
			pLogbookDay = this.ReadLogbookDay(pDate);
			if (pLogbookDay == null) {
				pLogbookDay = new LogbookDay();
				pLogbookDay.Date = pDate;
				isNew = true;
			}
			if (pAppendText && !String.IsNullOrEmpty(pLogbookDay.DiaryText)) {
				pLogbookDay.DiaryText += String.Concat("\n", pText.Text);
			} else {
				pLogbookDay.DiaryText = pText.Text;
			}
			if (pLogbookDay.HasData) {
				this.SaveLogbookDay(pLogbookDay);
			} else {
				this.DeleteEmptyLogbookDay(pLogbookDay);
			}
			return isNew;
		}

		/// <summary>
		/// Returns a list of all GPS records that have been changed after a certain
		/// date, clustered by date
		/// </summary>
		/// <returns></returns>
		public List<LogbookDay> GetChangedData(DateTime pChangedAfter) {
			List<LogbookDay> result = new List<LogbookDay>();
			string dataPath = this.dataHelper.GetDataPath(LOGBOOKDIR);
			DirectoryInfo dataDir = new DirectoryInfo(dataPath);
			LogbookDay logbookDay;
			foreach (var aFile in dataDir.EnumerateFiles("*", SearchOption.AllDirectories)) {
				if (aFile.LastWriteTimeUtc > pChangedAfter) {
					logbookDay = this.ReadLogbookDay(aFile.FullName);
					if (logbookDay != null) {
						result.Add(logbookDay);
					}
				}
			}
			return result;
		}

		/// <summary>
		/// This checks, if the logbook has no entry and no diary text, and in that case
		/// deletes the logbook file, if one exists. Returns true, if there is no data
		/// in the logbook
		/// </summary>
		/// <param name="pLogbookDay">A LogbookDay with no data</param>
		private void DeleteEmptyLogbookDay(LogbookDay pLogbookDay) {
			Assert.IsFalse(pLogbookDay.HasData);
			String filePath = this.GetLogbookFilePath(pLogbookDay.Date, false);
			if (File.Exists(filePath)) {
				File.Delete(filePath);
			}
		}

		/// <summary>
		/// Creates an ID for a logbookEntry, in the form
		/// yyyymmddnn, where n is a number between 0 and 99. The id is unique, given
		/// we only have one LogbookDay per day
		/// </summary>
		/// <param name="pLogbookEntry">The logbookEntry for which we crate an ID</param>
		/// <param name="pLogbookDay">The LogbookDay the Entry belongs to</param>
		private Int32 CreateLogbookEntryID(LogbookEntry pLogbookEntry, LogbookDay pLogbookDay) {
			Int32 result;
			if (pLogbookEntry.EntryID != null) {
				result = pLogbookEntry.EntryID.Value;
			} else {
				Date date = new Date(pLogbookDay.Date.ToDateTime());
				result = (date.Year * 1000000) + (date.Month * 10000) + (date.Day * 100);
				while (pLogbookDay.LogbookEntries.Exists(e => e.EntryID == result)) {
					result++;
				}
			}
			return result;
		}

		/// <summary>
		/// Calculates the date a certain EntryID refers to. The EntryId is calculated
		/// by (date.Year * 1000000) + (date.Month * 10000) + (date.Day * 100) plus a
		/// 2-digit incrementing number.
		/// </summary>
		/// <param name="pEntryID"></param>
		/// <returns>a Date or null, if pEntryID is null</returns>
		private Model.Common.Date EntryIDToDate(Int32? pEntryID) {
			Model.Common.Date result = null;
			if (pEntryID != null) {
				Int32 year = (Int32)Math.Floor(pEntryID.Value / 1000000f);
				Int32 month = (Int32)Math.Floor((pEntryID.Value % 1000000) / 10000f);
				Int32 day = (Int32)Math.Floor((pEntryID.Value % 10000) / 100f);
				result = new Model.Common.Date(year, month, day);
			}
			return result;
		}

		/// <summary>
		/// returns the path for a file for a logbookDay with Date pLogbookDay
		/// which is usually data/logbook/yyyy/MM/dd. If the folders don't exist,
		/// they are automatically created if pCreateMissingFolder is true
		/// </summary>
		private String GetLogbookFilePath(Model.Common.Date pLogbookDay, Boolean pCreateMissingFolder) {
			String logbookRootPath = this.dataHelper.GetDataPath(LOGBOOKDIR, pCreateMissingFolder);
			String datePath = Path.Combine(logbookRootPath, pLogbookDay.Year.ToString("0000"), pLogbookDay.Month.ToString("00"));
			if (!Directory.Exists(datePath) && pCreateMissingFolder) {
				Directory.CreateDirectory(datePath);
			}
			return Path.Combine(datePath, pLogbookDay.Day.ToString("00") + ".json");
		}
	}
}