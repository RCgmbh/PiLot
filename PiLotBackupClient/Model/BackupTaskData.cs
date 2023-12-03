using System;
using System.Collections.Generic;

namespace PiLot.Backup.Client.Model {

	/// <summary>
	/// This holds data that has been read for one backup task. We care not only 
	/// about the actual data to back up, but also about the total data, which will
	/// be used to make sure the resulting backup set really contains all data.
	/// </summary>
	/// <typeparam name="T"></typeparam>
	internal class BackupTaskData<T> {

		/// <summary>
		/// All items that have changed and needs to be backed up. This also
		/// contains empty items, if they had data before.
		/// </summary>
		public T ChangedItems { get; set; }

		/// <summary>
		/// The total number of items. This does not contain empty
		/// items, which had data that has been deleted. 
		/// </summary>
		public Int32 TotalItems { get; set; }

	}
}
