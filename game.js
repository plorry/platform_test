var gamejs = require('gramework').gamejs,
    conf = require('./conf'),
    GameController = require('gramework').input.GameController,
    animate = require('gramework').animate,
    Scene = require('gramework').Scene,
    Entity = require('gramework').Entity,
    TextBlock = require('gramework').uielements.TextBlock,
    MenuItem = require('gramework').uielements.MenuItem,
    Emitter = require('gramework').particles.Emitter,
    _ = require('underscore');

var PIXEL_SCALE = 2;

// Maybe these values do something important
var MONKEY_SPEED = 3;
var MONKEY_JUMP = 5;
var MONKEY_GRAVITY = 1;

var pickup_sound = new Audio(conf.Sounds.blip);


var Display = Entity.extend({
    
});

// Container for the entire game.
var Monkey = Entity.extend({
    initialize: function(options) {
        this.spriteSheet = options.spriteSheet;
        this.anim = new animate.Animation(this.spriteSheet, "static", {static:
            {
                frames: _.range(0,15), rate: 15, loop: true
            }});
        this.image = this.anim.update(0);
        this.anim.setFrame(0);
        this.speed = {x: 0, y: 0};
        this.accel = {x: 0, y: 0};
        this.terminalVelocity = MONKEY_GRAVITY * 10;
        this.scene = options.scene;
        this.falling = false;
        this.isJumping = false;
        this.lookingRight = true;
        this.ground;
        this.canJump = true;

        if (this.scene) {
            this.scene.pushEntity(this);
        }
    },

    land: function(platform) {
        this.rect.top = platform.rect.top - this.rect.height + 5;
        this.speed.y = 0;
        this.accel.y = 0;
        this.falling = false;
    },

    checkCollisions: function() {
        this.scene.entities.forEach(function(entity) {
            if (this.rect.collideRect(entity.rect)) {
                if (entity.type === 'collectible') {
                    entity.kill();
                    pickup_sound.play();
                    this.scene.score += 1;
                }
            }
        }, this);
    },

    onGround: function() {
        var onGround = false;
        this.scene.entities.forEach(function(entity) {
            if (this.rect.collideRect(entity.rect)) {
                if (entity.type === 'platform' && (this.rect.bottom < entity.rect.bottom + 5 + (3 * MONKEY_GRAVITY))) {
                    if (!onGround || entity.rect.bottom > onGround.rect.bottom) {
                        onGround = entity;
                    }
                }
            }
        }, this);
        return onGround;
    },

    jump: function() {
        if (this.isJumping === false && this.falling === false && this.canJump === true) {
            this.speed.y = -MONKEY_JUMP;
            this.isJumping = true;
            this.ground = null;
            this.canJump = true;
        }
    },

    moveRight: function() {
        this.speed.x = MONKEY_SPEED / 10;
        this.lookingRight = true;
    },

    moveLeft: function() {
        this.speed.x = -MONKEY_SPEED / 10;
        this.lookingRight = false;
    },

    stop: function() {
        this.speed.x = 0;
    },

    offGround: function() {
        return (this.isJumping || this.falling);
    },

    update: function(dt) {
        this.image = this.anim.update(dt);

        this.checkCollisions();

        if (this.lookingRight) {
            this.image = gamejs.transform.flip(this.image, true);
        }

        if (this.offGround()) {
            this.accel.y = MONKEY_GRAVITY;
        }

        if (!this.onGround()) {
            if (this.speed.y <= 0) {
                this.falling = true;
                this.isJumping = false;
            }
        }

        if (!this.isJumping && this.falling) {
            this.ground = this.onGround();
        }

        if (!this.ground){
            
        } else if (this.isJumping === false){
            if (this.rect.bottom <= this.ground.rect.top + 5) {
                this.land(this.ground);
            }
        }

        this.speed.x += this.accel.x;
        this.speed.y += this.accel.y;

        if (this.speed.y > this.terminalVelocity) {
            this.speed.y = this.terminalVelocity;
        }

        this.move(this.speed.x, this.speed.y);

    }
});

var Collectible = Entity.extend({
    initialize: function(options) {
        this.type = 'collectible';
        this.spriteSheet = options.spriteSheet;
        this.anim = new animate.Animation(this.spriteSheet, "static", {static:
            {
                frames: _.range(0,15), rate: 15, loop: true
            }});
        this.image = this.anim.update(0);
        this.anim.setFrame(0);
        this.speed = {x: 0, y: 0};
        this.accel = {x: 0, y: 0};
        this.scene = options.scene;

        if (this.scene) {
            this.scene.pushEntity(this);
        }
    },

    update: function(dt) {
        this.image = this.anim.update(dt);
    }
});

var Platform = Entity.extend({
    initialize: function(options) {
        this.type = 'platform';
    },

    draw: function(display) {
        if (this.image) {
            Platform.super_.prototype.draw.apply(this, arguments);
        } else {
            gamejs.draw.rect(display, '#ff0000', this.rect);
        }
    }
});


var Game = exports.Game = function () {
    
    this.cont = new GameController();
    
    this.paused = false;
    this.initialize();
};

Game.prototype.lose = function() {
    this.initialize();
};

Game.prototype.win = function() {

};
 
Game.prototype.initialize = function() {
    var game = this;

    this.scene = new Scene({
        width:450,
        height:300,
        pixelScale: PIXEL_SCALE,
        image: conf.Images.bg
    });

    this.scene.score = 0;
    this.font = new gamejs.font.Font('80px Arial');
    this.scoreIcon = gamejs.image.load(conf.Images.banana_icon);
    this.scoreIcon = gamejs.transform.scale(this.scoreIcon, [66, 103]);
    this.scoreText = this.font.render(this.scene.score, "#ff0000");

    var monkey = new Monkey({
        x:20,
        y:180,
        width:80,
        height:70,
        scene: this.scene,
        spriteSheet: new animate.SpriteSheet(
            gamejs.image.load(conf.Images.monkey),
            80,
            70)
    });

    var banana = new Collectible({
        width: 33,
        height: 53,
        x: 190,
        y: 145,
        scene: this.scene,
        spriteSheet: new animate.SpriteSheet(
            gamejs.image.load(conf.Images.banana),
            33,
            53)
    });
    var banana = new Collectible({
        width: 33,
        height: 53,
        x: 390,
        y: 160,
        scene: this.scene,
        spriteSheet: new animate.SpriteSheet(
            gamejs.image.load(conf.Images.banana),
            33,
            53)
    });
    var banana = new Collectible({
        width: 33,
        height: 53,
        x: 30,
        y: 40,
        scene: this.scene,
        spriteSheet: new animate.SpriteSheet(
            gamejs.image.load(conf.Images.banana),
            33,
            53)
    });
    var banana = new Collectible({
        width: 33,
        height: 53,
        x: 360,
        y: 40,
        scene: this.scene,
        spriteSheet: new animate.SpriteSheet(
            gamejs.image.load(conf.Images.banana),
            33,
            53)
    });

    var platform1 = new Platform({
        x: 20,
        y: 260,
        width: 70,
        height: 10
    });

    var platform2 = new Platform({
        x: 160,
        y: 200,
        width: 70,
        height: 10
    });

    var platform3 = new Platform({
        x: 390,
        y: 220,
        width: 40,
        height: 10
    });

    var platform4 = new Platform({
        x: 20,
        y: 100,
        width: 60,
        height: 10
    });

    var platform5 = new Platform({
        x: 80,
        y: 150,
        width: 60,
        height: 10
    });
    var platform6 = new Platform({
        x: 150,
        y: 80,
        width: 100,
        height: 10
    });

    var platform7 = new Platform({
        x: 360,
        y: 100,
        width: 30,
        height: 10
    });


    var emitter = new Emitter({x: 100, y: 100}, {
        image: conf.Images.particle,
        rate: 20,
        particleSpeed: 10
    });

    this.scene.pushEntity(platform1);
    this.scene.pushEntity(platform2);
    this.scene.pushEntity(platform3);
    this.scene.pushEntity(platform4);
    this.scene.pushEntity(platform5);
    this.scene.pushEntity(platform6);
    this.scene.pushEntity(platform7);
    //this.scene.pushThing(emitter);

    this.controlMapDown = {
        left: function () {
            monkey.moveLeft();
        },
        up: function () {
            monkey.jump();
        },
        right: function () {
            monkey.moveRight();
        },
        down: function () {
        },
        action: function() {
            game.lose();
        },
        mousePos: function(pos) {
        },
        menu: function() {
            // MENU
        },
        cancel: function() {
        }
    };

    this.controlMapUp = {
        left: function() {
            monkey.stop();
        },

        right: function() {
            monkey.stop();
        },

        up: function() {
            monkey.canJump = true;
        }
    }

};

Game.prototype.draw = function(surface) {
    this.scene.draw(surface);
    surface.blit(this.scoreIcon, [700, 480]);
    surface.blit(this.scoreText, [775, 480]);
};

Game.prototype.event = function(ev) {
    
    var key = this.cont.handle(ev);

    if (key) {
        if (key.action == 'keyDown') {
            this.controlMapDown[key.label]();
        }
        if (key.action == 'keyUp') {
            this.controlMapUp[key.label]();
        }
        if (key.action == 'mouseMotion') {
            //this.scene.handleMouse([Math.floor(key.value[0]/PIXEL_SCALE), Math.floor(key.value[1]/PIXEL_SCALE)]);
        }
        if (key.action == 'mouseDown') {
            //console.log(key.value);
        }
    }
};


Game.prototype.update = function(dt) {
    if (dt > 1000 / 3) dt = 1000 / 3;
    this.scene.update(dt);
    this.scoreText = this.font.render('x ' + this.scene.score, "#ff0000");
};
