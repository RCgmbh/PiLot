var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Logbook = {

	logbookEntry: `<div class="logbookEntry"></div>`,

	weatherTypes: [
		['1', "Sonnig/klar"],
		['2', "Teilweise bewölkt"],
		['3', "Bedeckt"],
		['4', "Nieselregen"],
		['5', "Regen"],
		['6', "Starkregen"],
		['7', "Gewitter"],
		['8', "Nebel"],
		['9', "Schneefall"]
	],

	windForces: [
		['0', "0"],
		['1', "1"],
		['2', "2"],
		['3', "3"],
		['4', "4"],
		['5', "5"],
		['6', "6"],
		['7', "7"],
		['8', "8"],
		['9', "9"],
		['10', "10"],
		['11', "11"],
		['12', "12"]
	],

	windDirections: [
		['0',     "N"  ], 
		['22.5',  "NNE"], 
		['45',    "NE" ], 
		['67.5',  "ENE"],
		['90',    "E"  ], 
		['112.5', "ESE"], 
		['135',   "SE" ],
		['157.5', "SSE"], 
		['180',   "S"  ], 
		['202.5', "SSW"], 
		['225',   "SW" ], 
		['247.5', "WSW"], 
		['270',   "W"  ], 
		['292.5', "WNW"], 
		['315',   "NW" ], 
		['337.5', "NNW"], 
	],

	logbookPage: `
		<div class="contentPadding">		
			<div class="dataContainerFull marginBottom">
				<h1 class="inlineBlock">Logbuch<span class="lblToday hidden"> von heute</span></h1>
				<div class="floatRight inlineBlock marginRight">
					<a href="#" class="lnkPreviousDay"><i class="icon-arrow-left2"></i></a><span 
						class="lblCalendarDate lblCalendarLink inlineBlock marginLeft marginRight pointer"></span><a
						href="#" class="lnkNextDay"><i class="icon-arrow-right2"></i></a>
					<div class="logbookCalendar"></div>
				</div>
			</div>
			<div class="dataContainerHalf">
				<a href="#" class="lnkAddEntry block semiBold marginBottom"><i class="icon-plus marginRight"></i>Neuer Eintrag</a>
				<div class="plhLogbookEntries"></div>
			</div>
			<div class="dataContainerHalf paddingRight">
				<span class="block semiBold marginBottom">Tagebuch</span>
				<textarea class="tbDiary fullWidth paper" rows="10" autocorrect="off" autocapitalize="off" spellcheck="false" ></textarea>
			</div>
		</div>`,

	diaryPage: `
		<div class="contentPadding fullHeight">
			<div class="dataContainerFull marginBottom">
				<h1 class="inlineBlock lblFriendlyDate"></h1>
				<div class="floatRight inlineBlock marginRight">
					<a href="#" class="lnkPreviousDay biggerText"><i class="icon-arrow-left2"></i></a><i
						class="icon-calendar2 lblCalendarLink inlineBlock marginLeft marginRight pointer biggerText"></i><a
						href="#" class="lnkNextDay biggerText"><i class="icon-arrow-right2"></i></a>
					<div class="logbookCalendar diaryCalendar"></div>
				</div>
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<div class="lblDiary marginBottom hidden preLine"></div>
				<div class="plhDistance marginBottom">Distanz: <span class="lblDistanceKm"></span> km / <span class="lblDistanceNm"></span> nm</div>
				<div class="plhLogbookEntries"></div>
			</div>
			<div class="dataContainerHalf paddingRight marginBottom">
				<div class="plhMap navMap borderDark"></div>
			</div>
			<div class="dataContainerFull paddingRight paddingBottom">
				<div class="diaryPhotos"></div>
			</div>
			<div class="paddingBottom marginBottom">
				<a href="#" class="lnkPublish block linkButton paddingLeft paddingRight hidden">Publizieren</a>
			</div>
		</div>`,

	logbookEntryContainer:`<div></div>`,

	logbookEntryEditable: `
		<div class="logbookEntry marginBottom">
			<div class="marginBottomSmall block">
				<span class="col1"><input type="text" class="tbTime input3" placeholder="hh:mm"
				/></span><input type="text" class="tbTitle marginRight" placeholder="Titel"
				/><a href="#" class="btnDeleteEntry inlineBlock"><i class="icon-bin"></i></a>
			</div>
			<div class="logbookBoxes marginBottomSmall">
				<div class="plhBoatSetupForm hidden"></div>
				<div class="logbookBox logbookMeteo">
					<div class="semiBold inlineBlock marginBottomSmall">Meteo</div><a href="#" class="btnRefreshMeteo input1 inlineBlock floatRight hidden"><i class="icon-loop2"></i></a>
					<select class="ddlWeather fullWidth marginBottomSmall"></select>
					<div class="block marginBottomSmall">
						<span class="label">Temp.</span><input type="text" class="tbTemperature input3" />°C
					</div>
					<div class="block marginBottomSmall">
						<span class="label">Druck</span><input type="text" class="tbPressure input3" />hPa
					</div>
					<div class="block marginBottomSmall">
						<span class="label">Wind</span><select class="ddlWindForce input3"></select>BF
					</div>
					<div class="block marginBottomSmall">
						<span class="label"></span><select class="ddlWindDirection input3"></select>
					</div>
					<div class="block marginBottomSmall">
						<span class="label">Welle</span><input type="text" class="tbWaveHeight input3" />m
					</div>
				</div>
				<div class="logbookBox logbookNav">
					<div class="semiBold inlineBlock marginBottomSmall">Nav</div>
					<a href="#" class="btnRefreshNav input1 inlineBlock floatRight hidden"><i class="icon-loop2"></i></a>
					<div class="block">
						<span class="labelSmall">Lat</span><div class="plhLat inlineBlock"></div>
					</div>
					<div class="block marginBottomSmall">
						<span class="labelSmall">Lon</span><div class="plhLon inlineBlock"></div>
					</div>
					<div class="block marginBottomSmall">
						<span class="label">COG</span><input type="text" class="tbCOG input3" />°
					</div>
					<div class="block marginBottomSmall">
						<span class="label">SOG</span><input type="text" class="tbSOG input3" />kn
					</div>
					<div class="block marginBottomSmall">
						<span class="label">Log</span><input type="text" class="tbLog input3" />nm
					</div>
				</div>
				<div class="plhBoatSetup logbookBox logbookBoat"></div>
			</div>
			<textarea class="tbNotes fullWidth block marginBottomSmall" rows="2" placeholder="Bemerkungen"></textarea>
			<a href="#" class="btnCancel block linkButton marginRight">Abbrechen</a>
			<a href="#" class="btnSave block linkButton marginLeft">Speichern</a>
		</div>`,

	logbookEntryReadonly:
		`<div class="logbookEntry marginBottom">
			<div class="titleContainer">
				<span class="lblTime inlineBlock semiBold marginRight"></span> <span class="lblTitle inlineBlock semiBold"></span>
				<a href="#" class="btnEditEntry inlineBlock"><i class="icon-pencil"></i></a>
			</div>
			<div class="marginBottomSmall block lblNotes"></div>
			<div class="logbookBoxes marginBottomSmall">
				<div class="logbookBox logbookMeteo">
					<span class="semiBold inlineBlock marginBottomSmall">Meteo</span>
					<span class="lblWeather block"></span>
					<span class="lblTemperature block">
						<span class="labelIcon"><i class="icon-thermometer-half"></i></span><span></span> °C
					</span>
					<span class="lblPressure block">
						<span class="labelIcon"><i class="icon-barometer"></i></span><span></span> hPa
					</span>
					<div class="block">
						<span class="lblWindForce">
							<span class="labelIcon"><i class="icon-wind2"></i></span><span></span> Bft.
						</span>
						<span class="lblWindDirection"></span>
					</div>
					<span class="lblWaveHeight block">
						<span class="labelIcon"><i class="icon-sailing-boat-water1"></i></span><span></span> m
					</span>
				</div>
				<div class="logbookBox logbookNav">
					<div class="semiBold inlineBlock marginBottomSmall">Nav</div>
					<div class="lblLat block">
						<span class="labelSmall">Lat</span><span></span>
					</div>
					<div class="lblLon block">
						<span class="labelSmall">Lon</span><span></span>
					</div>
					<div class="lblCOG block">
						<span class="labelSmall">COG</span><span></span>°
					</div>
					<div class="lblSOG block">
						<span class="labelSmall">SOG</span><span></span> kn
					</div>
					<div class="lblLog block">
						<span class="labelSmall">Log</span><span></span> nm
					</div>
				</div>
				<div class="plhBoatSetup logbookBox logbookBoat"></div>
			</div>
		</div>`,

	publishLogbookPage: `
		<div class="contentPadding">
			<div class="dataContainerFull marginBottomBig paddingRight">
				<div><h1 class="inlineBlock">Logbuch publizieren</h1></div>
				<div class="marginBottom">
					<label class="col6 inlineBlock">Ziel:</label><select class="ddlPublishTarget input8"></select> <i class="icoWait icon-hour-glass" hidden></i>
				</div>
				<div class="pnlJobInfo marginAll paddingAllSmall" hidden>
					<div class="fullWidth right"><a href="#" class="btnClose"><i class="icon-cancel3"></i></a></div>
					<div class="bold marginBottom">Job Status</div>
					<div class="marginBottomSmall">
						Status:
						<span class="lblStatusNone hidden">Kein Job vorhanden</span>
						<span class="lblStatusIdle hidden">Wartend</span>
						<span class="lblStatusBusy hidden">Job läuft</span>
						<span class="lblStatusFinished hidden">Fertig</span>
						<span class="lblStatusError hidden">Fehler</span>
					</div>
					<div class="pnlMessages"></div>
				</div>
				<div class="pnlPublish flex" style="flex-direction:column;">
					<div class="title">
						<div class="summary"><span class="lblLocalPositionsCount">...</span> Positionen</div>
						<div class="center">Track</div>
						<div class="summary right"><span class="lblTargetPositionsCount">...</span> Positionen</div>
					</div>
					<div>
						<div style="flex: 1 0 10em;"><div class="divLocalTrack map"></div></div>
						<div style="flex: 0 0 4em;" class="center">
							<input type="checkbox" class="cbPublishTrack" /><i class="icon-arrow-right"></i>
						</div>
						<div style="flex: 1 0 10em;"><div class="divTargetTrack map"></div></div>
					</div>
					<div class="title paddingTop">
						<div class="summary"><span class="lblLocalDiaryLength">...</span> Zeichen</div>
						<div class="center">Tagebuch</div>
						<div class="summary right"><span class="lblTargetDiaryLength">...</span> Zeichen</div>
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
						<div class="summary"><span class="lblLocalLogbookEntriesCount">...</span> Einträge</div>
						<div class="center">Logbuch</div>
						<div class="summary right"><span class="lblTargetLogbookEntriesCount">...</span> Einträge</div>
					</div>
					<div class="">
						<div class="divLocalLogbookEntries logbookEntries"></div>
						<div style="flex: 0 0 4em;" class="center">
							<input type="checkbox" class="cbPublishLogbook" /><i class="icon-arrow-right"></i><br />
							<input type="checkbox" class="cbOverwriteLogbook" /><i class="icon-trashcan"></i>
						</div>
						<div class="logbookEntries divTargetLogbookEntries"></div>
					</div>
					<div class="title paddingTop">
						<div class="summary"><span class="lblLocalPhotosCount">...</span> Bilder</div>
						<div class="center">Fotos</div>
						<div class="summary right"><span class="lblTargetPhotosCount">...</span> Bilder</div>
					</div>
					<div class="">
						<div class="divLocalPhotos photos" id="divLocalPhotos"></div>
						<div style="flex: 0 0 4em;" class="center">
							<input type="checkbox" class="cbSelectPhotos" /><i class="icon-arrow-right"></i><br />
						</div>
						<div class="divTargetPhotos photos"></div>
					</div>
					<div class="divButton paddingTop center">
						<a href="#" class="btnPublish block linkButton paddingLeft paddingRight marginRight">Publizieren</a>
						<a href="#" class="btnStatus block linkButton paddingLeft paddingRight">Status</a>
					</div>
				</div>
			</div>
		</div>
	`,

	publishPagePhoto: `<div><img class="imgPhoto" /><div class="label"><input type="checkbox" class="cbSelectPhoto"><label class="lblName"></label></div></div>`

};