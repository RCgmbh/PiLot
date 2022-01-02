using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Photos {

	/// <summary>
	/// Information about a folder which contains images or thumbnails
	/// to build up an image gallery. Each folder will contain all the images,
	/// in a certain size.
	/// </summary>
	public class ImageFolder {

		public ImageFolder() { }

		[JsonPropertyName("maxSize")]
		public Int32? MaxSize { get; set; }

		[JsonPropertyName("folder")]
		public String Folder { get; set; }

	}
}
