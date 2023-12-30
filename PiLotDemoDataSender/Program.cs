using System;
using System.Collections.Generic;
using System.Configuration;
using System.Threading.Tasks;
using System.Timers;

using PiLot.APIProxy;
using PiLot.Data.Files;
using PiLot.Model.Logbook;
using PiLot.Model.Nav;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLotDemoDataSender {

	class Program {

		private const Int32 INTERVALMS = 1000;

		private static readonly PiLot.Model.Common.Date[] days = {
			new PiLot.Model.Common.Date(2020, 6, 15),
			new PiLot.Model.Common.Date(2020, 6, 19),
			new PiLot.Model.Common.Date(2020, 11, 11) 
		};

		private static readonly Int32[] routeIDs = { 2, 3, 1 };
		private const String boatName = "cruiser320";

		private static Timer timer = null;
		private static PositionProxy positionProxy = null;
		private static SettingsProxy settingsProxy = null;
		private static RoutesProxy routesProxy = null;
		private static LogbookProxy logbookProxy = null;
		private static DateTime? lastSendDate = null;
		private static PiLot.Model.Common.Date currentDay = null;
		private static Track dailyTrack = null;
		private static LogbookDay dailyLogbook = null;

		static void Main(string[] args) {
			if (args.Length > 0 && args[0] == "prepare") {
				Program.PrepareTracks();
			} else {
				Program.SetupLogging();
				Program.SetupProxies();
				Program.StartTimer();
				Console.ReadLine();
				Program.timer.Stop();
				Program.timer.Dispose();
			}
		}

		private static void SetupLogging() {
			String configLogLevel = ConfigurationManager.AppSettings["logLevel"];
			LogLevels logLevel = LogLevels.ERROR;
			Enum.TryParse<LogLevels>(configLogLevel, out logLevel);
			String logfilePath = ConfigurationManager.AppSettings["logfilePath"];
			Logger.SetupLogging(logfilePath, logLevel);
			Logger.Log("Starting DemoDataSender", LogLevels.INFO);
		}

		private static void SetupProxies() {
			String remoteAPI = ConfigurationManager.AppSettings["remoteAPI"];
			String username = ConfigurationManager.AppSettings["username"];
			String password = ConfigurationManager.AppSettings["password"];
			LoginHelper loginHelper = null;
			if (!String.IsNullOrEmpty(username) && !String.IsNullOrEmpty(password)) {
				loginHelper = new LoginHelper(remoteAPI, username, password);
			}
			Program.positionProxy = new PositionProxy(remoteAPI, loginHelper);
			Program.settingsProxy = new SettingsProxy(remoteAPI, loginHelper);
			Program.routesProxy = new RoutesProxy(remoteAPI, loginHelper);
			Program.logbookProxy = new LogbookProxy(remoteAPI, loginHelper);
		}

		/// <summary>
		/// Starts the timer
		/// </summary>
		private static void StartTimer() {
			Program.lastSendDate = DateTime.UtcNow;
			Program.timer = new Timer(INTERVALMS);
			Program.timer.Elapsed += OnTimerAsync;
			Program.timer.AutoReset = true;
			Program.timer.Enabled = true;
		}

		/// <summary>
		/// Handles the timer event. Changes the day if necessary, and sends the data
		/// </summary>
		/// <param name="source"></param>
		/// <param name="e"></param>
		private static async void OnTimerAsync(Object source, ElapsedEventArgs e) {
			DateTime now = DateTime.UtcNow;
			PiLot.Model.Common.Date today = new PiLot.Model.Common.Date(now);
			if (!PiLot.Model.Common.Date.Equals(today, Program.currentDay)) {
				Program.currentDay = today;
				await Program.PrepareDailyDataAsync();
			}
			await Program.SendDataAsync(now);
		}

		private static async Task PrepareDailyDataAsync() {
			Int32 index = Program.currentDay.Day % Program.days.Length;
			PiLot.Model.Common.Date date = Program.days[index];
			Program.dailyTrack = Program.GetDailyTrack(date);
			Int32 hoursOffset = new Random().Next(0, 8);
			Console.WriteLine($"Offset hours set to {hoursOffset}");
			Int32 offsetDays = (Int32)(Program.currentDay.ToDateTime() - date.ToDateTime()).TotalDays;
			Int32 offsetSeconds = offsetDays * 24 * 3600 + hoursOffset * 3600;
			Int64 offsetMs = (Int64)offsetSeconds * 1000;
			List<TrackPoint> records = Program.dailyTrack.TrackPoints;
			foreach (TrackPoint aRecord in records){
				aRecord.UTC = aRecord.UTC + offsetMs;
				aRecord.BoatTime = null;
			}
			LogbookDay logbookDay = new LogbookDataConnector().ReadLogbookDay(date);
			Program.dailyLogbook = new LogbookDay(Program.currentDay);
			if(logbookDay != null) {
				foreach(LogbookEntry aLogbookEntry in logbookDay.LogbookEntries) {
					aLogbookEntry.Utc += offsetSeconds;
					aLogbookEntry.BoatTime += offsetSeconds;
					aLogbookEntry.EntryID = null;
					Program.dailyLogbook.SetEntry(aLogbookEntry);
				}
			}
			Route route = new RouteDataConnector().ReadRoute(Program.routeIDs[index]);
			Console.WriteLine($"Sending current route {route.Name} to server");
			await Program.routesProxy.PutRouteAsync(route);
			Console.WriteLine($"Selecting route {route.RouteID}");
			await Program.settingsProxy.SelectRoute(route.RouteID);
			Console.WriteLine($"Selecting boat {Program.boatName}");
			await Program.settingsProxy.SelectBoatConfig(Program.boatName);
			Program.lastSendDate = DateTime.UtcNow;
		}

		private static async Task SendDataAsync(DateTime pStartTime) {
			DateTime now = DateTime.UtcNow;
			Int64 nowSeconds = DateTimeHelper.ToUnixTime(now);
			Int64 nowMs = nowSeconds * 1000;
			Int64 lastSendSeconds = DateTimeHelper.ToUnixTime(Program.lastSendDate.Value);
			Int64 lastSendMs = lastSendSeconds * 1000;
			TrackPoint[] positions = Program.dailyTrack.TrackPoints.FindAll(r => ((r.UTC > lastSendMs) && (r.UTC <= nowMs))).ToArray();
			Console.WriteLine($"Sending {positions.Length} gps positions");
			if (positions.Length > 0) {
				await Program.positionProxy.PutPositionsAsync(positions);
			}
			List<LogbookEntry> entries = dailyLogbook.LogbookEntries.FindAll(e => ((e.Utc > lastSendSeconds) && (e.Utc <= nowSeconds)));
			Console.WriteLine($"Sending {entries.Count} logbook entries");
			if (entries.Count > 0) {
				await logbookProxy.PutLogbookEntriesAsync(entries, currentDay, false);
			}
			Program.lastSendDate = now;
		}

		/// <summary>
		/// This adds gps positions between existing positions, because we only have one 
		/// Position per 10s, which makes moving a bit shaky. Therefore we just fill the
		/// gaps with some more positions, and save the files in a separate folder (temp)
		/// </summary>
		private static void PrepareTracks() {
			List<TrackPoint> records;
			Track newTrack;
			TrackPoint record1, record2;
			Int64 deltaT;
			LatLon pos1, pos2;
			LatLon splitPoint;
			Int32 newPositionCount;
			Int64 stepMS;
			foreach(PiLot.Model.Common.Date aDate in Program.days) {
				Console.WriteLine($"Preparing track for {aDate}");
				records = Program.GetDailyTrack(aDate)?.TrackPoints;
				Console.WriteLine($"Track has {records?.Count} positions");
				newTrack = new Track();
				newTrack.AddTrackPoints(records);
				if ((records != null) && (records.Count > 1)) {
					for(Int32 i = 0; i < records.Count - 1; i++) {
						record1 = records[i];
						record2 = records[i + 1];
						deltaT = record2.UTC - record1.UTC;
						if(deltaT >= 2000) {
							pos1 = new LatLon(record1.Latitude, record1.Longitude);
							pos2 = new LatLon(record2.Latitude, record2.Longitude);
							newPositionCount = (Int32)(deltaT / 1000) - 1;
							Console.WriteLine($"Adding {newPositionCount} new positions");
							stepMS = deltaT / (newPositionCount + 1);
							for (Int32 j = 0; j < newPositionCount; j++) {
								splitPoint = pos1.IntermediatePointTo(pos2, (Single)(j + 1) / (Single)(newPositionCount + 1));
								TrackPoint newRecord = new TrackPoint(splitPoint.Latitude, splitPoint.Longitude);
								newRecord.UTC = record1.UTC + (stepMS * (j + 1));
								newRecord.BoatTime = record1.BoatTime + (stepMS * (j + 1));
								newRecord.Latitude = splitPoint.Latitude;
								newRecord.Longitude = splitPoint.Longitude;
								newTrack.AddTrackPoint(newRecord);
							}
						}						
					}
				}
				Console.WriteLine($"New track has {newTrack.TrackPoints.Count} positions");
				newTrack.SortTrackPoints();
				new TrackDataConnector(ConfigurationManager.AppSettings["tempDataDir"]).SaveTrackPoints(newTrack.TrackPoints);
			}
		}

		private static Track GetDailyTrack(PiLot.Model.Common.Date pDate) {
			return new TrackDataConnector().ReadTrack(DateTimeHelper.ToJSTime(pDate.ToDateTime()), DateTimeHelper.ToJSTime(pDate.ToDateTime().AddDays(1)), true);
		}
	}
}
