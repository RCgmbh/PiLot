using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents a poi category
	/// </summary>
	public class PoiCategory {

		[JsonPropertyName("id")]
		public Int32 ID { get; set; }
		
		[JsonPropertyName("parentId")]
		public Int32? ParentId { get; set; }
		
		[JsonPropertyName("name")]
		public String Name { get; set; }
		
		[JsonPropertyName("labels")]
		public Object Labels { get; set; }
		
		[JsonPropertyName("icon")]
		public String Icon { get; set; }

	}
}