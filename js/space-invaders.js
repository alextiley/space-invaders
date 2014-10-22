var SpaceInvaders = function () {
	
	var self = this;

	self.animate = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;

	self.options = {
		difficulty: 3
	};

	self.constants = {
		HEIGHT: 508,
		WIDTH: 630,
		SPACESHIP_WIDTH: 41,
		SPACESHIP_HEIGHT: 22,
		LASER_HEIGHT: 8,
		LASER_WIDTH: 1,
		LASER_SPEED: 5,
		MAX_LASERS: 10,
		ALIEN_WIDTH: 24,
		ALIEN_HEIGHT: 24
	};

	self.util = {
		setOptions: function (options) {
			var key;

			for (key in options) {
				if (options.hasOwnProperty(key)) {
					self.options[key] = options[key];
				}
			}
		}
	};

	self.keys = {};
	self.firing = false;
	self.aliens = [];

	window.addEventListener('keydown', function (e) {
		self.keys[e.keyCode] = true;
	});

	window.addEventListener('keyup', function (e) {
		delete self.keys[e.keyCode];
	});

	// self.Alien = function (x, y) {
	// 	this.x = x;
	// 	this.x = y;
	// 	this.height = self.constants.ALIEN_WIDTH;
	// 	this.width = self.constants.ALIEN_HEIGHT;
	// };

	// self.Alien.prototype.render = function () {
	// 	self.context.fillStyle = '#ff0000';
	// 	self.context.fillRect(this.x, this.y, this.width, this.height);
	// };

	// self.Alien.prototype.update = function (left, right, down) {
	// 	if (left) {
	// 		this.x -= 10;
	// 	} else if (right) {
	// 		this.x += 10;
	// 	} else if (down) {
	// 		this.y += 10;
	// 	}
	// };

	self.Laser = function (x, y) {
		this.x = x;
		this.y = y;
		this.width = self.constants.LASER_WIDTH;
		this.height = self.constants.LASER_HEIGHT;
	};

	self.Laser.prototype.render = function () {
		self.context.fillStyle = '#fff';
		self.context.fillRect(this.x, this.y, this.width, this.height);
	};

	self.Laser.prototype.update = function (spaceship) {
		this.y += -self.constants.LASER_SPEED;
		if (this.y <= -this.height) {
			spaceship.lasers.shift();
		}
	};

	self.Spaceship = function (x, y) {
		this.x = x;
		this.y = y;
		this.width = self.constants.SPACESHIP_WIDTH;
		this.height = self.constants.SPACESHIP_HEIGHT;
		this.lasers = [];
		this.sprite = new Image();
		this.sprite.src = './img/spaceship.png';
	};

	self.Spaceship.prototype.render = function () {
		self.context.drawImage(this.sprite, this.x, this.y);
	};

	self.Spaceship.prototype.move = function (x) {
		var newX = this.x + x;
		if (newX <= 0) {
			this.x = 0;
		} else if (newX + this.width >= self.constants.WIDTH) {
			this.x = self.constants.WIDTH - this.width;
		} else {
			this.x = newX;
		}
	};

	self.Spaceship.prototype.shoot = function () {
		var coords = self.getNewLaserCoords(this),
			laser = new self.Laser(coords.x, coords.y);
		laser.render();
		this.lasers.push(laser);
	};

	self.delayFire = function (timer) {
		setTimeout(function () {
			self.firing = false;
		}, timer);
	};

	self.getNewLaserCoords = function (spaceship) {
		return {
			x: spaceship.x + (spaceship.width / 2),
			y: spaceship.y - self.constants.LASER_HEIGHT
		};
	};

	self.getInitialPlayerCoords = function () {
		return {
			x: self.constants.WIDTH / 2 - (self.constants.SPACESHIP_WIDTH / 2),
			y: self.constants.HEIGHT - self.constants.SPACESHIP_HEIGHT
		};
	};

	self.Player = function () {
		var coords = self.getInitialPlayerCoords();
		this.spaceship = new self.Spaceship(coords.x, coords.y);
	};

	self.Player.prototype.render = function () {
		this.spaceship.render();
	};

	self.Player.prototype.update = function () {
		var key;

		for (key in self.keys) {
			if (self.keys.hasOwnProperty(key)) {
				if (parseInt(key) === 37) {
					this.spaceship.move(-5);
				} else if (parseInt(key) === 39) {
					this.spaceship.move(5);
				} else if (parseInt(key) === 38 && this.spaceship.lasers.length < self.constants.MAX_LASERS) {
					// Only allow laser fire every 100 ms
					if (self.firing) {
						continue;
					}

					self.firing = true;
					self.delayFire(100);

					this.spaceship.shoot();
				}
			}
		}
	};

	self.updateFrame = function () {
		var i;
		
		self.player.update();
		//self.enemyFleet.update();
		
		for (i = self.player.spaceship.lasers.length - 1; i >= 0; i--) {
			self.player.spaceship.lasers[i].update(self.player.spaceship);
		}
	};

	self.renderFrame = function () {
		var i;

		self.context.fillStyle = '#000';
		self.context.fillRect(0, 0, self.constants.WIDTH, self.constants.HEIGHT);
		self.player.render();
		//self.enemyFleet.render();

		for (i = self.player.spaceship.lasers.length - 1; i >= 0; i--) {
			self.player.spaceship.lasers[i].render();
		}
	};

	self.nextFrame = function () {
		self.updateFrame();
		self.renderFrame();
		self.animate.call(window, self.nextFrame);
	};

	self.renderStage = function () {
		self.canvas = document.createElement('canvas');

		self.canvas.height = self.constants.HEIGHT;
		self.canvas.width = self.constants.WIDTH;
		self.context = self.canvas.getContext('2d');
		
		document.body.appendChild(self.canvas);

		self.player = new self.Player();
		//self.enemyFleet = new self.EnemyFleet();

		self.animate.call(window, self.nextFrame);
	};

	return {
		init: function (options) {
			self.util.setOptions(options);
			self.renderStage();
		}
	};
};

window.onload = function () {

	var game = new SpaceInvaders(),
		options = {
			difficulty: 1
		};
	
	game.init(options);
};