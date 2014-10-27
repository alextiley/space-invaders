var SpaceInvadersGame = function (options) {
	
	var game = this;

	game.animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

	game.options = {
		difficulty: 3,
		debug: false
	};

	game.constants = {
		GAME_HEIGHT: 508,
		GAME_WIDTH: 630,
		SPACESHIP_HEIGHT: 22,
		SPACESHIP_WIDTH: 41,
		LASER_HEIGHT: 8,
		LASER_WIDTH: 1,
		LASER_SPEED: 5,
		MAX_LASERS: 10,
		ALIEN_HEIGHT: 23,
		ALIEN_WIDTH: 33,
		ALIENS_PER_ROW: 11
	};

	game.utils = {
		extend: function (copyObject) {
			var copyObject = JSON.parse(JSON.stringify(copyObject)),
				newObject = {},
				key;
			for (key in copyObject) {
				if (copyObject.hasOwnProperty(key)) {
					newObject[key] = copyObject[key];
				}
			}
			return newObject;
		}
	};

	// Default game state settings
	game.defaultState = {
		keys: {}, // Stores the current key presses for access within each frame
		firing: false, // Is the player firing a weapon? Used to allow delay between new lasers
		initialised: false, // Flag to determine whether the first frame has been fully rendered
		directions: { 
			left: false,
			right: true, // Initialise and store which direction the alien fleet are travelling in. They always move right at the beginning.
			down: false
		}
	};

	game.sprites = {
		spaceship: './img/spaceship.png',
		alien: './img/alien.png'
	};

	/*
	 * Actor class
	 * - This class is used to hold all actors within the game, such as aliens, players, etc.
	 * - All actors have x + y coords, as well as a height and width, and an optional sprite img
	 * - This class also has built in methods which allow the application to check collisions
	 * - Other classes can extend this class when these properties/methods are required
	 */
	game.Actor = function (x, y, width, height, sprite) {

		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		
		if (sprite !== undefined) {
			this.sprite = new Image();
			this.sprite.src = sprite;
		}
	};

	game.Actor.prototype.isAtLeftBoundary = function () {
		return this.x <= 0;
	};

	game.Actor.prototype.isAtRightBoundary = function () {
		return this.x + this.width >= game.constants.GAME_WIDTH;
	};

	game.Actor.prototype.isAtBottomBoundary = function () {
		return this.y + this.height >= game.constants.GAME_HEIGHT - game.constants.SPACESHIP_HEIGHT;
	};

	/*
	 * Alien class
	 */
	game.Alien = function (x, y) {
		game.Actor.call(this, x, y, game.constants.ALIEN_WIDTH, game.constants.ALIEN_HEIGHT, game.sprites.alien);
	};

	game.Alien.prototype = new game.Actor();
	game.Alien.prototype.constructor = game.Alien;

	game.Alien.prototype.render = function () {
		game.context.drawImage(this.sprite, this.x, this.y);
	};

	game.Alien.prototype.update = function (left, right, down) {

		var difficultyModifier = 0.5 * game.options.difficulty;

		if (left) {
			this.x -= difficultyModifier;
		} else if (right) {
			this.x += difficultyModifier;
		} else if (down) {
			this.y += difficultyModifier;
		}
	};

	game.AlienFleet = function () {
		this.aliens = this.populateFleet();
		this.bottomLeftAlien = this.getBottomLeftAlien();
		this.bottomRightAlien = this.getBottomRightAlien();
	};

	game.AlienFleet.prototype.populateFleet = function () {

		var totalAliens = game.constants.ALIENS_PER_ROW * game.options.difficulty,
			totalRows = totalAliens / game.constants.ALIENS_PER_ROW,
			fleet = [], x = 0, y = 0, i = 0, n = 0;

		for (i; i < totalRows; i++) {
			for (n; n < game.constants.ALIENS_PER_ROW; n++) {
				x = (n + 1) * (game.constants.ALIEN_WIDTH) - game.constants.ALIEN_WIDTH;
				if (n > 0) {
					x = x + (game.constants.ALIEN_WIDTH / 4) * n;
				}
				if (i > 0) {
					y = i * (game.constants.ALIEN_HEIGHT * 1.5);
				}
				fleet.push(new game.Alien(x, y));
			}
			n = 0;
		}

		return fleet;
	};

	game.AlienFleet.prototype.getBottomRightAlien = function () {
		return this.aliens[game.constants.ALIENS_PER_ROW * game.options.difficulty - 1];
	};

	game.AlienFleet.prototype.getBottomLeftAlien = function () {
		return this.aliens[game.constants.ALIENS_PER_ROW * game.options.difficulty - (game.constants.ALIENS_PER_ROW - 1) - 1];
	};

	game.AlienFleet.prototype.hasMovedCloseEnough = function () {
		return this.bottomRightAlien.y >= (this.bottom + game.constants.ALIEN_HEIGHT);
	};

	game.AlienFleet.prototype.updateMovementDirection = function () {
		// This is messy. Rethink how this is done!
		if (!game.state.directions.down) {
			if (this.bottomRightAlien.isAtRightBoundary()) {
				game.state.directions.right = false;
				game.state.directions.down = true;
				this.bottom = this.bottomRightAlien.y;
				game.state.next = 'left';
			} else if (this.bottomLeftAlien.isAtLeftBoundary()) {
				game.state.directions.left = false;
				game.state.directions.down = true;
				this.bottom = this.bottomLeftAlien.y;
				game.state.next = 'right';
			}
		} else if (this.hasMovedCloseEnough()) {
			game.state.directions.down = false;
			game.state.directions[game.state.next] = true;
		}
	};

	game.AlienFleet.prototype.detectGameOver = function () {
		if (game.state.directions.down) {
			if (this.bottomRightAlien.isAtBottomBoundary()) {
				game.state.ended = true;
			}
		}
	};

	game.AlienFleet.prototype.render = function () {
		for (var i = this.aliens.length - 1; i >= 0; i--) {
			this.aliens[i].render();
		};
	};

	game.AlienFleet.prototype.update = function () {

		var directions = game.state.directions,
			i;

		if (game.state.initialised) {
			this.updateMovementDirection();
			this.detectGameOver();
		}

		for (i = this.aliens.length - 1; i >= 0; i--) {
			this.aliens[i].update(directions.left, directions.right, directions.down);
		};
	};

	game.Laser = function (x, y) {
		game.Actor.call(this, x, y, game.constants.LASER_WIDTH, game.constants.LASER_HEIGHT);
	};

	game.Laser.prototype = new game.Actor();
	game.Laser.prototype.constructor = game.Laser;

	game.Laser.prototype.render = function () {
		game.context.fillStyle = '#fff';
		game.context.fillRect(this.x, this.y, this.width, this.height);
	};

	game.Laser.prototype.update = function (spaceship) {
		this.y += -game.constants.LASER_SPEED;
		if (this.y <= -this.height) {
			spaceship.lasers.shift();
		}
	};

	game.Spaceship = function (x, y) {
		this.lasers = [];
		game.Actor.call(this, x, y, game.constants.SPACESHIP_WIDTH, game.constants.SPACESHIP_HEIGHT, game.sprites.spaceship);
	};

	game.Spaceship.prototype = new game.Actor();
	game.Spaceship.prototype.constructor = game.Spaceship;

	game.Spaceship.prototype.render = function () {
		game.context.drawImage(this.sprite, this.x, this.y);
	};

	game.Spaceship.prototype.move = function (x) {
		this.x += x;
		if (this.isAtLeftBoundary()) {
			this.x = 0;
		} else if (this.isAtRightBoundary()) {
			this.x = game.constants.GAME_WIDTH - this.width;
		}
	};

	game.Spaceship.prototype.shoot = function () {
		var coords = game.getNewLaserCoords(this),
			laser = new game.Laser(coords.x, coords.y);
		laser.render();
		this.lasers.push(laser);
	};

	game.delayFire = function (timer) {
		setTimeout(function () {
			game.state.firing = false;
		}, timer);
	};

	game.getNewLaserCoords = function (spaceship) {
		return {
			x: spaceship.x + (spaceship.width / 2),
			y: spaceship.y - game.constants.LASER_HEIGHT
		};
	};

	game.getInitialPlayerCoords = function () {
		return {
			x: game.constants.GAME_WIDTH / 2 - (game.constants.SPACESHIP_WIDTH / 2),
			y: game.constants.GAME_HEIGHT - game.constants.SPACESHIP_HEIGHT
		};
	};

	game.Player = function () {
		var coords = game.getInitialPlayerCoords();
		this.spaceship = new game.Spaceship(coords.x, coords.y);
	};

	game.Player.prototype.render = function () {
		this.spaceship.render();
	};

	game.Player.prototype.update = function () {
		var key;

		for (key in game.state.keys) {
			if (game.state.keys.hasOwnProperty(key)) {
				if (parseInt(key) === 37) {
					this.spaceship.move(-5);
				} else if (parseInt(key) === 39) {
					this.spaceship.move(5);
				} else if (parseInt(key) === 38 && this.spaceship.lasers.length < game.constants.MAX_LASERS) {
					if (game.state.firing) {
						continue;
					}
					game.state.firing = true;
					game.delayFire(100);

					this.spaceship.shoot();
				}
			}
		}
	};

	game.updateFrame = function () {
		var i;
		
		game.player.update();
		game.alienFleet.update();
		
		for (i = game.player.spaceship.lasers.length - 1; i >= 0; i--) {
			game.player.spaceship.lasers[i].update(game.player.spaceship);
		}
	};

	game.reset = function () {
		// Clear old game
		game.context.clearRect(0, 0, game.constants.GAME_WIDTH, game.constants.GAME_HEIGHT);
		// Reset initial game state
		game.state = {};
		game.player = null;
		game.alienFleet = null;
		// Restart
		game.start();
	}

	game.renderFrame = function () {
		var i;

		game.context.fillStyle = '#000';
		game.context.fillRect(0, 0, game.constants.GAME_WIDTH, game.constants.GAME_HEIGHT);
		game.player.render();
		game.alienFleet.render();

		for (i = game.player.spaceship.lasers.length - 1; i >= 0; i--) {
			game.player.spaceship.lasers[i].render();
		}

		if (!game.state.initialised) {
			game.state.initialised = true;
		}
	};

	game.nextFrame = function () {
		if (!game.state.ended) {
			game.updateFrame();
			game.renderFrame();
			game.animate.call(window, game.nextFrame);
		} else {
			window.cancelAnimationFrame(game.animate);
			window.alert('Game Over!');
			game.reset();
		}
	};

	game.createCanvas = function () {
		game.canvas = document.createElement('canvas');

		game.canvas.height = game.constants.GAME_HEIGHT;
		game.canvas.width = game.constants.GAME_WIDTH;
		game.context = game.canvas.getContext('2d');
		
		document.body.appendChild(game.canvas);
	};

	game.initKeyBindings = function () {
		window.addEventListener('keydown', function (e) {
			game.state.keys[e.keyCode] = true;
		});

		window.addEventListener('keyup', function (e) {
			delete game.state.keys[e.keyCode];
		});
	};

	game.start = function () {
		game.state = game.utils.extend(game.defaultState);
		game.player = new game.Player();
		game.alienFleet = new game.AlienFleet();
		game.animate.call(window, game.nextFrame);
	};

	game.initialize = function () {
		game.options = game.utils.extend(options);
		game.createCanvas();
		game.initKeyBindings();
		game.start();
	};

	game.initialize();
};

window.onload = function () {
	var game,
		options = {
			difficulty: 9,
			debug: true
		};

	game = new SpaceInvadersGame(options);
};