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
	}

	public class ProxyResult<T>: ProxyResult {

		public ProxyResult() : base() { }

		public T Data {
			get;
			set;
		}

	}
}
