var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Logbook = {

	logbookEntry: `<div class="logbookEntry"></div>`,

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
		<div class="contentPadding">		
			<div class="dataContainerFull marginBottom logbookHeader">
				<h1 class="inlineBlock">
					<span class="lblTodaysLogbook hidden" data-text="todaysLogbook"></span>
					<span class="lblLogbook hidden" data-text="logbook"></span>
				</h1>
				<div class="inlineBlock marginRight dateContainer">
					<a href="#" class="lnkPreviousDay"><i class="icon-arrow-left2"></i></a><span 
						class="lblCalendarDate lblCalendarLink inlineBlock marginLeft marginRight pointer"></span><a
						href="#" class="lnkNextDay"><i class="icon-arrow-right2"></i></a>
					<div class="logbookCalendar" hidden></div>
				</div>
			</div>
			<div class="dataContainerHalf paddingRight">
				<a href="#" class="lnkAddEntry block semiBold marginBottom"><i class="icon-plus marginRight"></i><span data-text="newLogbookEntry"></span></a>
				<div class="plhLogbookEntries logbookEntries"></div>
			</div>
			<div class="dataContainerHalf paddingRight">
				<span class="block semiBold marginBottom" data-text="diary"></span>
				<textarea class="tbDiary fullWidth" rows="10" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
			</div>
		</div>`,

	diaryPage: `
		<div class="contentPadding fullHeight">
			<div class="dataContainerFull logbookHeader">
				<h1 class="inlineBlock lblFriendlyDate"></h1>
				<div class="inlineBlock marginRight dateContainer">
					<a href="#" class="lnkPreviousDay biggerText"><i class="icon-arrow-left2"></i></a><i
						class="icon-calendar2 lblCalendarLink inlineBlock marginLeft marginRight pointer biggerText"></i><a
						href="#" class="lnkNextDay biggerText"><i class="icon-arrow-right2"></i></a>
					<div class="logbookCalendar diaryCalendar" hidden></div>
				</div>
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<div class="pnlDiary marginBottom" style="text-align:justify; line-height:1.4em;">
					<div class="plhTextSize" style="text-align:right;">
						<a href="#" class="lnkBiggerText" data-title="fontsizeIncrease"><span style="font-size:1.5em;">A&uarr;</span></a>
						<a href="#" class="lnkSmallerText" data-title="fontsizeDecrease"><span>A&darr;</span></a>
					</div>
					<span class="lblDiary preLine" style="hyphens:auto;"></span>
					<div class="plhDistance marginTop">
						<span data-text="distance"></span>: <span class="lblDistanceKm"></span> <span data-text="km"></span> / <span class="lblDistanceNm"></span> <span data-text="nm"></span>
					</div>
				</div>
				<div class="plhLogbookEntries logbookEntries"></div>
			</div>
			<div class="dataContainerHalf paddingRight marginTop marginBottom">
				<div class="plhMap navMap borderDark"></div>
			</div>
			<div class="dataContainerFull paddingRight paddingBottom">
				<div class="diaryPhotos"></div>
			</div>
			<div class="dataContainerFull paddingBottom">
				<a href="#" class="lnkEdit block linkButton marginRight paddingLeft paddingRight hidden" data-text="edit"></a>
				<a href="#" class="lnkEditTrack block linkButton marginRight paddingLeft paddingRight hidden" data-text="editTrack"></a>
				<a href="#" class="lnkPublish block linkButton marginRight paddingLeft paddingRight hidden" data-text="publish"></a>
			</div>
		</div>`,

	logbookEntryContainer:`<div></div>`,

	logbookEntryEditable: `
		<div class="logbookEntry marginBottom">
			<div class="marginBottomSmall titleContainer">
				<input type="text" class="tbTime" placeholder="hh:mm"
				/><input type="text" class="tbTitle" data-title="title"
				/><a href="#" class="btnDeleteEntry inlineBlock" data-title="delete"><i class="icon-bin"></i></a>
			</div>
			<div class="logbookBoxes editable marginBottomSmall">
				<div class="plhBoatSetupForm hidden"></div>
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
			<div class="buttons">
				<a href="#" class="btnCancel block linkButton" data-text="cancel"></a>
				<a href="#" class="btnSave block linkButton" data-text="save"></a>
			</div>
		</div>`,

	logbookEntryReadonly:
		`<div class="logbookEntry marginBottom">
			<div class="titleContainer">
				<span class="lblTime inlineBlock semiBold marginRight"></span> <span class="lblTitle inlineBlock semiBold"></span>
				<a href="#" class="btnEditEntry inlineBlock"><i class="icon-pencil"></i></a>
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

	publishLogbookPage: `
		<div class="contentPadding">
			<div class="dataContainerFull marginBottomBig paddingRight">
				<div><h1 class="inlineBlock" data-text="publishLogbook"></h1></div>
				<div class="marginBottom">
					<label class="col6 inlineBlock" data-text="publishTarget">:</label><select class="ddlPublishTarget input8"></select> <i class="icoWait icon-hour-glass" hidden></i>
				</div>
				<div class="pnlJobInfo dialogPanel hCenter marginAll paddingAllSmall hCenter" hidden>
					<div class="fullWidth right"><a href="#" class="btnClose"><i class="icon-cancel3"></i></a></div>
					<div class="bold marginBottom" data-text="jobStatus"></div>
					<div class="marginBottomSmall">
						<span data-text="state"></span>:
						<span class="lblStatusNone hidden" data-text="noJob"></span>
						<span class="lblStatusIdle hidden" data-text="waiting"></span>
						<span class="lblStatusBusy hidden" data-text="jobRunning"></span>
						<span class="lblStatusFinished hidden" data-text="finished"></span>
						<span class="lblStatusError hidden" data-text="error"></span>
					</div>
					<div class="pnlMessages"></div>
				</div>
				<div class="pnlPublish flex" style="flex-direction:column;">
					<div class="title">
						<div class="summary"><span class="lblLocalPositionsCount">...</span> <span data-text="positions"></span></div>
						<div class="center" data-text="track"></div>
						<div class="summary right"><span class="lblTargetPositionsCount">...</span> <span data-text="positions"></span></div>
					</div>
					<div>
						<div style="flex: 1 0 10em;"><div class="divLocalTrack map"></div></div>
						<div style="flex: 0 0 4em;" class="center">
							<input type="checkbox" class="cbPublishTrack" /><i class="icon-arrow-right"></i>
						</div>
						<div style="flex: 1 0 10em;"><div class="divTargetTrack map"></div></div>
					</div>
					<div class="title paddingTop">
						<div class="summary"><span class="lblLocalDiaryLength">...</span> <span data-text="characters"></span></div>
						<div class="center" data-text="diary"></div>
						<div class="summary right"><span class="lblTargetDiaryLength">...</span> <span data-text="characters"></span></div>
					</div>
					<div>
						<div class="divLocalDiaryText diaryText"></div>
						<div style="flex: 0 0 4em;" class="center">
							<input type="checkbox" class="cbPublishDiary" /><i class="icon-arrow-right"></i><br />
							<input type="checkbox" class="cbOverwriteDiary" /><i class="icon-trashcan"></i>
						</div>
						<div class="divTargetDiaryText diaryText"></div>
					</div>
					<div class="title paddingTop">
						<div class="summary"><span class="lblLocalLogbookEntriesCount">...</span> <span data-text="entries"></span></div>
						<div class="center" data-text="logbook"></div>
						<div class="summary right"><span class="lblTargetLogbookEntriesCount">...</span> <span data-text="entries"></span></div>
					</div>
					<div class="">
						<div class="divLocalLogbookEntries logbookEntries"></div>
						<div style="flex: 0 0 4em;" class="center">
							<input type="checkbox" class="cbPublishLogbook" /><i class="icon-arrow-right"></i><br />
							<input type="checkbox" class="cbOverwriteLogbook" /><i class="icon-trashcan"></i>
						</div>
						<div class="divTargetLogbookEntries logbookEntries"></div>
					</div>
					<div class="title paddingTop">
						<div class="summary"><span class="lblLocalPhotosCount">...</span> <span data-text="images"></span></div>
						<div class="center" data-text="photos"></div>
						<div class="summary right"><span class="lblTargetPhotosCount">...</span> <span data-text="images"></span></div>
					</div>
					<div class="">
						<div class="divLocalPhotos photos" id="divLocalPhotos"></div>
						<div style="flex: 0 0 4em;" class="center">
							<input type="checkbox" class="cbSelectPhotos" /><i class="icon-arrow-right"></i><br />
						</div>
						<div class="divTargetPhotos photos"></div>
					</div>
					<div class="divButton paddingTop center">
						<a href="#" class="btnPublish block linkButton paddingLeft paddingRight marginRight" data-text="publish"></a>
						<a href="#" class="btnStatus block linkButton paddingLeft paddingRight" data-text="state"></a>
					</div>
				</div>
			</div>
		</div>
	`,

	publishPagePhoto: `<div><img class="imgPhoto" /><div class="label"><input type="checkbox" class="cbSelectPhoto"><label class="lblName"></label></div></div>`

};