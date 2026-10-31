using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Nav {

	/// <summary>
	/// Represents a poi
	/// </summary>
	public class Poi {

		private double? latitude;
		private double? longitude;

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

		/// <summary>
		/// Gets or sets the latitude in degrees. Any values are accepted, but will min/max to -90 .. 90
		/// </summary>
		[JsonPropertyName("latitude")]
		public Double? Latitude { 
			get { return this.latitude; }
			set {
				this.latitude = LatLon.SanitizeLatitude(value);
			}
		}

		/// <summary>
		/// The longitude in degrees. Any values are accepted, but will translate to -180 .. 180
		/// </summary>
		[JsonPropertyName("longitude")]
		public Double? Longitude {
			get { return this.longitude; }
			set {
				this.longitude = LatLon.SanitizeLongitude(value);
			}
		}

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

		/// <summary>
		/// The name of the source, for POIs with external sources, e.g. OSM
		/// </summary>
		[JsonPropertyName("source")]
		public String Source { get; set; }

		/// <summary>
		/// The Pois' id in the source system
		/// </summary>
		[JsonPropertyName("sourceId")]
		public String SourceID { get; set; }

		/// <summary>
		/// Returns the attributes needed to show the poi on the map as an object array. We do this, 
		/// because the DB-Connector returns the data read straight out of the db. So for the file
		/// based storage, we do a bit of extra work.
		/// </summary>
		public Object[] ToShortArray() {
			return new Object[] {
				this.ID, this.Title,
				this.CategoryID, this.FeatureIDs,
				this.Latitude, this.Longitude,
				this.ValidFrom, this.ValidTo, 
				this.Source, this.SourceID
			};
		}

		/// <summary>
		/// Returns all Attributes of the poi as an array. This is needed for compatibility reasons
		/// with the db connector
		/// </summary>
		public Object[] ToArray() {
			return new Object[] {
				this.ID, this.Title,
				this.CategoryID, this.FeatureIDs,
				this.Latitude, this.Longitude,
				this.ValidFrom, this.ValidTo,
				this.Source, this.SourceID,
				this.Description, this.Properties
			};
		}

	}
}