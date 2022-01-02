using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Publishing {
	
	/// <summary>
	/// This encapsulates data we requested from the publish Target. It
	/// contains the data as well as meta-information (whether the request
	/// was successful, and human-readable information about eventual errors.
	/// </summary>
	public class TargetData<T> {

		/// <summary>
		/// false, if any errors occured while getting or deserializing the data
		/// </summary>
		[JsonPropertyName("success")]
		public Boolean Success {
			get;
			set;
		}

		/// <summary>
		/// Human readable messages in case of errors
		/// </summary>
		[JsonPropertyName("messages")]
		public String Messages {
			get;
			set;
		}

		/// <summary>
		/// The acutal data
		/// </summary>
		[JsonPropertyName("data")]
		public T Data {
			get;
			set;
		}
	}
}
