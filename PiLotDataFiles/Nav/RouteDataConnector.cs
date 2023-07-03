using System;
using System.Collections.Generic;
using System.Linq;
using System.IO;
using System.Text.Json;

using PiLot.Model.Nav;
using PiLot.Utils;
using PiLot.Utils.Logger;

namespace PiLot.Data.Files {

	/// <summary>
	/// Reads and saves Routes inlcuding Waypoints 
	/// </summary>
	public class RouteDataConnector {

		public const String DATADIR = "routes";

		#region instance variables

		private DataHelper helper;

		#endregion

		#region constructors

		/// <summary>
		/// Default constructor
		/// </summary>
		public RouteDataConnector() {
			this.helper = new DataHelper();
		}

		/// <summary>
		/// Creates a new RouteDataConnector for a specific data root path
		/// </summary>
		/// <param name="pDataRoot">root path</param>
		public RouteDataConnector(String pDataRoot) {
			this.helper = new DataHelper(pDataRoot);
		}

		#endregion

		/// <summary>
		/// Reads all routes from the dataDirectory
		/// </summary>
		public List<Route> ReadAllRoutes() {
			List<Route> result = new List<Route>();
			String routesPath = this.GetRoutesPath();
			DirectoryInfo routesDirectory = new DirectoryInfo(routesPath);
			if (routesDirectory.Exists) {
				foreach (FileInfo aFileInfo in routesDirectory.GetFiles()) {
					result.Add(this.ReadRoute(aFileInfo.Name));
				}
			} else {
				Logger.Log("Routes directory not found: {0}", routesPath, LogLevels.WARNING);
			}
			return result;
		}

		/// <summary>
		/// Tries to read a route with a certain RouteID from the filesystem. Returns
		/// null, if the route does not exist or if loading fails.
		/// </summary>
		public Route ReadRoute(Int32? pRouteID) {
			Route result = null;
			if (pRouteID != null) {
				result = this.ReadRouteFromFile(this.GetFilePath(pRouteID.Value.ToString()));
			}
			return result;
		}

		/// <summary>
		/// Tries to read a route with a certain RouteID from the filesystem. Returns
		/// null, if the route does not exist or if loading fails.
		/// </summary>
		public Route ReadRoute(String pRouteID) {
			return this.ReadRouteFromFile(this.GetFilePath(pRouteID));
		}

		/// <summary>
		/// Reads a route from a file 
		/// </summary>
		/// <param name="pFilePath">The absolute path to the route file</param>
		/// <returns>The route or null, if the file does not exist or can't be deserialized</returns>
		public Route ReadRouteFromFile(String pFilePath) {
			Route result = null;
			if (File.Exists(pFilePath)) {
				String fileContent = null;
				try {
					fileContent = File.ReadAllText(pFilePath);
					result = JsonSerializer.Deserialize<Route>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error when trying to deserialize JSON. Exception: {0}, JSON:{1}", ex.Message, fileContent, LogLevels.WARNING);
				}
			}
			return result;
		}

		/// <summary>
		/// saves pRoute as json to the datadirectory. if pRoute is null, then nothing happens.
		/// For the route and for each waypoint, an ID is created if necessary
		/// </summary>
		public void SaveRoute(Route pRoute) {
			if (pRoute != null) {
				if (pRoute.RouteID == null) {
					pRoute.RouteID = this.GetNewRouteID();
				}
				for (Int32 i = 0; i < pRoute.Waypoints.Length; i++) {
					Waypoint waypoint = pRoute.Waypoints[i];
					if (waypoint.WaypointID == null) {
						waypoint.WaypointID = this.CreateWaypointID(waypoint, pRoute);
					}
				}
				String json = null;
				try {
					json = JsonSerializer.Serialize(pRoute);
				} catch (Exception ex) {
					Logger.Log("Error when trying to serialize Object. Exception: {0}, Object:{1}", ex.Message, pRoute.Name, LogLevels.WARNING);
					throw;
				}
				if (json != null) {
					File.WriteAllText(this.GetFilePath(pRoute.RouteID.ToString()), json);
				}
			}
		}

		/// <summary>
		/// Deletes a route from the disk, if it exists
		/// </summary>
		/// <param name="pRouteID">The ID of the route to delete. With null or empty, nothing happens</param>
		/// <returns>True, if the route existed, false otherwise</returns>
		public Boolean DeleteRoute(Int32 pRouteID) {
			Boolean result = false;
			FileInfo file = new FileInfo(this.GetFilePath(pRouteID.ToString()));
			if (file.Exists) {
				file.Delete();
				result = true;
			}
			return result;
		}

		/// <summary>
		/// Returns a list of all Routes that have been changed after a certain
		/// date
		/// </summary>
		public List<Route> GetChangedData(DateTime pChangedAfter) {
			List<Route> result = new List<Route>();
			string dataPath = this.helper.GetDataPath(DATADIR);
			DirectoryInfo dataDir = new DirectoryInfo(dataPath);
			Route route;
			foreach (var aFile in dataDir.EnumerateFiles("*", SearchOption.AllDirectories)) {
				if (aFile.LastWriteTimeUtc > pChangedAfter) {
					route = this.ReadRouteFromFile(aFile.FullName);
					if (route != null) {
						result.Add(route);
					}
				}
			}
			return result;
		}

		/// <summary>
		/// returns a unique ID for a new route. This is the max ID plus one,
		/// only considering those ids which represent an INT.
		/// </summary>
		private Int32 GetNewRouteID() {
			List<Int32> ids = new List<Int32>();
			String routesPath = this.GetRoutesPath();
			DirectoryInfo routesDirectory = new DirectoryInfo(routesPath);
			Int32 testInt;
			if (routesDirectory.Exists) {
				foreach (FileInfo aFileInfo in routesDirectory.GetFiles()) {
					if (Int32.TryParse(aFileInfo.Name, out testInt)) {
						ids.Add(testInt);
					}
				}
			}
			Int32 result;
			if (ids.Count > 0) {
				result = ids.Max() + 1;
			} else {
				result = 1;
			}
			return result;
		}

		/// <summary>
		/// Creates an ID for a waypoint, in the form rnnnn where r is the route id 
		/// and n is a number between 0 and 9999. The id is unique for all waypoints,
		/// however if anywhen a waypoint should be used by multiple routes, the r
		/// part does not necessarily correspond to the route the waypoint belongs to.
		/// </summary>
		/// <param name="pWaypoint">The waypoint for which we crate an ID</param>
		/// <param name="pRoute">The Route the Waypoint belongs to</param>
		private Int32 CreateWaypointID(Waypoint pWaypoint, Route pRoute) {
			Int32 result;
			Assert.IsNotNull(pRoute?.RouteID);
			if (pWaypoint.WaypointID != null) {
				result = pWaypoint.WaypointID.Value;
			} else {
				result = pRoute.RouteID.Value * 10000;
				while (Array.Exists(pRoute.Waypoints, (w => w.WaypointID == result))) {
					result++;
				}
			}
			return result;
		}

		/// <summary>
		/// returns the absolute path to the routes directory in the filesystem. 
		/// </summary>
		private String GetRoutesPath() {
			return this.helper.GetDataPath(DATADIR, true);
		}

		/// <summary>
		/// returns the path for a file for a route with the RouteID pRouteID,
		/// which is usually data/routes/routeID
		/// </summary>
		/// <param name="pRouteID">The ID of the route</param>
		private String GetFilePath(String pRouteID) {
			return Path.Combine(this.GetRoutesPath(), pRouteID);
		}
	}
}