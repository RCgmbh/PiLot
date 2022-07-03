using PiLot.Backup.Client.Proxies;
using PiLot.Utils;

namespace PiLot.Backup.Client.Helper {

	/// <summary>
	/// Base class for all Backup helpers
	/// </summary>
	public abstract class BackupHelper {

		protected BackupServiceProxy proxy = null;

		public BackupHelper(BackupServiceProxy pProxy) {
			Assert.IsNotNull(pProxy, "You need to pass a BackupServiceProxy when creating a BackupHelper");
			this.proxy = pProxy;
		}
	}
}
