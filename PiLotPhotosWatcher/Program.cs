/**
 * (c) 2021 Röthenmund Consulting GmbH
 * 
 * This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 *  
 * The full license text is available at https://github.com/RCgmbh/PiLot/blob/master/LICENSE.
 *  
 * THIS PROGRAM DOES IN NO WAY REPLACE SUITABLE NAVIGATION EQUIPMENT, UP-TO-DATE OFFICIAL CHARTS OR EDUCATED SEAMANSHIP.
 **/
using System;
using System.Collections.Generic;
using System.Configuration;

using PiLot.Utils.Logger;

namespace PiLot.PhotosWatcher {
	
	public class Program {

		private const String PARAMWATCH = "watch";
		private const String PARAMPROCESS = "process";
		private const String PARAMVERBOSE = "verbose";

		private static Boolean verbose = false;

		public static void Main(String[] args) {
			if (args.Length < 2) {
				Console.WriteLine("Usage: PhotosWatcher.exe (watchDirectory) (outputDirectory) [watch] [process] [verbose]");
				return;
			}
			Program.ReadConfig();
			Logger.Log("PiLot.PhotosWatcher started", LogLevels.INFO);
			Boolean doWatch, doProcess;
			String inputPath = args[0];
			String outputPath = args[1];
			List<String> argList = new List<string>(args);
			doWatch = (argList.Exists(e => e.ToLower().Equals(PARAMWATCH)));
			doProcess = (argList.Exists(e => e.ToLower().Equals(PARAMPROCESS)));
			Program.verbose = (argList.Exists(e => e.ToLower().Equals(PARAMVERBOSE)));
			if (doProcess) {
				DirectoryProcessor.ProcessDirectory(inputPath, outputPath);
			}
			if (doWatch) {
				new Watcher(inputPath, outputPath);
			}
		}

		private static void ReadConfig() {
			String configLogLevel = ConfigurationManager.AppSettings["logLevel"];
			LogLevels logLevel = LogLevels.ERROR;
			Enum.TryParse<LogLevels>(configLogLevel, out logLevel);
			String logfilePath = ConfigurationManager.AppSettings["logfilePath"];
			Logger.SetupLogging(logfilePath, logLevel);
		}

		public static void WriteLine(String pString) {
			if (Program.verbose) {
				Console.WriteLine(pString);
			} else {
				Logger.Log(pString, LogLevels.DEBUG);
			}
		}

		public static void WriteLine(String pFormat, Object pArg1) {
			if (Program.verbose) {
				Console.WriteLine(pFormat, pArg1);
			} else {
				Logger.Log(pFormat, pArg1, LogLevels.DEBUG);
			}
		}

		public static void WriteLine(String pFormat, Object pArg1, Object pArg2) {
			if (Program.verbose) {
				Console.WriteLine(pFormat, pArg1, pArg2);
			} else {
				Logger.Log(pFormat, pArg1, pArg2, LogLevels.DEBUG);
			}
		}
	}
}
