using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json.Serialization;

namespace PiLot.Model.Logbook{

	public class LogbookDay	{

		/// <summary>
		/// Default constructor
		/// </summary>
		public LogbookDay() {
			this.LogbookEntries = new List<LogbookEntry>();
		}

		/// <summary>
		/// Constructor expecting the Date of the LogbookDay
		/// </summary>
		/// <param name="pDate">The Date (day)</param>
		public LogbookDay(Common.Date pDate) : this() {
			this.Date = pDate;
		}

		/// <summary>
		/// The Date (day)
		/// </summary>
		[JsonPropertyName("date")]
		public Common.Date Date { get; set; }

		/// <summary>
		/// The logbook diary text for this day
		/// </summary>
		[JsonPropertyName("diaryText")]
		public String DiaryText { get; set; }

		/// <summary>
		/// The list of LogbookEntries for this day
		/// </summary>
		[JsonPropertyName("logbookEntries")]
		public List<LogbookEntry> LogbookEntries { get; set; }

		/// <summary>
		/// Time of last change in UTC in seconds from Epoc, nullable
		/// for backwards compatibility
		/// </summary>
		[JsonPropertyName("dateChanged")]
		public Int32? DateChanged { get; set; }

		/// <summary>
		/// Returns true, if the LogbookDay either has a diary text
		/// or at least one lobook Entry
		/// </summary>
		[JsonIgnore]
		public Boolean HasData {
			get {
				return (this.LogbookEntries.Count > 0) || !String.IsNullOrEmpty(this.DiaryText);
			}
		}

		/// <summary>
		/// Gets the Entry with EntryID = pEntryId or null, if there is no such entry
		/// </summary>
		public LogbookEntry GetEntry(Int32 pEntryId) {
			return this.LogbookEntries.FirstOrDefault(e => e.EntryID == pEntryId);
		}

		/// <summary>
		/// Replaces an Entry, if one with the same EntryID already exists,
		/// otherwise just adds a new one. Returns true, if an item was
		/// added, returns false, if an item was replaced
		/// </summary>
		/// <returns>true: item added, false: item replaced</returns>
		public Boolean SetEntry(LogbookEntry pEntry) {
			Boolean result = true;
			if (pEntry.EntryID != null) {
				LogbookEntry existingEntry = this.LogbookEntries.FirstOrDefault(e => e.EntryID == pEntry.EntryID);
				if(existingEntry != null) {
					this.LogbookEntries.Remove(existingEntry);
					result = false;
				}
			}
			this.LogbookEntries.Add(pEntry);
			this.LogbookEntries.Sort((x, y) => x.Utc.CompareTo(y.Utc));
			return result;
		}
	}
}
