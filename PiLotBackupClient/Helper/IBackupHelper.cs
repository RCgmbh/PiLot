using System;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Interface which needs to be implemented by all backup helpers
	/// </summary>
	interface IBackupHelper {

		/// <summary>
		/// Performs a backup task and returns true, if it was successful
		/// </summary>
		/// <param name="pTask"></param>
		/// <param name="pBackupTime"></param>
		/// <returns>true: success, false: failed</returns>
		Task<Boolean> PerformBackupTaskAsync (BackupTask pTask, DateTime pBackupTime);
	}
}
