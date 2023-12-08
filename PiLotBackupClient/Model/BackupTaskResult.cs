using System;

namespace PiLot.Backup.Client.Model {

	/// <summary>
	/// Represents the result of a backup task, where the task can be done
	/// successfully or not, and telling, how much data there is in total,
	/// which is needed to check backup consistency at the end.
	/// </summary>
	public struct BackupTaskResult {

		public BackupTaskResult(BackupTask pBackupTask, Boolean pSuccess, Int32 pTotalDailyData) {
			this.BackupTask = pBackupTask;
			this.Success = pSuccess;
			this.TotalDataCount = pTotalDailyData;
		}

		public BackupTask BackupTask { get; set; }

		public Boolean Success { get; set; }

		public Int32 TotalDataCount { get; set; }

	}
}
