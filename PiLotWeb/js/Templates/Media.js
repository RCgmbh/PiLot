var PiLot = PiLot || {};
PiLot.Templates = PiLot.Templates || {};

PiLot.Templates.Media = {

	gamesOverviewPage: `
		<div class="contentPadding">
			<h1>Games</h1>
			<a href="games/snake/index.html" class="tile big" hidden>
				<div>
					<img src="img/iconSnake.svg" />
					<span class="label">Snake</span>
				</div>		
			</a>
			<a href="games/2048/index.html" class="tile big">
				<div>
					<img src="img/icon2048.svg" />
					<span class="label">2048</span>
				</div>		
			</a>
			<a href="games/1024/index.html" class="tile big">
				<div>
					<img src="img/icon1024.svg" />
					<span class="label">1024</span>
				</div>		
			</a>
			<a href="games/re-wire/index.html" class="tile big">
				<div>
					<img src="img/iconRewire.svg" />
					<span class="label">Re-wire</span>
				</div>		
			</a>
			<a href="games/choch/index.html" class="tile big">
				<div>
					<img src="img/iconChoch.svg" />
					<span class="label">ЧОЧ</span>
				</div>		
			</a>
			<a href="games/gameOfLife/index.html" class="tile big">
				<div>
					<img src="img/iconGameOfLife.svg" />
					<span class="label">Game of Life</span>
				</div>
			</a>
		</div>
	`,

	libraryPage: `
		<div class="contentPadding fullHeight">
			<iframe style="width:100%; height:99%; border-width:0px;"></iframe>
		</div>`

};