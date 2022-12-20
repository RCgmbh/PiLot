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
		<div class="fullHeight fullWidth absolute vCenter" hidden>
			<div class="overlay"></div>
			<div class="poiDetails dialogPanel hCenter hCenter">
				<div class="paddingAllSmall">
					<div class="marginBottomSmall flexRowWrap" style="align-items:center; display:flex; flex-wrap:wrap-reverse;">
						<div class="plhCategoryIcon poiIcon marginRight" style="flex-grow:0;"></div>
						<span class="lblCategoryName italic" style="flex-grow:1;"></span>
						<a href="#" class="lnkClose" style="flex-grow:0;"><i class="icon-cross"></i></a>
					</div>
					<span class="lblTitle marginBottomSmall block semiBold"></span>
					<div class="labelValues30-70 flexColumn marginBottomSmall">
						<div hidden><span class="label" data-text="features"></span><li class="liFeatures value"></li></div>
						<div><span class="label" data-text="description"></span><span class="lblDescription value"></span></div>
						<div class="pnlProperties" hidden><span class="label" data-text="properties"></span><span class="lblProperties value"></span></div>
						<div class="pnlValidFrom"><span class="label" data-text="validFrom"></span><span class="lblValidFrom value"></span></div>
						<div class="pnlValidTo"><span class="label" data-text="validTo"></span><span class="lblValidTo value"></span></div>
					</div>
				</div>
				<div class="flexRowWrap bgLight" style="justify-content:space-between;">
					<a href="#" class="lnkEdit marginAllSmall"><i class="icon-pencil marginRightSmall"></i><span data-text="edit"></span></a>
					<a href="#" class="lnkMove marginAllSmall"><i class="icon-unlocked2 marginRightSmall"></i><span data-text="move"></span></a>
					<a href="#" class="lnkDelete marginAllSmall"><i class="icon-trashcan marginRightSmall"></i><span data-text="delete"></span></a>
				</div>
			</div>
		</div>`,

	poiForm: `
		<div class="fullHeight fullWidth absolute vCenter" hidden>
			<div class="overlay"></div>
			<div class="poiDetails dialogPanel hCenter hCenter paddingAllSmall">
				<span class="lblTitleAddPoi block marginBottomSmall semiBold" data-text="addPoi"></span>
				<span class="lblTitleEditPoi block marginBottomSmall semiBold" data-text="editPoi"></span>
				<div class="calValidTo" style="top:2em;" hidden></div>
				<div class="calValidFrom" style="top:2em;" hidden></div>
				<div class="poiForm marginBottom">
					<input type="text" class="tbTitle marginBottomSmall" data-title="title" />
					<select class="ddlCategory marginBottomSmall"></select>
					<textarea class="tbDescription marginBottomSmall" rows="5" data-title="description"></textarea>
					<div class="flexRowWrap">
						<div class="flex" style="flex: 1 0 50%;"><span class="inlineBlock col4" data-text="latitude"></span><div class="plhLatitude flex"></div></div>
						<div class="flex" style="flex: 1 0 50%;"><span class="inlineBlock col4" data-text="longitude"></span><div class="plhLongitude flex"></div></div>
					</div>
					<label class="lblAllowDrag marginRight marginBottomSmall block"><input type="checkbox" class="cbAllowDrag" /><span data-text="allowDrag"></span></label>
					<div class="flexRowWrap">
						<div class="marginBottomSmall flex" style="flex: 1 0 50%;"><span class="inlineBlock col4" data-text="validFrom">:</span><input type="text" class="tbValidFrom input4" /></div>
						<div class="marginBottomSmall flex" style="flex: 1 0 50%;"><span class="inlineBlock col4" data-text="validTo">:</span><input type="text" class="tbValidTo input4" /></div>
					</div>
				</div>
				<div class="buttons reverse marginBottomSmall">
					<a href="#" class="btnSave linkButton semiBold" data-text="save"></a>
					<a href="#" class="btnCancel linkButton" data-text="cancel"></a>
				</div>
			</div>
		</div>`,

	poi_object: '<i class="icon-location"></i>',

	poi_health: '<i class="icon-health"></i>',

	poi_lock: '<img src="img/icons/lock.svg" />',

	poi_marina: `<img src="img/icons/marina.svg" />`,

	poi_gazstation: '<img src="img/icons/gazstation.svg" />',

	poi_mooring: '<img src="img/icons/mooring.svg" />',

	poi_anchorage: '<i class="icon-anchor"></i>',

	poi_toilet: '<i class="icon-man-woman"></i>',

	poi_restaurant: '<i class="icon-spoon-knife"></i>',

	poi_shop: '<i class="icon-cart"></i>',

	poi_obstacle: '<i class="icon-warning2"></i>',

	poi_information: '<i class="icon-info2"></i>',

	poi_event: '<i class="icon-pin"></i>',

	poi_measuringstation: '<i class="icon-meter2"</i>',

	poi_sight: '<i class="icon-eye"</i>'
};