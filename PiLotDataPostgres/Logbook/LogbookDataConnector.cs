using System;
using Npgsql;

using PiLot.Model.Logbook;

namespace PiLot.Data.Postgres {

	/// <summary>
	/// Helps with CRUD Operations for Logbook data
	/// </summary>
	public class LogbookDataConnector {

		private NpgsqlConnection connection = null;

		public LogbookDataConnector(String pConnectionString) {
			this.connection = new NpgsqlConnection(pConnectionString);
		}

		public LogbookDay ReadLogbookDay(Date pDate) {
			return null;
		}

	}
}
