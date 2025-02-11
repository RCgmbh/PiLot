﻿var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Map = {

	mapPage: `<div style="flex-grow:1"><div class="navMap"></div></div>`,

	mapSettingsContainer: `
		<div class="sideMenu">
			<a href="#" class="expandCollapse">
				<i class="icon-circle-right expand"></i><i class="icon-circle-left collapse"></i>
			</a>
		</div>`,

	mapLayersIcon: `<a href="" class="sideMenu mapLayersIcon"><i class="icon-stack4 biggerText"></i></a>`,

	mapLayersSettings: `
		<div class="pnlOverlay vCenter overlay" hidden>
			<div class="pnlDialog mapLayerSettings dialogPanel flexColumn hCenter">
				<div class="paddingAllSmall flexRowWrap bgLight" style="align-items:center; display:flex; flex-wrap:wrap-reverse;">
					<span class="marginRight"><i class="icon-stack4 biggerText"></i></span>
					<span class="semiBold" data-text="mapLayerSettings"></span>
				</div>
				<div class="paddingAllSmall labelValues30-70" style="overflow:auto;">
					<label class="borderBottom borderLight paddingBottomSmall">
						<span data-text="tileSets" class="semiBold label"></span>
						<span class="value plhTileSources flexColumn"></span>
					</label>
					<label class="borderBottom borderLight paddingBottomSmall">
						<span data-text="pois" class="semiBold label"></span>
						<span class="value">
							<label><input type="checkbox" class="cbShowPois" /><span data-text="show"></span></label>					
							<span data-text="fromZoomLevel"></span>
							<select class="ddlPoisMinZoomLevel input4"></select>
						</span>
					</label>
					<div class="borderBottom borderLight paddingBottomSmall">
						<span class="label" data-text="categories"></span>
						<div class="plhCategories value flexColumn"></div>
					</div>
					<div>
						<span class="label" data-text="features"></span>
						<div class="plhFeatures value"></div>
					</div>
				</div>
				<div class="buttons reverse paddingAllSmall paddingBottomBig bgLight">
					<a href="#" class="btnApply linkButton semiBold" data-text="ok"></a>
					<a href="#" class="btnCancel linkButton" data-text="cancel"></a>
				</div>
			</div>
		</div>`,

	poiCategoryCheckbox: `
		<div class="flex">
			<span class="divIndent col1 inlineBlock"></span>
			<label class="marginRightSmall inlineBlock flex"><input type="checkbox" class="cbCategory" /><span class="lblCategory"></span></label>
			<a href="#" class="lnkExpand" hidden><i class="icon-expand_more biggerText"></i></a>
			<a href="#" class="lnkCollapse" hidden><i class="icon-expand_less biggerText"></i></a>
		</div>`,

	outdatedGpsWarning: `<div class="feedbackBad navOutdatedDataWarning absolute" hidden data-text="noGpsData"></div>`,

	mapWaypointPopup: `
		<div class="mapWaypointPopup">
			<div class="name block semiBold"></div><br />
			<span class="latLng"></span><br />
			<span data-text="eta"></span>: <span class="eta"></span><br />
			<span data-text="distance"></span>: <span class="dist"></span> <span data-text="nm"></span><br />
			<span data-text="bearing"></span>: <span class="bearing"></span>°<br /><br />
			<a href="#" class="lnkDelete" data-text="deleteWaypoint"></a>
		</div>`,

	mapLegPopup: `
		<div class="mapLeg">
			<a href="#" class="lnkInsertWaypoint" data-text="addWaypoint"></a>
		</div>`,

	mapLegOptions: { color: '#768E96', className: 'navLegLine' },

	mapCurrentLegOptions: { color: '#FFBF49', className: 'navCurrentLegLine' },

	mapAutoCenter: `
		<a href="#" class="option">
			<span class="label" data-text="centerPosition"></span>
			<span class="icon navCurrentPosition"></span>
		</a>`,

	mapShowCOG: `
		<a href="#" class="option">
			<span class="label" data-text="showCogVector"></span>
			<span class="icon"><i class="icon-arrow-up-right2"></i></span>
		</a>`,

	mapShowRoute: `
		<a href="#" class="option">
			<span class="label" data-text="showRoute"></span>
			<span class="icon"><i class="icon-share2"></i></span>
		</a>`,

	mapLockRoute: `
		<a href="#" class="option">
			<span class="label" data-text="lockWaypoints"></span>
			<span class="icon"><i class="icon-locked"></i></span>
		</a>`,

	mapAnchorWatchOption: `
		<a href="#" class="option">
			<span class="label" data-text="anchorWatch"></span>
			<span class="icon"><i class="icon-anchor"></i></span>
		</a>`,

	mapPopup: `
		<div>
			<span class="latLon"></span><br /><br />
			<div class="customContent"></div>
		</div>`,

	mapAddWaypointLink: '<a href="#" data-text="addWaypoint"></a>',

	mapAddPoiLink: '<a href="#" data-text="addPoi"></a>',

	mapAnchorWatchLink: '<a href="#" data-text="anchorWatch"></a>',

	mapAnchorWatchCircle: {
		color: '#214372',
		fillOpacity: 0.2
	},

	mapAnchorWatchCircleInactive: {
		color: '#aaaaaa',
		fillOpacity: 0.1
	},

	mapAnchorWatchWarning: `<div class="feedbackBad anchorWatchWarning absolute" hidden data-text="anchorWatchExceedRadius"></div>`,

	mapShowTrack:`
		<div class="option">
			<a class="block fullWidth" href="#">
				<span class="label" data-text="showTrack"></span>
				<span class="icon"><i class="icon-history"></i></span>
			</a>
			<div class="label">
				<select class="input6 marginBottomSmall">
					<option value="3600">1h</option>
					<option value="28800">8h</option>
					<option value="86400">24h</option>
					<option value="172800">48h</option>
					<option value="345600">96h</option>
					<option value="null" data-text="userdefined"></option>
				</select>
				<div class="label marginBottomSmall pnlCustomDates">
					<span class="inlineBlock col2" data-text="from">:</span><input type="text" class="tbStartDate input4" /><div class="calStartDate" hidden></div><br />
					<span class="inlineBlock col2" data-text="to">:</span><input type="text" class="tbEndDate input4" /><div class="calEndDate" hidden></div>
				</div>
			</div>
		</div>`,

	mapTrackOptions: { color: 'green' },

	mapTrackSlider: `
		<div class="mapSliderContainer" hidden>
			<input type="range" class="slider" min="0" max="1000" value="0" />
			<div class="time"></div>
		</div>`,

	poiDetails: `
		<div class="fullHeight fullWidth absolute vCenter" hidden>
			<div class="overlay"></div>
			<div class="poiDetails dialogPanel hCenter paddingAllSmall hCenter">
				<span class="lblTitleAddEntry block marginBottomSmall semiBold" data-text="addLogbookEntry"></span>
				<span class="lblTitleEditEntry block marginBottomSmall semiBold" data-text="editLogbookEntry"></span>
				<div class="marginBottomSmall titleContainer">
					<input type="text" class="tbTime" placeholder="hh:mm"
					/><input type="text" class="tbTitle" data-title="title" />
				</div>
			</div>
		</div>`,

	startPageMap: `
		<div class="divMap navMap border fullHeight hidden" style="flex-grow:1;"></div>
		<a href="#" class="tile noBorder stretch hidden">
			<div>
				<span class="symbol"><i class="icon-map3"></i></span>
			</div>
		</a>`,

	PolylineMeasure: {
		tempLine: {								// Styling settings for the temporary dashed line
			color: 'rgba(142, 105, 41, 0.8)' ,	// Dashed line color
			weight: 2							// Dashed line weight
		},
		fixedLine: {                    // Styling for the solid line
			color: '#214372',           // Solid line color
			weight: 2                   // Solid line weight
		},
		arrow: {                        // Styling of the midway arrow 
			color: '#214372',           // Color of the arrow
		},
		startCircle: {                  // Style settings for circle marker indicating the starting point of the polyline
			color: '#000',              // Color of the border of the circle
			weight: 1,                  // Weight of the circle
			fillColor: '#4992FF',          // Fill color of the circle
			fillOpacity: 0.8,           // Fill opacity of the circle
			radius: 5                   // Radius of the circle
		},
		intermedCircle: {               // Style settings for all circle markers between startCircle and endCircle
			color: '#000',              // Color of the border of the circle
			weight: 1,                  // Weight of the circle
			fillColor: '#4992FF',          // Fill color of the circle
			fillOpacity: 0.8,             // Fill opacity of the circle
			radius: 5                   // Radius of the circle
		},
		currentCircle: {                // Style settings for circle marker indicating the latest point of the polyline during drawing a line
			color: '#000',              // Color of the border of the circle
			weight: 1,                  // Weight of the circle
			fillColor: '#FFBF49',          // Fill color of the circle
			fillOpacity: 0.8,             // Fill opacity of the circle
			radius: 5                   // Radius of the circle
		},
		endCircle: {                    // Style settings for circle marker indicating the last point of the polyline
			color: '#000',              // Color of the border of the circle
			weight: 1,                  // Weight of the circle
			fillColor: '#4992FF',          // Fill color of the circle
			fillOpacity: 0.8,             // Fill opacity of the circle
			radius: 5                   // Radius of the circle
		},
	},

};