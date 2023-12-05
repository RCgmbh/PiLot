using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;

namespace PiLot.Model.Common {

	[JsonConverter(typeof(JsonStringEnumConverter))]
	public enum DataTypes { GPS = 0, SensorData = 1, Logbook = 2, Routes = 3, POIs = 4, Photos = 5 }


	public struct DataSource {

		public DataSource(DataTypes pType, String pName) {
			this.DataType = pType;
			this.Name = pName;
		}

		[JsonPropertyName("dataType")]
		public DataTypes DataType {
			get;set;
		}

		[JsonPropertyName("name")]
		public String Name {
			get; set; 
		}
	}
}
