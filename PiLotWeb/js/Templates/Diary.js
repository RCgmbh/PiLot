var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Diary = {

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
				<div class="pnlEditDiary marginBottom" hidden>
					<span class="block semiBold marginBottom" data-text="diary"></span>
					<textarea class="tbDiary fullWidth" rows="10" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
				</div>
				<div class="plhLogbookEntries logbookEntries"></div>
				<a href="#" class="lnkAddLogbookEntry block semiBold marginBottom"><i class="icon-plus marginRight"></i><span data-text="newLogbookEntry"></span></a>
			</div>
			<div class="dataContainerHalf paddingRight marginTop marginBottom">
				<div class="plhMap navMap borderDark marginBottom"></div>
				<div class="pnlSpeedDiagram marginBottom"></div>
			</div>
			<div class="dataContainerFull paddingRight paddingBottom" hidden>
				<div class="diaryPhotos"></div>
			</div>
			<div class="pnlEdit dataContainerFull marginBottom">
				<label class="marginRight"><input type="checkbox" class="cbEditMode" /><span data-text="editMode"></span></label> |
				<a href="#" class="lnkEditTrack marginLeft marginRight" data-text="editTrack"></a> | 
				<a href="#" class="lnkPublish marginLeft marginRight" data-text="publish"></a>
			</div>
		</div>`,


	publishDiaryPage: `
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

	publishPagePhoto: `<div><img class="imgPhoto" /><div class="label"><input type="checkbox" class="cbSelectPhoto"><label class="lblName"></label></div></div>`,

	diaryImageUpload: `
		<div class="marginTop marginBottom hCenter">
			<span class="semiBold block marginBottom" data-text="photoUpload"></span>
			<div class="logbookImageUpload hCenter">
				<input type="file" class="fileImageUpload" accept="image/jpeg" />
				<img src="#" class="imgPreview" hidden />
				<button class="btnSend" hidden data-text="upload"></button>
				<div class="pnlUploading feedbackNeutral" hidden data-text="uploading"></div>
				<div class="pnlUploadSuccess feedbackGood" hidden data-text="uploadComplete"></div>
				<div class="pnlInvalidType feedbackBad" hidden data-text="uploadInvalidType"></div>
			</div>
		</div>
	`,

	diaryPhotos: `<div class="plhPhotos" style="display:flex;gap:1em; flex-direction:row;flex-wrap:wrap;justify-content:center"></div>`,

	diaryPhoto: `<div style="width:10em; height:10em; display:flex; flex-direction:column; justify-content:center;">
			<img class="imgPhoto" style="max-height:100%; max-width:100%; margin-left:auto; margin-right: auto;" />
		</div>`


};