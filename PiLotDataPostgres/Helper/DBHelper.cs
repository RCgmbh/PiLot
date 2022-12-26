using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;

using Npgsql;

using PiLot.Utils.Logger;

namespace PiLot.Data.Postgres.Helper {
	public class DBHelper {

		public DBHelper() { }

		/// <summary>
		/// Reads data and returns a list of Object of a certain type. The type and a function which
		/// creates an object of that type using an NpgsqlDataReader must be passed, as well as 
		/// the query and the parameters.
		/// </summary>
		/// <typeparam name="T">The type of objects to create</typeparam>
		/// <param name="pQuery">Well... the query</param>
		/// <param name="pReadDataDelegate">Function to create a result object from a db record.</param>
		/// <param name="pParams">The parameters with name and value</param>
		/// <returns></returns>
		public List<T> ReadData<T>(String pQuery, Func<NpgsqlDataReader, T> pReadDataDelegate, List<(String, Object)> pParams = null) {
			NpgsqlConnection connection = null;
			List<T> result = new List<T>();
			String connectionString = ConfigurationManager.AppSettings["connectionString"];
			if (!String.IsNullOrEmpty(connectionString)) {
				try {

					Logger.Log($"connectionString: {connectionString}", LogLevels.DEBUG);
					connection = new NpgsqlConnection(connectionString);
					NpgsqlCommand cmd = new NpgsqlCommand(pQuery, connection);
					if (pParams != null) {
						foreach (var aParam in pParams) {
							cmd.Parameters.AddWithValue(aParam.Item1, aParam.Item2);
						}
					}
					connection.Open();
					NpgsqlDataReader reader = cmd.ExecuteReader();
					while (reader.Read()) {
						result.Add((T)pReadDataDelegate(reader));
					}
					reader.Close();
				} catch (Exception ex) {
					Logger.Log(ex, "PoiDataConnector.ReadData");
					throw;
				} finally {
					if ((connection != null) && (connection.State == ConnectionState.Open)) {
						connection.Close();
					}
				}
			} else {
				Logger.Log("No DB connection configured", LogLevels.WARNING);
			}
			return result;
		}

		public T ExecuteCommand<T>(String pCommand, List<(String, Object)> pParams) {
			NpgsqlConnection connection = null;
			T result = default(T);
			String connectionString = ConfigurationManager.AppSettings["connectionString"];
			if (!String.IsNullOrEmpty(connectionString)) {
				try {
			
					connection = new NpgsqlConnection(connectionString);
					NpgsqlCommand cmd = new NpgsqlCommand(pCommand, connection);
					if (pParams != null) {
						foreach (var aParam in pParams) {
							cmd.Parameters.AddWithValue(aParam.Item1, aParam.Item2);
						}
					}
					connection.Open();
					Object cmdResult = cmd.ExecuteScalar();
					if (cmdResult != DBNull.Value) {
						result = (T)cmdResult;
					}
				} catch (Exception ex) {
					Logger.Log(ex, "PoiDataConnector.SavePoi");
					throw;
				} finally {
					if ((connection != null) && (connection.State == ConnectionState.Open)) {
						connection.Close();
					}
				}
			} else {
				Logger.Log("No DB connection configured", LogLevels.WARNING);
			}
			return result;
		}

		/// <summary>
		/// Helper to create an array of objects from a db record.
		/// </summary>
		/// <returns>Array of objects as long as the number of fileds in the db record</returns>
		public Object[] ReadObject(NpgsqlDataReader pReader) {
			Object[] result = new Object[pReader.FieldCount];
			pReader.GetValues(result);
			return result;
		}

		/// <summary>
		/// Helper to read a date from a db record, using just the first field
		/// </summary>
		/// <returns>DateTime corresponding to the first field, or null</returns>
		public DateTime? ReadDateTime(NpgsqlDataReader pReader) {
			DateTime? result = null;
			if (!pReader.IsDBNull(0)) {
				result = pReader.GetDateTime(0);
			}
			return result;
		}
	}
}
