using System;
using System.IO;
using System.Threading.Tasks;

namespace PiLot.Utils.Various {

	/// <summary>
	/// Helps with handling bytes
	/// </summary>
	public class BytesHelper {

		/// <summary>
		/// Reads a number of bytes from a Stream. This is not as trivial as it might
		/// seem, as the ReadAsync method seems to just reas some bytes, but not all.
		/// So this loops as long as necessary in oder to read all bytes.
		/// </summary>
		/// <param name="pStream">The stream to read from</param>
		/// <param name="pLength">The number of bytes to read</param>
		/// <returns>A byte array or null. The array is empty, if pStream is null</returns>
		public async Task<Byte[]> ReadBytes(Stream pStream, long pLength) {
			Byte[] result = new Byte[pLength];
			if (pStream != null) {
				int bytesRead = 0;
				while (bytesRead < pLength) { // ReadAsync does not read all, but just some bytes.
					bytesRead += await pStream.ReadAsync(result, bytesRead, (int)result.Length - bytesRead);
				}
			}
			return result;
		}

	}
}
