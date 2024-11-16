var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Diary = {

	diaryPage: `
		<div class="fullHeight fullWidth">
			<div class="logbookHeader fullWidth paddingLeftSmall paddingTopSmall paddingRightSmall">
				<h1 class="inlineBlock lblFriendlyDate"></h1>
				<div class="inlineBlock marginRight dateContainer">
					<span class="icoLoading grey marginRight biggerText" hidden><i class="icon-hour-glass"></i></span>
					<a href="#" class="lnkPreviousDay biggerText"><i class="icon-arrow-left2"></i></a><i
						class="icon-calendar2 lblCalendarLink inlineBlock marginLeftSmall marginRightSmall pointer biggerText"></i><a
						href="#" class="lnkNextDay biggerText"><i class="icon-arrow-right2"></i></a>
					<div class="logbookCalendar diaryCalendar" hidden></div>
				</div>
			</div>
			<div class="flexRowWrap reverse">
				<div class="plhMainContent diaryContent marginLeftSmall marginRightSmall"></div>
				<div class="pnlContext diaryContext marginLeftSmall marginRightSmall"></div>
			</div>
			<div class="marginLeft marginBottom">
				<a href="#" class="lnkPublish"><i class="icon-podcast marginRightSmall"></i><span data-text="publish"></span></a>
			</div>
			<a href="#" class="lnkTop topLink paddingAllSmall"><i class="biggerText icon-arrow-up"></i></a>
			
		</div>`,

	diaryText: `
		<div class="easyShadow marginBottom">
			<div class="boxHeader">
				<span class="boxTitle paddingAllSmall" data-text="diary"></span>
				<div class="boxIcons">
					<a href="#" class="lnkBiggerText" data-title="fontsizeIncrease"><span style="font-size:1.5em;">A&uarr;</span></a>
					<a href="#" class="lnkSmallerText" data-title="fontsizeDecrease"><span>A&darr;</span></a>
					<a href="#" class="lnkEditDiary paddingAllSmall" data-title="edit"><i class="icon-pencil"></i></a>
					<a href="#" class="lnkCollapseDiary paddingAllSmall " data-title="hide"><i class="icon-circle-up"></i></a>
					<a href="#" class="lnkExpandDiary paddingAllSmall " data-title="show" hidden><i class="icon-circle-down"></i></a>
				</div>
			</div>
			<div class="pnlDiary paddingAllSmall">
				<div class="pnlShowDiary">
					<span class="lblDiary diaryText preLine block textColumns" ></span>
					<div class="pnlNoData feedbackInfo" data-text="noData" hidden></div>
				</div>
				<div class="pnlEditDiary marginBottom" hidden>
					<textarea class="tbDiary diaryText borderLight fullWidth" rows="10" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>
				</div>
			</div>
		</div>
	`,

	diaryLogbook: `
		<div class="easyShadow marginBottom">
			<div class="boxHeader">
				<span class="boxTitle paddingAllSmall" data-text="logbook"></span>
				<div class="boxIcons">
					<a href="#" class="lnkEditLogbook paddingAllSmall" data-title="edit"><i class="icon-pencil"></i></a>
					<a href="#" class="lnkCollapseLogbook paddingAllSmall " data-title="hide"><i class="icon-circle-up"></i></a>
					<a href="#" class="lnkExpandLogbook paddingAllSmall " data-title="show" hidden><i class="icon-circle-down"></i></a>
				</div>
			</div>
			<div class="pnlLogbook paddingAllSmall">
				<div class="plhLogbookEntries logbookEntries"></div>
				<div class="pnlNoData feedbackInfo" data-text="noData" hidden></div>
				<a href="#" class="lnkAddLogbookEntry block semiBold"><i class="icon-plus marginRight"></i><span data-text="newLogbookEntry"></span></a>
			</div>
		</div>
	`,

	diaryPhotos: `
		<div class="marginBottom">
			<div class="boxHeader bgLight">
				<span class="boxTitle paddingAllSmall" data-text="photos"></span>
				<div class="boxIcons">
					<a href="#" class="lnkEditPhotos paddingAllSmall" data-title="edit"><i class="icon-pencil"></i></a>
					<a href="#" class="lnkCollapsePhotos paddingAllSmall" data-title="hide"><i class="icon-circle-up"></i></a>
					<a href="#" class="lnkExpandPhotos paddingAllSmall" data-title="show" hidden><i class="icon-circle-down"></i></a>
				</div>
			</div>
			<div class="pnlPhotos borderLighter">
				<div class="plhPhotoUpload"></div>
				<div class="plhPhotoGallery"></div>
			</div>
		</div>
	`,

	diaryTrackData: `
		<div>
			<div class="easyShadow  marginBottom">
				<div class="boxHeader">
					<span class="boxTitle paddingAllSmall" data-text="map"></span>
					<div class="boxIcons">
						<a href="#" class="lnkEditTrack paddingAllSmall" data-title="editTrack"><i class="icon-pencil"></i></a>	
						<a href="#" class="lnkEnlargeMap paddingAllSmall" data-title="enlarge"><i class="icon-enlarge"></i></a>
						<a href="#" class="lnkMinimizeMap paddingAllSmall" data-title="minimize" hidden><i class="icon-shrink2"></i></a>
						<a href="#" class="lnkCollapseMap paddingAllSmall" data-title="hide"><i class="icon-circle-up"></i></a>
						<a href="#" class="lnkExpandMap paddingAllSmall" data-title="show" hidden><i class="icon-circle-down"></i></a>
					</div>
				</div>
				<div class="pnlMap">
					<div class="plhMap navMap borderDark"></div>
				</div>
			</div>
			<div class="easyShadow  marginBottom">
				<div class="boxHeader">
					<span class="boxTitle paddingAllSmall" data-text="tracks"></span>
					<div class="boxIcons">
						<a href="#" class="paddingAllSmall lnkCollapseTracks" data-title="hide"><i class="icon-circle-up"></i></a>
						<a href="#" class="paddingAllSmall lnkExpandTracks" data-title="show" hidden><i class="icon-circle-down"></i></a>
					</div>
				</div>
				<div class="pnlTracks">
					<div class="plhTracks"></div>
					<div class="plhSpeedDiagram"></div>
					<div class="plhTrackStatistics marginBottom"></div>
					<div class="pnlNoData paddingAllSmall" hidden><div class="feedbackInfo" data-text="noData"></div></div>
				</div>
			</div>
		</div>
	`,

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

	diaryPhotoUpload: `
		<div class="hCenter bgLight paddingAllSmall">
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

	diaryPhotoGallery: `
		<div>
			<div class="pnlPhotoScreen photoScreen" hidden>
				<div class="pnlOptions">
					<div>
						<a href="#" target="_blank" download class="lnkDownload marginLeft" data-title="imageDownload"><i class="icon-download2"></i></a>
						<a href="#" target="_blank" class="lnkOpenBlank marginLeft" data-title="imageOpenOriginal"><i class="icon-popout"></i></a>
						<a href="#" class="lnkDelete marginLeft" data-title="delete"><i class="icon-trashcan"></i></a>
					</div>
					<a href="#" class="lnkClose" data-title="close"><i class="icon-cancel3"></i></a>
				</div>
				<a href="#" class="lnkPrevious"><i class="icon-circle-left"></i></a>
				<img src="" class="imgFullSize photo" />
				<a href="#" class="lnkNext"><i class="icon-circle-right"></i></a>
				<div class="pnlFooter">
					<span class="lblFileName"></span>
					<div>
						<span class="lblPhotoIndex"></span>/<span class="lblPhotoTotal"></span>
					</div>
				</div>
			</div>
			<div class="plhPhotos diaryPhotos">
			</div>
		</div>`,

	diaryPhoto: `<div class="thumbnailContainer">
			<img class="imgPhoto thumbnail" src="" />
		</div>`
};