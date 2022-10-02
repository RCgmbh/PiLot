using System;
using System.IO;

namespace PiLot.Utils.Logger {

	public enum LogLevels { NONE = 4, ERROR = 3, WARNING = 2, INFO = 1, DEBUG = 0 }

	public class Logger {

		private static LogLevels currentLogLevel = LogLevels.ERROR;
		private static String logFolder = null;
		private static Boolean doLogStackTrace = false;
		private static Object fileLock = new Object();
		private const String LOGFILENAMEFORMAT = "{0:yyyy}-{0:MM}-{0:dd}.txt";

		/// <summary>
		/// This pattern is used to format log messages. {0} will be replaced by the current date & time,
		/// {1} by the logLevel and {2} by the message. 
		/// </summary>
		private const String MESSAGEFORMATSTRING = "{0:HH}:{0:mm}:{0:ss}\t{1}\t{2}";

		private Logger() { }

		/// <summary>
		/// This needs to be called by them who use the logger in order to properly set up logging.
		/// The logger himself will not try to get any settings, as
		/// </summary>
		/// <param name="pLogFolder">The folder to log to. use ./blah or .\blah for app-relative paths</param>
		/// <param name="pLogLevel">The log level</param>
		/// <param name="pDoLogStackTrace">Set to true, to log the entire stack trace</param>
		public static void SetupLogging(String pLogFolder, LogLevels pLogLevel, Boolean pDoLogStackTrace = false) {
			if (!String.IsNullOrEmpty(pLogFolder)) {
				Logger.logFolder = pLogFolder;
			}
			Logger.currentLogLevel = pLogLevel;
			Logger.doLogStackTrace = pDoLogStackTrace;
		}

		/// <summary>
		/// Writes pMessage into today's lofgile, if pLogLevel is greater or equal than the application's
		/// current log level configuration.
		/// </summary>
		/// <param name="pMessage">the message to write. Will be formatted with timestamp and pLogLevel</param>
		/// <param name="pLogLevel">the logLevel must be between DEBUG and ERROR. NONE is not allowed</param>
		public static void Log(String pMessage, LogLevels pLogLevel) {
			if (pLogLevel == LogLevels.NONE) {
				throw new Exception("It is not allowed to call Logger.Log with pLogLevel = LogLevels.NONE");
			}
			if (String.IsNullOrEmpty(Logger.logFolder)) {

			}
			if (pLogLevel >= Logger.currentLogLevel) {
				String message = Logger.FormatLogMessage(pMessage, pLogLevel);
				FileInfo logFile = Logger.GetCurrentLogFile();
				if (logFile != null) {
					StreamWriter writer;
					try {
						// the following block is locked to prevent concurrent file manipulation. 
						lock (Logger.fileLock) {
							if (!logFile.Exists) {
								writer = logFile.CreateText();
							} else {
								writer = logFile.AppendText();
							}
							using (writer) {
								writer.WriteLine(message);
							}
						}
					} catch (Exception ex) {
						Console.WriteLine(ex.Message);
					}
				} else {
					Console.WriteLine($"Did not find a logfile. Logging to the console");
					Console.WriteLine(message);
				}
			}
		}

		/// <summary>
		/// Same as Log(String, LogLevels), but accepts an argument to be used in String.Format(pMessage, pArg1)
		/// </summary>
		public static void Log(String pMessage, Object pArg1, LogLevels pLogLevel) {
			Logger.Log(String.Format(pMessage, pArg1), pLogLevel);
		}

		/// <summary>
		/// Same as Log(String, LogLevels), but accepts 2 arguments to be used in String.Format(pMessage, pArg1, pArg2)
		/// </summary>
		public static void Log(String pMessage, Object pArg1, Object pArg2, LogLevels pLogLevel) {
			Logger.Log(String.Format(pMessage, pArg1, pArg2), pLogLevel);
		}

		/// <summary>
		/// Same as Log(String, LogLevels), but accepts 3 arguments to be used in String.Format(pMessage, pArg1, pArg2, pArg3)
		/// </summary>
		public static void Log(String pMessage, Object pArg1, Object pArg2, Object pArg3, LogLevels pLogLevel) {
			Logger.Log(String.Format(pMessage, pArg1, pArg2, pArg3), pLogLevel);
		}

		/// <summary>
		/// Logs an exception, it will loop to find the most inner exception.
		/// Depending on config, the stacktrace will be included. LogLevel is always set to ERROR
		/// </summary>
		/// <param name="pException">The exception to log</param>
		/// <param name="pUrl">The url where the exception happened</param>
		public static void Log(Exception pException, String pUrl) {
			Exception exception = pException;
			while (exception.InnerException != null) {
				exception = exception.InnerException;
			}
			String message = String.Format("URL: {0} \n {1}", pUrl, exception.Message);
			if (Logger.doLogStackTrace) {
				message += "\n" + exception.StackTrace;
			}
			Logger.Log(message, LogLevels.ERROR);
		}

		/// <summary>
		/// Gets the absolute file path to the log folder, based on the "logFolder"
		/// that has been initialized.
		/// </summary>
		public static String LogFolderPath {
			get {
				return Logger.logFolder;
			}
		}

		/// <summary>
		/// Gets the absolute path of the current logfile or null, if no logfilePath has been defined
		/// </summary>
		public static String CurrentLogFilePath {
			get {
				String result = null;
				String logFolder = Logger.LogFolderPath;
				if (!String.IsNullOrEmpty(logFolder)) {
					String filename = String.Format(Logger.LOGFILENAMEFORMAT, DateTime.UtcNow);
					result = Path.Combine(Logger.LogFolderPath, filename);
				}
				return result;
			}
		}

		/// <summary>
		/// Gets a handle to the current logfile. Might return null, if there
		/// is no current logfile
		/// </summary>
		public static FileInfo GetCurrentLogFile() {
			String currentLogFilePath = Logger.CurrentLogFilePath;
			FileInfo result = null;
			if (!String.IsNullOrEmpty(currentLogFilePath)) {
				result = new FileInfo(currentLogFilePath);
			} 
			return result;
		}

		/// <summary>
		/// Gets the size of the current logfile in a configurable unit
		/// </summary>
		/// <param name="pUnit">the unit. Use 1 for bytes, 1024 for KB etc.</param>
		public static int GetCurrentLogSize(int pUnit) {
			FileInfo file = Logger.GetCurrentLogFile();
			int result = 0;
			if (file.Exists) {
				if (file.Length > 0) {
					result = (int)(file.Length / pUnit);
				}
			}
			return result;
		}

		/// <summary>
		/// Gets the time when the current logfile has last been changed
		/// </summary>
		public static DateTime? GetLastLogEntryTime() {
			FileInfo file = Logger.GetCurrentLogFile();
			DateTime? result = null;
			if (file.Exists) {
				result = file.LastWriteTimeUtc;
			}
			return result;
		}

		/// <summary>
		/// Formats a text using the Logger.MESSAGEFORMATSTRING
		/// </summary>
		/// <param name="pMessage">the message text to be formatted</param>
		/// <returns>pMessage with leading current DateTime and loglevel</returns>
		private static String FormatLogMessage(String pMessage, LogLevels pLogLevel) {
			return String.Format(Logger.MESSAGEFORMATSTRING, DateTime.UtcNow, pLogLevel, pMessage);
		}
	}
}
