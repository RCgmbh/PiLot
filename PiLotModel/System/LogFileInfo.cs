using PiLot.Utils.DateAndTime;
using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Text.Json.Serialization;

namespace PiLotModel.System {

	/// <summary>
	/// Represents information about a logfile
	/// </summary>
	public class LogFileInfo {

		/// <summary>
		/// Creates a LogFileInfo based on an actual FileInfo
		/// </summary>
		/// <param name="pFileInfo"></param>
		public LogFileInfo(FileInfo pFileInfo) {
			this.Filename = pFileInfo.Name;
			this.DateChanged = DateTimeHelper.ToUnixTime(pFileInfo.LastWriteTimeUtc);
			this.Bytes = (Int32)pFileInfo.Length;
		}

		/// <summary>
		/// The relative filename, no path information
		/// </summary>
		[JsonPropertyName("filename")]
		public String Filename { get; set; }

		/// <summary>
		/// The date of the last change of the file, in seconds from epoc UTC
		/// </summary>
		[JsonPropertyName("dateChanged")]
		public Int32 DateChanged { get; set; }

		/// <summary>
		/// The filesize in Bytes
		/// </summary>
		[JsonPropertyName("bytes")]
		public Int32 Bytes { get; set; }
	}
}
