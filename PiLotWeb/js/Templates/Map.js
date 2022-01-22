var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Map = {

	mapPage: `<div id="map" class="navMap"></div>`,

	mapSettingsContainer: `
		<div class="sideMenu">
			<a href="#" class="expandCollapse">
				<i class="icon-circle-right expand"></i><i class="icon-circle-left collapse"></i>
			</a>
		</div>`,

	outdatedGpsWarning: `<div class="feedbackBad navOutdatedDataWarning absolute hidden" data-key="noGpsData"></div>`,

	mapWaypointPopup: `
		<div class="mapWaypointPopup">
			<div class="name block semiBold"></div><br />
			<span class="latLng"></span><br />
			<span data-key="eta"></span>: <span class="eta"></span><br />
			<span data-key="distance"></span>: <span class="dist"></span> <span data-key="nm"></span><br />
			<span data-key="bearing"></span>: <span class="bearing"></span>°<br /><br />
			<a href="#" class="lnkDelete" data-key="deleteWaypoint"></a>
		</div>`,

	mapLegPopup: `
		<div class="mapLeg">
			<a href="#" class="lnkInsertWaypoint" data-key="addWaypoint"></a>
		</div>`,

	mapLegOptions: { color: '#768E96', className: 'navLegLine' },

	mapCurrentLegOptions: { color: '#FFBF49', className: 'navCurrentLegLine' },

	mapAutoCenter: `
		<a href="#" class="option">
			<span class="label" data-key="centerPosition"></span>
			<span class="icon navCurrentPosition"></span>
		</a>`,

	mapShowCOG: `
		<a href="#" class="option">
			<span class="label" data-key="showCogVector"></span>
			<span class="icon"><i class="icon-arrow-up-right2"></i></span>
		</a>`,

	mapShowRoute: `
		<a href="#" class="option">
			<span class="label" data-key="showRoute"></span>
			<span class="icon"><i class="icon-share2"></i></span>
		</a>`,

	mapLockRoute: `
		<a href="#" class="option">
			<span class="label" data-key="lockWaypoints"></span>
			<span class="icon"><i class="icon-locked"></i></span>
		</a>`,

	mapPopup: `
		<div>
			<span class="latLon"></span><br /><br />
			<div class="customContent"></div>
		</div>`,

	mapAddWaypointLink: '<a href="#" data-key="addWaypoint"></a>',

	mapShowTrack:`
		<div class="option">
			<a href="#">
				<span class="label" data-key="showTrack"></span>
				<span class="icon"><i class="icon-history"></i></span>
			</a>
			<div class="label">
				<select class="label marginBottomSmall">
					<option value="3600">1h</option>
					<option value="28800">8h</option>
					<option value="86400">24h</option>
					<option value="172800">48h</option>
					<option value="345600">96h</option>
					<option value="null" data-key="userdefined"></option>
				</select>
				<div class="label marginBottomSmall pnlCustomDates">
					<span class="inlineBlock input2" data-key="from">:</span><input type="text" class="tbStartDate input4" /><div class="calStartDate"></div><br />
					<span class="inlineBlock input2" data-key="to">:</span><input type="text" class="tbEndDate input4" /><div class="calEndDate hidden"></div>
				</div>
			</div>
		</div>`,

	mapTrackOptions: { color: 'green' },

	mapTrackSlider: `
		<div class= "mapSliderContainer hidden">
			<div class="inner"><div class="slider"></div></div>
			<div class="time"></div>
		</div>`,

	startPageMap: `
		<div class="divMap navMap border fullHeight hidden" style="flex-grow:1;"></div>
		<a href="#" class="tile stretch hidden">
			<div>
				<span class="symbol"><i class="icon-map3"></i></span>
			</div>
		</a>` 

};