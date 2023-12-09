using System;

using PiLot.Utils.Logger;

namespace PiLot.Backup.Client {

	/// <summary>
	/// This provides different outputs, either to the log or to the console
	/// </summary>
	class Out {

		public enum Modes { Console, Log }

		private static Modes mode = Modes.Log;

		public static void SetMode(Modes pMode) {
			Out.mode = pMode;
		}

		public static void WriteDebug(String pMessage) {
			Write(pMessage, LogLevels.DEBUG);
		}

		public static void WriteDebug(String pMessage, Object pArg1) {
			Write(pMessage, pArg1, LogLevels.DEBUG);
		}

		public static void WriteDebug(String pMessage, Object pArg1, Object pArg2) {
			Write(pMessage, pArg1, pArg2, LogLevels.DEBUG);
		}

		public static void WriteInfo(String pMessage) {
			Write(pMessage, LogLevels.INFO);
		}

		public static void WriteInfo(String pMessage, Object pArg1) {
			Write(pMessage, pArg1, LogLevels.INFO);
		}

		public static void WriteInfo(String pMessage, Object pArg1, Object pArg2) {
			Write(pMessage, pArg1, pArg2, LogLevels.INFO);
		}

		public static void WriteError(String pMessage) {
			Write(pMessage, LogLevels.ERROR);
		}

		public static void WriteError(String pMessage, Object pArg1) {
			Write(pMessage, pArg1, LogLevels.ERROR);
		}

		public static void WriteError(String pMessage, Object pArg1, Object pArg2) {
			Write(pMessage, pArg1, pArg2, LogLevels.ERROR);
		}

		public static void Write(String pMessage, LogLevels pLogLevel) {
			switch(Out.mode){
				case Modes.Console:
					ConsoleColor originalColor = Console.ForegroundColor;
					if(pLogLevel == LogLevels.ERROR) {
						Console.ForegroundColor = ConsoleColor.Red;
					}
					Console.WriteLine(pMessage);
					Console.ForegroundColor = originalColor;
					break;
				case Modes.Log:
					Logger.Log(pMessage, pLogLevel);
					break;
			} 
		}

		public static void Write(String pMessage, Object pArg1, LogLevels pLogLevel) {
			switch (Out.mode) {
				case Modes.Console:
					Console.WriteLine(String.Format(pMessage, pArg1));
					break;
				case Modes.Log:
					Logger.Log(pMessage, pArg1, pLogLevel);
					break;
			}
		}

		public static void Write(String pMessage, Object pArg1, Object pArg2, LogLevels pLogLevel) {
			switch (Out.mode) {
				case Modes.Console:
					Console.WriteLine(String.Format(pMessage, pArg1, pArg2));
					break;
				case Modes.Log:
					Logger.Log(pMessage, pArg1, pArg2, pLogLevel);
					break;
			}
		}

		public static void Write(String pMessage, Object pArg1, Object pArg2, Object pArg3, LogLevels pLogLevel) {
			switch (Out.mode) {
				case Modes.Console:
					Console.WriteLine(String.Format(pMessage, pArg1, pArg2, pArg3));
					break;
				case Modes.Log:
					Logger.Log(pMessage, pArg1, pArg2, pArg3, pLogLevel);
					break;
			}
		}
	}
}
