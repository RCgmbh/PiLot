using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;

using PiLot.Model.Tools;
using PiLot.Utils;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Helper used to load/save Checklist data from file
	/// </summary>
	public class ChecklistDataConnector {
		
		#region constants

		private const String DATASOURCENAME = "tools";
		private const String CHECKLISTSFILENAME = "checklists.json";
		
		#endregion

		#region instance variables

		private DataHelper helper;
		private Object lockObject = null;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public ChecklistDataConnector() {
			this.helper = new DataHelper();
			this.lockObject = new Object();
		}

		/// <summary>
		/// Creates a new ChecklistDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		public ChecklistDataConnector(String pDataRoot) {
			this.helper = new DataHelper(pDataRoot);
			this.lockObject = new Object();
		}

		#endregion

		#region public methods

		/// <summary>
		/// Returns all checklists, or an empty list of checklists
		/// </summary>
		/// <returns></returns>
		public List<Checklist> ReadChecklists() {
			List<Checklist> result = new List<Checklist>();
			FileInfo file = this.GetFile(true, CHECKLISTSFILENAME);
			if (file.Exists) {
				String fileContent = File.ReadAllText(file.FullName);
				if (!String.IsNullOrEmpty(fileContent)) {
					result = JsonSerializer.Deserialize<List<Checklist>>(fileContent);
				}
			}
			return result;
		}

		/// <summary>
		/// Inserts or updates a Checklist in the file and returns the ID
		/// </summary>
		/// <param name="pChecklist">The checklist to save, not null</param>
		/// <returns>The checklists ID</returns>
		public Int32 SaveChecklist(Checklist pChecklist) {
			lock (this.lockObject) {
				List<Checklist> allChecklists = this.ReadChecklists();
				if (pChecklist.ID != null) {
					allChecklists.RemoveAll(p => p.ID == pChecklist.ID);
				} else {
					pChecklist.ID = (allChecklists.Max(p => p.ID) ?? 0) + 1;
				}
				allChecklists.Add(pChecklist);
				this.SaveAllChecklists(allChecklists);
			}
			return pChecklist.ID.Value;
		}

		/// <summary>
		/// Saves a list of checklists to a file. ALL EXISTING DATA WILL BE REPLACED
		/// </summary>
		/// <param name="pChecklists">The list of all Checklists</param>
		public void SaveAllChecklists(List<Checklist> pChecklists) {
			lock (this.lockObject) {
				FileInfo file = this.GetFile(true, CHECKLISTSFILENAME);
				String json = null;
				try {
					json = JsonSerializer.Serialize(pChecklists);
				} catch (Exception ex) {
					Logger.Log($"ChecklistsDataConnector: Error when trying to serialize Object. Exception: {ex.Message}", LogLevels.WARNING);
					throw;
				}
				if (json != null) {
					File.WriteAllText(file.FullName, json);
				}
			}
		}

		/// <summary>
		/// Deletes a Checklist from the file
		/// </summary>
		/// <param name="pChecklistID">The id of the checklist, not null</param>
		public void DeleteChecklist(Int64 pPoiID) {
			lock (this.lockObject) {
				List<Checklist> allChecklists = this.ReadChecklists();
				allChecklists.RemoveAll(p => p.ID == pPoiID);
				this.SaveAllChecklists(allChecklists);
			}
		}

		#endregion

		#region private methods		

		/// <summary>
		/// Gets a FileInfo, creating the file if it does not exist and pCreateIfMissing is true
		/// </summary>
		private FileInfo GetFile(Boolean pCreateIfMissing, String pFileName) {
			string path = Path.Combine(this.helper.GetDataPath(DATASOURCENAME, pCreateIfMissing), pFileName);
			FileInfo result = new FileInfo(path);
			if (!result.Exists && pCreateIfMissing) {
				result.Create().Close();
			}
			return result;
		}

		#endregion

	}
}