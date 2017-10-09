/**
 * Inicializar el juego y comenzar
 */
var game = new Game();

function init() {
	game.init();
}


/* Define un objeto para mantener todas nuestras imagenes en el juego, 
de esta manera las imagenes solo son creadas una sola vez.
Este tipo de objeto es conocido como singleton.
singleton (instancia unica): Garantiza que una clase tenga una sola instancia 
y proporciona un punto de acceso global a ella.*/
var imageRepository = new function() {
	// Define images
	//this.empty = null;
	this.background = new Image();
	this.spaceship = new Image();
	this.bullet = new Image();
	this.enemy = new Image();//Se agregan las imagenes para el enemigo y las balas enemigas
	this.enemyBullet = new Image();

	//Asegurarse de que todas las imagenes se han cargado antes de empezar el juego
	var numImages = 5;//tenemos 5 imagenes ahora
	var numLoaded = 0;
	function imageLoaded() {//funcion para las imagenes cargadas
		numLoaded++;
		if (numLoaded === numImages) {
			window.init();
		}
	}
	this.background.onload = function() {//fondo
		imageLoaded();
	}
	this.spaceship.onload = function() {//nave
		imageLoaded();
	}
	this.bullet.onload = function() {//balas
		imageLoaded();
	}
	this.enemy.onload = function() {//nave enemiga
		imageLoaded();
	}
	this.enemyBullet.onload = function() {//balas enemigas
		imageLoaded();
	}

	//Establecer las imagenes src
    //Establecemos la fuente de la imagen
	this.background.src = "imgs/bg.png";
	this.spaceship.src = "imgs/ship.png";
	this.bullet.src = "imgs/bullet.png";
	this.enemy.src = "imgs/enemy.png";
	this.enemyBullet.src = "imgs/bullet_enemy.png";
}


/*Creamos el objeto Drawable para dibujar, el cual sera la clase base para 
todos los objetos dibujables en el juego. Se definen variables por
default que todos los objetos hijo van a heredar, asi como las 
funciones por defecto*/
function Drawable() {//Este objeto es un objeto abstracto, el cual todos los objetos del juego lo van a heredar
	this.init = function(x, y, width, height) {
 //Variables por default		
		this.x = x;
		this.y = y;
		this.width = width;//como vamos a utilizar imagenes que no seran 
		this.height = height;//del tama;o del canvas, tenemos que definir alto y ancho de esas imagenes
	}

	this.speed = 0;
	this.canvasWidth = 0;
	this.canvasHeight = 0;
	this.collidableWith = "";
	this.isColliding = false;
	this.type = "";

//Se definen la funcion abstracta a implementar en los objetos hijo
	this.draw = function() {
	};
	this.move = function() {
	};
	this.isCollidableWith = function(object) {
		return (this.collidableWith === object.type);
	};
}


//Ahora que tenemos un objeto base, es tiempo de crear el objeto del background
/*Crea el objeto background el cual se convertira en un hijo del objeto Drawable.
el background es dibujado en el "background" canvas and y crea la ilusion movimiento*/ 
function Background() {
	this.speed = 1; //Redefine la velocidad del fondo para panoramizar

    //Implementamos la funcion abstracta
	this.draw = function() {
		// Pan background
		this.y += this.speed;
		//this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight);
		this.context.drawImage(imageRepository.background, this.x, this.y);

        //Dibuja otra imagen en el borde superior de la primera imagen
		this.context.drawImage(imageRepository.background, this.x, this.y - this.canvasHeight);

        //Si la imagen se desplazo por la pantalla, se restablece
		if (this.y >= this.canvasHeight)
			this.y = 0;
	};
}
//Establece el fondo para heredar propiedades de drawable
Background.prototype = new Drawable();


/**
 * Crea el objeto bala con el cual la nave dispara. Las balas son dibujadas en el 
 * canvas "main"
 */
function Bullet(object) {
	this.alive = false; //es verdadero si la bala esta actualmente en uso
	var self = object;
	/*
	//da los valores a la bala
	 */
	this.spawn = function(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.alive = true;
	};

	/*utiliza un rectangulo para borrar la bala y la mueve
	regresa true si la bala se movio fuera de la pantalla, indicando que
	la bala esta lista para ser limpiada por el pool, de otra manera
	dibuja la bala */
	this.draw = function() {
		this.context.clearRect(this.x-1, this.y-1, this.width+2, this.height+2);
		this.y -= this.speed;

		if (this.isColliding) {
			return true;
		}
		else if (self === "bullet" && this.y <= 0 - this.height) {
			return true;
		}
		else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
			return true;
		}
		else {
			if (self === "bullet") {
				this.context.drawImage(imageRepository.bullet, this.x, this.y);
			}
			else if (self === "enemyBullet") {
				this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
			}

			return false;
		}
	};

	/*
	//reestablece los valores de la bala
	 */
	this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.alive = false;
		this.isColliding = false;
	};
}
Bullet.prototype = new Drawable();


/**
 * QuadTree object.
 *
 * The quadrant indexes are numbered as below:
 *     |
 *  1  |  0
 * ----+----
 *  2  |  3
 *     |
 */
function QuadTree(boundBox, lvl) {
	var maxObjects = 10;
	this.bounds = boundBox || {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};
	var objects = [];
	this.nodes = [];
	var level = lvl || 0;
	var maxLevels = 5;

	/*
	 *limpia el cuadrante y todos los nodos de los objetos
	 */
	this.clear = function() {
		objects = [];

		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].clear();
		}

		this.nodes = [];
	};

		/*
obtiene todos los objetos en el cuadrante	 */
	this.getAllObjects = function(returnedObjects) {
		for (var i = 0; i < this.nodes.length; i++) {
			this.nodes[i].getAllObjects(returnedObjects);
		}

		for (var i = 0, len = objects.length; i < len; i++) {
			returnedObjects.push(objects[i]);
		}

		return returnedObjects;
	};

	/*

	Devuelve todos los objetos con los que el objeto podría colisionar	 */
	this.findObjects = function(returnedObjects, obj) {
		if (typeof obj === "undefined") {
			console.log("UNDEFINED OBJECT");
			return;
		}

		var index = this.getIndex(obj);
		if (index != -1 && this.nodes.length) {
			this.nodes[index].findObjects(returnedObjects, obj);
		}

		for (var i = 0, len = objects.length; i < len; i++) {
			returnedObjects.push(objects[i]);
		}

		return returnedObjects;
	};

	/*
	 * Insert the object into the quadTree. If the tree
	 * excedes the capacity, it will split and add all
	 * objects to their corresponding nodes.
	 */
	this.insert = function(obj) {
		if (typeof obj === "undefined") {
			return;
		}

		if (obj instanceof Array) {
			for (var i = 0, len = obj.length; i < len; i++) {
				this.insert(obj[i]);
			}

			return;
		}

		if (this.nodes.length) {
			var index = this.getIndex(obj);
			// Sólo agregue el objeto a un subnodo si puede caber completamente dentro de uno
			if (index != -1) {
				this.nodes[index].insert(obj);

				return;
			}
		}

		objects.push(obj);

		// Evitar la división infinita
		if (objects.length > maxObjects && level < maxLevels) {
			if (this.nodes[0] == null) {
				this.split();
			}

			var i = 0;
			while (i < objects.length) {

				var index = this.getIndex(objects[i]);
				if (index != -1) {
					this.nodes[index].insert((objects.splice(i,1))[0]);
				}
				else {
					i++;
				}
			}
		}
	};

	/*
	 * Determine a qué nodo pertenece el objeto. -1 medios
* el objeto no puede encajar completamente dentro de un nodo y es parte
* del nodo actual
	 */
	this.getIndex = function(obj) {

		var index = -1;
		var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
		var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

		// El objeto puede caber completamente dentro del cuadrante superior
		var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
		// El objeto puede caber completamente dentro del cuadrante inferior
		var bottomQuadrant = (obj.y > horizontalMidpoint);

		// El objeto puede caber completamente dentro de los cuadrantes izquierdos
		if (obj.x < verticalMidpoint &&
				obj.x + obj.width < verticalMidpoint) {
			if (topQuadrant) {
				index = 1;
			}
			else if (bottomQuadrant) {
				index = 2;
			}
		}
		// Objeto puede arreglar completamente dentro de los cuadrantes derechos
		else if (obj.x > verticalMidpoint) {
			if (topQuadrant) {
				index = 0;
			}
			else if (bottomQuadrant) {
				index = 3;
			}
		}

		return index;
	};

	/*
	 * Divide el nodo en 4 subnodos
	 */
	this.split = function() {
		// Bitwise or [html5rocks]
		var subWidth = (this.bounds.width / 2) | 0;
		var subHeight = (this.bounds.height / 2) | 0;

		this.nodes[0] = new QuadTree({
			x: this.bounds.x + subWidth,
			y: this.bounds.y,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[1] = new QuadTree({
			x: this.bounds.x,
			y: this.bounds.y,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[2] = new QuadTree({
			x: this.bounds.x,
			y: this.bounds.y + subHeight,
			width: subWidth,
			height: subHeight
		}, level+1);
		this.nodes[3] = new QuadTree({
			x: this.bounds.x + subWidth,
			y: this.bounds.y + subHeight,
			width: subWidth,
			height: subHeight
		}, level+1);
	};
}


/**
 * Pool trabaja de esta manera:
 * ->cuando el pool es inicializado, llena un arreglo con los objetos bala
 * -> cuando el pool necesita crear un nuevo objeto para usarlo, echa un vistazo
 * al ultimo dato en el arreglo y checa si esta actualmente en uso o no, 
 * si esta en uso, el pool esta lleno, si no, el pool guarda el ultimo elemento 
 * del arreglo y lo toma del final para lanzarlo al inicio del arreglo.
 * Esto hace que el pool tenga objetos libres atras y objetos usados en el frente.
 * -> cuando el pool anima sus objetos, checa si el objeto esta en uso
 * (no neesita dibujar objetos que no se utilizan) y si lo esta, lo dibuja.
 * si la funcion draw() regresa un true, el objeto esta listo para ser limpiado
 * entonces "limpia" el objeto y usa el arreglo de la funcion splice() para remover
 * el elemento del arreglo y lo manda hacia atras.
 */
function Pool(maxSize) {
	var size = maxSize; //Max balas permitidas en el pool
	var pool = [];//se guardan en un arreglo

	this.getPool = function() {
		var obj = [];
		for (var i = 0; i < size; i++) {
			if (pool[i].alive) {
				obj.push(pool[i]);
			}
		}
		return obj;
	}

	/*
	llena el arreglo con los objetos dados
	 */
	this.init = function(object) {
		if (object == "bullet") {
			for (var i = 0; i < size; i++) {
				// Inicializamos objeto
				var bullet = new Bullet("bullet");
				bullet.init(0,0, imageRepository.bullet.width,
										imageRepository.bullet.height);
				bullet.collidableWith = "enemy";
				bullet.type = "bullet";
				pool[i] = bullet;
			}
		}
		else if (object == "enemy") {
			for (var i = 0; i < size; i++) {
				var enemy = new Enemy();
				enemy.init(0,0, imageRepository.enemy.width,
									 imageRepository.enemy.height);
				pool[i] = enemy;
			}
		}
		else if (object == "enemyBullet") {
			for (var i = 0; i < size; i++) {
				var bullet = new Bullet("enemyBullet");
				bullet.init(0,0, imageRepository.enemyBullet.width,
										imageRepository.enemyBullet.height);
				bullet.collidableWith = "ship";
				bullet.type = "enemyBullet";
				pool[i] = bullet;
			}
		}
	};

	//toma el ultimo articulo en la lista y lo inicializa
	//y luego lo pone al principio del arreglo
	this.get = function(x, y, speed) {
		if(!pool[size - 1].alive) {
			pool[size - 1].spawn(x, y, speed);
			pool.unshift(pool.pop());
		}
	};

	/*Usado para que la nave sea capaz de lanzar dos balas a la vez
	solo si la funcion get() es usada dos veces, la nave es capaz de disparar
	y solo lanza una bala en vez de 2*/ 
	this.getTwo = function(x1, y1, speed1, x2, y2, speed2) {
		if(!pool[size - 1].alive && !pool[size - 2].alive) {
			this.get(x1, y1, speed1);
			this.get(x2, y2, speed2);
		}
	};

	/*Dibuja cualquier bala en uso, si alguna balla se sale de la pantalla
	la limpia y la manda al principio del arreglo */
	this.animate = function() {
		for (var i = 0; i < size; i++) {
			//solo dibuja hasta que encontramos una bala que no esta viva
			if (pool[i].alive) {
				if (pool[i].draw()) {
					pool[i].clear();
					pool.push((pool.splice(i,1))[0]);
				}
			}
			else
				break;
		}
	};
}


/*C	reamos el objeto ship(nave) el cual va a manejar el jugador
la nave es dibujada en el canvas "ship" y usa rectangulos sucios para moverse
al rededor de la pantalla */
function Ship() {
	this.speed = 3;
	this.bulletPool = new Pool(30);
	var fireRate = 15;
	var counter = 0;
	this.collidableWith = "enemyBullet";
	this.type = "ship";

	this.init = function(x, y, width, height) {
		//Variables por Default
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.alive = true;
		this.isColliding = false;
		this.bulletPool.init("bullet");
	}

	this.draw = function() {
		this.context.drawImage(imageRepository.spaceship, this.x, this.y);
	};
	this.move = function() {
		counter++;
		//determina si la accion es mover
		if (KEY_STATUS.left || KEY_STATUS.right ||
				KEY_STATUS.down || KEY_STATUS.up) {
			//la navese movio, entonces se borra la imagen actual para que pueda
			//ser redibujada en su nueva locacion
			this.context.clearRect(this.x, this.y, this.width, this.height);

			//actualiza x y y de acuerdo con la direcion de movimiento
			//y redibuja la nave, cambia the else if's to id=f statements
			//para tener movimientos diagonales
			if (KEY_STATUS.left) {
				this.x -= this.speed
				if (this.x <= 0) //mantiene al jugador dentro de la pantalla
					this.x = 0;
			} else if (KEY_STATUS.right) {
				this.x += this.speed
				if (this.x >= this.canvasWidth - this.width)
					this.x = this.canvasWidth - this.width;
			} else if (KEY_STATUS.up) {
				this.y -= this.speed
				if (this.y <= this.canvasHeight/4*3)
					this.y = this.canvasHeight/4*3;
			} else if (KEY_STATUS.down) {
				this.y += this.speed
				if (this.y >= this.canvasHeight - this.height)
					this.y = this.canvasHeight - this.height;
			}
		}

			//finalizando el redibujado de la nave
		if (!this.isColliding) {
			this.draw();
		}
		else {
			this.alive = false;
			game.gameOver();
		}

		if (KEY_STATUS.space && counter >= fireRate && !this.isColliding) {
			this.fire();
			counter = 0;
		}
	};

	/*
	//dispara 2 balas
	 */
	this.fire = function() {
		this.bulletPool.getTwo(this.x+6, this.y, 3,
		                       this.x+33, this.y, 3);
		game.laser.get();
	};
}
Ship.prototype = new Drawable();


/**
 *Crea el objeto de la nave enemiga. 
 */
function Enemy() {
	var percentFire = .01;
	var chance = 0;
	this.alive = false;
	this.collidableWith = "bullet";
	this.type = "enemy";

	/*
	 * Establece los valores del enemigo
	 */
	this.spawn = function(x, y, speed) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.speedX = 0;
		this.speedY = speed;
		this.alive = true;
		this.leftEdge = this.x - 90;
		this.rightEdge = this.x + 90;
		this.bottomEdge = this.y + 140;
	};

	/*
	 *Mueve al enemigo
	 */
	this.draw = function() {
		this.context.clearRect(this.x-1, this.y, this.width+1, this.height);
		this.x += this.speedX;
		this.y += this.speedY;
		if (this.x <= this.leftEdge) {
			this.speedX = this.speed;
		}
		else if (this.x >= this.rightEdge + this.width) {
			this.speedX = -this.speed;
		}
		else if (this.y >= this.bottomEdge) {
			this.speed = 1.5;
			this.speedY = 0;
			this.y -= 5;
			this.speedX = -this.speed;
		}

		if (!this.isColliding) {
			this.context.drawImage(imageRepository.enemy, this.x, this.y);

		// El enemigo tiene chance de disparar todo el tiempo
			chance = Math.floor(Math.random()*101);
			if (chance/100 < percentFire) {
				this.fire();
			}

			return false;
		}
		else {
			game.playerScore += 10;
			game.explosion.get();
			return true;
		}
	};

	/*
	 * Dispara una bala
	 */
	this.fire = function() {
		game.enemyBulletPool.get(this.x+this.width/2, this.y+this.height, -2.5);
	};

	/*
	 * Reestablece los valores del enemigo
	 */
	this.clear = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.speedX = 0;
		this.speedY = 0;
		this.alive = false;
		this.isColliding = false;
	};
}
Enemy.prototype = new Drawable();


 /*con la estructura basica del juego completo, es hora de crear el objeto final
que manejara el juego entero*/
//se crea el objeto Game, el cual tomara todos los objetos y datos para el juego.
function Game() {
	/*obtiene la informacion del canvas y context y actualiza todos los objetos del juego
    -regresa true si el canvas es soportado y falso si no, esto para parar
    la animacion de correr constantemente en navegadores mas viejos*/
	this.init = function() {
        //obtiene el elemento canvas
		this.bgCanvas = document.getElementById('background');
		this.shipCanvas = document.getElementById('ship');
		this.mainCanvas = document.getElementById('main');

		 //Testeo para saber si el canvas es soportado

		if (this.bgCanvas.getContext) {
			this.bgContext = this.bgCanvas.getContext('2d');
			this.shipContext = this.shipCanvas.getContext('2d');
			this.mainContext = this.mainCanvas.getContext('2d');

			//inicializa los ibjetos para contener la informacion de su context y canvas
			Background.prototype.context = this.bgContext;
			Background.prototype.canvasWidth = this.bgCanvas.width;
			Background.prototype.canvasHeight = this.bgCanvas.height;

			Ship.prototype.context = this.shipContext;
			Ship.prototype.canvasWidth = this.shipCanvas.width;
			Ship.prototype.canvasHeight = this.shipCanvas.height;

			Bullet.prototype.context = this.mainContext;
			Bullet.prototype.canvasWidth = this.mainCanvas.width;
			Bullet.prototype.canvasHeight = this.mainCanvas.height;

			Enemy.prototype.context = this.mainContext;
			Enemy.prototype.canvasWidth = this.mainCanvas.width;
			Enemy.prototype.canvasHeight = this.mainCanvas.height;

            //inicializa el objeto background
			this.background = new Background();
			this.background.init(0,0); //Establece el punto de inicio de dibujo como (0,0)

			//Inicializar el objeto ship(nave)
			this.ship = new Ship();
			// establecer la nave para empezar cerca del medio del canvas
			this.shipStartX = this.shipCanvas.width/2 - imageRepository.spaceship.width;
			this.shipStartY = this.shipCanvas.height/4*3 + imageRepository.spaceship.height*2;
			this.ship.init(this.shipStartX, this.shipStartY,
			               imageRepository.spaceship.width, imageRepository.spaceship.height);

			// Inicializa el objeto pool del enemigo
			this.enemyPool = new Pool(30);
			this.enemyPool.init("enemy");
			this.spawnWave();

			this.enemyBulletPool = new Pool(50);
			this.enemyBulletPool.init("enemyBullet");

			// Start QuadTree
			this.quadTree = new QuadTree({x:0,y:0,width:this.mainCanvas.width,height:this.mainCanvas.height});

			this.playerScore = 0;

			// Archivos de audio
			this.laser = new SoundPool(10);
			this.laser.init("laser");

			this.explosion = new SoundPool(20);
			this.explosion.init("explosion");

			this.backgroundAudio = new Audio("sounds/kick_shock.wav");
			this.backgroundAudio.loop = true;
			this.backgroundAudio.volume = .25;
			this.backgroundAudio.load();

			this.gameOverAudio = new Audio("sounds/game_over.wav");
			this.gameOverAudio.loop = true;
			this.gameOverAudio.volume = .25;
			this.gameOverAudio.load();

			this.checkAudio = window.setInterval(function(){checkReadyState()},1000);
		}
	};

	// Genera una nueva ola de enemigos
	this.spawnWave = function() {
		var height = imageRepository.enemy.height;
		var width = imageRepository.enemy.width;
		var x = 100;
		var y = -height;
		var spacer = y * 1.5;
		for (var i = 1; i <= 18; i++) {
			this.enemyPool.get(x,y,2);
			x += width + 25;
			if (i % 6 == 0) {
				x = 100;
				y += spacer
			}
		}
	}

    //comienza el bucle de animacion
	this.start = function() {
		this.ship.draw();
		this.backgroundAudio.play();
		animate();
	};

	// Reinicia el juego
	this.restart = function() {
		this.gameOverAudio.pause();

		document.getElementById('game-over').style.display = "none";
		this.bgContext.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
		this.shipContext.clearRect(0, 0, this.shipCanvas.width, this.shipCanvas.height);
		this.mainContext.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

		this.quadTree.clear();

		this.background.init(0,0);
		this.ship.init(this.shipStartX, this.shipStartY,
		               imageRepository.spaceship.width, imageRepository.spaceship.height);

		this.enemyPool.init("enemy");
		this.spawnWave();
		this.enemyBulletPool.init("enemyBullet");

		this.playerScore = 0;

		this.backgroundAudio.currentTime = 0;
		this.backgroundAudio.play();

		this.start();
	};

	// Game over
	this.gameOver = function() {
		this.backgroundAudio.pause();
		this.gameOverAudio.currentTime = 0;
		this.gameOverAudio.play();
		document.getElementById('game-over').style.display = "block";
	};
}

/**
 * Se asegura de que el sonido del juego se ha cargado antes de iniciar el juego
 */
function checkReadyState() {
	if (game.gameOverAudio.readyState === 4 && game.backgroundAudio.readyState === 4) {
		window.clearInterval(game.checkAudio);
		document.getElementById('loading').style.display = "none";
		game.start();
	}
}


/**
 * A sound pool to use for the sound effects
 */
function SoundPool(maxSize) {
	var size = maxSize; // Max balas peromitidas en el pool
	var pool = [];
	this.pool = pool;
	var currSound = 0;

	/*
	 * llena el arreglo con los objetos dados
	 */
	this.init = function(object) {
		if (object == "laser") {
			for (var i = 0; i < size; i++) {
				// Inicializa el objeto
				laser = new Audio("sounds/laser.wav");
				laser.volume = .12;
				laser.load();
				pool[i] = laser;
			}
		}
		else if (object == "explosion") {
			for (var i = 0; i < size; i++) {
				var explosion = new Audio("sounds/explosion.wav");
				explosion.volume = .1;
				explosion.load();
				pool[i] = explosion;
			}
		}
	};

	/*
	 * Reproduce un sonido
	 */
	this.get = function() {
		if(pool[currSound].currentTime == 0 || pool[currSound].ended) {
			pool[currSound].play();
		}
		currSound = (currSound + 1) % size;
	};
}


/**
*El bucle de animacion, llama a requestAnimationFrame shim para optimizar el 
bucle del juego y dibuja todos los objetos del juego.
Esta funcion debe ser una funcion global y no puede estar dentro de un objeto.
 */
function animate() {
	document.getElementById('score').innerHTML = game.playerScore;

	// inserta objetos en el quadtree
	game.quadTree.clear();
	game.quadTree.insert(game.ship);
	game.quadTree.insert(game.ship.bulletPool.getPool());
	game.quadTree.insert(game.enemyPool.getPool());
	game.quadTree.insert(game.enemyBulletPool.getPool());

	detectCollision();

	// no mas enemigos
	if (game.enemyPool.getPool().length === 0) {
		game.spawnWave();
	}

	// Animate game objects
	if (game.ship.alive) {
		requestAnimFrame( animate );

		game.background.draw();
		game.ship.move();
		game.ship.bulletPool.animate();
		game.enemyPool.animate();
		game.enemyBulletPool.animate();
	}
}

function detectCollision() {
	var objects = [];
	game.quadTree.getAllObjects(objects);

	for (var x = 0, len = objects.length; x < len; x++) {
		game.quadTree.findObjects(obj = [], objects[x]);

		for (y = 0, length = obj.length; y < length; y++) {

			// ALGORITMO DE DETECCION DE COLISION
			if (objects[x].collidableWith === obj[y].type &&
				(objects[x].x < obj[y].x + obj[y].width &&
			     objects[x].x + objects[x].width > obj[y].x &&
				 objects[x].y < obj[y].y + obj[y].height &&
				 objects[x].y + objects[x].height > obj[y].y)) {
				objects[x].isColliding = true;
				obj[y].isColliding = true;
			}
		}
	}
};


// los codigos clave que se asignaran cuando un usuario presione un boton

KEY_CODES = {
  32: 'space',
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down',
}

//se crea el arreglo para los KEY_CODES y se le asignan sus valores
//checando true/false es la manera mas rapida de checar el 
//status de una tecla presionada y cual fue presionada y en que direccion
KEY_STATUS = {};
for (code in KEY_CODES) {
  KEY_STATUS[KEY_CODES[code]] = false;
}
/* configura el documento para escuchar eventos onekeydown(cuando 
	alguna tecla  este presionada) cuando una tecla es presionada, le da 
	la direccion apropiada para saber que tecla fue*/
document.onkeydown = function(e) {
	// Firefox and opera use charCode instead of keyCode to
	// return which key was pressed.
	var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
		e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = true;
  }
}
/* configura el documento para ecuchar eventos onekeyup
(cuando una tecla es liberada) cuandouna tecla es liberada, asigna 
la direccion apropiada a falso para darnos a saber cual tecla fue*/
document.onkeyup = function(e) {
  var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
  if (KEY_CODES[keyCode]) {
    e.preventDefault();
    KEY_STATUS[KEY_CODES[keyCode]] = false;
  }
}

window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame       ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame    ||
			window.oRequestAnimationFrame      ||
			window.msRequestAnimationFrame     ||
			function( callback,  element){
				window.setTimeout(callback, 1000 / 60);
			};
})();