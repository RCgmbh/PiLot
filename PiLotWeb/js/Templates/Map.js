var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Map = {

	mapPage: `<div style="flex-grow:1"><div class="navMap"></div></div>`,

	mapSettingsContainer: `
		<div class="sideMenu">
			<a href="#" class="expandCollapse">
				<i class="icon-circle-right expand"></i><i class="icon-circle-left collapse"></i>
			</a>
		</div>`,

	outdatedGpsWarning: `<div class="feedbackBad navOutdatedDataWarning absolute hidden" data-text="noGpsData"></div>`,

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

	mapPopup: `
		<div>
			<span class="latLon"></span><br /><br />
			<div class="customContent"></div>
		</div>`,

	mapAddWaypointLink: '<a href="#" data-text="addWaypoint"></a>',

	mapShowTrack:`
		<div class="option">
			<a href="#">
				<span class="label" data-text="showTrack"></span>
				<span class="icon"><i class="icon-history"></i></span>
			</a>
			<div class="label">
				<select class="label marginBottomSmall">
					<option value="3600">1h</option>
					<option value="28800">8h</option>
					<option value="86400">24h</option>
					<option value="172800">48h</option>
					<option value="345600">96h</option>
					<option value="null" data-text="userdefined"></option>
				</select>
				<div class="label marginBottomSmall pnlCustomDates">
					<span class="inlineBlock input2" data-text="from">:</span><input type="text" class="tbStartDate input4" /><div class="calStartDate" hidden></div><br />
					<span class="inlineBlock input2" data-text="to">:</span><input type="text" class="tbEndDate input4" /><div class="calEndDate" hidden></div>
				</div>
			</div>
		</div>`,

	mapTrackOptions: { color: 'green' },

	mapTrackSlider: `
		<div class="mapSliderContainer" hidden>
			<input type="range" class="slider" min="0" max="1000" value="0" />
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