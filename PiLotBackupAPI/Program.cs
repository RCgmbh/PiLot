/**
 (c) 2021 Röthenmund Consulting GmbH
 
 This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
 the Free Software Foundation, either version 3 of the License, or any later version.
 
 This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
  
 The full license text is available at https://github.com/RCgmbh/PiLot/blob/master/LICENSE.
  
 **/
using System;
using System.Collections.Generic;
using System.Configuration;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using PiLot.Backup.API.Helpers;
using PiLot.Utils.Logger;

namespace PiLot.Backup.API {

	public class Program {

		public const String APIROOT = "pilotbackupapi/v1/";
		private static Dictionary<String, Object> application;
		private static Helpers.Config config;

		public static void Main(string[] args) {
			Program.SetupLogger();
			Program.config = ConfigHelper.ReadConfig();
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

		/// <summary>
		/// Returns the config object for the application
		/// </summary>
		public static Helpers.Config GetConfig() {
			return Program.config;
		}

		/// <summary>
		/// Sets up the logger based on the settings in app.config
		/// </summary>
		private static void SetupLogger() {
			String configLogLevel = ConfigurationManager.AppSettings["logLevel"];
			LogLevels logLevel = LogLevels.ERROR;
			Enum.TryParse<LogLevels>(configLogLevel, out logLevel);
			String logfilePath = ConfigurationManager.AppSettings["logfilePath"];
			logfilePath = logfilePath.Replace("~", AppContext.BaseDirectory);
			Logger.SetupLogging(logfilePath, logLevel);
			Logger.Log("PiLot.Backup.API is starting", LogLevels.INFO);
		}
	}
}
