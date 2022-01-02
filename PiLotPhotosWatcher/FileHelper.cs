using System;
using System.IO;
using System.Threading;

namespace PiLot.PhotosWatcher {
	
	/// <summary>
	/// Offers some static helper functions to handle files
	/// </summary>
	public class FileHelper {

		private const Int32 READATTEMPTS = 10;		// the number of attempts for the TryReadFile method
		private const Int32 READTIMEOUT = 200;      // the timeout in ms for the TryReadFile method


		public static Byte[] TryReadFile(String pFilePath) {
			Byte[] result = null;
			Int32 tryCounter = 0;
			while (tryCounter < READATTEMPTS) {
				try {
					result = File.ReadAllBytes(pFilePath);
					break;
				} catch {
					tryCounter++;
					Thread.Sleep(READTIMEOUT);
				}
			}
			return result;
		}
	}
}
