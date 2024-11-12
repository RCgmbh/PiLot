var PiLot = PiLot || { };
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Common = {

	mainMenuHamburger: '<a href="#" class="vCenter"><i class="icon-menu"></i></a>',
	mainMenuSection: '<div></div>',
	mainMenuLink: '<a></a>',

	flyoutMainMenu: `<div class="mainMenu"><div class="plhContent"></div></div>`,
	
	mainMenuContent: `
		<div>
			<div class="menuSection menuSectionHome">
				<a data-page="home"><i class="icon-home"></i><span data-text="home"></span></a>
			</div>
			<div class="menuSection menuSectionNav">
				<a data-page="map"><i class="icon-map3"></i><span data-text="map"></span></a>
				<a data-page="nav"><i class="icon-compass3"></i><span data-text="navigation"></span></a>
				<a data-page="routes"><i class="icon-linegraph"></i><span data-text="routes"></span></a>
			</div>
			<div class="menuSection menuSectionLog">
				<a data-page="diary"><i class="icon-book3"></i><span data-text="diary"></span></a>
				<a data-page="logbook"><i class="icon-pen2"></i><span data-text="logbook"></span></a>
				<a data-page="stats"><i class="icon-chart4"></i><span data-text="statistics"></span></a>
			</div>
			<div class="menuSection menuSectionMeteo">
				<a data-page="measurements"><i class="icon-thermometer"></i><span data-text="measurements"></span></a>
			</div>
			<div class="menuSection menuSectionEntertainment">
				<a data-page="games"><i class="icon-gamepad"></i><span data-text="games"></span></a>
				<a data-page="library"><i class="icon-library"></i><span data-text="library"></span></a>
			</div>
			<div class="menuSection menuSectionSettings">
				<a data-page="boat"><i class="icon-sailing-boat-water1"></i><span data-text="boatConfig"></span></a>
				<a data-page="boatTime"><i class="icon-time2"></i><span data-text="boatTime"></span></a>
				<a data-page="language"><i class="icon-bubbles4"></i><span data-text="language"></span></a>
			</div>
			<div class="menuSection menuSectionTools">
				<a data-page="data"><i class="icon-database"></i><span data-text="gpsData"></span></a>
				<a data-page="tiles"><i class="icon-download2"></i><span data-text="localTiles"></span></a>
				<a data-page="pois"><i class="icon-location"></i><span data-text="pois"></span></a>
			</div>
			<div class="menuSection menuSectionAdmin">
				<a data-page="wifi"><i class="icon-connection"></i><span data-text="wifi"></span></a>
				<a data-page="services"><i class="icon-cogs"></i><span data-text="services"></span></a>
				<a data-page="systemTime"><i class="icon-time2"></i><span data-text="systemTime"></span></a>
				<a data-page="systemStatus"><i class="icon-thermometer"></i><span data-text="temperature"></span></a>
				<a data-page="logs"><i class="icon-stack"></i><span data-text="logfiles"></span></a>
				<a data-page="shutDown"><i class="icon-switch"></i><span data-text="shutDown"></span></a>
			</div>
		</div>
	`,

	clock: `<span class="lblTime"></span>`,

	clockOffsetIcon: `
		<div class="vCenter biggerText">
			<a class="icoTimezoneOffset icon orange" href="#" hidden><i class="icon-time2"></i></a>
			<a class="icoTimeOffset icon red" href="#" hidden><i class="icon-time2"></i></a>
		</div>
	`,

	startPage: `<div class="homeContainer"></div>`,

	dayNightButtons: `
		<div class="vCenter biggerText">
			<a class="lnkNight yellow icon" href="#" data-title="nightMode"><i class="icon-moon"></i></a>
			<a class="lnkDay yellow icon" href="#" data-title="dayMode"><i class="icon-sun2"></i></a>
		</div>
	`,

	touchButtonsOptions: `
		<div class="sideMenu">
			<a href="#" class="expandCollapse">
				<i class="icon-circle-right expand"></i><i class="icon-circle-left collapse"></i>
			</a>
			<a href="#" class="option btnShowButtons">
				<span class="label">Touch Buttons</span>
				<span class="icon"><i class="icon-point-up"></i></span>
			</a>
			<a href="#" class="option btnFixButtons hidden">
				<span class="label">Buttons fixieren</span>
				<span class="icon"><i class="icon-locked"></i></span>
			</a>
		</div>`,

	touchButtonUp: `
		<div class="touchButton hidden" style="top:15em; left:0.5em;">
			<div class="dragHandle"></div>
			<div class="button">
				<i class="icon-arrow-up"></i>
			</div>
		</div>`,

	touchButtonDown: `
		<div class="touchButton hidden" style="top:23em; left:0.5em;">
			<div class="dragHandle"></div>
			<div class="button">
				<i class="icon-arrow-down"></i>
			</div>
		</div>`,

	touchButtonLeft: `
		<div class="touchButton hidden" style="top:15em; left:7em;">
			<div class="dragHandle"></div>
			<div class="button">
				<i class="icon-arrow-left"></i>
			</div>
		</div>`,

	touchButtonRight: `
		<div class="touchButton hidden" style="top:23em; left:7em;">
			<div class="dragHandle"></div>
			<div class="button">
				<i class="icon-arrow-right"></i>
			</div>
		</div>`,

	accessDenied: `
		<div class="fullWidth"><div class="feedbackBad marginAll" data-text="accessDenied"></div></div>
	`,

	loginForm: `
		<div class="dialogPanel round hCenter center" style="width:50vw; min-width: 20em; max-width: 30em;">
			<div class="pnlLoginFailed feedbackBad marginAll hidden" data-text="loginFailed"></div>
			<div class="pnlLoginForm marginAll feedbackWarning">
				<div class="center">
					<form id="frmLogin">
						<input type="text" class="tbUsername input8 marginBottomSmall" autocomplete="username" data-title="username" /><br />
						<input type="password" class="tbPassword input8 marginBottomSmall" placeholder="Passwort" autocomplete="current-password" /><br />
						<button class="btnLogin input8 marginBottomSmall" type="submit" data-text="login"></button><br />
						<button class="btnCancel input8" type="button" data-text="cancel"></button><br />
					</form>
				</div>
			</div>
		</div>
		`,

	userMenuIcon: `
		<a class="btnUserInfo vCenter icon" href="#" data-title="userinfo"><i class="icon-smile2"></i></a>
	`,

	userMenu: `
		<div class="pnlUserInfo dialogPanel shadow hidden">
			<div class="semiBold"><span data-text="user"></span>: <span class="lblUsername"></span><span class="lblAnonymous">-</span></div>
			<div><span class="col1 marginRight"><i class="icon-checkmark icoReadAccess green"></i><i class="icon-cross icoNoReadAccess red"></i></span><span data-text="readAccess"></span></div>
			<div><span class="col1 marginRight"><i class="icon-checkmark icoWriteAccess green"></i><i class="icon-cross icoNoWriteAccess red"></i></span><span data-text="writeAccess"></span></div>
			<div><span class="col1 marginRight"><i class="icon-checkmark icoSettingsAccess green"></i><i class="icon-cross icoNoSettingsAccess red"></i></span><span data-text="settingsAccess"></span></div>
			<div><span class="col1 marginRight"><i class="icon-checkmark icoSystemAccess green"></i><i class="icon-cross icoNoSystemAccess red"></i></span><span data-text="systemAccess"></span></div>
			<div class="center">
				<button class="btnLogin linkButton input8 center marginTop" data-text="login"></button>
				<button class="btnLogout linkButton input8 center marginTop hidden" data-text="logout"></button>
			</div>
		</div>
	`,

	checkbox: '<label class="marginRight inlineBlock"><input type="checkbox" class="cbCheckbox" /><span class="lblLabel"></span></label>',

	expandIcon: '<a href="#" class="lnkExpand marginRightSmall"><i class="icon-circle-right"></i></a>',

	collapseIcon: '<a href="#" class="lnkCollapse marginRightSmall" hidden><i class="icon-circle-down"></i></a>'
};