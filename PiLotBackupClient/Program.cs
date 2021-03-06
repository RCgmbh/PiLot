/*
(c) 2021 Röthenmund Consulting GmbH

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 
The full license text is available at https://github.com/RCgmbh/PiLot/blob/master/LICENSE.
*/
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

using PiLot.Backup.Client.Helper;
using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Utils.Logger;

namespace PiLot.Backup.Client {

	class Program {

		private const Int32 TIMERINTERVALMS = 1000 * 60 * 5;
		private static Boolean busy = false;

		/// <summary>
		/// Usage: ./PiLot.Backup.Client [verbose] 
		/// </summary>
		/// <param name="args">Add "verbose" so that the output is written to the console instead of the log</param>
		static void Main(string[] args) {
			Program.ReadLogConfig();
			Logger.Log("Starting PiLot.Backup.Client", LogLevels.INFO);

			List<String> argsList = args.ToList();
			Boolean verbose = argsList.Any(a => a.ToLower() == "verbose");
			if (verbose) {
				Out.SetMode(Out.Modes.Console);
			}
			Program.StartTimer();
		}

		/// <summary>
		/// Reads the configuration for logging and sets up the logger
		/// </summary>
		private static void ReadLogConfig() {
			String configLogLevel = ConfigurationManager.AppSettings["logLevel"];
			LogLevels logLevel = LogLevels.ERROR;
			Enum.TryParse<LogLevels>(configLogLevel, out logLevel);
			String logfilePath = ConfigurationManager.AppSettings["logfilePath"];
			Logger.SetupLogging(logfilePath, logLevel);
		}

		/// <summary>
		/// This is some kind of self made Timer
		/// </summary>
		private static void StartTimer() {
			DateTime start, end;
			Int32 sleepMS;
			while (true) {
				start = DateTime.UtcNow;
				Program.TimerEventAsync();
				end = DateTime.UtcNow;
				sleepMS = TIMERINTERVALMS - (Int32)(end - start).TotalMilliseconds;
				if (sleepMS > 0) {
					Thread.Sleep(sleepMS);
				}
			}
		}

		/// <summary>
		/// Starts the Backup, if not a backup is still running.
		/// </summary>
		private static async void TimerEventAsync() {
			if (!Program.busy) {
				Program.busy = true;
				await Program.PerformBackup();
				Program.busy = false;
			}			
		}

		/// <summary>
		/// Performs the backup for each target, if the target is reachable, and finally commits
		/// the backup and updates the lastSuccess date if everything goes well
		/// </summary>
		private static async Task PerformBackup() {
			ConfigHelper configHelper = new ConfigHelper();
			Out.WriteDebug($"Found {configHelper.BackupTargets.Count} Backup Targets");
			Boolean success = true;
			DateTime backupDate = DateTime.UtcNow;
			BackupServiceProxy proxy;
			foreach (BackupTarget aTarget in configHelper.BackupTargets) {
				proxy = new BackupServiceProxy(aTarget.TargetUrl, aTarget.Username, aTarget.Password);
				Out.WriteInfo($"Starting Backup for target {aTarget.TargetUrl}");
				if (await proxy.PingAsync()) {
					foreach (BackupTask aTask in aTarget.BackupTasks) {
						Out.WriteDebug($"Starting Backup for task {aTask.DataType}: {aTask.DataSource}");
						success = success && await Program.PerformBackupTaskAsync(aTask, proxy, backupDate);
					}
					if (success) {
						success = success && await proxy.CommitAsync(backupDate);
					}
					if (success) {
						aTarget.BackupTasks.ForEach(t => t.LastSuccess = backupDate);
						configHelper.SaveConfig();
						Out.WriteInfo($"Finished Backup for target {aTarget.TargetUrl}");
					} else {
						Out.WriteInfo($"Backup for target {aTarget.TargetUrl} failed");
					}
					
				} else {
					Out.WriteInfo($"Did not start backup because target {aTarget.TargetUrl} can not be reached");
				}
			}
		}

		/// <summary>
		/// Performs one single BackupTask
		/// </summary>
		/// <param name="pTask">The task to be performed</param>
		/// <param name="pProxy">The proxy, created for the Task's backup target</param>
		/// <param name="pBackupTime">A DateTime to be used for each backupTask in order to get one single BackupSet</param>
		private static async Task<Boolean> PerformBackupTaskAsync(BackupTask pTask, BackupServiceProxy pProxy, DateTime pBackupTime) {
			IBackupHelper backupHelper = null;
			Boolean result = true;
			switch (pTask.DataType) {
				case DataTypes.GPS:
					backupHelper = new GpsBackupHelper(pProxy);
					break;
				case DataTypes.Logbook:
					backupHelper = new LogbookBackupHelper(pProxy);
					break;
				case DataTypes.Routes:
					backupHelper = new RouteBackupHelper(pProxy);
					break;
				case DataTypes.SensorData:
					backupHelper = new SensorDataBackupHelper(pProxy);
					break;
			}
			if (backupHelper != null) {
				DateTime backupDate = DateTime.UtcNow;
				result = await backupHelper.PerformBackupTaskAsync(pTask, pBackupTime);
			}
			return result;
		}
	}
}
