using System;
using System.Threading.Tasks;

using PiLot.Backup.Client.Model;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Interface which needs to be implemented by all backup helpers
	/// </summary>
	interface IBackupHelper {

		/// <summary>
		/// Performs a backup task and returns a result which indicates whether the
		/// task was successful, and how much data there is in total for the source.
		/// </summary>
		/// <param name="pTask"></param>
		/// <param name="pBackupTime"></param>
		Task<BackupTaskResult> PerformBackupTaskAsync (BackupTask pTask, DateTime pBackupTime);
	}
}
