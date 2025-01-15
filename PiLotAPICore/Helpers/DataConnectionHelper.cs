using System;
using System.Configuration;
using PiLot.Data.Nav;

namespace PiLot.API.Helpers
{

    /// <summary>
    /// This helps using either a files based or db based data connection.
    /// If a connectionString is defined, the db connectors will be used,
    /// otherwise the files based connectors will be used.
    /// </summary>
    public class DataConnectionHelper {

		public static IPoiDataConnector PoiDataConnector {
			get {
				IPoiDataConnector result = null;
				String connectionString = ConfigurationManager.AppSettings["connectionString"];
				if (!String.IsNullOrEmpty(connectionString)) {
					result = new Data.Postgres.Nav.PoiDataConnector(connectionString);
				} else {
					result = new Data.Files.PoiDataConnector();
				}
				return result;
			}
		}

		public static ITrackDataConnector TrackDataConnector {
			get {
				ITrackDataConnector result = null;
				String connectionString = ConfigurationManager.AppSettings["connectionString"];
				if (!String.IsNullOrEmpty(connectionString)) {
					result = new Data.Postgres.Nav.TrackDataConnector(connectionString);
				} else {
					result = Data.Files.TrackDataConnector2.GetInstance();
				}				
				return result;
			}
		}
	}
}
