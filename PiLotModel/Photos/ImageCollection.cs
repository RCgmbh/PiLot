using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace PiLot.Model.Photos {

	/// <summary>
	/// This holds information about an image collection, which can be used
	/// to create an image gallery.
	/// </summary>
	public class ImageCollection {

		public ImageCollection() { }

		/// <summary>
		/// The root url of the images, relative to the web application root.
		/// </summary>
		[JsonPropertyName("rootUrl")]
		public String RootURL { get; set; }

		/// <summary>
		/// The name of the collection
		/// </summary>
		[JsonPropertyName("name")]
		public String Name { get; set; }

		/// <summary>
		/// The names and image sizes of the folders containing different 
		/// sizes of the images
		/// </summary>
		[JsonPropertyName("zoomFolders")]
		public List<ImageFolder> ZoomFolders { get; set; }

		/// <summary>
		/// The filenames of the images. Each ZoomFolder will usually contain
		/// all these files.
		/// </summary>
		[JsonPropertyName("imageNames")]
		public List<String> ImageNames { get; set; }
	}
}
