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

using PiLot.Model.Common;
using PiLot.Backup.Client.Helper;
using PiLot.Backup.Client.Model;
using PiLot.Backup.Client.Proxies;
using PiLot.Utils.Logger;
using PiLot.APIProxy;

namespace PiLot.Backup.Client {

	/// <summary>
	/// Console app that sends changed data to the backup api within an interval. This 
	/// is intended to run as a service.
	/// </summary>
	class Program {

		private const Int32 TIMERINTERVALMS = 1000 * 60 * 5;
		private static Boolean busy = false;
		private static ConfigHelper configHelper;

		/// <summary>
		/// Usage: ./PiLot.Backup.Client [verbose] 
		/// </summary>
		/// <param name="args">Add "verbose" so that the output is written to the console instead of the log</param>
		static async Task Main(string[] args) {
			Program.ReadLogConfig();
			Logger.Log("Starting PiLot.Backup.Client", LogLevels.INFO);
			List<String> argsList = args.ToList();
			if (argsList.Any(a => a == "-i")) {
				Out.SetMode(Out.Modes.Console);
				await StartInteractiveSession();
			} else {
				Boolean verbose = argsList.Any(a => a.ToLower() == "verbose");
				if (verbose) {
					Out.SetMode(Out.Modes.Console);
				}
				Program.StartTimer();
			}
		}

		private static async Task StartInteractiveSession() {
			Program.configHelper = new ConfigHelper();
			List<BackupTarget> targets = Program.configHelper.BackupTargets;
			BackupTarget selectedTarget = null;
			Boolean fullBackup = false;
			Boolean validEntry = false;
			Boolean quit = false;
			Console.Clear();
			Console.WriteLine("******************************************");
			Console.WriteLine("| PiLot Backup Client - Interactive Mode |");
			Console.WriteLine("******************************************");
			Thread.Sleep(500);
			while (!quit) {
				validEntry = false;
				while (!validEntry && !quit) {
					Console.WriteLine("\nPlease select a backup target. Hit X to quit.");
					Console.WriteLine("0: all targets");
					for (Int32 i = 0; i < targets.Count; i++) {
						Console.WriteLine($"{i + 1}: {targets[i].TargetUrl}");
					}
					Char input = (Console.ReadKey().KeyChar);
					Console.WriteLine();
					if (input.ToString().ToLower() == "x") {
						quit = true;
					} else if (input == '0') {
						validEntry = true;
					} else if (Int32.TryParse(input.ToString(), out Int32 inputNumber) && inputNumber > 0 && inputNumber <= targets.Count) {
						validEntry = true;
						selectedTarget = targets[inputNumber - 1];
					} else {
						Console.ForegroundColor = ConsoleColor.Red;
						Console.WriteLine($"Invalid entry: {input}");
						Thread.Sleep(300);
						Console.ForegroundColor = ConsoleColor.Gray;
						validEntry = false;
					}
				}
				validEntry = false;
				while (!validEntry && !quit) {
					Console.WriteLine("\nPlease select the backup type. 1: differential, 2: full. Hit X to quit.");
					String input = (Console.ReadKey().KeyChar).ToString().ToLower();
					Console.WriteLine();
					switch (input) {
						case "x":
							quit = true;
							break;
						case "1":
							validEntry = true;
							fullBackup = false;
							break;
						case "2":
							validEntry = true;
							fullBackup = true;
							break;
						default:
							Console.ForegroundColor = ConsoleColor.Red;
							Console.WriteLine($"Invalid entry: {input}");
							Thread.Sleep(300);
							Console.ForegroundColor = ConsoleColor.Gray;
						break;
					}
				}
				if (!quit) {
					String backupTyp = fullBackup ? "full" : "differential";
					String targetName = selectedTarget == null ? "all targets" : $"target {selectedTarget.TargetUrl}";
					Console.WriteLine($"\nYou selected a {backupTyp} backup for {targetName}. Hit any key to start the backup, or X to quit.");
					String input = (Console.ReadKey().KeyChar).ToString().ToLower();
					Console.WriteLine();
					if (input != "x") {
						if (selectedTarget == null) {
							await Program.BackupAllTargetsAsync(fullBackup);
						} else {
							await Program.BackupTargetAsync(selectedTarget, fullBackup);
						}
					}
					Console.WriteLine();
				}
			}
			Console.WriteLine("Bye");
			Thread.Sleep(1000);
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
			while (true) {
				Program.TimerEventAsync();
				Thread.Sleep(TIMERINTERVALMS);
			}
		}

		/// <summary>
		/// Starts the Backup, if not a backup is still running.
		/// </summary>
		private static async void TimerEventAsync() {
			if (!Program.busy) {
				Program.busy = true;
				await Program.BackupAllTargetsAsync(false);
				Program.busy = false;
			}			
		}

		/// <summary>
		/// Performs the backup for each target, if the target is reachable, and finally commits
		/// the backup and updates the lastSuccess date if everything goes well
		/// </summary>
		private static async Task BackupAllTargetsAsync(Boolean pFullBackup) {
			Program.configHelper = new ConfigHelper();
			Out.WriteDebug($"Found {configHelper.BackupTargets.Count} Backup Targets");
			foreach (BackupTarget aTarget in configHelper.BackupTargets) {
				await Program.BackupTargetAsync(aTarget, pFullBackup);
			}
		}

		/// <summary>
		/// Performs the backup for one specific target.
		/// </summary>
		/// <param name="pTarget">The backup target</param>
		/// <param name="pFullBackup">true, to perform a full backup</param>
		private static async Task BackupTargetAsync(BackupTarget pTarget, Boolean pFullBackup) {
			DateTime backupDate = DateTime.UtcNow;
			BackupServiceProxy proxy;
			proxy = new BackupServiceProxy(pTarget.TargetUrl, pTarget.Username, pTarget.Password);
			Out.WriteInfo($"Starting Backup for target {pTarget.TargetUrl}");
			BackupTaskResult backupTaskResult;
			List<BackupTaskResult> backupTaskResults = new();
			if (await proxy.PingAsync()) {
				Boolean success = true;
				if (pFullBackup) {
					success = success && await proxy.PrepareAsync(backupDate, true);
				}
				foreach (BackupTask aTask in pTarget.BackupTasks) {
					Out.WriteDebug($"Starting Backup for task {aTask.DataType}: {aTask.DataSource}");
					if (pFullBackup) {
						Out.WriteInfo($"Performing full backup");
						aTask.LastSuccess = null;
					}
					backupTaskResult = await Program.PerformBackupTaskAsync(aTask, proxy, backupDate);
					backupTaskResults.Add(backupTaskResult);
					success = success && (backupTaskResult.Success);
				}
				if (success) {
					success = success && await Program.VerifyBackupAsync(backupDate, backupTaskResults, proxy, pFullBackup);
				}
				if (success) {
					success = success && await proxy.CommitAsync(backupDate);
				}
				if (success) {
					pTarget.BackupTasks.ForEach(t => t.LastSuccess = backupDate);
					Program.configHelper.SaveConfig();
					Out.WriteInfo($"Finished Backup for target {pTarget.TargetUrl}");
				} else {
					Out.WriteInfo($"Backup for target {pTarget.TargetUrl} failed");
				}
			} else {
				Out.WriteInfo($"Did not start backup because target {pTarget.TargetUrl} can not be reached");
			}
		}

		private static async Task<Boolean> VerifyBackupAsync(DateTime pBackupDate, List<BackupTaskResult> pBackupTaskResults, BackupServiceProxy pProxy, Boolean pFullBackup) {
			List<BackupTaskResult> resultsToCheck;
			if (pFullBackup) {
				resultsToCheck = pBackupTaskResults;
			} else {
				resultsToCheck = pBackupTaskResults.Where(t => t.BackupTask.DataType != DataTypes.Photos && t.BackupTask.DataType != DataTypes.Routes).ToList();
			}
			List<DataSource> dataScources = resultsToCheck.Select(t => new DataSource(t.BackupTask.DataType, t.BackupTask.DataSource)).ToList();
			ProxyResult<List<Int32>> proxyResult = await pProxy.GetSummaryAsync(dataScources, pBackupDate);
			Boolean result;
			if (proxyResult.Success) {
				List<Int32> backupSummaryItems = proxyResult.Data;
				result = true;
				for (Int32 i = 0; i < resultsToCheck.Count; i++) {
					if(resultsToCheck[i].TotalDataCount != backupSummaryItems[i]) {
						result = false;
						Out.WriteError($"PiLot.Backup.Client Verification mismatch: expected: {resultsToCheck[i].TotalDataCount}, in backup: {backupSummaryItems[i]}, data source: {pBackupTaskResults[i].BackupTask.DataSource}");
					}
				}
				if (result) {
					Out.WriteInfo("Verification successful");
				}
			} else {
				Out.WriteError($"BackupServiceProxy: Verification failed. Error calling serfer: {proxyResult.Message}");
				result = false;
			}
			return result;
		}

		/// <summary>
		/// Performs one single BackupTask
		/// </summary>
		/// <param name="pTask">The task to be performed</param>
		/// <param name="pProxy">The proxy, created for the Task's backup target</param>
		/// <param name="pBackupTime">A DateTime to be used for each backupTask in order to get one single BackupSet</param>
		private static async Task<BackupTaskResult> PerformBackupTaskAsync(BackupTask pTask, BackupServiceProxy pProxy, DateTime pBackupTime) {
			IBackupHelper backupHelper = null;
			BackupTaskResult result;
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
				case DataTypes.POIs:
					backupHelper = new PoisBackupHelper(pProxy);
					break;
				case DataTypes.Photos:
					backupHelper = new PhotoBackupHelper(pProxy);
					break;
				default:
					Logger.Log($"PerformBackupTaskAsync: Unknown DataType: {pTask.DataType}. Skipping", LogLevels.WARNING);
					break;
			}
			if (backupHelper != null) {
				DateTime backupDate = DateTime.UtcNow;
				result = await backupHelper.PerformBackupTaskAsync(pTask, pBackupTime);
			} else {
				result = new BackupTaskResult(pTask, false, 0);
			}
			return result;
		}
	}
}
