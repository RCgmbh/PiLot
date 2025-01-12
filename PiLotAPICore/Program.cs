/**
 * (c) 2021 R�thenmund Consulting GmbH
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

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;

using PiLot.Utils.Logger;

namespace PiLot.API {

	public class Program {

		public const String APIROOT = "pilotapi/v1/";
		private static Dictionary<String, Object> application;

		public static void Main(string[] args) {
			Program.SetupLogger();
			Program.application = new Dictionary<string, object>();
			CreateHostBuilder(args).Build().Run();
		}

		public static IHostBuilder CreateHostBuilder(string[] args) =>
			Host.CreateDefaultBuilder(args)
				.ConfigureWebHostDefaults(webBuilder => {
					webBuilder.UseStartup<Startup>();
				});

		/// <summary>
		/// We keep a Dictionary of application-level objects which
		/// can be accessed using the respective key
		/// </summary>
		/// <param name="pKey"></param>
		/// <returns>The item for pKey or null, if there is no such item</returns>
		public static Object GetApplicationObject(String pKey) {
			Object result = null;
			if (Program.application.ContainsKey(pKey)) {
				result = Program.application[pKey];
			}
			return result;
		}

		/// <summary>
		/// Sets an object to the application-wide Dictionary, or replaces
		/// the object if there is already one with that key.
		/// </summary>
		public static void SetApplicationObject(String pKey, Object pValue) {
			Program.application[pKey] = pValue;
		}

		private static void SetupLogger() {
			String configLogLevel = ConfigurationManager.AppSettings["logLevel"];
			LogLevels logLevel = LogLevels.ERROR;
			Enum.TryParse<LogLevels>(configLogLevel, out logLevel);
			String logfilePath = ConfigurationManager.AppSettings["logfilePath"];
			String logStackTrace = ConfigurationManager.AppSettings["logStackTrace"];
			Logger.SetupLogging(logfilePath, logLevel, logStackTrace == Boolean.TrueString);
			Logger.Log("PiLot.API is starting", LogLevels.INFO);
		}
	}
}
