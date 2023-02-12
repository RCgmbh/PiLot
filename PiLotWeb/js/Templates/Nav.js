var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Nav = {

	navPage: `
		<div class="navPage hCenter fullWidth">
			<div class="divData navData">
				<div class="divDirection"></div>
				<div class="divSpeed"></div>
				<div class="divPosition hidden"></div>
			</div>
		</div>
		`,

	outdatedGpsWarning: `<div class="feedbackBad navOutdatedDataWarning hidden" data-text="noGpsData"></div>`,

	routesPage: `
		<div class="contentPadding">
			<h1 data-text="routes"></h1>
			<a class="lnkAddRoute block marginBottom"><i class="icon-plus marginRight"></i><span data-text="newRoute"></span></a>
			<div class="plhTable marginRightBig"><div>
		</div>
		`,

	routesTable: `
		<table class="dgTable tblRoutes"><tbody>
			<tr class="dgHeader">
				<th class="headerActive col2" data-text="active"></th>
				<th class="headerName"><a href="#" class="lnkHeaderName" data-text="name"></a></th>
				<th class="headerDistance right col6"><a href="#" class="lnkHeaderDistance"><span data-text="distance"></span> [<span data-text="nm"></span>]</a></th>
				<th class="headerWaypoints right col6"><a href="#" class="lnkHeaderWaypoints" data-text="waypoints"></a></th>
			</tr>
		</tbody></table>`,

	routesTableRow: `
		<tr>
			<td class="tdIsActive biggerText"><a href="#" class="lnkActivate"><i class="icon-checkmark3"></i></a></td>
			<td class="tdName"><a href="#" class="lnkName"></a></td>
			<td class="tdDistance right"></td>
			<td class="tdWaypoints right"></td>
		</tr>`,

	routeDetailPage: `
		<div class="contentPadding">
			<div class="dataContainerFull marginBottom">
				<h1><a href="index.html?p=routes"><i class="icon-arrow-left2"></i> <span data-text="routes"></span></a></h1>
			</div>
			<div class="dataContainerHalf paddingRight">
				<div id="divRoute"></div>
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<div id="divMap" class="map navMap borderDark"></div>
			</div>
		</div>`,

	editRouteForm: `
		<div>
			<span class="bigDisplayText block">
				<input type="text" class="tbRouteName inlineBlock inlineTextbox fullWidth marginBottom" value="" />
			</span>
			<span class="semiBold inlineBlock marginBottomSmall"><span data-text="totalDistance"></span> <span class="lblTotalDistance"></span> <span data-text="nm"></span></span>
			<div class="divWaypoints marginBottom"></div>
			<div class="divActions">
				<div class="block marginBottom">
					<a href="#" class="lnkAddWaypoint inlineBlock marginBottom"><i class="icon-plus marginRight"></i><span data-text="addWaypoint"></span></a>
				<div>
				<div class="block marginBottom">
					<a href="#" class="lnkActivateRoute marginRight"><i class="icon-checkmark3 marginRight iconActiveRoute"></i><span data-text="activateRoute"></span></a> |
					<a href="#" class="lnkReverseRoute marginLeft marginRight"><i class="icon-arrow-left2 marginRight"></i><span data-text="reverseRoute"></span></a> |
					<a href="#" class="lnkCopyRoute marginLeft marginRight"><i class="icon-copy marginRight"></i><span data-text="copy"></span></a> |
					<a href="#" class="lnkDeleteRoute marginLeft"><i class="icon-trashcan marginRight"></i><span data-text="deleteRoute"></span></a>
				</div>
			</div>
		</div>`,

	waypointForm: `
		<div class="navWaypointForm"> 
			<div class="divWaypoint">
				<i class="icon-location col1"></i>
				<input type="text" class="tbWaypointName inlineTextbox" value="" /> 
				<div class="divLatLon">
					<span class="plhLatitude inlineBlock marginRight"></span><span class="plhLongitude inlineBlock"></span> 
				</div>
				<div class="divButtons marginLeft">
					<a href="#" class="lnkDeleteWaypoint"><i class="icon-trashcan"></i></a>
					<div>
						<a href="#" class="lnkMoveDown"><i class="icon-arrow-down2"></i></a>
						<a href="#" class="lnkMoveUp"><i class="icon-arrow-up2"></i></a>
					</div>
				</div>
			</div>
			<div class="block divLeg">
				<span class="inlineBlock col1"></span>
				<i class="icon-arrow-down2 col1"></i>
				<span class=""><span class="lblDistance"></span> <span data-text="nm"></span></span> /
				<span class="lblBearing"></span>°
			</div>
		</div>`,

	coordinateForm: `
		<input type="text" class="inlineBlock right tbDeg inlineTextbox" style="width:2em;" placeholder="--" 
		/>° <input type="text" class="inlineBlock right tbMin inlineTextbox" style="width:3.4em;" placeholder="---" 
		/>\' <input type="text" class="inlineBlock tbPrefix inlineTextbox" style="width:1.3em;" placeholder="-" />`,

	liveRoute: `
		<div class="navLiveRoute">
			<span class="lblRouteName" hidden></span>
			<div class="divWaypoints"></div>
		</div>`,

	liveWaypoint: `
		<div class="navWaypoint">
			<div class="divWaypointName">
				<span class="lblIcon">
					<span class="iconPastWP" hidden><i class="icon-checkmark5 "></i></span>
					<span class="iconNextWP" hidden><i class="icon-location2"></i></span>
					<span class="iconAheadWP" hidden><i class="icon-location "></i></span>
					<span class="iconFinalWP" hidden><i class="icon-flag"></i></span>
				</span>
				<div class="lblName"></div>
			</div>
			<div class="pnlLatLon">
				<span class="lblLat">-</span><br />
				<span class="lblLon">-</span>
			</div>
			<div class="divEtaDistBear">
				<span class="lblETA"></span>|<span><span class="lblDist"></span>nm</span>|<span><span class="lblBearing"></span>°</span>
			</div>
		</div>`,

	navOptions: `
		<div class="sideMenu">
			<a href="#" class="expandCollapse">
				<i class="icon-circle-right expand"></i><i class="icon-circle-left collapse"></i>
			</a>
			<a href="#" class="option lnkToggleCoordinates">
				<span class="label" data-text="coordinates"></span>
				<span class="icon"><i class="icon-globe2"></i></span>
			</a>
			<a href="#" class="option lnkTogglePastWaypoints">
				<span class="label" data-text="passedWP"></span>
				<span class="icon"><i class="icon-checkmark5"></i></span>
			</a>
			<a href="#" class="option lnkToggleNextWaypoint">
				<span class="label" data-text="nextWP"></span>
				<span class="icon"><i class="icon-location2"></i></span>
			</a>
			<a href="#" class="option lnkToggleAheadWaypoints">
				<span class="label" data-text="upcomingWP"></span>
				<span class="icon"><i class="icon-location"></i></span>
			</a>
			<a href="#" class="option lnkToggleFinalWaypoint">
				<span class="label" data-text="destination"></span>
				<span class="icon"><i class="icon-flag"></i></span>
			</a>
		</div>
	`,

	startPageNav: `
		<div class="startPageNav navData border"></div>
	`,

	sogIndicator: `
		<div class="divSOG hidden display motionDisplay">
			<span data-text="sog"></span><span class="lblSOG lblValue">---</span><span data-text="kn"></span>
		</div>
	`,

	cogIndicator: `
		<div class="divCOG hidden display motionDisplay">
			<span data-text="cog"></span><span class="lblCOG lblValue">---</span><span class="deg">°</span>
		</div>
	`,

	vmgIndicator: `
		<div class="divVMG hidden display motionDisplay">
			<span data-text="vmc"></span><span class="lblVMG lblValue">---</span><span data-text="kn"></span>
		</div>
	`,

	xteIndicator: `
		<div class="divXTE hidden display xteDisplay">
			<span data-text="xte"></span>
			<span class="lblIcon">
				<i class="icon-arrow-left2 lblXTELeft hidden"></i>
				<i class="icon-arrow-right2 lblXTERight hidden"></i>
			</span>
			<span class="lblXTE lblValue">---</span>
			<span data-text="nm"></span>
		</div>
	`,

	positionIndicator: `
		<div class="pnlCoordinates">
			<div class="divLat display">
				<span class="lblLatPrefix prefix"></span> <span class="lblLatDegrees value">--</span><span>°</span> <span class="lblLatMinutes value">--.---</span><span>'</span>
			</div>
			<div class="divLon display">
				<span class="lblLonPrefix prefix"></span> <span class="lblLonDegrees value">---</span><span>°</span> <span class="lblLonMinutes value">--.---</span><span>'</span>
			</div>
		</div>
	`,

	poiDetails: `
		<div class="pnlOverlay vCenter overlay" hidden>
			<div class="pnlDialog poiDetails dialogPanel hCenter">
				<div class="paddingAllSmall">
					<div class="marginBottomSmall flexRowWrap" style="align-items:center; display:flex; flex-wrap:wrap-reverse;">
						<div class="plhCategoryIcon poiIcon marginRight" style="flex-grow:0;"></div>
						<span class="lblCategoryName italic" style="flex-grow:1;"></span>
						<a href="#" class="lnkClose" style="flex-grow:0;"><i class="icon-cross"></i></a>
					</div>
					<span class="lblTitle marginBottomSmall block semiBold"></span>
					<div class="labelValues30-70 flexColumn marginBottomSmall">
						<div class="pnlFeatures"><span class="label" data-text="features"></span><ul class="ulFeatures value"></ul></div>
						<div class="pnlDescription"><span class="label" data-text="description"></span><span class="lblDescription value preWrap" style="word-break: break-word;overflow-wrap:break-word;"></span></div>
						<div class="pnlProperties" hidden><span class="label" data-text="properties"></span><span class="lblProperties value"></span></div>
						<div class="pnlValidFrom"><span class="label" data-text="validFrom"></span><span class="lblValidFrom value"></span></div>
						<div class="pnlValidTo"><span class="label" data-text="validTo"></span><span class="lblValidTo value"></span></div>
						<div>
							<div class="label">
								<span class="label" data-text="eta"></span>

							</div>
							<div class="value">
								<span class="pnlLiveData marginRightSmall" hidden>
									<span class="lblEta"></span>
									(<span class="lblEtaDuration"></span>, <span class="lblDistance"></span>&thinsp;<span data-text="nm"></span>, <span class="lblBearing"></span>°)
								</span>
								<span class="pnlNoLiveData marginRightSmall">---</span>
								<a href="#" class="lnkHideLiveData marginRight"><i class="icon-eye-blocked"></i></a>
								<a href="#" class="lnkShowLiveData marginRight" hidden><i class="icon-eye"></i></a>
							</div>
						</div>
					</div>
				</div>
				<div class="flexRowWrap bgLight" style="justify-content:space-between;">
					<a href="#" class="lnkEdit marginAllSmall"><i class="icon-pencil marginRightSmall"></i><span data-text="edit"></span></a>
					<a href="#" class="lnkMove marginAllSmall"><i class="icon-unlocked2 marginRightSmall"></i><span data-text="move"></span></a>
					<a href="#" class="lnkDelete marginAllSmall"><i class="icon-trashcan marginRightSmall"></i><span data-text="delete"></span></a>
				</div>
			</div>
		</div>`,

	editPoiDialog: `
		<div class="pnlOverlay vCenter overlay" hidden><div class="pnlDialog poiDetails dialogPanel hCenter"></div></div>
	`,

	poiForm: `
		<div class="paddingAllSmall">
			<span class="lblTitleAddPoi block marginBottomSmall semiBold" data-text="addPoi"></span>
			<span class="lblTitleEditPoi block marginBottomSmall semiBold" data-text="editPoi"></span>
			<div class="calValidTo hCenter" style="top:2em;" hidden></div>
			<div class="calValidFrom hCenter" style="top:2em;" hidden></div>
			<div class="poiForm marginBottom">
				<input type="text" class="tbTitle marginBottomSmall" data-title="title" />
				<select class="ddlCategory marginBottomSmall"></select>
				<textarea class="tbDescription marginBottomSmall" rows="7" data-title="description"></textarea>
				<div class="flexColumn marginBottomSmall">
					<span data-text="features"></span>
					<div class="plhFeatures borderLight paddingAllSmall"></div>
				</div>
				<div class="flexRowWrap">
					<div class="flex" style="flex: 1 0 50%;"><span class="inlineBlock col4" data-text="latitude"></span><div class="plhLatitude flex"></div></div>
					<div class="flex" style="flex: 1 0 50%;"><span class="inlineBlock col4" data-text="longitude"></span><div class="plhLongitude flex"></div></div>
				</div>
				<div class="flexRowWrap">
					<div class="marginBottomSmall flex" style="flex: 1 0 50%;">
						<span class="inlineBlock col4" data-text="validFrom">:</span>
						<input type="text" class="tbValidFrom input4" />
						<a href="#" class="lnkClearValidFrom"><i class="icon-cross"></i></a>
					</div>
					<div class="marginBottomSmall flex" style="flex: 1 0 50%;">
						<span class="inlineBlock col4" data-text="validTo">:</span>
						<input type="text" class="tbValidTo input4" />
						<a href="#" class="lnkClearValidTo"><i class="icon-cross"></i></a>
					</div>
				</div>
				<div class="pnlSource flexRowWrap" hidden>
					<div class="flex marginBottomSmall" style="flex: 1 0 50%;">
						<span class="inlineBlock col4" data-text="source"></span><input type="text" class="tbSource input4" />
					</div>
					<div class="flex marginBottomSmall" style="flex: 1 0 50%;">
						<span class="inlineBlock col4" data-text="sourceId"></span><input type="text" class="tbSourceId input4" />
					</div>
				</div>
			</div>
			<div class="buttons reverse paddingBottomBig">
				<a href="#" class="btnSave linkButton semiBold" data-text="save"></a>
				<a href="#" class="btnCancel linkButton" data-text="cancel"></a>
			</div>
		</div>`,

	poiFeaturesSelector: `
		<div>
			<span class="marginRight">
				<input type="text" class="tbSearch input6 marginBottomSmall" data-title="search" /><a href="#" class="lnkClear" style="margin-left:-1.5em;"><i class="icon-cross"></i></a>
			</span>
			<span class="noWrap inlineBlock marginBottomSmall" style="min-width:10em;">
				<a href="#" class="lnkShowAll" data-text="showAll"></a><a href="#" class="lnkShowSelected" data-text="showSelected" hidden></a>
			</span>
			<div class="plhFeatureCheckboxes flexColumn paddingBottomSmall" style="align-items:flex-start;"></div>
		</div>`,

	poiCategoryIconCss: '<i class="{{icon}}"></i>',

	poiCategoryIconSvg: '<img src="img/icons/{{icon}}" />'
};