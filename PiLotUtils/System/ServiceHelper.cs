using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Runtime.InteropServices;

using PiLot.Utils.Logger;

namespace PiLot.Utils.OS {

	/// <summary>
	/// Helper for interacting with services. This needs an entry "services" in the 
	/// app.config, where all services the client is allowed to interact with are listed.
	/// </summary>
	public class ServiceHelper {

		private const String SERVICESTATECOMMAND = "systemctl status {0}";				// command template to get the service state
		private const String SERVICESTARTCOMMAND = "systemctl start {0}";				// command template to start a service
		private const String SERVICESTOPCOMMAND = "systemctl stop {0}";					// command template to stop a service
		private const String SERVICERESTARTCOMMAND = "systemctl restart {0}";			// command template to restart a service
		private const String SERVICECONFIGKEY = "services";

        private SystemHelper systemHelper;

        public ServiceHelper(){
            this.systemHelper = new SystemHelper();
        }

		/// <summary>
		/// Returns the Line starting with "Active" from the output of systemctl status,
		/// or null, if there is no such line (which would probably mean the service
		/// is not existing)
		/// </summary>
		/// <param name="pServiceName">the name of the service, e.g. renderd, gpsLogger</param>
		/// <returns>A String or null</returns>
		public String GetServiceStatus(String pServiceName) {
			String result;
			if (this.GetServices().Contains(pServiceName)) {
				if (this.systemHelper.IsLinux) {
					String status = this.systemHelper.CallCommand("sudo", String.Format(SERVICESTATECOMMAND, pServiceName));
					List<String> lines = status.Split('\n').ToList();
					lines = lines.Select(l => l.Trim()).ToList();
					result = lines.FirstOrDefault(l => l.StartsWith("Active:"));
				} else {
					result = $"this feature is only available on linux. Your System is {RuntimeInformation.OSDescription}";
				}
			} else {
				result = "Invalid service name";
				Logger.Logger.Log($"Invalid service name provided: {pServiceName}", LogLevels.WARNING);
			}
			return result;
		}

		/// <summary>
		/// Starts a service
		/// </summary>
		/// <param name="pServiceName">The name of the service to start</param>
		/// <returns>the new status of the service</returns>
		public String StartService(String pServiceName) {
			return this.CallServiceCommand(pServiceName, SERVICESTARTCOMMAND);
		}

		/// <summary>
		/// Stops a service
		/// </summary>
		/// <param name="pServiceName">The name of the service to stop</param>
		/// <returns>the new status of the service</returns>
		public String StopService(String pServiceName) {
			return this.CallServiceCommand(pServiceName, SERVICESTOPCOMMAND);
		}

		/// <summary>
		/// Restarts a service
		/// </summary>
		/// <param name="pServiceName">The name of the service to restart</param>
		/// <returns>the new status of the service</returns>
		public String RestartService(String pServiceName) {
			return this.CallServiceCommand(pServiceName, SERVICERESTARTCOMMAND);
		}

		/// <summary>
		/// Gets the list of all services this allows to interact with. The list is
		/// loaded from the app.config, so the application using this must have the
		/// respective entry in the config file. The service names are comma separated.
		/// </summary>
		/// <returns>A String array, might be empty, but never null</returns>
		public String[] GetServices() {
			String[] result;
			String config = ConfigurationManager.AppSettings[SERVICECONFIGKEY];
			if (!String.IsNullOrEmpty(config)) {
				result = config.Split(',').Select(i => i.Trim()).ToArray();
			} else {
				Logger.Logger.Log($"The config value for \"{SERVICECONFIGKEY}\" is missing. Please add it to app.config", LogLevels.WARNING);
				result = new String[0];
			}
			return result;
		}

		/// <summary>
		/// Calls a command for a service, such as start or stop. Makes sure that only
		/// allowed services are used.
		/// </summary>
		/// <param name="pServiceName">The name of the service, must be part of SERVICES</param>
		/// <param name="pServiceCommand">The Command, where the service name will be String.Formatted into</param>
		/// <param name="pAllowedServices">A list of the names of all allowed services</param>
		/// <returns>The result of the command</returns>
		private String CallServiceCommand(String pServiceName, String pServiceCommand) {
			String result;
			if (this.GetServices().Contains(pServiceName)) {
				if (this.systemHelper.IsLinux) {
					this.systemHelper.CallCommand("sudo", String.Format(pServiceCommand, pServiceName));
					result = this.GetServiceStatus(pServiceName);
				} else {
					result = $"this feature is only available on linux. Your System is {RuntimeInformation.OSDescription}";
				}
			} else {
				result = "Invalid service name";
				Logger.Logger.Log($"Invalid service name provided: {pServiceName}", LogLevels.WARNING);
			}
			return result;
		}
	}
}