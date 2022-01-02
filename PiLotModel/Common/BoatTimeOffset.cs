using System;
using System.Text.Json.Serialization;

namespace PiLot.Model.Common {
	
	/// <summary>
	/// represents a boatTime offset, which was valid from a certain point in time.
	/// This is used together with recorded data, to allow calculating the
	/// boatTime for any utc timestamp 
	/// </summary>
	public struct BoatTimeOffset {


		private Int32? validFrom;
		private Int32 offset;

		/// <summary>
		/// Creates a new BoatTime item
		/// </summary>
		/// <param name="pValidFrom">The timestamp in UTC seconds from epoc</param>
		/// <param name="pOffset">the offset in minutes, e.g. MESZ would be 120</param>
		public BoatTimeOffset(Int32? pValidFrom, Int32 pOffset) {
			this.validFrom = pValidFrom;
			this.offset = pOffset;
		}

		/// <summary>
		/// The moment, from when the offset is valid, in UTC seconds form epoc
		/// null can be used as default value, which is handy in case we don't 
		/// have data from the beginning of the requested period	
		/// </summary>
		[JsonPropertyName("validFrom")]
		public Int32? ValidFrom {
			get { return this.validFrom; }
		}

		/// <summary>
		/// The boatTime offset in minutes
		/// </summary>
		[JsonPropertyName("offset")]
		public Int32 Offset {
			get { return this.offset; }
		}
	}
}
