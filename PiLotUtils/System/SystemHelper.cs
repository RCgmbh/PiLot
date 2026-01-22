using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
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
		private const String PINGCOMMAND = "ping";
		private const String PINGARGSLINUX = "-W 2 -c 1 {0}";
		private const String PINGSUCCSSSLINUX = "1 received";
		private const String PINGARGSWIN = "-n 1 {0}";
		private const String PINGSUCCSSSWIN = "Received = 1";
		private const String NOLINUXMESSAGE = "This feature is only available on Linux systems.";
		private const Int32 MAXWAIT = 5000;     // the number of milliseconds to wait for an answer from the process

		public SystemHelper() {
			this.IsLinux = RuntimeInformation.IsOSPlatform(OSPlatform.Linux);
		}

		/// <summary>
		/// Returns whether we are on a linux system
		/// </summary>
		public Boolean IsLinux {
			get; private set;
		}

		/// <summary>
		/// Shuts down the system
		/// </summary>
		public String Shutdown() {
			return this.IsLinux ? this.CallCommand("sudo", SHUTDOWNCOMMAND) : NOLINUXMESSAGE;
		}

		/// <summary>
		/// Reboots the system
		/// </summary>
		public String Reboot() {
			return this.IsLinux ? this.CallCommand("sudo", REBOOTCOMMAND) : NOLINUXMESSAGE;
		}

		/// <summary>
		/// Sets the server time
		/// </summary>
		/// <param name="pMillisUTC">The time to set in milliseconds UTC</param>
		/// <returns>the result of the command</returns>
		public String SetDate(Int64 pMillisUTC) {
			DateTime time = DateTimeHelper.FromJSTime(pMillisUTC);
			return this.IsLinux ? this.CallCommand("sudo", String.Format(DATECOMMAND, time)) : NOLINUXMESSAGE;
		}

		/// <summary>
		/// Pings a host and returns true, if pinging was successful
		/// </summary>
		/// <param name="pHost">the host, such as 8.8.8.8</param>
		/// <returns>True, if the host was reached</returns>
		public Boolean Ping (String pHost) {
			String args = String.Format(this.IsLinux ? PINGARGSLINUX : PINGARGSWIN, pHost);
			String cmdResult = this.CallCommand(PINGCOMMAND, args);
			return (cmdResult.IndexOf(this.IsLinux ? PINGSUCCSSSLINUX : PINGSUCCSSSWIN)) > -1;
		}

		/// <summary>
		/// Calls a few commands in order to get some general info about the system
		/// </summary>
		/// <returns>the results from all commands</returns>
		public List<String[]> GetSystemInfo(){
			List<String[]> result = new List<String[]>();
			List<String[]> commands;
			if(this.IsLinux) {
				commands = new List<String[]>() {
					new String[]{"dotnet","--info"},
					new String[]{"sudo","ifconfig"},
					new String[]{"ip","link"},
					new String[]{"lsb_release","-a"},
					new String[]{"uname","-a"},
				};
			} else {
				commands = new List<String[]>(){
					new String[]{"dotnet","--info"},
					new String[]{"ipconfig",""}
				};
			}
			for(Int32 i = 0; i < commands.Count; i++){
				result.Add(new String[2] {
					String.Join(" ", commands[i]),
					this.CallCommand(commands[i][0], commands[i][1])
				});
			}
			return result;
		}

		/// <summary>
		/// Calls a command with parameters (usually sudo as command, and the rest as parameters)
		/// </summary>
		/// <param name="pCommand">The command, usually sudo</param>
		/// <param name="pArguments">The parameters</param>
		/// <param name="pMaxWait">The maximal duration to wait in ms, null defaults to 5000</param>
		/// <returns>The console output returned after the command</returns>
		public String CallCommand(String pCommand, String pArguments, Int32 pMaxWait = MAXWAIT) {
			Process process = new Process();
			process.StartInfo.FileName = pCommand;
			process.StartInfo.Arguments = pArguments;
			process.StartInfo.UseShellExecute = false;
			process.StartInfo.RedirectStandardOutput = true;
			process.StartInfo.CreateNoWindow = true;
			Logger.Logger.Log("Calling system command {0} with arguments {1}", pCommand, pArguments, LogLevels.DEBUG);
			process.Start();
			process.WaitForExit(pMaxWait);
			String output = process.StandardOutput.ReadToEnd();
			Logger.Logger.Log("Result from SystemService: {0}", output, LogLevels.DEBUG);
			process.Close();
			return output;
		}
	}
}