var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Tools = {

	toolsOverviewPage: `
		<div class="contentPadding">
			<h1 data-text="tools"></h1>
			<a href="" class="lnkData tile big">
				<div>
					<span class="symbol"><i class="icon-database"></i></span>
					<span class="label" data-text="gpsData"></span>
				</div>
			</a>
			<a href="" class="lnkTiles tile big">
				<div>
					<span class="symbol"><i class="icon-download2"></i></span>
					<span class="label" data-text="localTiles"></span>
				</div>
			</a>
			<a href="" class="lnkPois tile big">
				<div>
					<span class="symbol"><i class="icon-location"></i></span>
					<span class="label" data-text="pois"></span>
				</div>
			</a>
		</div>
	`,

	gpsImportExportForm: `
		<div class="contentPadding">
			<h1><a href="" class="lnkTools" data-text="tools"></a> : <span data-text="gpsData"></span></h1>
			<div class="dataContainerHalf marginBottom paddingTop paddingRight">
				<div class="marginBottomSmall"><span class="col4 inlineBlock" data-text="start"></span><input type="text" class="input4 tbStartDate"
				/><div class="divCalStartDate" hidden></div><input type="text" class="input3 tbStartTime" data-title="hhmm" /><a
				class="lnkStartTimeFromMap" href="#"><i class="icon-map2"></i></a></div>
				<div class="marginBottomSmall"><span class="col4 inlineBlock" data-text="end"></span><input type="text" class="input4 tbEndDate"
				/><div class="divCalEndDate" hidden></div><input type="text" class="input3 tbEndTime" data-title="hhmm" /><a
				class="lnkEndTimeFromMap" href="#"><i class="icon-map2"></i></a></div>
				<div class="marginBottomSmall"><span class="col4 inlineBlock"></span><button type="button" class="input7 btnLoadData marginBottom" data-text="loadData"></button></div>
				<div class="feedbackInfo divLoadingData marginBottomSmall" hidden data-text="loadingData"></div>
				<div class="divTracksList"></div>
				<div class="feedbackGood divDataLoaded" hidden data-text="xPositionsFound">...</div>
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<div class="divMap navMap borderDark" style="max-height:30em;"></div>
			</div>
			<div class="divResult dataContainerFull marginBottom paddingRight" hidden>
				<h3><a class="lnkEdit" data-text="edit"></a></h3>
				<div class="divEdit" hidden>
					<span data-text="boat" class="marginRightSmall"></span><select class="ddlEditBoats input8 marginRightSmall"></select>
					<button type="button" class="btnSaveTrack marginRight" data-text="save"></button>
				</div>
				<h3><a class="lnkDelete" data-text="delete"></a></h3>
				<div class="divDelete" hidden>
					<button type="button" class="btnDeleteCurrent marginRight" data-text="currentPosition"></button>
					<button type="button" class="btnDeleteAll marginRight" data-text="entirePeriod"></button>
				</div>
				<h3><a class="lnkSpeedDiagram" data-text="speedDiagram"></a></h3>
				<div class="pnlSpeedDiagram" hidden></div>
				<h3><a class="lnkImport" data-text="import"></a></h3>
				<h3><a class="lnkExport" data-text="export"></a></h3>
				<div class="divExport" hidden>
					<div>
						<label><input type="radio" name="exportFormat" value="CSV" class="rbExportFormat" />CSV</label>
						<label><input type="radio" name="exportFormat" value="GPX" class="rbExportFormat" />GPX</label>
						<label><input type="radio" name="exportFormat" value="JSON" class="rbExportFormat" />JSON</label>
						<label><input type="radio" name="exportFormat" value="Table" class="rbExportFormat" />HTML</label>		
					</div>
					<div class="divResultText marginBottom" hidden> 
						<textarea class="fullWidth big tbResultText marginBottomSmall" style="max-height: 20em; overflow:auto; border:1px solid #666"></textarea>
						<button type="button" class="btnCopy"><i class="icon-copy marginRight"></i><span data-text="copy"></span></button>
					</div>
					<div class="marginBottomSmall divResultTable" hidden style="max-height: 20em; overflow:auto; border:1px solid #666"> 
						<table class="tblPositions dgTable">
							<tbody>
								<tr class="dgHeader">
									<th data-text="utcEpoc"></th>
									<th data-text="dateUTC"></th>
									<th data-text="boatTime"></th>
									<th data-text="latitude"></th>
									<th data-text="longitude"></th>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
				<div class="divImport" hidden>
					<label><input type="radio" name="importFormat" class="rbImportFormat" />CSV</label>
					<label><input type="radio" name="importFormat" class="rbImportFormat" />TCX</label>
					<textarea class="fullWidth big tbImport marginBottomSmall" style="max-height: 20em; overflow:auto; border:1px solid #666"></textarea>
					<div class="fullWidth marginBottom">
						<span data-text="utcOffset" class="marginRightSmall"></span><input type="text" class="tbImportUtcOffset input2 marginRight" />
						<span data-text="boat" class="marginRightSmall"></span><select class="ddlImportBoats input8 marginRight"></select>
					</div>
					<div class="pnlImportSuccess fullWidth feedbackGood marginBottom" hidden data-text="importSuccess"></div>
					<button type="button" class="btnImportPreview input6 marginRight" data-text="preview"></button>
					<button type="button" class="btnImport input6 marginRight" data-text="import"></button>
				</div>
			</div>
		</div>
	`,

	speedDiagram: `
		<div class="borderLight" style="padding: 0.5em 0.25em 0.25em 0.25em;">
			<div style="display:flex; gap:1em;" class="marginBottomSmall paddingRight">
				<span class="semiBold" style="flex-grow:1;" data-text="speedDiagram"></span>
				<div class="pnlUnit" hidden>
					<span data-text="unit"></span>: <select class="ddlUnit">
						<option value="ms" data-text="metersPerSecondShort"></option>
						<option value="kts" data-text="kn"></option>
						<option value="kmh" data-text="kmh"></option>
					</select>
				</div>
				<div class="pnlSample" hidden>
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
				<a class="lnkSettings"><i class="icon-cog"></i></a>
			</div>
			<div style="width:100%; height:20vh; min-height:200px;" class="pnlChart"></div>
		</div>
	`,

	tilesDownloadForm: `
		<div class="contentPadding">
			<h1><a href="" class="lnkTools" data-text="tools"></a> : <span data-text="localTiles"></span></h1>
			<div class="marginTop marginBottom dataContainerHalf">
				<div class="semiBold inlineBlock marginBottomSmall" data-text="tileSets"></div>
				<div class="divTileSources marginBottom">
					<span class="col6 inlineBlock strong" data-text="name"></span><span class="col2 inlineBlock center"><i class="icon-eye"></i></span><span class="col2 inlineBlock center"><i class="icon-download2"></i></span>
					<div class="divTileSourceTemplate">
						<span class="col6 inlineBlock strong lblName"></span><span class="col2 inlineBlock center"><input type="checkbox" checked="checked" class="cbShow marginNone" /></span><span class="col2 inlineBlock center"><input type="checkbox" class="cbDownload marginNone" /></span>
					</div>
				</div>
			</div>
			<div class="marginTop marginBottom dataContainerHalf">
				<div class="semiBold inlineBlock marginBottomSmall" data-text="options"></div>
				<div class="marginBottom">
					<span data-text="downloadLowerZoomLevels"></span>:<br/>
					<select class="ddlIncludeLower input6">
						<option value="0" selected="true" data-text="none"></option>
						<option value="1">1</option>
						<option value="2">2</option>
						<option value="99" data-text="all"></option>
					</select>
				</div>
				<div class="marginBottom">
					<span data-text="downloadHigherZoomLevels"></span>:<br/>
					<select class="ddlIncludeHigher input6">
						<option value="0" selected="true" data-text="none"></option>
						<option value="1">1</option>
						<option value="2">2</option>
					</select>
				</div>
				<div class="marginBottom">
					<input type="checkbox" id="cbForceDownload"><label for="cbForceDownload" data-text="replaceTiles"></label>
				</div>
			</div>
			<div class="dataContainerFull paddingRight divStats" style="display:flex; flex-wrap:wrap;">
				<div><span data-text="zoom"></span>: <span class="lblZoom"></span> |&nbsp;</div>
				<div><span data-text="downloaded"></span>: <span class="lblDownloadCount">0</span> <span data-text="tiles"></span>, <span class="lblDownloadKB">0</span> <span data-text="kb"></span> |&nbsp;</div>
				<div><span data-text="remaining"></span>: <span class="lblPendingCount">0</span> <span data-text="tiles"></span></div>
				<div style="flex-grow:1;text-align:right;"><span class="lblLoading hidden marginLeft"><i class="icon-hour-glass"></i></span></div>
			</div>
			<div class="dataContainerFull paddingRight marginBottom">
				<div class="divMap navMap borderDark" style="height:80vh;"></div>
			</div>
		</div>
	`,

	poisManagementPage: `
		<div class="contentPadding marginBottom">
			<h1><a href="" class="lnkTools" data-text="tools"></a> : <span data-text="pois"></span></h1>
		</div>`,

	poisOsmImportForm: `
		<div>
			<h2 class="lblTitle"><span data-text="importOsm"></span></h2>
			<div class="pnlForm" hidden>
				<div class="flexRowWrap marginRight marginTopSmall">
					<div class="marginBottom">
						<label class="marginRight noWrap"><input type="checkbox" class="cbImportMarinas marginRight" /><span data-text="marinas"></span></label>
						<label class="marginRight noWrap"><input type="checkbox" class="cbImportLocks marginRight" /><span data-text="locks"></span></label>
                        <label class="marginRight noWrap"><input type="checkbox" class="cbImportBridges marginRight" /><span data-text="bridges"></span></label>
						<label class="marginRight noWrap"><input type="checkbox" class="cbImportFuel marginRight" /><span data-text="fuelStations"></span></label>
						<label class="marginRight noWrap"><input type="checkbox" class="cbImportShops marginRight" /><span data-text="shops"></span></label>
						<label class="marginRight noWrap"><input type="checkbox" class="cbImportPump marginRight" /><span data-text="pumpingStations"></span></label>
						<label class="marginRight noWrap"><input type="checkbox" class="cbImportToilets marginRight" /><span data-text="toilets"></span></label>
					</div>
					<select class="ddlApi input10 marginBottomSmall marginRight"></select>
					<button class="btnLoad input6 marginBottomSmall" type="button" data-text="loadData" hidden></button>
					<span class="lblLoadingData marginLeft" hidden><i class="icon-hour-glass"></i></span>
				</div>
				<div class="flexRowWrap marginBottom">
					<div class="paddingRight" style="min-width:16em; flex-basis:30em; flex-grow:1;">
						<div class="pnlMap navMap" style="height: 70vh;"></div>
					</div>
					<div class="plhOsmDetails marginRight borderLight" style="min-width:16em; flex-basis:20em; flex-grow:1; max-height:70vh; overflow: auto; position:relative; "></div>
				</div>
			</div>
		</div>
	`,

	osmPoiDetails: `
		<div class="osmPoiDetails">
			<div class="paddingAllSmall">
				<span class="lblTitle semiBold"></span>
				<div class="flexColumn plhTags marginBottomSmall"></div>
				<div class="pnlActions">
					<a href="#" class="lnkHide marginRight"><i class="icon-eye-blocked marginRightSmall"></i><span data-text="hide"></span></a>
					<a href="#" class="lnkShow marginRight" hidden><i class="icon-eye marginRightSmall"></i><span data-text="show"></span></a>
					<a href="#" class="lnkImport marginRight" hidden><i class="icon-cloud-download marginRightSmall"></i><span data-text="import"></span></a>
					<a href="#" class="lnkEdit marginRight" hidden><i class="icon-pencil marginRightSmall"></i><span data-text="edit"></span></a>
					<a href="#" class="lnkLink marginRight" hidden><i class="icon-link marginRightSmall"></i><span data-text="linkPoi"></span></a>
					<a href="#" class="lnkUnlink marginRight" hidden><i class="icon-cancel2 marginRightSmall"></i><span data-text="unlinkPoi"></span></a>
				</div>
			</div>
			<div class="pnlLinkCandidates paddingAllSmall" hidden>
				<div class="pnlNoLinkCandidates feedbackWarning" hidden data-text="noPoiLinkCandidates"></div>
				<div class="plhLinkCandidates">
				</div>
			</div>
		</div>
	`,

	osmPoiTag: '<div><span class="lblKey italic"></span>: <span class="lblValue breakWord"></span></div>',

	osmLinkCandidate: '<a href="#" class="block"><span class="lblCategory"></span>:&nbsp;<span class="lblTitle"></span></a>',

	osmMapMarkerIcon: '<i class="icon-cloud-download"></i>',

	osmPoiEditDialog: `
		<div class="pnlOverlay vCenter overlay" hidden>
			<div class="pnlDialog editOsmPoi dialogPanel hCenter flexRowWrap">
				<div class="pnlPoiForm"></div>
				<div class="pnlOsmPoiForm"></div>
			</div>
		</div>
	`,

	poisJsonImportForm: `
		<div class="paddingTop">
			<h2><span data-text="importJson" class="marginBottomSmall"></span></h2>
			<div class="pnlForm flexRowWrap marginBottom paddingTopSmall" hidden>
				<div class="paddingRight" style="min-width:16em; flex-basis:30em; flex-grow:1;">
					<span class="semiBold" data-text="categories"></span>
					<textarea rows="10" class="tbImportCategories fullWidth smallerText marginBottom" style="font-family:'Lucida Console', Courier; height: 10vh;"></textarea>
					<span class="semiBold" data-text="features"></span>
					<textarea rows="10" class="tbImportFeatures fullWidth smallerText marginBottom" style="font-family:'Lucida Console', Courier; height: 10vh;"></textarea>
					<span class="semiBold" data-text="pois"></span>
					<textarea rows="40" class="tbImportPois fullWidth smallerText marginBottomSmall" style="font-family:'Lucida Console', Courier; height: 40vh;"></textarea>
					<div class="flexColumn marginBottomSmall">
						<label class="semiBold" data-text="handleExistingPois"></label>
						<label><input type="radio" value="add" name="rblReplaceOptions" checked /><span data-text="add"></span></label>
						<label><input type="radio" value="skip" name="rblReplaceOptions" /><span data-text="skip"></span></label>
						<label><input type="radio" value="replace" name="rblReplaceOptions" /><span data-text="replace"></span></label>
					</div>
					<button class="btnImport input7" type="button" data-text="import"></button>
				</div>
				<div class="paddingRight" style="min-width:16em; flex-basis:20em; flex-grow:1;">
					<div class="plhOutput preWrap" style="max-height:80vh; overflow:auto;"></div>
				</div>
			</div>
		</div>
	`,

	poisJsonExportForm: `
		<div class="paddingTop ">
			<h2><span data-text="export" class="marginBottomSmall"></span></h2>
			<div class="pnlForm flexColumn marginBottom paddingTopSmall paddingRight" style="max-width:48em;" hidden>
				<button class="btnExport input7 marginTop marginBottom" type="button" data-text="export"></button>
				<span class="semiBold" data-text="categories"></span>
				<textarea rows="10" class="tbExportCategories fullWidth smallerText marginBottom" style="font-family:'Lucida Console', Courier; height: 10vh;"></textarea>
				<span class="semiBold" data-text="features"></span>
				<textarea rows="10" class="tbExportFeatures fullWidth smallerText marginBottom" style="font-family:'Lucida Console', Courier; height: 10vh;"></textarea>
				<span class="semiBold" data-text="pois"></span>
				<textarea rows="40" class="tbExportPois fullWidth smallerText marginBottomSmall" style="font-family:'Lucida Console', Courier; height: 40vh;"></textarea>
			</div>
		</div>
	`,

	poiCategoriesForm: `
		<div class="paddingTop">
			<h2><span data-text="categories" class="marginBottomSmall"></span></h2>
			<div class="pnlForm paddingTopSmall" hidden>
				<div class="plhCategories"></div>
				<a href="#" class="lnkAddCategory"><i class="icon-plus marginRightSmall"></i><span data-text="addCategory"></span></a>
			</div>
		</div>
	`,

	poiCategoryForm: `
		<div class="flexRowWrap gapSmall marginBottomSmall">
			<input type="text" class="tbName input6" />
			<select class="ddlParent input6" />
			<input type="text" class="tbIcon input6" />
			<input type="text" class="tbLabel input6" />
			<a href="#" class="lnkDelete"><i class="icon-trashcan"></i></a>
		</div>
	`,

	poiFeaturesForm: `
		<div class="paddingTop">
			<h2><span data-text="features" class="marginBottomSmall"></span></h2>
			<div class="pnlForm paddingTopSmall" hidden>
				<div class="plhFeatures"></div>
				<a href="#" class="lnkAddFeature"><i class="icon-plus marginRightSmall"></i><span data-text="addFeature"></span></a>
			</div>
		</div>
	`,

	poiFeatureForm: `
		<div class="flexRowWrap gapSmall marginBottomSmall">
			<input type="text" class="tbName input6" />
			<input type="text" class="tbLabel input6" />
			<a href="#" class="lnkDelete"><i class="icon-trashcan"></i></a>
		</div>
	`
};