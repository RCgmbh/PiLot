using System;
using System.Collections.Generic;
using System.IO;
using PiLot.Backup.Client.Model;
using PiLot.Model.Nav;

namespace PiLot.Backup.Client.Data {

	/// <summary>
	/// Helps reading route data to back up
	/// </summary>
	internal class RouteDataConnector: PiLot.Data.Files.RouteDataConnector {

		internal RouteDataConnector() : base() { }

		/// <summary>
		/// Returns a list of all Routes that have been changed after a certain
		/// date
		/// </summary>
		public BackupTaskData<List<Route>> GetChangedData(DateTime pChangedAfter) {
			List<Route> changedRoutes = new List<Route>();
			string dataPath = this.helper.GetDataPath(DATADIR);
			DirectoryInfo dataDir = new DirectoryInfo(dataPath);
			Route route;
			Int32 totalRoutes = 0;
			foreach (var aFile in dataDir.EnumerateFiles("*", SearchOption.AllDirectories)) {
				route = this.ReadRouteFromFile(aFile.FullName);
				if (route != null) {
					if (aFile.LastWriteTimeUtc > pChangedAfter) {
						changedRoutes.Add(route);
					}
					totalRoutes++;
				}
			}
			return new BackupTaskData<List<Route>>() {
				ChangedItems = changedRoutes,
				TotalItems = totalRoutes
			};
		}
	}
}
