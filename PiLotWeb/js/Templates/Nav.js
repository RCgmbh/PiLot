var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Nav = {

	navPage: `
		<div class="navPage">
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
			<h1>Routen</h1>
			<a class="lnkAddRoute block marginBottom"><i class="icon-plus marginRight"></i>Neue Route</a>
			<div class="plhTable marginRightBig"><div>
		</div>
		`,

	routesTable: `
		<table class="dgTable tblRoutes"><tbody>
			<tr class="dgHeader">
				<th class="headerActive col2">Aktiv</th>
				<th class="headerName" > <a href="#" class="lnkHeaderName">Name</a></th>
				<th class="headerDistance right col6"><a href="#" class="lnkHeaderDistance">Distanz [nm]</a></th>
				<th class="headerWaypoints right col6"><a href="#" class="lnkHeaderWaypoints">Wegpunkte</a></th>
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
				<h1><a href="index.html?p=routes"><i class="icon-arrow-left2"></i> Routen</a></h1>
			</div>
			<div class="dataContainerHalf paddingRight">
				<div id="divRoute"></div>
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<div id="divMap" class="map navMap borderDark"></div>
			</div>
		</div>`,

	editRouteForm: `
		<span class="bigDisplayText block">
			<input type="text" class="tbRouteName input8 inlineBlock inlineTextbox marginBottom" value="" />
		</span>
		<span class="semiBold inlineBlock marginBottomSmall">Gesamtdistanz <span class="lblTotalDistance"></span> nm</span>
		<div class="divWaypoints marginBottom"></div>
		<div class="divActions">
			<div class="block marginBottom">
				<a href="#" class="lnkAddWaypoint inlineBlock marginBottom"><i class="icon-plus marginRight"></i>Wegpunkt hinzufügen</a>
			<div>
			<div class="block marginBottom">
				<a href="#" class="lnkActivateRoute marginRight"><i class="icon-checkmark3 marginRight iconActiveRoute"></i>Route aktivieren</a> |
				<a href="#" class="lnkDeleteRoute marginLeft"><i class="icon-trashcan marginRight"></i>Route löschen</a>
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
				<div class="divButtons">
					<a href="#" class="lnkDeleteWaypoint marginLeft linkButton"><i class="icon-trashcan"></i></a>
					<span class="linkButton handle move"><span>
						<i class="icon-arrow-up2"></i><i class="icon-arrow-down2"></i>
					</span></span>
				</div>
			</div>
			<div class="block divLeg">
				<span class="inlineBlock col1"></span>
				<i class="icon-arrow-down2 col1"></i>
				<span class=""><span class="lblDistance"></span> nm</span> /
				<span class="lblBearing"></span>°
			</div>
		</div>`,

	coordinateForm: `
		<input type="text" class="inlineBlock right tbDeg inlineTextbox" style="width:2em;" placeholder="--" 
		/>° <input type="text" class="inlineBlock right tbMin inlineTextbox" style="width:3.4em;" placeholder="---" 
		/>\' <input type="text" class="inlineBlock tbPrefix inlineTextbox" style="width:1.3em;" placeholder="-" />`,

	liveRoute: `
		<div class="navLiveRoute">
			<span class="lblRouteName hidden"></span>
			<div class="divWaypoints"></div>
		</div>`,

	liveWaypoint: `
		<div class="navWaypoint">
			<div class="divWaypointName">
				<span class="lblIcon">
					<span class="iconPastWP hidden"><i class="icon-checkmark5 "></i></span>
					<span class="iconNextWP hidden"><i class="icon-location2"></i></span>
					<span class="iconAheadWP hidden"><i class="icon-location "></i></span>
					<span class="iconFinalWP hidden"><i class="icon-flag"></i></span>
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

	telemetryOptions: `
		<div class="sideMenu">
			<a href="#" class="expandCollapse">
				<i class="icon-circle-right expand"></i><i class="icon-circle-left collapse"></i>
			</a>
			<a href="#" class="option lnkToggleCoordinates">
				<span class="label">Koordinaten</span>
				<span class="icon"><i class="icon-globe2"></i></span>
			</a>
			<a href="#" class="option lnkTogglePastWaypoints">
				<span class="label">Achterne WP</span>
				<span class="icon"><i class="icon-checkmark5"></i></span>
			</a>
			<a href="#" class="option lnkToggleNextWaypoint">
				<span class="label">Nächster WP</span>
				<span class="icon"><i class="icon-location2"></i></span>
			</a>
			<a href="#" class="option lnkToggleAheadWaypoints">
				<span class="label">Voraus liegende WP</span>
				<span class="icon"><i class="icon-location"></i></span>
			</a>
			<a href="#" class="option lnkToggleFinalWaypoint">
				<span class="label">Ziel</span>
				<span class="icon"><i class="icon-flag"></i></span>
			</a>
		</div>
	`,

	startPageNav: `
		<div class="startPageNav navData border"></div>
	`,

	sogIndicator: `
		<div class="divSOG hidden display motionDisplay">
			<span>SOG</span><span class="lblSOG lblValue">---</span><span>kn</span>
		</div>
	`,

	cogIndicator: `
		<div class="divCOG hidden display motionDisplay">
			<span>COG</span><span class="lblCOG lblValue">---</span><span class="deg">°</span>
		</div>
	`,

	vmgIndicator: `
		<div class="divVMG hidden display motionDisplay">
			<span>VMG</span><span class="lblVMG lblValue">---</span><span>kn</span>
		</div>
	`,

	xteIndicator: `
		<div class="divXTE hidden display xteDisplay">
			<span>XTE</span>
			<span class="lblIcon">
				<i class="icon-arrow-left2 lblXTELeft hidden"></i>
				<i class="icon-arrow-right2 lblXTERight hidden"></i>
			</span>
			<span class="lblXTE lblValue">---</span>
			<span>nm</span>
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
	`
};