using System;
using System.Collections.Generic;
using System.IO;
using PiLot.Backup.Client.Model;
using PiLot.Model.Tools;

namespace PiLot.Backup.Client.Data {

	/// <summary>
	/// Helps reading route data to back up
	/// </summary>
	internal class ChecklistDataConnector: PiLot.Data.Files.ChecklistDataConnector {

		internal ChecklistDataConnector() : base() { }

		/// <summary>
		/// Returns a list of eihter all checklists or none, depending on whether 
		/// the checklists file has been changed or not.
		/// date
		/// </summary>
		public BackupTaskData<List<Checklist>> GetChangedData(DateTime pChangedAfter) {
			List<Checklist> checklists;
			FileInfo file = this.GetFile(false);
			List<Checklist> allChecklists = this.ReadChecklists();
			if(file.LastWriteTimeUtc >= pChangedAfter){
				checklists = allChecklists;
			} else {
				checklists = new List<Checklist>();
			}
			return new BackupTaskData<List<Checklist>>() {
				ChangedItems = checklists,
				TotalItems = allChecklists.Count
			};
		}
	}
}
