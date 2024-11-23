var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Logbook = {

	/*logbookEntry: `<div class="logbookEntry"></div>`,*/

	weatherTypes: [
		['', ''],
		['1', 'sunny'],
		['2', 'cloudy'],
		['3', 'overcast'],
		['4', 'drizzle'],
		['5', 'rain'],
		['6', 'heavyRain'],
		['7', 'thunderstorm'],
		['8', 'fog'],
		['9', 'snow']
	],

	windForces: [
		['', ''],
		['0', '0'],
		['1', '1'],
		['2', '2'],
		['3', '3'],
		['4', '4'],
		['5', '5'],
		['6', '6'],
		['7', '7'],
		['8', '8'],
		['9', '9'],
		['10', '10'],
		['11', '11'],
		['12', '12']
	],

	windDirections: [
		['', ''],
		['0', 'directionN'],
		['22.5',  'directionNNE'],
		['45',    'directionNE' ],
		['67.5',  'directionENE'],
		['90',    'directionE'  ],
		['112.5', 'directionESE'],
		['135',   'directionSE' ],
		['157.5', 'directionSSE'],
		['180',   'directionS'  ],
		['202.5', 'directionSSW'],
		['225',   'directionSW' ],
		['247.5', 'directionWSW'],
		['270',   'directionW'  ],
		['292.5', 'directionWNW'],
		['315',   'directionNW' ],
		['337.5', 'directionNNW'],
	],

	logbookPage: `
		<div class="contentPadding fullHeight logbookPage">
			<h1 class="fullWidth" data-text="logbook"></h1>
			<div style="display:flex; flex-direction:row; flex-wrap: wrap-reverse; justify-content:flex-start;">
				<div class="marginRightBig marginBottom" style="flex-grow:2; max-width: 56em;">
					<div class="pnlNoEntries feedbackInfo" data-text="noLogbookEntries" hidden></div>
					<div class="plhLogbookEntries logbookEntries"></div>
				</div>
				<div class="marginBottom paddingRight addEntryLinks" style="flex-grow:1; flex-basis: 25vw;">
					<a href="#" class="lnkAddEntry block semiBold marginBottom"><i class="icon-plus marginRight"></i><span data-text="newLogbookEntry"></span></a>
					<div style="display:flex; flex-direction:column; gap:0.5em;">
						<div class="pnlRecentSetups" hidden>
							<span class="semiBold block marginBottomSmall" data-text="recentlyUsed"></span>
							<div class="plhRecentSetups flexRowWrap"></div>
						</div>
						<div class="pnlDefaultSetups" hidden>
							<span class="semiBold block marginBottomSmall" data-text="predefined">Vordefiniert</span>
							<div class="plhDefaultSetups flexRowWrap"></div>
						</div>
					</div>
				</div>
			</div>
		</div>`,

	logbookEntryContainer: `<div></div>`,

	logbookNewEntryImage: `
		<div class="newEntryImage"></div>`,

	logbookEntryForm: `
		<div class="pnlOverlay vCenter overlay" hidden>
			<div class="logbookEntry dialogPanel hCenter paddingAllSmall">
				<span class="lblTitleAddEntry block marginBottomSmall semiBold" data-text="addLogbookEntry"></span>
				<span class="lblTitleEditEntry block marginBottomSmall semiBold" data-text="editLogbookEntry"></span>
				<div class="marginBottomSmall titleContainer">
					<input type="text" class="tbTime" placeholder="hh:mm"
					/><input type="text" class="tbTitle" data-title="title" />
				</div>
				<div class="logbookBoxes editable marginBottomSmall">
					<div class="plhBoatSetup logbookBox logbookBoat"></div>
					<div class="data">
						<div class="logbookBox logbookMeteo">
							<div class="semiBold inlineBlock marginBottomSmall" data-text="meteo"></div>
							<select class="ddlWeather fullWidth marginBottomSmall"></select>
							<div class="block marginBottomSmall">
								<span class="label" data-text="temperatureShort"></span><input type="text" class="tbTemperature input3" />°C
							</div>
							<div class="block marginBottomSmall">
								<span class="label" data-text="pressureShort"></span><input type="text" class="tbPressure input3" /><span data-text="hPa"></span>
							</div>
							<div class="block marginBottomSmall">
								<span class="label" data-text="wind"></span><select class="ddlWindForce input3"></select><span data-text="bft"></span>
							</div>
							<div class="block marginBottomSmall">
								<span class="label"></span><select class="ddlWindDirection input3"></select>
							</div>
							<div class="block marginBottomSmall">
								<span class="label" data-text="wave"></span><input type="text" class="tbWaveHeight input3" />m
							</div>
						</div>
						<div class="logbookBox logbookNav">
							<div class="semiBold inlineBlock marginBottomSmall" data-text="nav"></div>
							<div class="block">
								<span class="labelSmall" data-text="latitudeShort"></span><div class="plhLat inlineBlock"></div>
							</div>
							<div class="block marginBottomSmall">
								<span class="labelSmall" data-text="longitudeShort"></span><div class="plhLon inlineBlock"></div>
							</div>
							<div class="block marginBottomSmall">
								<span class="label" data-text="cog"></span><input type="text" class="tbCOG input3" />°
							</div>
							<div class="block marginBottomSmall">
								<span class="label" data-text="sog"></span><input type="text" class="tbSOG input3" /><span data-text="kn"></span>
							</div>
							<div class="block marginBottomSmall">
								<span class="label" data-text="log"></span><input type="text" class="tbLog input3" /><span data-text="nm"></span>
							</div>
						</div>
					</div>	
				</div>
				<textarea class="tbNotes fullWidth block marginBottomSmall" rows="2" data-title="remarks"></textarea>
				<div class="buttons reverse marginBottom">
					<a href="#" class="btnSave linkButton bold" data-text="save"></a>
					<a href="#" class="btnCancel linkButton" data-text="cancel"></a>
				</div>
			</div>
		</div>`,

	logbookEntryControl:
		`<div class="logbookEntry marginBottom">
			<div class="titleContainer">
				<span class="lblTime inlineBlock semiBold"></span> <span class="lblTitle inlineBlock semiBold"></span>
				<a href="#" class="btnEditEntry inlineBlock" data-title="edit"><i class="icon-pencil"></i></a>
				<a href="#" class="btnDeleteEntry inlineBlock" data-title="delete"><i class="icon-bin"></i></a>
			</div>
			<div class="marginBottomSmall block lblNotes"></div>
			<div class="logbookBoxes marginBottomSmall">
				<div class="plhBoatSetup logbookBox logbookBoat"></div>
				<div class="data">
					<div class="logbookBox logbookMeteo">
						<span class="semiBold inlineBlock marginBottomSmall" data-text="meteo"></span>
						<span class="lblWeather block"></span>
						<span class="lblTemperature block">
							<span class="labelIcon"><i class="icon-thermometer-half"></i></span><span></span> °C
						</span>
						<span class="lblPressure block">
							<span class="labelIcon"><i class="icon-barometer"></i></span><span></span> <span data-text="hPa"></span>
						</span>
						<div class="block">
							<span class="lblWindForce">
								<span class="labelIcon"><i class="icon-wind2"></i></span><span></span> <span data-text="bft"></span> <div class="inlineBlock" data-text="bft"></div>
							</span>
							<span class="lblWindDirection"></span>
						</div>
						<span class="lblWaveHeight block">
							<span class="labelIcon"><i class="icon-sailing-boat-water1"></i></span><span></span> m
						</span>
					</div>
					<div class="logbookBox logbookNav">
						<div class="semiBold inlineBlock marginBottomSmall" data-text="nav"></div>
						<div class="lblLat block">
							<span class="labelSmall" data-text="latitudeShort"></span><span></span>
						</div>
						<div class="lblLon block">
							<span class="labelSmall" data-text="longitudeShort"></span><span></span>
						</div>
						<div class="lblCOG block">
							<span class="labelSmall" data-text="cog"></span><span></span>°
						</div>
						<div class="lblSOG block">
							<span class="labelSmall" data-text="sog"></span><span></span> <span data-text="kn"></span>
						</div>
						<div class="lblLog block">
							<span class="labelSmall" data-text="log"></span><span></span> <span data-text="nm"></span>
						</div>
					</div>
				</div>
			</div>
		</div>`,

	logbookHeaderRow: `
		<div class="logbookRow flexRowWrap header">
			<div class="outer general">
				<div class="inner image">
					<div class="cell boat"></div>
				</div>
				<div class="inner general">

					<span class="cell time semiBold"></span>
					<span class="cell title"></span>
				</div>
			</div>
			<div class="outer data">
				<div class="outer nav">
					<div class="inner coordinates">
					</div>
					<div class="inner cogSogLog">
						<div class="cell numberM" data-text="cog"></div>
						<div class="cell numberM" data-text="sog"></div>
						<div class="cell numberM" data-text="log"></div>
					</div>
				</div>
				<div class="outer meteo">
					<div class="inner weather">
						<div class="cell weather" data-text="weather"></div>
					</div>
					<div class="flexRowWrap">
						<div class="inner air">
							<div class="cell numberM">°C</div>
							<div class="cell numberL" data-text="hPa"></div>
						</div>
						<div class="inner wind">
							<div class="cell numberL wind" data-text="wind"></div>
							<div class="cell numberM">~</div>
						</div>
					</div>
				</div>
			</div>
			<div class="icons"></div>
		</div>
	`,

	logbookEntryControl2:
		`<div class="logbookRow flexRowWrap">
			<div class="outer general">
				<div class="inner image">
					<div class="plhBoatSetup cell boat"></div>
				</div>
				<div class="inner general">
					<div class="flexRowWrap">
						<span class="lblTime cell time semiBold"></span>
						<span class="lblTitle cell title"></span>
					</div>
				</div>
				<div class="lblNotes italic inner notes"></div>
			</div>
			<div class="outer data">
				<div class="outer nav">
					<div class="inner coordinates">
						<div class="lblLat cell coordinate"></div>
						<div class="lblLon cell coordinate"></div>
					</div>
					<div class="inner cogSogLog">
						<div class="lblCOG cell numberM"></div>
						<div class="lblSOG cell numberM"></div>
						<div class="lblLog cell numberM"></div>
					</div>
				</div>
				<div class="outer meteo">
					<div class="inner weather">
						<div class="lblWeather cell weather"></div>
					</div>
					<div class="flexRowWrap">
						<div class="inner air">
							<div class="lblTemperature cell numberM"></div>
							<div class="lblPressure cell numberL"></div>
						</div>
						<div class="inner wind">
							<div class="cell numberL wind">
								<span class="lblWindForce"></span>&nbsp;<span class="lblWindDirection"></span>
							</div>
							<div class="lblWaveHeight cell numberM"></div>
						</div>
					</div>
				</div>
			</div>
			<div class="icons">
				<a href="#" class="btnEditEntry" data-title="edit"><i class="icon-pencil"></i></a>
				<a href="#" class="btnDeleteEntry" data-title="delete"><i class="icon-bin"></i></a>
			</div>
		</div>`

};