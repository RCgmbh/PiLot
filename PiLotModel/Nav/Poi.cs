using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents a poi
	/// </summary>
	public class Poi {

		[JsonPropertyName("id")]
		public Int64? ID { get; set; }
		
		[JsonPropertyName("title")]
		public String Title { get; set; }

		[JsonPropertyName("description")]
		public String Description { get; set; }

		[JsonPropertyName("categoryId")]
		public Int32 CategoryID { get; set; }

		[JsonPropertyName("featureIds")]
		public Int32[] FeatureIDs { get; set; }

		[JsonPropertyName("properties")]
		public Object Properties { get; set; }

		[JsonPropertyName("latitude")]
		public Double Latitude { get; set; }

		[JsonPropertyName("longitude")]
		public Double Longitude { get; set; }

		/// <summary>
		/// Date in seconds since epoc UTC
		/// </summary>
		[JsonPropertyName("validFrom")]
		public Int32? ValidFrom { get; set; }

		/// <summary>
		/// Date in seconds since epoc UTC
		/// </summary>
		[JsonPropertyName("validTo")]
		public Int32? ValidTo { get; set; }

	}
}