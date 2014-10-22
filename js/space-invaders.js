var SpaceInvaders = function () {
	
	var game = this;

	game.animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

	game.options = {
		difficulty: 3,
		debug: false
	};

	game.constants = {
		HEIGHT: 508,
		WIDTH: 630,
		SPACESHIP_WIDTH: 41,
		SPACESHIP_HEIGHT: 22,
		LASER_HEIGHT: 8,
		LASER_WIDTH: 1,
		LASER_SPEED: 5,
		MAX_LASERS: 10,
		ALIEN_WIDTH: 33,
		ALIEN_HEIGHT: 23,
		ALIENS_PER_ROW: 11
	};

	game.util = {
		setOptions: function (options) {
			var key;

			for (key in options) {
				if (options.hasOwnProperty(key)) {
					game.options[key] = options[key];
				}
			}
		}
	};

	game.state = {
		keys: {},
		firing: false,
		directions: {
			left: false,
			right: true,
			down: false
		}
	};

	window.addEventListener('keydown', function (e) {
		game.state.keys[e.keyCode] = true;
	});

	window.addEventListener('keyup', function (e) {
		delete game.state.keys[e.keyCode];
	});

	game.Edge = function (x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	};

	game.Bounds = function () {
		this.edges = [
			new game.Edge(0, 0, game.constants.WIDTH, 1),
			new game.Edge(game.constants.WIDTH - 1, 0, 1, game.constants.HEIGHT),
			new game.Edge(0, game.constants.HEIGHT - 1, game.constants.WIDTH, 1),
			new game.Edge(0, 0, 1, game.constants.HEIGHT)
		];
	};

	game.Bounds.prototype.render = function () {
		var i = 0;

		for (i; i < this.edges.length; i++)	{
			if (game.options.debug) {
				game.context.fillStyle = '#ff0000';
			}
			game.context.fillRect(this.edges[i].x, this.edges[i].y, this.edges[i].width, this.edges[i].height);
		}
	};

	game.AlienFleet = function () {
		this.aliens = this.populateFleet();
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
	}

	game.AlienFleet.prototype.updateDirectionState = function () {
		var bottomRightIndex = (game.constants.ALIENS_PER_ROW * game.options.difficulty) - 1,
			bottomLeftIndex = ((game.constants.ALIENS_PER_ROW * game.options.difficulty) - (game.constants.ALIENS_PER_ROW - 1)) - 1,
			bottomRightAlien = this.aliens[bottomRightIndex],
			bottomLeftAlien = this.aliens[bottomLeftIndex];

		// Detect collision with right boundary
		if (bottomRightAlien.x < game.bounds.edges[1].x + game.bounds.edges[1].width &&
			bottomRightAlien.x + bottomRightAlien.width > game.bounds.edges[1].x &&
			bottomRightAlien.y < game.bounds.edges[1].y + game.bounds.edges[1].height &&
			bottomRightAlien.y + bottomRightAlien.height > game.bounds.edges[1].y) {
				game.state.directions.right = false;
				game.state.directions.down = true;
		} else if (bottomLeftAlien.x < game.bounds.edges[3].x + game.bounds.edges[3].width &&
			bottomLeftAlien.x + bottomLeftAlien.width > game.bounds.edges[3].x &&
			bottomLeftAlien.y < game.bounds.edges[3].y + game.bounds.edges[3].height &&
			bottomLeftAlien.y + bottomLeftAlien.height > game.bounds.edges[3].y) {
				game.state.directions.left = false;
				game.state.directions.down = true;
		}
	};

	game.AlienFleet.prototype.render = function () {
		for (var i = this.aliens.length - 1; i >= 0; i--) {
			this.aliens[i].render();
		};
	};

	game.AlienFleet.prototype.update = function () {

		var directions = game.state.directions;

		this.updateDirectionState();

		for (var i = this.aliens.length - 1; i >= 0; i--) {
			this.aliens[i].update(directions.left, directions.right, directions.down);
		};
	};

	game.Alien = function (x, y) {
		this.x = x;
		this.y = y;
		this.height = game.constants.ALIEN_WIDTH;
		this.width = game.constants.ALIEN_HEIGHT;
		this.sprite = new Image();
		this.sprite.src = './img/alien.png';
	};

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

	game.Laser = function (x, y) {
		this.x = x;
		this.y = y;
		this.width = game.constants.LASER_WIDTH;
		this.height = game.constants.LASER_HEIGHT;
	};

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
		this.x = x;
		this.y = y;
		this.width = game.constants.SPACESHIP_WIDTH;
		this.height = game.constants.SPACESHIP_HEIGHT;
		this.lasers = [];
		this.sprite = new Image();
		this.sprite.src = './img/spaceship.png';
	};

	game.Spaceship.prototype.render = function () {
		game.context.drawImage(this.sprite, this.x, this.y);
	};

	game.Spaceship.prototype.move = function (x) {
		var newX = this.x + x;
		if (newX <= 0) {
			this.x = 0;
		} else if (newX + this.width >= game.constants.WIDTH) {
			this.x = game.constants.WIDTH - this.width;
		} else {
			this.x = newX;
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
			x: game.constants.WIDTH / 2 - (game.constants.SPACESHIP_WIDTH / 2),
			y: game.constants.HEIGHT - game.constants.SPACESHIP_HEIGHT
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

	game.renderFrame = function () {
		var i;

		game.context.fillStyle = '#000';
		game.context.fillRect(0, 0, game.constants.WIDTH, game.constants.HEIGHT);
		game.bounds.render();
		game.player.render();
		game.alienFleet.render();

		for (i = game.player.spaceship.lasers.length - 1; i >= 0; i--) {
			game.player.spaceship.lasers[i].render();
		}
	};

	game.nextFrame = function () {
		game.updateFrame();
		game.renderFrame();
		game.animate.call(window, game.nextFrame);
	};

	game.renderStage = function () {
		game.canvas = document.createElement('canvas');

		game.canvas.height = game.constants.HEIGHT;
		game.canvas.width = game.constants.WIDTH;
		game.context = game.canvas.getContext('2d');
		
		document.body.appendChild(game.canvas);

		game.bounds = new game.Bounds();
		game.player = new game.Player();
		game.alienFleet = new game.AlienFleet();

		game.animate.call(window, game.nextFrame);
	};

	return {
		init: function (options) {
			game.util.setOptions(options);
			game.renderStage();
		}
	};
};

window.onload = function () {

	var game = new SpaceInvaders(),
		options = {
			difficulty: 2,
			debug: true
		};
	
	options.difficulty = prompt('Please enter your difficulty (1 - 5).');

	if (options.difficulty > 0 && options.difficulty <= 5) {
		game.init(options);
	} else {
		alert('You should have entered a valid difficulty. Extra hard mode enabled!!!');
		options.difficulty = 10;
		game.init(options);	
	}
	
};