var PiLot = PiLot || { };
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Common = {

	mainMenuHamburger: '<a href="#" class="vCenter"><i class="icon-menu"></i></a>',
	mainMenuSection: '<div></div>',
	mainMenuLink: '<a></a>',

	clock: `<span class="lblTime"></span><a class="lnkWarning hidden marginLeftSmaller red"><i class="icon-notice"></i></a>`,

	startPage: `<div class="homeContainer"></div>`,

	dayNightButtons: `
		<a class="btnNightMode button vCenter" href="#" data-title="nightMode"><i class="icon-moon"></i></a>
		<a class="btnDayMode button vCenter" href="#" data-title="dayMode"><i class="icon-sun2"></i></a>
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
		<div class="fullWidth">
			<div class="pnlLoginFailed feedbackBad marginAll hidden" data-text="loginFailed"></div>
			<div class="pnlLoginForm marginAll feedbackWarning">
				<div class="center">
					<form id="frmLogin">
						<input type="text" class="tbUsername input8 marginBottomSmall" autocomplete="username" data-title="username" /><br />
						<input type="password" class="tbPassword input8 marginBottomSmall" placeholder="Passwort" autocomplete="current-password" /><br />
						<button class="btnLogin input8" type="submit" data-text="login"></button><br />
					</form>
				</div>
			</div>
		</div>
		`,

	userMenuIcon: `
		<a class="btnUserInfo marginLeft vCenter" href="#" data-title="userinfo"><i class="icon-smile2"></i></a> 
	`,

	userMenu: `
		<div class="pnlUserInfo dialogPanel hidden">
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
	`
};