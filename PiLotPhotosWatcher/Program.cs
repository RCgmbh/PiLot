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

namespace PiLot.PhotosWatcher {
	
	public class Program {

		private const String PARAMWATCH = "watch";
		private const String PARAMPROCESS = "process";

		private static Boolean verbose = false;

		public static void Main(String[] args) {
			if (args.Length < 2) {
				Console.WriteLine("Usage: PhotosWatcher.exe (watchDirectory) (outputDirectory) (watch | process) [verbose]");
				return;
			}
			String action = PARAMWATCH;
			String inputPath = args[0];
			String outputPath = args[1];
			if (args.Length > 2) {
				action = args[2];
			}
			if ((args.Length > 3) && (args[3].ToLower().Equals("verbose"))) {
				Program.verbose = true;
			}
			switch (action) {
				case PARAMWATCH:
					new Watcher(inputPath, outputPath);
					break;
				case PARAMPROCESS:
					new DirectoryProcessor(inputPath, outputPath);
					break;
				default:
					Console.WriteLine("Unknown action command: {0}", action);
					break;
			}
		}

		public static void WriteLine(String pString) {
			if (Program.verbose) {
				Console.WriteLine(pString);
			}
		}

		public static void WriteLine(String pFormat, Object pArg1) {
			if (Program.verbose) {
				Console.WriteLine(pFormat, pArg1);
			}
		}

		public static void WriteLine(String pFormat, Object pArg1, Object pArg2) {
			if (Program.verbose) {
				Console.WriteLine(pFormat, pArg1, pArg2);
			}
		}
	}
}
