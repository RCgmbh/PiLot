using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Tools {

	public class Checklist {

		[JsonPropertyName("id")]
		public Int32? ID { get; set; }

		[JsonPropertyName("title")]
		public String Title { get; set; }

		[JsonPropertyName("items")]
		public ChecklistItem[] Items { get; set; }

		public class ChecklistItem {

			[JsonPropertyName("title")]
			public String Title { get; set; }
			
			[JsonPropertyName("checked")]
			public Boolean Checked { get; set; }

		}

	}
}
