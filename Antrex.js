// ============================================================
// ANTREX.JS
// Enemigo resistente de media distancia que libera 3 crías
// ============================================================

const ANTREX_PATH = "Sprites/Antrex/";


// ============================================================
// CARGAR SPRITES
// ============================================================

function loadAntrexSprite(fileName) {

    const image = new Image();

    image.src =
        ANTREX_PATH +
        fileName;

    return image;
}


const antrexSpawnSprite =
    loadAntrexSprite(
        "Antrex-aparecer.png"
    );


const antrexIdleSprite =
    loadAntrexSprite(
        "Antrex-reposo.png"
    );


const antrexWalkSprite =
    loadAntrexSprite(
        "Antrex-caminar.png"
    );


const antrexAttackSprite =
    loadAntrexSprite(
        "Antrex-atacar.png"
    );


const antrexDamageSprite =
    loadAntrexSprite(
        "Antrex-daño.png"
    );


const antrexDeathSprite =
    loadAntrexSprite(
        "Antrex-morir.png"
    );


const antrexChildWalkSprite =
    loadAntrexSprite(
        "Antrex-cria-caminar.png"
    );


const antrexChildAttackSprite =
    loadAntrexSprite(
        "Antrex-cria-atacar.png"
    );


const antrexFrameCache =
    new Map();


// ============================================================
// OBTENER UN CUADRO DEL SPRITE
// ============================================================

function getAntrexFrame(
    sprite,
    frame,
    columns
) {

    if (
        !sprite.complete ||
        !sprite.naturalWidth ||
        !sprite.naturalHeight
    ) {
        return null;
    }


    const safeFrame =
        Math.max(
            0,
            Math.min(
                columns - 1,
                frame
            )
        );


    const key =
        `${sprite.src}-${safeFrame}-${columns}`;


    if (
        antrexFrameCache.has(key)
    ) {

        return antrexFrameCache.get(
            key
        );
    }


    const frameWidth =
        sprite.naturalWidth /
        columns;


    const frameCanvas =
        document.createElement(
            "canvas"
        );


    frameCanvas.width =
        Math.round(
            frameWidth
        );


    frameCanvas.height =
        sprite.naturalHeight;


    const frameContext =
        frameCanvas.getContext(
            "2d"
        );


    frameContext.drawImage(

        sprite,

        safeFrame *
        frameWidth,

        0,

        frameWidth,

        sprite.naturalHeight,

        0,

        0,

        frameCanvas.width,

        frameCanvas.height
    );


    antrexFrameCache.set(
        key,
        frameCanvas
    );


    return frameCanvas;
}


// ============================================================
// CUADROS CENTRADOS DE CAMINATA DE LAS CRÍAS
// ============================================================

const antrexChildWalkFrames = [

    {
        x: 20,
        y: 22,
        width: 58,
        height: 88
    },

    {
        x: 80,
        y: 22,
        width: 58,
        height: 88
    },

    {
        x: 137,
        y: 22,
        width: 58,
        height: 88
    },

    {
        x: 200,
        y: 18,
        width: 58,
        height: 92
    },

    {
        x: 266,
        y: 14,
        width: 60,
        height: 98
    },

    {
        x: 335,
        y: 20,
        width: 60,
        height: 90
    }
];


// ============================================================
// OBTENER CUADRO CENTRADO DE LA CRÍA
// ============================================================

function getAntrexChildWalkFrame(frame) {

    if (
        !antrexChildWalkSprite.complete ||
        !antrexChildWalkSprite.naturalWidth ||
        !antrexChildWalkSprite.naturalHeight
    ) {

        return null;
    }


    const safeFrame =
        Math.max(
            0,
            Math.min(
                5,
                frame
            )
        );


    const key =
        `antrex-child-walk-${safeFrame}`;


    if (
        antrexFrameCache.has(key)
    ) {

        return antrexFrameCache.get(
            key
        );
    }


    const source =
        antrexChildWalkFrames[
            safeFrame
        ];


    const frameCanvas =
        document.createElement(
            "canvas"
        );


    // Todos los cuadros tendrán
    // exactamente el mismo tamaño
    frameCanvas.width = 64;
    frameCanvas.height = 100;


    const frameContext =
        frameCanvas.getContext(
            "2d"
        );


    frameContext.drawImage(

        antrexChildWalkSprite,

        source.x,
        source.y,

        source.width,
        source.height,

        2,
        4,

        60,
        92
    );


    antrexFrameCache.set(
        key,
        frameCanvas
    );


    return frameCanvas;
}


// ============================================================
// CLASE PRINCIPAL ANTREX
// ============================================================

class Antrex extends Enemy {

    constructor(x, y) {

        super(x, y);


        // TAMAÑO
        this.width = 68;
        this.height = 68;


        // ESTADÍSTICAS
        this.speed = 1.8;

        this.health = 240;
        this.maxHealth = 240;

        this.damage = 16;


        // ESTADO
        this.state = "SPAWN";


        // ROTACIÓN
        this.directionAngle = 0;

        this.spriteDirectionOffset =
            -Math.PI / 2;


        // DISTANCIAS
        this.preferredDistance = 230;

        this.attackRange = 370;


        // ATAQUE
        this.attackCooldown = 2100;

        this.attackDuration = 720;

        this.projectileReleased = false;

        this.nextAttackTime =
            performance.now() +
            1200;


        // DURACIONES
        this.spawnDuration = 720;

        this.hitDuration = 520;

        this.deathDuration = 1000;


        // TIEMPOS
        this.spawnStartedAt =
            performance.now();

        this.walkStartedAt =
            performance.now();

        this.attackStartedAt =
            -Infinity;


        // POSICIÓN BLOQUEADA
        this.lockedX = x;

        this.lockedY = y;

        this.lockedAngle = 0;


        // CONTROL DE CRÍAS
        this.childrenReleased = false;
    }


    // ========================================================
    // ACTUALIZAR ANTREX
    // ========================================================

    update(player) {

        const now =
            performance.now();


        if (!this.alive) {
            return;
        }


        // ====================================================
        // MUERTE
        // ====================================================

        if (this.isDying) {

            // Antrex permanece quieto
            this.keepAnimationLocked();


            // Primero termina completamente
            // la animación de muerte
            if (
                now -
                this.deathStartedAt >=
                this.deathDuration
            ) {

                // Después aparecen las crías
                if (
                    !this.childrenReleased
                ) {

                    this.releaseChildren();
                }


                // Finalmente desaparece Antrex
                this.alive = false;
            }


            return;
        }


        // ====================================================
        // JUGADOR MUERTO
        // ====================================================

        if (
            !player ||
            !player.alive
        ) {

            this.state =
                "SEARCH";

            return;
        }


        // ====================================================
        // RECIBIENDO DAÑO
        // ====================================================

        if (
            now -
            this.hitStartedAt <
            this.hitDuration
        ) {

            this.keepAnimationLocked();

            return;
        }


        const dx =
            player.x -
            this.x;


        const dy =
            player.y -
            this.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        // Girar hacia el jugador
        if (
            distance > 0 &&
            this.state !==
            "ATTACK"
        ) {

            this.directionAngle =
                Math.atan2(
                    dy,
                    dx
                );
        }


        // ====================================================
        // APARICIÓN
        // ====================================================

        if (
            this.state ===
            "SPAWN"
        ) {

            if (
                now -
                this.spawnStartedAt >=
                this.spawnDuration
            ) {

                this.state =
                    "CHASE";


                this.walkStartedAt =
                    now;
            }


            return;
        }


        // ====================================================
        // BÚSQUEDA
        // ====================================================

        if (
            this.state ===
            "SEARCH"
        ) {

            this.state =
                "CHASE";


            this.walkStartedAt =
                now;
        }


        // ====================================================
        // ATAQUE
        // ====================================================

        if (
            this.state ===
            "ATTACK"
        ) {

            this.updateAttack(
                player,
                now
            );


            return;
        }


        // Comenzar ataque
        if (
            distance <=
            this.attackRange

            &&

            now >=
            this.nextAttackTime
        ) {

            this.startAttack(
                now
            );


            return;
        }


        // Movimiento a media distancia
        this.moveAtMediumDistance(

            dx,

            dy,

            distance
        );


        this.keepInsideCanvas();
    }


    // ========================================================
    // MOVIMIENTO A MEDIA DISTANCIA
    // ========================================================

    moveAtMediumDistance(
        dx,
        dy,
        distance
    ) {

        if (distance <= 0) {
            return;
        }


        const directionX =
            dx /
            distance;


        const directionY =
            dy /
            distance;


        // Acercarse
        if (
            distance >
            this.preferredDistance +
            35
        ) {

            this.x +=

                directionX *

                this.speed;


            this.y +=

                directionY *

                this.speed;
        }


        // Alejarse
        else if (
            distance <
            this.preferredDistance -
            35
        ) {

            this.x -=

                directionX *

                this.speed *

                0.8;


            this.y -=

                directionY *

                this.speed *

                0.8;
        }


        // Moverse lateralmente
        else {

            this.x +=

                -directionY *

                this.speed *

                0.55;


            this.y +=

                directionX *

                this.speed *

                0.55;
        }
    }


    // ========================================================
    // INICIAR ATAQUE
    // ========================================================

    startAttack(now) {

        this.state =
            "ATTACK";


        this.attackStartedAt =
            now;


        this.projectileReleased =
            false;


        // Mantener toda la transición
        // en el mismo lugar
        this.lockAnimation();
    }


    // ========================================================
    // ACTUALIZAR ATAQUE
    // ========================================================

    updateAttack(
        player,
        now
    ) {

        this.keepAnimationLocked();


        const elapsed =
            now -
            this.attackStartedAt;


        const frameDuration =

            this.attackDuration /

            6;


        const attackFrame =

            Math.min(

                5,

                Math.floor(

                    elapsed /

                    frameDuration
                )
            );


        // Lanzar un proyectil
        // cuando llega al cuadro 3
        if (
            attackFrame >= 3 &&
            !this.projectileReleased
        ) {

            this.projectileReleased =
                true;


            this.shoot(
                player
            );
        }


        // Terminar la transición
        if (
            elapsed >=
            this.attackDuration
        ) {

            this.state =
                "CHASE";


            this.walkStartedAt =
                now;


            this.projectileReleased =
                false;


            this.nextAttackTime =

                now +

                this.attackCooldown;
        }
    }


    // ========================================================
    // DISPARAR
    // ========================================================

    shoot(player) {

        if (
            typeof projectiles ===
            "undefined"
        ) {

            return;
        }


        const angle =

            Math.atan2(

                player.y -
                this.y,

                player.x -
                this.x
            );


        const offset = 46;


        projectiles.push({

            x:

                this.x +

                Math.cos(angle) *

                offset,


            y:

                this.y +

                Math.sin(angle) *

                offset,


            radius: 10,

            speed: 5,

            angle:
                angle,

            damage:
                this.damage,

            enemyProjectile:
                true,

            antrexProjectile:
                true,

            color:
                "#ff28c8",

            spriteStartedAt:
                performance.now()
        });
    }


    // ========================================================
    // RECIBIR DAÑO
    // ========================================================

    takeDamage(amount) {

        if (
            !this.alive ||
            this.isDying
        ) {

            return;
        }


        this.health =

            Math.max(

                0,

                this.health -
                amount
            );


        this.hitStartedAt =
            performance.now();


        this.lockAnimation();


        if (
            this.health === 0
        ) {

            this.state =
                "DEAD";


            this.isDying =
                true;


            this.deathStartedAt =
                performance.now();


            this.childrenReleased =
                false;
        }
    }


    // ========================================================
    // LIBERAR LAS TRES CRÍAS
    // ========================================================

    releaseChildren() {

        // Impide que se creen nuevamente
        this.childrenReleased =
            true;


        if (
            typeof enemigos ===
            "undefined"
        ) {

            return;
        }


        // Separación de 120 grados
        const separation =
            Math.PI *
            2 /
            3;


        for (
            let index = 0;
            index < 3;
            index += 1
        ) {

            const angle =

                this.directionAngle +

                index *

                separation;


            enemigos.push(

                new AntrexCria(

                    this.x +

                    Math.cos(angle) *

                    34,


                    this.y +

                    Math.sin(angle) *

                    34
                )
            );
        }
    }


    // ========================================================
    // BLOQUEAR POSICIÓN
    // ========================================================

    lockAnimation() {

        this.lockedX =
            this.x;


        this.lockedY =
            this.y;


        this.lockedAngle =
            this.directionAngle;
    }


    keepAnimationLocked() {

        this.x =
            this.lockedX;


        this.y =
            this.lockedY;


        this.directionAngle =
            this.lockedAngle;
    }


    // ========================================================
    // LÍMITES
    // ========================================================

    keepInsideCanvas() {

        const halfWidth =
            this.width /
            2;


        const halfHeight =
            this.height /
            2;


        this.x =

            Math.max(

                halfWidth,

                Math.min(

                    canvas.width -
                    halfWidth,

                    this.x
                )
            );


        this.y =

            Math.max(

                halfHeight,

                Math.min(

                    canvas.height -
                    halfHeight,

                    this.y
                )
            );
    }


    // ========================================================
    // DIBUJAR ANTREX
    // ========================================================

    draw(ctx) {

        if (!this.alive) {
            return;
        }


        const now =
            performance.now();


        const isHit =

            now -
            this.hitStartedAt <

            this.hitDuration;


        // Caminata por defecto
        let sprite =
            antrexWalkSprite;


        let startedAt =
            this.walkStartedAt;


        let frameDuration =
            110;


        let repeat =
            true;


        // MUERTE
        if (this.isDying) {

            sprite =
                antrexDeathSprite;


            startedAt =
                this.deathStartedAt;


            frameDuration =

                this.deathDuration /

                6;


            repeat = false;
        }


        // DAÑO
        else if (isHit) {

            sprite =
                antrexDamageSprite;


            startedAt =
                this.hitStartedAt;


            frameDuration =

                this.hitDuration /

                6;


            repeat = false;
        }


        // ATAQUE
        else if (
            this.state ===
            "ATTACK"
        ) {

            sprite =
                antrexAttackSprite;


            startedAt =
                this.attackStartedAt;


            frameDuration =

                this.attackDuration /

                6;


            repeat = false;
        }


        // APARICIÓN
        else if (
            this.state ===
            "SPAWN"
        ) {

            sprite =
                antrexSpawnSprite;


            startedAt =
                this.spawnStartedAt;


            frameDuration =

                this.spawnDuration /

                6;


            repeat = false;
        }


        // REPOSO
        else if (
            this.state ===
            "SEARCH"
        ) {

            sprite =
                antrexIdleSprite;


            startedAt =
                this.walkStartedAt;


            frameDuration =
                130;
        }


        const elapsed =

            Math.max(

                0,

                now -
                startedAt
            );


        const rawFrame =

            Math.floor(

                elapsed /

                frameDuration
            );


        const frame =

            repeat

                ? rawFrame % 6

                : Math.min(
                    5,
                    rawFrame
                );


        this.drawAntrexSprite(

            ctx,

            sprite,

            frame,

            6,

            this.width *
            1.55,

            this.height *
            1.55,

            this.directionAngle +

            this.spriteDirectionOffset
        );


        if (!this.isDying) {

            this.drawHealthBar(

                ctx,

                68,

                7,

                18
            );
        }
    }


    // ========================================================
    // DIBUJAR UN CUADRO
    // ========================================================

    drawAntrexSprite(
        ctx,
        sprite,
        frame,
        columns,
        width,
        height,
        angle
    ) {

        const drawable =

            getAntrexFrame(

                sprite,

                frame,

                columns
            );


        if (!drawable) {

            ctx.fillStyle =
                "#ff28c8";


            ctx.beginPath();


            ctx.arc(

                this.x,

                this.y,

                this.width /
                2,

                0,

                Math.PI *
                2
            );


            ctx.fill();


            return;
        }


        ctx.save();


        ctx.translate(

            Math.round(
                this.x
            ),

            Math.round(
                this.y
            )
        );


        ctx.rotate(
            angle
        );


        ctx.drawImage(

            drawable,

            -width /
            2,

            -height /
            2,

            width,

            height
        );


        ctx.restore();
    }
}


// ============================================================
// CRÍA DE ANTREX
// Tiene poca vida y ataca a corta distancia
// ============================================================

class AntrexCria extends Enemy {

    constructor(x, y) {

        super(x, y);


        // TAMAÑO
        this.width = 24;
        this.height = 24;


        // ESTADÍSTICAS
        this.speed = 3.5;

        this.health = 20;
        this.maxHealth = 20;

        this.damage = 5;


        // ESTADO
        this.state =
            "CHASE";


        // ATAQUE CERCANO
        this.attackRange = 30;

        this.attackCooldown = 850;

        this.lastAttackTime =
            -Infinity;


        // ANIMACIÓN DE ATAQUE
        this.attackDuration = 300;

        this.attackStartedAt =
            -Infinity;

        this.isAttacking =
            false;


        // DIRECCIÓN
        this.directionAngle = 0;

        this.spriteDirectionOffset =
            -Math.PI / 2;


        // ANIMACIONES
        this.walkStartedAt =
            performance.now();

        this.deathDuration = 360;
    }


    // ========================================================
    // ACTUALIZAR CRÍA
    // ========================================================

    update(player) {

        const now =
            performance.now();


        if (!this.alive) {
            return;
        }


        // MUERTE
        if (this.isDying) {

            if (
                now -
                this.deathStartedAt >=
                this.deathDuration
            ) {

                this.alive =
                    false;
            }


            return;
        }


        if (
            !player ||
            !player.alive
        ) {

            return;
        }


        const dx =
            player.x -
            this.x;


        const dy =
            player.y -
            this.y;


        const distance =

            Math.hypot(
                dx,
                dy
            );


        // Mirar hacia el jugador
        if (distance > 0) {

            this.directionAngle =

                Math.atan2(
                    dy,
                    dx
                );
        }


        // Terminar ataque
        if (this.isAttacking) {

            if (
                now -
                this.attackStartedAt >=
                this.attackDuration
            ) {

                this.isAttacking =
                    false;
            }


            return;
        }


        // Ataque a corta distancia
        if (
            distance <=
            this.attackRange
        ) {

            if (
                now -
                this.lastAttackTime >=
                this.attackCooldown
            ) {

                damagePlayer(
                    this.damage
                );


                this.lastAttackTime =
                    now;


                this.attackStartedAt =
                    now;


                this.isAttacking =
                    true;
            }


            return;
        }


        // Perseguir al jugador
        if (distance > 0) {

            this.x +=

                (
                    dx /
                    distance
                )

                *

                this.speed;


            this.y +=

                (
                    dy /
                    distance
                )

                *

                this.speed;
        }


        this.keepInsideCanvas();
    }


    // ========================================================
    // RECIBIR DAÑO
    // ========================================================

    takeDamage(amount) {

        if (
            !this.alive ||
            this.isDying
        ) {

            return;
        }


        this.health =

            Math.max(

                0,

                this.health -
                amount
            );


        this.hitStartedAt =
            performance.now();


        if (
            this.health === 0
        ) {

            this.state =
                "DEAD";


            this.isDying =
                true;


            this.deathStartedAt =
                performance.now();
        }
    }


    // ========================================================
    // LÍMITES DE LA CRÍA
    // ========================================================

    keepInsideCanvas() {

        const halfWidth =
            this.width /
            2;


        const halfHeight =
            this.height /
            2;


        this.x =

            Math.max(

                halfWidth,

                Math.min(

                    canvas.width -
                    halfWidth,

                    this.x
                )
            );


        this.y =

            Math.max(

                halfHeight,

                Math.min(

                    canvas.height -
                    halfHeight,

                    this.y
                )
            );
    }


    // ========================================================
    // DIBUJAR CRÍA
    // ========================================================

    draw(ctx) {

        if (!this.alive) {
            return;
        }


        const now =
            performance.now();


        let sprite =
            antrexChildWalkSprite;


        let columns = 6;


        let frame =

            Math.floor(

                (
                    now -
                    this.walkStartedAt
                )

                /

                95
            )

            %

            columns;


        // ATAQUE O MUERTE
        if (
            this.isAttacking ||
            this.isDying
        ) {

            sprite =
                antrexChildAttackSprite;


            columns = 3;


            const startedAt =

                this.isDying

                    ? this.deathStartedAt

                    : this.attackStartedAt;


            const totalDuration =

                this.isDying

                    ? this.deathDuration

                    : this.attackDuration;


            frame =

                Math.min(

                    columns -
                    1,

                    Math.floor(

                        (
                            now -
                            startedAt
                        )

                        /

                        (
                            totalDuration /
                            columns
                        )
                    )
                );
        }


        // Para caminar usa los cuadros
        // recortados y centrados
        const drawable =

            !this.isAttacking &&
            !this.isDying

                ? getAntrexChildWalkFrame(
                    frame
                )

                : getAntrexFrame(

                    sprite,

                    frame,

                    columns
                );


        if (drawable) {

            ctx.save();


            ctx.translate(

                Math.round(
                    this.x
                ),

                Math.round(
                    this.y
                )
            );


            ctx.rotate(

                this.directionAngle +

                this.spriteDirectionOffset
            );


            // Todos los cuadros se dibujan
            // desde el mismo centro
            ctx.drawImage(

                drawable,

                -this.width,

                -this.height,

                this.width *
                2,

                this.height *
                2
            );


            ctx.restore();
        }


        // BARRA DE VIDA
        if (!this.isDying) {

            this.drawHealthBar(

                ctx,

                27,

                4,

                8
            );
        }
    }
}