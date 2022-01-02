/**
 * (c) 2021 Röthenmund Consulting GmbH
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *  
 * The full license text is available at https://github.com/Didosa/pilotCore/blob/master/LICENSE.
 *  
 * THIS PROGRAM DOES IN NO WAY REPLACE SUITABLE NAVIGATION EQUIPMENT, UP-TO-DATE OFFICIAL CHARTS OR EDUCATED SEAMANSHIP.
 **/
using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using PiLot.APIProxy;
using PiLot.Model.Logbook;
using PiLot.Model.Nav;
using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.LiveClient {

	/// <summary>
	/// This sends position data to a server, so that the track can be 
	/// watched using the magic of the Interwebs.
	/// </summary>
	public class Program {

		private static PublishingConfig publishingConfig;
		private static PositionProxy localPositionProxy;
		private static PositionProxy remotePositionProxy;
		private static LogbookProxy localLogbookProxy;
		private static LogbookProxy remoteLogbookProxy;
		private static Int64? lastPositionTimestamp = null;	// milliseconds
		private static Int32? lastLogbookTimestamp = null;  // seconds!

		static void Main(String[] args) {
			try {
				Program.ReadConfig();
				Logger.Log("Starting LiveClient", LogLevels.INFO);
				Program.SetupProxies();
				Program.StartTimer();
			} catch (Exception ex) {
				Logger.Log(ex, "PiLot.LiveClient");
				throw;
			}
		}

		/// <summary>
		/// Reads the config from the app config as well as the config.json file
		/// </summary>
		private static void ReadConfig() {
			String configLogLevel = ConfigurationManager.AppSettings["logLevel"];
			LogLevels logLevel = LogLevels.ERROR;
			Enum.TryParse<LogLevels>(configLogLevel, out logLevel);
			String logfilePath = ConfigurationManager.AppSettings["logfilePath"];
			Logger.SetupLogging(logfilePath, logLevel);
			String configFilePath = Path.Combine(AppContext.BaseDirectory, "config.json");
			if (File.Exists(configFilePath)) {
				String fileContent = File.ReadAllText(configFilePath);
				Program.publishingConfig = JsonSerializer.Deserialize<PublishingConfig>(fileContent);
			} else {
				Logger.Log($"Exiting LiveClient because config file was not found at {configFilePath}", LogLevels.ERROR);
				throw new FileNotFoundException("The config file could not be found", configFilePath);
			}
		}

		/// <summary>
		/// Creates the proxy instances used to read from the local API 
		/// and send data to the remote API
		/// </summary>
		private static void SetupProxies() {
			PublishingConfig config = Program.publishingConfig;
			LoginHelper loginHelper = new LoginHelper(config.RemoteAPI, config.Username, config.Password);
			Program.localPositionProxy = new PositionProxy(config.LocalAPI, null);
			Program.remotePositionProxy = new PositionProxy(config.RemoteAPI, loginHelper);
			Program.localLogbookProxy = new LogbookProxy(config.LocalAPI, null);
			Program.remoteLogbookProxy = new LogbookProxy(config.RemoteAPI, loginHelper);
		}

		/// <summary>
		/// This is some kind of self made Timer, as starting the System.Threading.Timer and
		/// waiting for Console.ReadLine() didn't work well within the systemd service.
		/// </summary>
		private static void StartTimer() {
			DateTime start, end;
			while (true) {
				start = DateTime.UtcNow;
				try {
					Program.SendPositionDataAsync();
					Program.SendLogbookDataAsync();
				} catch (Exception ex) {
					Logger.Log(ex, "PiLot.LiveClient");
				}
				end = DateTime.UtcNow;
				Int32 sleepMS = Program.publishingConfig.Interval * 1000 - (Int32)(end - start).TotalMilliseconds;
				if (sleepMS > 0) {
					Thread.Sleep(sleepMS);
				}
			}
		}

		/// <summary>
		/// Reads the latest position data from the local api and sends it
		/// to the remote api
		/// </summary>
		private async static void SendPositionDataAsync() {
			if (Program.lastPositionTimestamp == null) {
				Program.lastPositionTimestamp = DateTimeHelper.JSNow;
			}
			List<GpsRecord> records = await Program.localPositionProxy.GetLatestPositions(lastPositionTimestamp.Value);
			Logger.Log($"LiveClient recieved {records.Count} Records from local API", LogLevels.DEBUG);
			if (records.Count > 0) {
				if (await Program.remotePositionProxy.PutPositionsAsync(records.ToArray())) {
					Logger.Log($"LiveClient sent {records.Count} Records to remote API", LogLevels.DEBUG);
					Program.lastPositionTimestamp = records.Max(r => r.UTC);
				}
			}
		}

		/// <summary>
		/// Sends the entire current logbookDay to the live server, if anything
		/// changed since last time
		/// </summary>
		private async static void SendLogbookDataAsync() {
			if (Program.lastLogbookTimestamp == null) {
				Program.lastLogbookTimestamp = DateTimeHelper.UnixNow;
			}
			LogbookDay logbookDay = (await Program.localLogbookProxy.GetTodayLogbookDayAsync()).Data;
			Logger.Log($"LiveClient recieved LogbookDay from local API: {logbookDay}", LogLevels.DEBUG);
			if(logbookDay != null && logbookDay.DateChanged > Program.lastLogbookTimestamp) {
				if (await Program.remoteLogbookProxy.PutLogbookDayAsync(logbookDay)) {
					Logger.Log($"LiveClient sent LogbookDay with {logbookDay.LogbookEntries.Count} entries to remote API", LogLevels.DEBUG);
					Program.lastLogbookTimestamp = logbookDay.DateChanged;
				}
			}
		}
	}
}