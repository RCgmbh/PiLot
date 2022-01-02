var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Tools = {

	toolsOverviewPage: `
		<div class="contentPadding">
			<h1>Tools</h1>
			<a href="" class="lnkData tile big">
				<div>
					<span class="symbol"><i class="icon-database"></i></span>
					<span class="label">Data</span>
				</div>
			</a>
			<a href="Tiles.aspx" class="lnkTiles tile big">
				<div>
					<span class="symbol"><i class="icon-download2"></i></span>
					<span class="label">Local Tiles</span>
				</div>
			</a>

		</div>
	`,

	gpsExportForm: `
		<div class="contentPadding">
			<h1><a href="" class="lnkTools">Tools</a> : Data</h1>
			<h2>GPS</h2>
				<div class="dataContainerHalf marginBottom paddingTop paddingRight">
				<div class="marginBottomSmall"><span class="col4 inlineBlock">Start</span><input type="text" class="input4 tbStartDate"
				/><div class="divCalStartDate"></div><input type="text" class="input3 tbStartTime" placeholder="hh:mm" /><a
				class="lnkStartTimeFromMap" href="#"><i class="icon-map2"></i></a></div>
				<div class="marginBottomSmall"><span class="col4 inlineBlock">Ende</span><input type="text" class="input4 tbEndDate"
				/><div class="divCalEndDate"></div><input type="text" class="input3 tbEndTime" placeholder="hh:mm" /><a
				class="lnkEndTimeFromMap" href="#"><i class="icon-map2"></i></a></div>
				<div class="marginBottomSmall"><span class="col4 inlineBlock"></span><button type="button" class="input7 btnLoadData marginBottom">Daten laden</button></div>
				<div class="col11 feedbackInfo divLoadingData hidden">Lade Daten...</div>
				<div class="col11 feedbackGood divDataLoaded hidden"><span class="lblPositionsCount">0</span> Positionen gefunden</div>
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<div class="divMap navMap borderDark" style="max-height:30em;"></div>
			</div>
			<div class="divResult dataContainerFull marginBottom paddingRight hidden">
				<h3><a class="lnkExport">Export</a></h3>
				<div class="divExport hidden">
					<div>
						<label><input type="radio" name="exportFormat" value="CSV" class="rbExportFormat" />CSV</label>
						<label><input type="radio" name="exportFormat" value="GPX" class="rbExportFormat" />GPX</label>
						<label><input type="radio" name="exportFormat" value="JSON" class="rbExportFormat" />JSON</label>
						<label><input type="radio" name="exportFormat" value="Table" class="rbExportFormat" />Table</label>		
					</div>
					<div class="divResultText hidden marginBottom"> 
						<textarea class="fullWidth big tbResultText marginBottomSmall" style="max-height: 20em; overflow:auto; border:1px solid #666"></textarea>
						<button type="button" class="btnCopy"><i class="icon-copy marginRight"></i>Kopieren</button>
					</div>
					<div class="marginBottomSmall divResultTable hidden" style="max-height: 20em; overflow:auto; border:1px solid #666"> 
						<table class="tblPositions dgTable">
							<tbody>
								<tr class="dgHeader">
									<th>UTC Epoc</th>
									<th>Datum UTC</th>
									<th>Datum BoatTime</th>
									<th>Latitude</th>
									<th>Longitude</th>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				<h3><a class="lnkDelete">Löschen</a></h3>
				<div class="divDelete hidden">
					<button type="button" class="btnDeleteCurrent marginRight">Aktuelle Position</button>
					<button type="button" class="btnDeleteAll marginRight">Ganze Zeitspanne</button>
				</div>
				<h3><a class="lnkSpeedDiagram">Speed Diagram</a></h3>
				<div class="pnlSpeedDiagram hidden"></div>
			</div>
		</div>
	`,

	speedDiagram: `
		<div style="display:flex; justify-content:flex-end" class="marginBottomSmall">
			<div class="marginLeft">
				Unit: <select class="ddlUnit">
					<option value="ms">m/s</option>
					<option value="kts">kts</option>
					<option value="kmh">km/h</option>
				</select>
			</div>
			<div class="marginLeft">
				Sample: <select class="ddlSample">
					<option value="10">10 s</option>
					<option value="30">30 s</option>
					<option value="60">1 min</option>
					<option value="300">5 min</option>
					<option value="600">10 min</option>
					<option value="1800">30 min</option>
					<option value="3600">1 h</option>
				</select>
			</div>
		</div>
		<div style="width:100%; height:20vh; min-height:200px; border:1px solid #666;" class="pnlChart">
			
		</div>
	`,

	tilesDownloadForm: `
		<div class="contentPadding">
			<h1><a href="" class="lnkTools">Tools</a> : Tiles</h1>
			<div class="marginTop marginBottom dataContainerHalf">
				<div class="semiBold inlineBlock marginBottomSmall">Tile Sets</div>
				<div class="divTileSources marginBottom">
					<span class="col6 inlineBlock strong">Name</span><span class="col2 inlineBlock center"><i class="icon-eye"></i></span><span class="col2 inlineBlock center"><i class="icon-download2"></i></span>
					<div class="divTileSourceTemplate">
						<span class="col6 inlineBlock strong lblName"></span><span class="col2 inlineBlock center"><input type="checkbox" checked="checked" class="cbShow marginNone" /></span><span class="col2 inlineBlock center"><input type="checkbox" class="cbDownload marginNone" /></span>
					</div>
				</div>
			</div>
			<div class="marginTop marginBottom dataContainerHalf">
				<div class="semiBold inlineBlock marginBottomSmall">Optionen</div>
				<div class="marginBottom">
					Kleinere Zoom-Levels (weniger detailliert) auch herunterladen:<br/>
					<select class="ddlIncludeLower input6">
						<option value="0" selected="true">keine</option>
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="99">alle</option>
					</select>
				</div>
				<div class="marginBottom">
					Grössere Zoom-Levels (detaillierter) auch herunterladen:<br/>
					<select class="ddlIncludeHigher input6">
						<option value="0" selected="true">keine</option>
						<option value="1">1</option>
						<option value="2">2</option>
					</select>
				</div>
				<div class="marginBottom">
					<input type="checkbox" id="cbForceDownload"><label for="cbForceDownload">Vorhandene Tiles überschreiben</label>
				</div>
			</div>
			<div class="dataContainerFull paddingRight divStats" style="display:flex">
				<div>Zoom: <span class="lblZoom"></span> |&nbsp;</div>
				<div>Heruntergeladen: <span class="lblDownloadCount">0</span> Tiles, <span class="lblDownloadKB">0</span> KB |&nbsp;</div>
				<div>Offen: <span class="lblPendingCount">0</span> Tiles</div>
				<div style="flex-grow:1;text-align:right;"><span class="lblLoading hidden marginLeft"><i class="icon-hour-glass"></i></span></div>
			</div>
			<div class="dataContainerFull paddingRight marginBottom">
				<div class="divMap navMap borderDark" style="height:80vh;"></div>
			</div>
		</div>
	`,

	/// main form for data import, allows to select the import source and the date
	pi2piImportForm: `
		<div class="marginBottomSmall">
			<span class="col4 inlineBlock">Quelle</span><input type="text" class="input4 tbSource"
			/><span class="col4 inlineBlock">Datum</span><input type="text" class="input4 tbDate" /><div class="divCalStartDate"></div>
		</div>
		<div class="marginBottomSmall">
			<span class="col4 inlineBlock"></span><button type="button" class="input8 btnLoadData marginBottom">Daten laden</button>
		</div>
		<div class="marginBottomSmall">
			<div class="col11 feedbackInfo divLoadingData hidden">Lade Daten...</div>
		<div>
		<div class="plhDataPreview"></div>
	`,

	/// summarizes the data for one day found on the client and compares it to the local data
	pi2piImportPreview: `
		<div>
			<div class="plhGpsPreview marginBottomSmall">
				<input type="checkbox" name="cbImportGps" class="cbImportGps" title="GPS Daten importieren" />
			</div>
			<div class="plhLogbookPreview marginBottomSmall">
				<input type="checkbox" name="cbImportLogbook" class="cbImportLogbook" title=" />
			</div>
			<div class="plhPhotosPreview marginBottomSmall">
				<input type="checkbox" name="cbImportPhotos" class="cbImportPhotos" />
			</div>
			<div class="marginBottomSmall">
				<button type="button" class="input7 btnStartImport">Import starten</button>
			</div>
		</div>
	`,

	/// sommarizes the gps data for one day (either from the source or the current client)
	pi2piGpsDataPreview: ``,

	/// sommarizes the logbook data for one day (either from the source or the current client)
	pi2piLogbookDataPreview: ``,

	/// sommarizes the photos for one day (either from the source or the current client)
	pi2piPhotosPreview: ``

};