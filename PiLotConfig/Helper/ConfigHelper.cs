using System;
using System.IO;

namespace PiLot.Config {

	/// <summary>
	/// This class helps accessing the config directory. The config 
	/// directory contains specific configuration files for the
	/// different pilot applications. As opposed to the data files the
	/// config files are only read by the applications, but might be
	/// manually edited by the administrating user.
	/// </summary>
	public class ConfigHelper {

		const String CONFIGDIR = "config";

		/// <summary>
		/// Returns the default config directory, which is just /config within the
		/// application root.
		/// </summary>
		public static String GetConfigDirectory() {
			return Path.Combine(AppContext.BaseDirectory, CONFIGDIR);
		}
	}
}
