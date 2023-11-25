using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Photos {

	/// <summary>
	/// This is contains the path and some other metadata about an image
	/// </summary>
	public class ImageReference {

		public ImageReference() { }

		/// <summary>
		/// The full path, including the filename
		/// </summary>
		[JsonPropertyName("path")]
		public String Path {
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
		public Date Day {
			get;
			set;
		}
	}
}
