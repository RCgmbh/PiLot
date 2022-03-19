using System;
using System.Diagnostics;

using PiLot.Utils.DateAndTime;
using PiLot.Utils.Logger;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Helper for OS interaction. Offers some common commands, plus a generic
	/// option to call any command. The calling classes need to make sure this
	/// is not abused, at it's quite mighty.
	/// </summary>
	public class SystemHelper {

		private const String DATECOMMAND = "date -u -s \"{0:yyyy-MM-dd HH:mm:ss}\"";    // command template to set system date/time
		private const String SHUTDOWNCOMMAND = "shutdown now";
		private const String REBOOTCOMMAND = "reboot now";

		private const Int32 MAXWAIT = 5000;     // the number of milliseconds to wait for an answer from the process

		/// <summary>
		/// Shuts down the system
		/// </summary>
		public String Shutdown() {
			return this.CallCommand("sudo", SHUTDOWNCOMMAND);
		}

		/// <summary>
		/// Reboots the system
		/// </summary>
		public String Reboot() {
			return this.CallCommand("sudo", REBOOTCOMMAND);
		}

		/// <summary>
		/// Sets the server time
		/// </summary>
		/// <param name="pMillisUTC">The time to set in milliseconds UTC</param>
		/// <returns>the result of the command</returns>
		public String SetDate(Int64 pMillisUTC) {
			DateTime time = DateTimeHelper.FromJSTime(pMillisUTC);
			return this.CallCommand("sudo", String.Format(DATECOMMAND, time));
		}

		/// <summary>
		/// Calls a command with parameters (usually sudo as command, and the rest as parameters)
		/// </summary>
		/// <param name="pCommand">The command, usually sudo</param>
		/// <param name="pArguments">The parameters</param>
		/// <returns>The console output returned after the command</returns>
		public String CallCommand(String pCommand, String pArguments) {
			Process process = new Process();
			process.StartInfo.FileName = pCommand;
			process.StartInfo.Arguments = pArguments;
			process.StartInfo.UseShellExecute = false;
			process.StartInfo.RedirectStandardOutput = true;
			process.StartInfo.CreateNoWindow = true;
			Logger.Logger.Log("Calling system command {0} with arguments {1}", pCommand, pArguments, LogLevels.DEBUG);
			process.Start();
			process.WaitForExit(MAXWAIT);
			String output = process.StandardOutput.ReadToEnd();
			Logger.Logger.Log("Result from SystemService: {0}", output, LogLevels.DEBUG);
			process.Close();
			return output;
		}
	}
}