using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Publishing {

	/// <summary>
	/// This represents the selection where the user chose which data
	/// should be published to the target.
	/// </summary>
	public class PublishSelection {

		public PublishSelection() { }

		/// <summary>
		/// 0: Don't publish, 1: publish and replace
		/// </summary>
		[JsonPropertyName("publishTrackMode")]
		public Int32 PublishTrackMode {
			get; set;
		}

		/// <summary>
		/// 0: Don't publish, 1: publish and replace, 2: publish and append
		/// </summary>
		[JsonPropertyName("publishDiaryMode")]
		public Int32 PublishDiaryMode {
			get; set;
		}

		/// <summary>
		/// 0: Don't publish, 1: publish and replace, 2: publish and merge
		/// </summary>
		[JsonPropertyName("publishLogbookMode")]
		public Int32 PublishLogbookMode {
			get; set;
		}

		/// <summary>
		/// The names of the photos to be published
		/// </summary>
		[JsonPropertyName("publishPhotos")]
		public String[] PublishPhotos {
			get; set;
		}

	}
}
