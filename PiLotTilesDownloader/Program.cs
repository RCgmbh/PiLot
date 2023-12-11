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

using PiLot.TilesDownloader.Model;
using PiLot.Config;
using PiLot.Data.Files;
using PiLot.Model.Tiles;
using System.Linq;

namespace PiLot.TilesDownloader {
	
	class Program {

		private const Int32 PAUSEMS = 3000;
		private const Int32 PAUSEAFTER = 50;
		
		private static String configFilePath;
		private static Int32 maxAgeDays;
		private static TileSource selectedTileSource;
		private static Int32? selectedZoom;
		private static Boolean randomMode;
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
			Console.Clear();
			if (
				Program.ReadParameters(args) 
				&& Program.LoadTileSources()
			){
				Program.AskTileSource();
				Program.AskZoomLevel();
				Program.AskRandomMode();
				Program.AskMaxAgeDays();
				Console.CancelKeyPress += Console_CancelKeyPress;
				await Program.StartTilesDownload();
				Console.Write("Done. ");
			}
			Console.Write("Hit any key to quit.\n");
			Console.ReadKey();
			Program.CleanupConsole();
		}

		private static void Console_CancelKeyPress(object sender, ConsoleCancelEventArgs e) {
			Program.CleanupConsole();
		}

		private static void CleanupConsole() {
			Console.WriteLine("\nBye...\n");
			Console.CursorVisible = true;
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

		private static void AskTileSource() {
			Boolean valid = false;
			while (!valid) {
				Console.WriteLine("Please select a tile source.");
				Console.WriteLine("0: all tile sources");
				for (Int32 i = 0; i < Program.tileSources.Length; i++) {
					Console.WriteLine($"{i + 1}: {Program.tileSources[i].Name}");
				}
				Char input = (Console.ReadKey().KeyChar);
				Console.WriteLine();
				if (input == '0') {
					valid = true;
				} else if (Int32.TryParse(input.ToString(), out Int32 inputNumber) && inputNumber > 0 && inputNumber <= Program.tileSources.Length) {
					valid = true;
					Program.selectedTileSource = Program.tileSources[inputNumber - 1];
				} else {
					Console.WriteLine($"Invalid entry: {input}");
					Thread.Sleep(200);
					valid = false;
				}
				Console.WriteLine();
			}
		}

		private static void AskZoomLevel() {
			Boolean valid = false;
			while (!valid) {
				Console.Write("Please select the zoom level. Enter -1 for all zoom levels. ");
				String input = (Console.ReadLine());
				if (input == "-1") {
					valid = true;
				} else if (Int32.TryParse(input.ToString(), out Int32 inputNumber)) {
					valid = true;
					Program.selectedZoom = inputNumber;
				} else {
					Console.WriteLine($"Invalid entry: {input}");
					Thread.Sleep(200);
					valid = false;
				}
				Console.WriteLine();
			}
		}

		private static void AskRandomMode() {
			Boolean valid = false;
			while (!valid) {
				Console.Write("Please select the mode. 1: serial, 2: random. ");
				String input = (Console.ReadKey().KeyChar).ToString().ToLower();
				Console.WriteLine();
				Program.randomMode = input == "2";
				Boolean serialMode = input == "1";
				valid = Program.randomMode || serialMode;
				if (!valid) {
					Console.WriteLine($"Invalid entry: {input}");
					Thread.Sleep(200);
				}
				Console.WriteLine();
			}
		}

		private static void AskMaxAgeDays() {
			Boolean valid = false;
			while (!valid) {
				Console.Write("Enter the max age of tiles to keep, in days: ");
				String input = (Console.ReadLine());
				if (Int32.TryParse(input, out Int32 days)) {
					Program.maxAgeDays = days;
					valid = true;
				} else {
					Program.WriteError("Invalid number. Please try again.");
					Thread.Sleep(200);
				}
				Console.WriteLine();
			}
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
			Program.ShowStats();
			await Program.DownloadTiles();
		}

		private static void PrepareStats() {
			Program.stats = new Dictionary<String, List<Int32>>();
			foreach(TileSource aTileSource in Program.tileSources) {
				stats[aTileSource.Name] = new List<Int32>() { 0, 0, 0 };
			}
		}

		private static void PrepareHttpClient() {
			Program.httpClient = new HttpClient();
			Program.httpClient.DefaultRequestHeaders.Add("Sec-Fetch-Dest", "image");
			Program.httpClient.DefaultRequestHeaders.Add("Sec-Fetch-Mode", "no-cors");
			Program.httpClient.DefaultRequestHeaders.Add("Sec-Fetch-Site", "cross-site");
			Program.httpClient.DefaultRequestHeaders.Add("User-Agent", "PiLot map tiles download service. See github.com/RCgmbh.");
		}

		private static async Task DownloadTiles() {
			Func<IEnumerable<TileFile>> getTilesFunction = Program.randomMode ? Program.GetRandomTiles : Program.GetAllTiles;
			DateTime maxChangeDate = DateTime.UtcNow.AddDays(Program.maxAgeDays * -1);
			Int32 pauseCounter = 0;
			foreach(TileFile aTileFile in getTilesFunction()) {
				if (aTileFile.File.LastWriteTimeUtc < maxChangeDate) {
					if (await Program.DownloadTile(aTileFile.Tile)) {
						Program.stats[aTileFile.Tile.TileSource.Name][0]++;
					} else {
						Program.stats[aTileFile.Tile.TileSource.Name][2]++;
					}
					pauseCounter++;
					if (pauseCounter >= PAUSEAFTER) {
						pauseCounter = 0;
						Thread.Sleep(Program.PAUSEMS);
					}
				} else {
					Program.stats[aTileFile.Tile.TileSource.Name][1]++;
				}
				Program.ShowStats();
			}
		}

		private static IEnumerable<TileFile> GetAllTiles() {
			IEnumerable<TileSource> tileSources = Program.selectedTileSource == null ? Program.tileSources : new List<TileSource>() {Program.selectedTileSource };
			DirectoryInfo tileSourceDir;
			IOrderedEnumerable<DirectoryInfo> zoomDirectories;
			foreach(TileSource aTileSource in tileSources) {
				tileSourceDir = Program.GetTileSourceRoot(aTileSource);
				zoomDirectories = (
					Program.selectedZoom == null
					? tileSourceDir.EnumerateDirectories()
					: new List<DirectoryInfo> { Program.GetChildDirectory(tileSourceDir, Program.selectedZoom) }
				)
				.Where(d => d!= null)
				.OrderBy(d => String.Format("{0, 2}", d.Name));
				foreach(DirectoryInfo aZoomDirectory in zoomDirectories) {
					foreach(DirectoryInfo aXDirectory in aZoomDirectory.GetDirectories()) {
						foreach(FileInfo aFile in aXDirectory.GetFiles()) {
							String filename = Program.GetPureFilename(aFile);
							if (
									Int32.TryParse(aZoomDirectory.Name, out Int32 z)
									&& Int32.TryParse(aXDirectory.Name, out Int32 x)
									&& Int32.TryParse(filename, out Int32 y)
							) {
								yield return new TileFile(new TileInfo(aTileSource, z, x, y), aFile);
							}
						}
					}
				}
			}
		}

		private static IEnumerable<TileFile> GetRandomTiles() {
			while (true) {
				TileSource tileSource =  Program.selectedTileSource ?? Program.tileSources[Program.random.Next(0, Program.tileSources.Length)];
				DirectoryInfo rootDir = Program.GetTileSourceRoot(tileSource);
				DirectoryInfo zoomDir = Program.selectedZoom == null ? Program.GetRandomDirectory(rootDir) : Program.GetChildDirectory(rootDir, Program.selectedZoom);
				DirectoryInfo xDir = Program.GetRandomDirectory(zoomDir);
				if (xDir != null && xDir.Exists) {
					foreach (FileInfo aFile in xDir.GetFiles()) {
						String filename = Program.GetPureFilename(aFile);
						if (
								Int32.TryParse(zoomDir.Name, out Int32 z)
								&& Int32.TryParse(xDir.Name, out Int32 x)
								&& Int32.TryParse(filename, out Int32 y)
						) {
							yield return new TileFile(new TileInfo(tileSource, z, x, y), aFile);
						}
					}
				}
			}
		}

		private static DirectoryInfo GetTileSourceRoot(TileSource pTileSource) {
			string path = pTileSource.LocalPath.Substring(0, pTileSource.LocalPath.IndexOf("{"));
			return new DirectoryInfo(path);
		}

		private static DirectoryInfo GetChildDirectory(DirectoryInfo pParent, Object pName) {
			return pParent.GetDirectories(pName.ToString(), SearchOption.TopDirectoryOnly).ToList().FirstOrDefault();
		}

		private static String GetPureFilename(FileInfo pFile) {
			return pFile.Name.Substring(0, pFile.Name.Length - pFile.Extension.Length);
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

		private static async Task<Boolean> DownloadTile(TileInfo pTile) {
			Boolean result = false;
			String url = pTile.TileSource.OnlineUrl
				.Replace("{s}", "a")
				.Replace("{z}", pTile.Zoom.ToString())
				.Replace("{x}", pTile.X.ToString())
				.Replace("{y}", pTile.Y.ToString())
			;
			HttpResponseMessage response = await Program.httpClient.GetAsync(url);
			if (response.StatusCode == System.Net.HttpStatusCode.OK) {
				Byte[] bytes = await response.Content.ReadAsByteArrayAsync();
				TileDataConnector.SaveResults saveResult = Program.tileDataConnector.SaveTile(bytes, pTile);
				if (saveResult == TileDataConnector.SaveResults.Ok) {
					Program.lastInfo = $"{url} downloaded";
					result = true;
				} else {
					Program.lastError = ($"Error saving tile. Result: {saveResult}, url: {url}");
				}
			} else {
				Program.lastError = $"{response.StatusCode}: {url}";
			}
			return result;
		}

		private static void ShowStats() {
			Console.SetCursorPosition(0, 0);
			Console.WriteLine($"Tile Source: {(Program.selectedTileSource?.Name ?? "all")}");
			Console.WriteLine($"Zoom level: {(Program.selectedZoom?.ToString() ?? "all")}");
			Console.WriteLine($"Mode: {(Program.randomMode ? "Random" : "Serial")}");
			Console.WriteLine($"Maximal age of tiles: {Program.maxAgeDays} days\n");
			Console.WriteLine("┌──────────────────────┬────────────┬────────────┬────────────┐");
			Console.WriteLine("│ Tile source          │ outdated   │ up-to-date │ error      │");
			Console.WriteLine("├──────────────────────┼────────────┼────────────┼────────────┤");
			String name;
			String outdated, uptodate, error;
			foreach(KeyValuePair<String, List<Int32>> anItem in Program.stats) {
				name = String.Format("{0, -20}", anItem.Key);
				outdated = String.Format("{0, 10}", anItem.Value[0]);
				uptodate = String.Format("{0, 10}", anItem.Value[1]);
				error = String.Format("{0, 10}", anItem.Value[2]);
				Console.WriteLine($"│ {name} │ {outdated} │ {uptodate} │ {error} │");
			}
			Console.WriteLine("└──────────────────────┴────────────┴────────────┴────────────┘");
			Console.WriteLine();
			String formatString = $"{{0, -{Console.WindowWidth}}}";
			Console.WriteLine(String.Format(formatString, Program.lastInfo).Substring(0, Console.WindowWidth));
			Program.WriteError(String.Format(formatString, Program.lastError ?? "").Substring(0, Console.WindowWidth));
			Console.WriteLine();
		}

		private static void WriteError(String pMessage) {
			ConsoleColor defaultColor = Console.ForegroundColor;
			Console.ForegroundColor = ConsoleColor.Red;
			Console.WriteLine(pMessage);
			Console.ForegroundColor = defaultColor;
		}
	}
}