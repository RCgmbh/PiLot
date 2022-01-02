var SnakeGame = (function () {

	var Controller = function (pControls) {
		this.game = null;
		this.controlMode = 1;
		this.level = 4;
		this.board = pControls.board;
		this.divScore = pControls.divScore;
		this.slider = pControls.slider;
		this.lblLevel = pControls.lblLevel;
		this.lnkStart = pControls.lnkStart;
		this.lnkPause = pControls.lnkPause;
		this.rbNSWE = pControls.rbNSWE;
		this.rbLR = pControls.rbLR;
		this.lblLevel = pControls.lblLevel;
		this.initialize();
	};

	Controller.prototype = {

		initialize: function () {
			this.bindKeys();
			this.bindControls();
			this.bindSlider();
			this.prepareGame();
			this.board.focus();
		},

		bindKeys: function () {
			document.addEventListener('keydown', function (e) {
				e.stopPropagation();
				switch (e.key) {
					case "ArrowLeft": e.preventDefault(); this.arrowLeft(); break;
					case "ArrowUp": e.preventDefault(); this.arrowUp(); break;
					case "ArrowRight": e.preventDefault(); this.arrowRight(); break;
					case "ArrowDown": e.preventDefault(); this.arrowDown(); break;
					case " ": e.preventDefault(); this.togglePause(); break;
				}
			}.bind(this));
		},

		bindControls: function () {
			this.lnkStart.addEventListener('click', this.startGame.bind(this));
			this.lnkPause.addEventListener('click', this.pauseGame.bind(this));
			this.rbNSWE.addEventListener('change', function (event) { if(event.target.checked) this.setControlMode(1); }.bind(this));
			this.rbLR.addEventListener('change', function (event) { if (event.target.checked) this.setControlMode(0); }.bind(this));
		},

		bindSlider: function () {
			$(this.slider).slider({
				step: 1,
				min: 0, max: 9, value: this.level,
				stop: function (event, ui) {
					ui.handle.blur();
					this.setLevel(ui.value);
				}.bind(this)
			});
		},

		prepareGame: function () {
			this.game = new SnakeGame.Game(this.board, this.divScore);
			this.game.end = function (pGame, pMoveResult) {
				alert("GAME OVER");
				this.showButtons(false);
				this.prepareGame();
			}.bind(this);
			this.setLevel(this.level);
			this.game.draw();
		},

		setLevel: function (pLevelIndex) {
			this.level = pLevelIndex;
			this.game.setLevel(this.level);
			this.lblLevel.innerText = pLevelIndex + 1;
		},

		startGame: function () {
			this.game.resume();
			this.showButtons(true);
			this.board.focus();
		},

		pauseGame: function () {
			this.game.pause();
			this.showButtons(false);
		},

		showButtons: function (pIsRunning) {
			RC.Utils.toggleClass(this.lnkStart, 'hidden', pIsRunning);
			RC.Utils.toggleClass(this.lnkPause, 'hidden', !pIsRunning);
		},

		togglePause: function () {
			if (this.game.isRunning()) {
				this.pauseGame();
			} else {
				this.startGame();
			}
		},

		arrowUp: function () {
			if (this.controlMode === 1) {
				this.game.snake.setDirection(0, -1);
			}
		},

		arrowDown: function () {
			if (this.controlMode === 1) {
				this.game.snake.setDirection(0, 1);
			}
		},

		arrowLeft: function () {
			switch (this.controlMode) {
				case 0: this.game.snake.turnLeft(); break;
				case 1: this.game.snake.setDirection(-1, 0); break;
			}
		},

		arrowRight: function () {
			switch (this.controlMode) {
				case 0: this.game.snake.turnRight(); break;
				case 1: this.game.snake.setDirection(1, 0); break;
			}
		},

		setControlMode: function (pMode) {
			this.controlMode = pMode;
			this.board.focus();
		}
	};	

	var Game = function (pBoard, pDivScore) {

		this.levels = [
			[350, 0, 350], // 0: level 1
			[350, 5, 250], // 1: level 2
			[300, 5, 200], // 2: level 3
			[300, 5, 150], // 3: level 4
			[250, 5, 150], // 4: level 5
			[250, 10, 150], // 5: level 6
			[200, 10, 100], // 6: level 7
			[200, 10, 100], // 7: level 8
			[150, 10, 75], // 8: level 9
			[150, 10, 50], // 9: level 10
		];

		this.interval = null;
		this.end = null;
		this.defaultIntervalMS = 0;
		this.intervalMS = 0;
		this.intervalMSStep = 0;
		this.minIntervalMS = 0;
		this.board = new SnakeGame.Board(30, 30, pBoard);
		this.snake = new SnakeGame.Snake(this.board);
		this.score = 0;
		this.divScore = pDivScore;
	};

	Game.prototype = {

		setLevel: function (pLevelIndex) {
			if ((pLevelIndex >= 0) && (pLevelIndex < this.levels.length)) {
				var isRunning = this.isRunning();
				if (isRunning) { this.pause(); }
				this.defaultIntervalMS = this.levels[pLevelIndex][0];
				this.intervalMS = this.levels[pLevelIndex][0];
				this.intervalMSStep = this.levels[pLevelIndex][1];
				this.minIntervalMS = this.levels[pLevelIndex][2];
				if (isRunning) { this.resume(); }
			}
		},

		play: function () {
			this.intervalMS = this.defaultIntervalMS;
			this.resume();
		},

		pause: function () {
			window.clearInterval(this.interval);
			this.interval = null;
		},

		resume: function () {
			this.interval = window.setInterval(this.moveAndDraw.bind(this), this.intervalMS);
			console.log("setting intervalMS to " + this.intervalMS);
		},

		isRunning: function () {
			return this.interval !== null;
		},

		accelerate: function (pBy) {
			if (this.intervalMS > this.minIntervalMS) {
				this.pause();
				this.intervalMS = Math.max(this.intervalMS - pBy, this.minIntervalMS);
				this.resume();
			}
		},

		moveAndDraw: function () {
			if (this.board.apples.length === 0) {
				this.board.addApple();
			}
			this.snake.move();
			switch (this.snake.checkCollision()) {
				case 0:
					this.draw();
					break;
				case 1:
					console.log('mhmmm');
					this.score++;
					this.board.addApple();
					this.draw();
					this.accelerate(this.intervalMSStep);
					break;
				case 2:
					this.onEnd(2);
					break;
				case 3:
					this.onEnd(3);
					break;
			}
		},

		/// calls this.onEnd if it was defined before, adding this as parameter
		onEnd: function (pMoveResult) {
			this.pause();
			if (this.end !== null) {
				this.end(this, pMoveResult);
			}
		},

		/// updates the gui
		draw: function () {
			this.divScore.innerText = this.score;
			this.board.draw();
			this.snake.draw();
		}
	};

	/// represents the Snake
	var Snake = function (pBoard) {

		this.defaultX = Math.floor(pBoard.width / 2);
		this.defaultY = -1;

		/// the board this snake is on
		this.board = pBoard;

		/// the array of all segments of this snake
		this.segments = new Array();

		/// the velocity in x-direction which will usually be -1, 0 or 1
		this.vX = 0;

		/// the velocity in y-direction which will usually be -1, 0 or 1
		/// we default to 1, because the snake always moves
		this.vY = 1;

		/// setting a value here will add one new tail segment on the next moves
		/// until the value is 0. Adding on move makes things simpler, so we combine it.		
		this.addSegmentsWhenMoving = 4;

		this.initialize();
	};

	Snake.prototype = {

		/// prepares the snake by adding just the head
		initialize: function () {
			this.addSegment();
		},

		/// adds a new segment to the end of the snake
		addSegment: function () {
			var isHead = true;
			var lastSegment = null;
			var x = this.defaultX;
			var y = this.defaultY;
			if (this.segments.length > 0) {
				isHead = false;
				lastSegment = this.segments[this.segments.length - 1];
				lastSegment.isLast = false;
				x = lastSegment.getX();
				y = lastSegment.getY();
			}
			this.segments.push(new SnakeGame.SnakeSegment(x, y, isHead, true));
		},

		/// sets the velocity in X- and Y direction. Either one of
		/// the values must be non-zero. The moving direction can not
		/// be changed by 180° at once.
		setDirection: function (pVX, pVY) {
			if ((pVX !== 0) || (pVY !== 0)) {
				if ((this.vX * pVX !== -1) && (this.vY * pVY !== -1)) {
					this.vX = pVX;
					this.vY = pVY;
				}
			} else {
				console.log("Invalid velocity. Either pVX or pVY must be not 0");
			}
		},

		/// turns the velocity by 90° counter-clockwise
		turnLeft: function () {
			this.turn(-1);
		},

		/// turns the velocity by 90° clockwise
		turnRight: function () {
			this.turn(1);
		},

		/// turns by 90° to the right (pSign = 1) or left (pSign = -1)
		turn: function (pSign) {
			var vXold = this.vX;
			this.vX = this.vY * pSign * -1;
			this.vY = vXold * pSign;
		},

		/// moves the snake based on the current direction. If there are pending
		/// segments, one will be added.
		move: function () {
			var lastIndex = this.segments.length - 1;
			var segment;
			// add segment if necessary
			if (this.addSegmentsWhenMoving > 0) {
				this.addSegment(false);
				this.addSegmentsWhenMoving--;
			}
			// move the tail, starting at the end
			for (var i = lastIndex; i > 0; i--) {
				segment = this.segments[i];
				// clear the last field as long as we know where it was
				if (i == lastIndex) {
					this.board.drawField(segment.getX(), segment.getY(), false, false, false, false)
				}
				var previousSegment = this.segments[i - 1];
				segment.setXY(previousSegment.getX(), previousSegment.getY());
			}
			// move the head
			if (this.segments.length > 0) {
				segment = this.segments[0];
				segment.moveBy(this.vX, this.vY);
				
			}
		},

		/// Checks whether the head collides with the board boundary, with
		/// an apple or with the tail. Collisions with apples are handled
		/// by removing the apple and growing the snake. The result value
		/// indicate what happened:
		/// 0: Nothing
		/// 1: Apple eaten
		/// 2: Collision with board boundary
		/// 3: Collision with self
		checkCollision: function () {
			var result = 0;
			if (this.segments.length > 0) {
				var head = this.segments[0];
				var x = head.getX();
				var y = head.getY();
				if (this.board.eatApple(x, y)) {
					this.addSegmentsWhenMoving++;
					result = 1;
				} else {
					var field = this.board.getField(x, y);
					if (field === null) {
						result = 2;
					} else if (field.getIsSnake()) {
						result = 3;
					}
				}
			}
			return result;
		},

		/// Draws the snake by calling draw() on each segment;
		draw: function () {
			var segment;
			if (this.segments.length > 0) {
				segment = this.segments[0];
				this.board.drawField(segment.getX(), segment.getY(), true, false, false, false);
				if (this.segments.length > 1) {
					segment = this.segments[this.segments.length - 1];
					this.board.drawField(segment.getX(), segment.getY(), false, true, true, false);
					if (this.segments.length > 2) {
						segment = this.segments[1];
						this.board.drawField(segment.getX(), segment.getY(), false, true, false, false);
					}
				}

			}
		}
	};

	/// represents one segment of the snake, which can be 
	/// head (isHead === true) or tail, and if tail, it can 
	/// be the last item which will have an additional css class
	var SnakeSegment = function (pX, pY, pIsHead, pIsLast) {

		this.isHead = pIsHead;
		this.isLast = pIsLast;
		this.x = pX;
		this.y = pY;

	};

	SnakeSegment.prototype = {

		/// gets the X-coordinate of the current location of this segment
		getX: function () {
			return this.x;
		},

		/// gets the Y-coordinate of the current location of this segment
		getY: function () {
			return this.y;
		},

		/// sets the Position of the segment
		setXY: function (pX, pY) {
			this.x = pX;
			this.y = pY;
		},

		/// moves the segment by pVX in X-direction and by pVY in 
		/// Y-direction
		moveBy: function (pVX, pVY) {
			this.x += pVX;
			this.y += pVY;
		},
	};

	/// represents the game board, expecting the number of fields in horizontal
	/// and in vertical direction. pJQElement represents a JQuery object which 
	/// contains the field template and will contain the fields
	var Board = function (pWidth, pHeight, pElement) {

		/// the JQuery Element representing the board
		this.control = pElement;

		/// the number of fields in X-Direction (horizontal)
		this.width = pWidth;

		/// the number of fields in Y-Direction (vertical)
		this.height = pHeight;

		/// the list of all apples on the board
		this.apples = new Array();

		/// the array holding arrays with fields.
		this.fieldRows = null;

		this.initialize();

	};

	Board.prototype = {

		/// initializes the board by filling it with fields in a two-
		/// dimensional array (the outer array representing the columns)
		initialize: function () {
			this.fieldRows = new Array();
			var fieldControl;
			while (this.control.firstChild) {
				this.control.removeChild(this.control.firstChild);
			}
			for (var y = 0; y < this.height; y++) {
				var row = new Array();
				for (var x = 0; x < this.width; x++) {
					var field = this.getField(x, y);
					if (field === null) {
						fieldControl = this.control.appendChild(document.createElement('div'));
						row.push(new SnakeGame.BoardField(fieldControl));
					}
				}
				this.control.appendChild(document.createElement('br'));
				this.fieldRows.push(row);
			}
		},

		/// adds an apple at a random place 
		addApple: function () {
			while (true) {
				var x = Math.floor(Math.random() * this.width);
				var y = Math.floor(Math.random() * this.height);
				var field = this.getField(x, y);
				if ((field !== null) && field.isEmpty()) {
					this.apples.push(new SnakeGame.Apple(x, y));
					console.log('Apple added');
					break;
				}
			}
		},

		/// checks whether we have an Apple at X/Y and
		/// removes it if so.
		eatApple: function (pX, pY) {
			var result = false;
			var appleIndex = this.indexOfApple(pX, pY);
			if (appleIndex !== null) {
				this.apples.splice(appleIndex, 1);
				result = true;
			}
			return result;
		},

		/// gets the index of the apple at X/Y or null, if there is no
		/// apple at X/Y
		indexOfApple: function (pX, pY) {
			var result = null;
			for (var i = 0; i < this.apples.length; i++) {
				if (this.apples[i].isAt(pX, pY)) {
					result = i;
					break;
				}
			}
			return result;
		},

		/// returns the field at Coordinates X/Y or null,
		/// if the coordinates lay outside the board;
		getField: function (pX, pY) {
			var result = null;
			if ((pY >= 0) && (pY < this.fieldRows.length)) {
				var row = this.fieldRows[pY];
				if ((pX >= 0) && (pX < row.length)) {
					result = row[pX];
				}
			}
			return result;
		},

		/// draws the apples
		draw: function () {
			this.drawApples();
		},

		/// draws a field, if it's found, with the appropriate style 
		drawField: function (pX, pY, pIsSnakeHead, pIsSnakeTail, pIsSnakeEnd, pIsApple) {
			var field = this.getField(pX, pY);
			if (field != null) {
				field.draw(pIsSnakeHead, pIsSnakeTail, pIsSnakeEnd, pIsApple);
			}
		},

		/// draws all apple fields
		drawApples: function () {
			for (var i = 0; i < this.apples.length; i++) {
				this.drawField(this.apples[i].getX(), this.apples[i].getY(), false, false, false, true);
			}
		}
	};


	var BoardField = function (pControl) {

		/// the HTMLElement control representing this field
		this.control = pControl;

		/// true, if the snake covers this field
		this.isSnake = false;

		/// true, if an apple covers this field
		this.isApple = false;

		this.initialize();
	}	

	BoardField.prototype = {

		initialize: function () { },

		/// returns true, if either head or tail is on this field
		getIsSnake: function () {
			return this.isSnake;
		},

		/// returns true, if there is nothing else on that field
		isEmpty: function () {
			return !(this.isSnake || this.isApple);
		},

		draw: function (pIsSnakeHead, pIsSnakeTail, pIsSnakeEnd, pIsApple) {
			this.isSnake = pIsSnakeTail || pIsSnakeHead;
			this.isApple = pIsApple;
			if (pIsSnakeHead) {
				this.control.classList.add('snakeHead');
			} else if (pIsSnakeTail) {
				this.control.classList.add('snakeTail');
				if (pIsSnakeEnd) {
					this.control.classList.add('last');
				}
			} else if (pIsApple) {
				this.control.classList.add('snakeApple');
			} else {
				this.control.className = '';
			}
		}
	};
	
	var Apple = function (pX, pY) {
		this.x = pX;
		this.y = pY;
	};

	Apple.prototype = {

		/// Gets the X-Coordinate of the apples position
		getX: function () {
			return this.x;
		},

		/// Gets the Y-Coordinate of the apples position
		getY: function () {
			return this.y;
		},

		/// returns true, if this apple is at X/Y
		isAt: function (pX, pY) {
			return ((this.x === pX) && (this.y === pY));
		}
	}

	return {
		Controller: Controller,
		Game: Game,
		Snake: Snake,
		SnakeSegment: SnakeSegment,
		Board: Board,
		BoardField: BoardField,
		Apple: Apple
	};

})();

