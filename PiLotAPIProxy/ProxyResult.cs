using System;

namespace PiLot.APIProxy {

	public class ProxyResult {

		public ProxyResult() {
			this.Success = false;
			this.Message = null;
		}

		public Boolean Success {
			get;
			set;
		}

		public String Message {
			get;
			set;
		}
		
		/// <summary>
		/// Gets or sets the media Type of the content, e.g. "text/html" or "appication/json"
		/// </summary>
		public String MediaType {
			get;
			set;
		}
	}

	public class ProxyResult<T>: ProxyResult {

		public ProxyResult() : base() { }

		public T Data {
			get;
			set;
		}

	}
}
