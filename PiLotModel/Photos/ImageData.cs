using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Photos {

	/// <summary>
	/// This is contains the bytes and some metadata about an image
	/// </summary>
	public class ImageData {

		public ImageData() { }

		/// <summary>
		/// The Image Bytes
		/// </summary>
		[JsonPropertyName("bytes")]
		public Byte[] Bytes {
			get;
			set;
		}

		/// <summary>
		/// The original image name, e.g. P1234.jpg
		/// </summary>
		[JsonPropertyName("name")]
		public String Name {
			get;
			set;
		}

		/// <summary>
		/// The day the picture was taken.
		/// </summary>
		[JsonPropertyName("day")]
		public Date? Day {
			get;
			set;
		}
	}
}
