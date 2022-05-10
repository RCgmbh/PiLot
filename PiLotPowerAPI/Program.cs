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
using System.Configuration;
using System.Device.Gpio;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using PiLot.Utils.Logger;

namespace PiLot.PowerAPI {
	
	/// <summary>
	/// The Main Program. This not only starts the API, but also initializes everything
	/// that's needed to make the leds blink, and handle the button inputs.
	/// </summary>
	public class Program {

		static ChargeManager chargeManager = null;

		public static void Main(string[] args) {
			Program.SetupLogger();
			GpioController controller = GPIOManager.Instance.GpioController;
			PowerManager powerManager = new PowerManager(controller);
			Program.chargeManager = new ChargeManager(controller);
			CreateHostBuilder(args).Build().Run();
			powerManager.Dispose();
			Program.chargeManager.Dispose();
			controller.Dispose();
		}

		public static IHostBuilder CreateHostBuilder(string[] args) =>
			Host.CreateDefaultBuilder(args)
				.ConfigureWebHostDefaults(webBuilder => {
					webBuilder.UseStartup<Startup>();
				});

		private static void SetupLogger() {
			String configLogLevel = ConfigurationManager.AppSettings["logLevel"];
			LogLevels logLevel = LogLevels.ERROR;
			Enum.TryParse<LogLevels>(configLogLevel, out logLevel);
			String logfilePath = ConfigurationManager.AppSettings["logfilePath"];
			Logger.SetupLogging(logfilePath, logLevel);
			Logger.Log("PiLot.PowerAPI is starting", LogLevels.INFO);
		}

		/// <summary>
		/// Gets the ChargeManager
		/// </summary>
		public static ChargeManager ChargeManager {
			get { return Program.chargeManager; }
		}
	}
}
