using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;

using Npgsql;

using PiLot.Utils.Logger;

namespace PiLot.Data.Postgres.Helper {
	public class DBHelper {

		private String connectionString;

		public DBHelper() {
			this.connectionString = ConfigurationManager.AppSettings["connectionString"];
		}

		public DBHelper(String pConnectionString) {
			this.connectionString = pConnectionString;
		}

		/// <summary>
		/// Returns the db connection for the connection string. If there is no connection string
		/// defined, null is returned, so make sure you look at what you get.
		/// </summary>
		/// <returns>A new, closed db connection or null</returns>
		public NpgsqlConnection GetConnection() {
			NpgsqlConnection result = null;
			if (!String.IsNullOrEmpty(this.connectionString)) {
				result = new NpgsqlConnection(this.connectionString);
			} else {
				Logger.Log("No DB connection configured", LogLevels.WARNING);
			}
			return result;
		}

		/// <summary>
		/// Reads data and returns a list of Object of a certain type. The type and a function which
		/// creates an object of that type using an NpgsqlDataReader must be passed, as well as 
		/// the query and the parameters.
		/// </summary>
		/// <typeparam name="T">The type of objects to create</typeparam>
		/// <param name="pQuery">Well... the query</param>
		/// <param name="pReadDataDelegate">Function to create a result object from a db record.</param>
		/// <param name="pParams">The parameters with name and value</param>
		/// <param name="pTransaction">Optionally pass a transaction, which must be handled by the caller</param>
		/// <returns></returns>
		public List<T> ReadData<T>(String pQuery, Func<NpgsqlDataReader, T> pReadDataDelegate, List<(String, Object)> pParams = null, NpgsqlTransaction pTransaction = null) {
			List<T> result = new List<T>();
			NpgsqlCommand cmd = this.CreateCommand(pQuery, pParams, pTransaction);
			if(cmd != null) { 
				try {
					this.OpenConnection(cmd.Connection);
					NpgsqlDataReader reader = cmd.ExecuteReader();
					while (reader.Read()) {
						result.Add((T)pReadDataDelegate(reader));
					}
					reader.Close();
				} catch (Exception ex) {
					Logger.Log(ex, "DBHelper.ReadData");
					throw;
				} finally {
					this.CloseConnection(cmd);
				}
			} 
			return result;
		}

		/// <summary>
		/// Executes a command against the database and returns the result
		/// </summary>
		/// <typeparam name="T">The type of the result</typeparam>
		/// <param name="pCommand">The command string</param>
		/// <param name="pParams">The parameters with name and value</param>
		/// <param name="pTransaction">Optionally pass a transaction, which must be handled by the caller</param>
		/// <returns></returns>
		public T ExecuteCommand<T>(String pCommand, List<(String, Object)> pParams, NpgsqlTransaction pTransaction = null) {
			T result = default(T);
			NpgsqlCommand command = this.CreateCommand(pCommand, pParams, pTransaction);
			if(command != null) {
				try {
					this.OpenConnection(command.Connection);
					Object cmdResult = command.ExecuteScalar();
					if ((cmdResult != null) && (cmdResult != DBNull.Value)) {
						result = (T)cmdResult;
					}
				} catch (Exception ex) {
					Logger.Log(ex, "DBHelper.ExecuteCommand");
					throw;
				} finally {
					this.CloseConnection(command);
				}
			} 
			return result;
		}

		/// <summary>
		/// Helper to create an array of objects from a db record. Sinde some npgsql version,
		/// this has started struggeling with arrays of nullable types (within the fields),
		/// so it needs some special treatment.
		/// </summary>
		/// <returns>Array of objects as long as the number of fileds in the db record</returns>
		public Object[] ReadObjects(NpgsqlDataReader pReader) {
			Object[] result = new Object[pReader.FieldCount];
			for(Int32 i = 0; i < pReader.FieldCount; i++){
				if (pReader.IsDBNull(i)) {
					result[i] = null;
				} else if(pReader.GetPostgresType(i).FullName == "pg_catalog.integer[]"){
					result[i] = pReader.GetFieldValue<Int32?[]>(i);
				} else {
					result [i] = pReader.GetValue(i);
				}
			}
			return result;
		}

		/// <summary>
		/// Reads a nullable db field. Returns the type's default value, if the
		/// field in the db is null
		/// </summary>
		/// <typeparam name="T">The result type</typeparam>
		/// <param name="pReader">the db reader</param>
		/// <param name="pFieldName">the field name</param>
		/// <returns></returns>
		public T ReadNullableField<T>(NpgsqlDataReader pReader, String pFieldName) {
			T result = default(T);
			if (!pReader.IsDBNull(pFieldName)) {
				result = pReader.GetFieldValue<T>(pFieldName);
			}
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

		/// <summary>
		/// Returns the value for a nullable parameter, which is either the
		/// value passed in, or dbNull, if the value is null.
		/// </summary>
		/// <param name="pValue">The parameter value</param>
		/// <returns>DBNull or pValue</returns>
		public Object GetNullableParameterValue(Object pValue) {
			return pValue != null ? pValue : DBNull.Value;
		}

		#region private methods

		/// <summary>
		/// Creates a command, using either a given transaction, or creating a new connection.
		/// Also adds the parameters to the command
		/// </summary>
		/// <param name="pSqlCommand"></param>
		/// <param name="pParams"></param>
		/// <param name="pTransaction"></param>
		/// <returns></returns>
		private NpgsqlCommand CreateCommand(String pSqlCommand, List<(String, Object)> pParams, NpgsqlTransaction pTransaction) {
			Logger.Log($"DBHelper.CreateCommand: {pSqlCommand}", LogLevels.DEBUG);
			NpgsqlCommand result = null;
			NpgsqlConnection connection;
			if (pTransaction != null) {
				connection = pTransaction.Connection;
			} else {
				connection = this.GetConnection();
			}
			if (connection != null) {
				if (pTransaction != null) {
					result = new NpgsqlCommand(pSqlCommand, connection, pTransaction);
				} else {
					result = new NpgsqlCommand(pSqlCommand, connection);
				}
				if (pParams != null) {
					foreach (var aParam in pParams) {
						if (aParam.Item2 == null) {
							result.Parameters.AddWithValue(aParam.Item1, DBNull.Value);
						} else if (aParam.Item2.GetType() == typeof(System.Text.Json.JsonElement)) {
							String serialized = System.Text.Json.JsonSerializer.Serialize<Object>(aParam.Item2);
							result.Parameters.AddWithValue(aParam.Item1, NpgsqlTypes.NpgsqlDbType.Jsonb, serialized);
						} else {
							result.Parameters.AddWithValue(aParam.Item1, aParam.Item2);
						}
					}

				}
			}
			return result;
		}

		/// <summary>
		/// Opens the db connection, if it's not open yet
		/// </summary>
		private void OpenConnection(NpgsqlConnection pConnection) {
			if (pConnection.State != ConnectionState.Open) {
				pConnection.Open();
			}
		}

		/// <summary>
		/// Closes the db connection associated to pCommand, if it's open
		/// and there is no transaction assigned to it. If there is a
		/// transaction, the caller has to commit the transaction and close 
		/// the connection himself.
		/// </summary>
		/// <param name="pCommand"></param>
		private void CloseConnection(NpgsqlCommand pCommand) {
			if ((pCommand.Connection != null) && (pCommand.Transaction == null) && (pCommand.Connection.State == ConnectionState.Open)) {
				pCommand.Connection.Close();
			}
		}

		#endregion
	}
}
