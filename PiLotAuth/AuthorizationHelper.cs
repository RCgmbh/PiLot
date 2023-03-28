using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;

using PiLot.Config;
using PiLot.Utils.Logger;
using PiLot.Model.Users;

namespace PiLot.Auth {

	/// <summary>
	/// This helps with reading authorization settings.
	/// </summary>
	public class AuthorizationHelper {

		private const String AUTHFILE = "authorization.json";

		private Dictionary<String, Role> roles = null;
		private User anonymous = null;

		/// <summary>
		/// Private constructor. Use Instance instead
		/// </summary>
		public AuthorizationHelper() {
			this.LoadConfig();
		}

		/// <summary>
		/// Returns true, if pUser is not null and has canRead Permission.
		/// If pUser is null, the permissions for an unauthenticated user are returned
		/// </summary>
		public Boolean UserCanRead(User pUser) {
			return (pUser ?? this.anonymous)?.CanRead() ?? false;
		}

		/// <summary>
		/// Returns true, if pUser is not null and has canWrite Permission.
		/// If pUser is null, the permissions for an unauthenticated user are returned
		/// </summary>
		public Boolean UserCanWrite(User pUser) {
			return (pUser ?? this.anonymous)?.CanWrite() ?? false;
		}

		/// <summary>
		/// Returns true, if pUser is not null and has canChangeSettings Permission.
		/// If pUser is null, the permissions for an unauthenticated user are returned
		/// </summary>
		public Boolean UserCanChangeSettings(User pUser) {
			return (pUser ?? this.anonymous)?.CanChangeSettings() ?? false;
		}

		/// <summary>
		/// Returns true, if pUser is not null and has hasSystemAccess Permission.
		/// If pUser is null, the permissions for an unauthenticated user are returned
		/// </summary>
		public Boolean UserHasSystemAccess(User pUser) {
			return (pUser ?? this.anonymous)?.HasSystemAccess() ?? false;
		}

		/// <summary>
		/// Returns true, if pUser is not null and has canBackup Permission.
		/// If pUser is null, the permissions for an unauthenticated user are returned
		/// </summary>
		public Boolean CanBackup(User pUser) {
			return (pUser ?? this.anonymous)?.CanBackup() ?? false;
		}

		/// <summary>
		/// Gets a Role from this.Roles. If the role does not exist, a warning is
		/// logged and null is returned.
		/// </summary>
		public Role GetRole(String pRoleName) {
			Role result = null;
			if (this.roles.ContainsKey(pRoleName)) {
				result = this.roles[pRoleName];
			} else {
				Logger.Log($"Role not found: {pRoleName}", LogLevels.WARNING);
			}
			return result;
		}

		/// <summary>
		/// Reloads the config from file
		/// </summary>
		public void ReloadConfig() {
			this.roles = null;
			this.anonymous = null;
			this.LoadConfig();
		}

		/// <summary>
		/// This loads the config from file and deserializes the users and roles objects, 
		/// resulting in a dictionary of roles and a dictionary of users
		/// </summary>
		protected void LoadConfig() {
			AuthorizationSettings settings = null;
			String authConfigFile = Path.Combine(ConfigHelper.GetConfigDirectory(), AUTHFILE);
			if (File.Exists(authConfigFile)) {
				try {
					String fileContent = null;
					fileContent = File.ReadAllText(authConfigFile);
					settings = JsonSerializer.Deserialize<AuthorizationSettings>(fileContent);
				} catch (Exception ex) {
					Logger.Log("Error reading config: {0}", ex.Message, LogLevels.ERROR);
					throw;
				}
			}
			if (settings != null) {
				this.roles = new Dictionary<String, Role>();
				foreach (Role aRole in settings.Roles) {
					this.roles.Add(aRole.Name, aRole);
				}
				if (settings.AnonymousRole != null) {
					this.anonymous = new User();
					this.anonymous.Role = this.GetRole(settings.AnonymousRole);
				}
			}
		}
	}
}
