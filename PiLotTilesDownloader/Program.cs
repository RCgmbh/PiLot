/*
(c) 2023 Röthenmund Consulting GmbH

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.
 
The full license text is available at https://github.com/RCgmbh/PiLot/blob/master/LICENSE.
*/
using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Threading;
using System.Threading.Tasks;

using PiLot.Config;
using PiLot.Data.Files;
using PiLot.Model.Tiles;

namespace PiLot.TilesDownloader {
	
	class Program {

		private const Int32 PAUSEMS = 3000;
		private const Int32 PAUSEAFTER = 20;
		private const Int32 MAXAGEDAYS = 700;

		private static String configFilePath;
		private static TileSource[] tileSources;
		private static TileDataConnector tileDataConnector;
		private static HttpClient httpClient;
		private static Random random;
		private static Dictionary<String, List<Int32>> stats;
		private static String lastError;
		private static String lastInfo;

		/// <summary>
		/// Usage: ./PiLot.TilesDownloader /path/to/config.json
		/// </summary>
		/// <param name="args">The path to the tileSources config must be passed</param>
		static async Task Main(string[] args) {
			if (
				Program.ReadParameters(args) 
				&& Program.LoadTileSources()
			){
				await Program.StartTilesDownload();
			}
			Console.ReadKey();
		}

		private static Boolean ReadParameters(String[] args) {
			Boolean result;
			if(args.Length != 1) {
				WriteError("The config file path must be passed as parameter.");
				result = false;
			} else {
				configFilePath = args[0];
				result = true;
			}
			return result;
		} 

		private static Boolean LoadTileSources() {
			Boolean result;
			if (File.Exists(Program.configFilePath)) {
				try {
					Program.tileSources = new TilesConfigReader(Program.configFilePath).GetAllTileSources();
					if(Program.tileSources.Length > 0) {
						result = true;
					} else {
						Program.WriteError("The config file does not contain any tile sources");
						result = false;
					}
				} catch (Exception ex) {
					Program.WriteError(ex.Message);
					result = false;
				}
			} else {
				Program.WriteError($"config file not found at {Program.configFilePath}");
				result = false;
			}
			return result;
		}

		private static async Task StartTilesDownload() {
			Program.random = new Random();
			Program.tileDataConnector = TileDataConnector.Instance;
			Program.PrepareStats();
			Program.PrepareHttpClient();
			Console.CursorVisible = false;
			Console.Clear();
			await Program.DownloadRandomTiles();
		}

		private static void PrepareStats() {
			Program.stats = new Dictionary<String, List<Int32>>();
			foreach(TileSource aTileSource in Program.tileSources) {
				stats[aTileSource.Name] = new List<Int32>() { 0, 0 };
			}
		}

		private static void PrepareHttpClient() {
			Program.httpClient = new HttpClient();
			Program.httpClient.DefaultRequestHeaders.Add("Sec-Fetch-Dest", "image");
			Program.httpClient.DefaultRequestHeaders.Add("Sec-Fetch-Mode", "no-cors");
			Program.httpClient.DefaultRequestHeaders.Add("Sec-Fetch-Site", "cross-site");
			Program.httpClient.DefaultRequestHeaders.Add("User-Agent", "PiLot map tiles download service. See github.com/RCgmbh.");
		}

		private static async Task DownloadRandomTiles() {
			DateTime maxChangeDate = DateTime.UtcNow.AddDays(Program.MAXAGEDAYS * -1);
			Int32 pauseCounter = 0;
			List<Int32> statsItem;
			while (true) {
				TileSource tileSource = Program.tileSources[Program.random.Next(0, Program.tileSources.Length)];
				String tileSourceRoot = tileSource.LocalPath.Substring(0, tileSource.LocalPath.IndexOf("{"));
				DirectoryInfo rootDir = new DirectoryInfo(tileSourceRoot);
				DirectoryInfo zoomDir = Program.GetRandomDirectory(rootDir);
				DirectoryInfo xDir = Program.GetRandomDirectory(zoomDir);
				statsItem = Program.stats[tileSource.Name];
				if (xDir != null && xDir.Exists) {
					foreach (FileInfo aFile in xDir.GetFiles()) {
						if (aFile.LastWriteTimeUtc < maxChangeDate) {
							String y = aFile.Name.Substring(0, aFile.Name.Length - aFile.Extension.Length);
							statsItem[0]++;
							await Program.DownloadTile(tileSource, zoomDir.Name, xDir.Name, y);
							pauseCounter++;
							if (pauseCounter >= PAUSEAFTER) {
								pauseCounter = 0;
								Thread.Sleep(Program.PAUSEMS);
							}
						} else {
							statsItem[1]++;
						}
						Program.ShowStats();
					}
				}
			}
		}

		private static DirectoryInfo GetRandomDirectory(DirectoryInfo pParent) {
			DirectoryInfo result = null;
			if(pParent != null && pParent.Exists) {
				DirectoryInfo[] children = pParent.GetDirectories();
				if (children.Length > 0) {
					result = children[Program.random.Next(0, children.Length)];
				} 
			}
			return result;
		}

		private static async Task DownloadTile(TileSource pTileSource, String pZ, String pX, String pY) {
			if (
					Int32.TryParse(pZ, out Int32 z)
					&& Int32.TryParse(pX, out Int32 x)
					&& Int32.TryParse(pY, out Int32 y)
			) {
				String url = pTileSource.OnlineUrl
					.Replace("{s}", "a")
					.Replace("{z}", pZ)
					.Replace("{x}", pX)
					.Replace("{y}", pY);
				HttpResponseMessage response = await Program.httpClient.GetAsync(url);
				if (response.StatusCode == System.Net.HttpStatusCode.OK) {
					Byte[] bytes = await response.Content.ReadAsByteArrayAsync();
					TileDataConnector.SaveResults saveResult = Program.tileDataConnector.SaveTile(bytes, pTileSource, z, x, y);
					if (saveResult == TileDataConnector.SaveResults.Ok) {
						Program.lastError = String.Empty;
						Program.lastInfo = $"{url} downloaded";
					} else {
						Program.lastError = ($"Error saving tile from {url}. Result: {saveResult}");
					}
				} else {
					Program.lastError = $"Status code {response.StatusCode} for {url}";
				}
			}
		}

		private static void ShowStats() {
			Console.SetCursorPosition(0, 0);
			Console.WriteLine("┌──────────────────────┬────────────┬────────────┐");
			Console.WriteLine("│ Tile source          │ outdated   │ up-to-date │");
			Console.WriteLine("├──────────────────────┼────────────┼────────────┤");
			String name;
			String outdated, uptodate;
			foreach(KeyValuePair<String, List<Int32>> anItem in Program.stats) {
				name = String.Format("{0, -20}", anItem.Key);
				outdated = String.Format("{0, 10}", anItem.Value[0]);
				uptodate = String.Format("{0, 10}", anItem.Value[1]);
				Console.WriteLine($"│ {name} │ {outdated} │ {uptodate} │");
			}
			Console.WriteLine("└──────────────────────┴────────────┴────────────┘");
			Console.WriteLine();
			Console.WriteLine(Program.lastInfo);
			if (!String.IsNullOrEmpty(Program.lastError)) {
				Program.WriteError(Program.lastError);
			}
		}

		private static void WriteError(String pMessage) {
			ConsoleColor defaultColor = Console.ForegroundColor;
			Console.ForegroundColor = ConsoleColor.Red;
			Console.WriteLine(pMessage);
			Console.ForegroundColor = defaultColor;
		}
	}
}