using System;

namespace PiLot.Backup.Client.Model {

	/// <summary>
	/// Represents the result of a backup task, where the task can be done
	/// successfully or not, and telling, how much data there is in total,
	/// which is needed to check backup consistency at the end.
	/// </summary>
	public struct BackupTaskResult {

		public BackupTaskResult(Boolean pSuccess, Int32 pTotalDailyData) {
			this.Success = pSuccess;
			this.TotalDailyData = pTotalDailyData;
		}

		public Boolean Success { get; set; }

		public Int32 TotalDailyData { get; set; }

	}
}
