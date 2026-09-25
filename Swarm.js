// ============================================================
// SWARM.JS
// Grupo de 3 enemigos.
// Cada enemigo dispara 3 proyectiles: 9 en total.
// ============================================================

const swarmSpritePath = "Sprites/Swarm/";

const swarmWalkSprite = new Image();
swarmWalkSprite.src =
    `${swarmSpritePath}Swarm-caminar.png`;

const swarmAttackSprite = new Image();
swarmAttackSprite.src =
    `${swarmSpritePath}Swarm-ataque.png`;

const swarmDamageSprite = new Image();
swarmDamageSprite.src =
    `${swarmSpritePath}Swarm-daño.png`;

const swarmDeathSprite = new Image();
swarmDeathSprite.src =
    `${swarmSpritePath}Swarm-muerte.png`;


// Guarda los cuadros procesados
const swarmFrameCache = new Map();
// Controla la posición de cada integrante del grupo
let swarmMemberCounter = 0;


// ============================================================
// ELIMINAR FONDO BLANCO O CUADRICULADO
// ============================================================

function removeSwarmBackground(canvas) {

    const context = canvas.getContext(
        "2d",
        {
            willReadFrequently: true
        }
    );

    const imageData = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const data = imageData.data;


    for (
        let index = 0;
        index < data.length;
        index += 4
    ) {

        const red =
            data[index];

        const green =
            data[index + 1];

        const blue =
            data[index + 2];

        const difference =

            Math.max(
                red,
                green,
                blue
            )

            -

            Math.min(
                red,
                green,
                blue
            );


        // Elimina los colores blancos y grises
        if (
            difference < 22 &&
            red > 150 &&
            green > 150 &&
            blue > 150
        ) {
            data[index + 3] = 0;
        }
    }


    context.putImageData(
        imageData,
        0,
        0
    );
}


// ============================================================
// OBTENER UN CUADRO DEL SPRITE SHEET
// ============================================================

function getSwarmFrame(
    sprite,
    frame,
    columns
) {

    const safeFrame =
        Math.max(
            0,
            Math.min(
                columns - 1,
                frame
            )
        );


    const cacheKey =
        `${sprite.src}-${safeFrame}-${columns}`;


    if (
        swarmFrameCache.has(cacheKey)
    ) {
        return swarmFrameCache.get(
            cacheKey
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


    const context =

        frameCanvas.getContext(

            "2d",

            {
                willReadFrequently: true
            }
        );


    context.drawImage(

        sprite,

        safeFrame * frameWidth,
        0,

        frameWidth,
        sprite.naturalHeight,

        0,
        0,

        frameCanvas.width,
        frameCanvas.height
    );


    removeSwarmBackground(
        frameCanvas
    );


    swarmFrameCache.set(
        cacheKey,
        frameCanvas
    );


    return frameCanvas;
}


// ============================================================
// CLASE SWARM
// ============================================================

class Swarm extends Enemy {

    constructor(x, y) {

        super(x, y);


        // TAMAÑO
        this.width = 38;
        this.height = 38;


        // ESTADÍSTICAS
        this.speed = 2.35;

        this.health = 55;
        this.maxHealth = 55;

        this.damage = 8;


        // ESTADO
        this.state = "SPAWN";


        // ROTACIÓN
        this.directionAngle = 0;

        this.spriteDirectionOffset =
            -Math.PI / 2;


        // MOVIMIENTO EN GRUPO
        this.desiredDistance = 205;

        // Cada integrante obtiene un ángulo diferente:
// 0°, 120° y 240°
this.formationSlot =
    swarmMemberCounter % 3;

swarmMemberCounter += 1;

this.formationAngle =
    this.formationSlot *
    (Math.PI * 2 / 3);


        // ATAQUE
        this.attackRange = 340;

        this.attackCooldown = 1900;

        this.attackDuration = 720;

        this.projectileFrame = 3;

        this.projectileReleased = false;


        // TIEMPOS
        const now =
            performance.now();


        this.spawnStartedAt =
            now;

        this.walkStartedAt =
            now;

        this.attackStartedAt =
            -Infinity;


        // Hace que no disparen exactamente
        // al mismo tiempo al aparecer
        this.nextAttackTime =

            now +

            800 +

            Math.random() * 900;


        // DAÑO
        this.hitDuration = 560;


        // MUERTE
        this.deathDuration = 880;


        // POSICIÓN FIJA PARA LAS ANIMACIONES
        this.lockedX = x;
        this.lockedY = y;
        this.lockedAngle = 0;
    }


    // ========================================================
    // ACTUALIZAR SWARM
    // ========================================================

    update(player) {

        const now =
            performance.now();


        if (!this.alive) {
            return;
        }


        // MUERTE
        if (this.isDying) {

            // La animación se queda en el mismo lugar
            this.x =
                this.lockedX;

            this.y =
                this.lockedY;

            this.directionAngle =
                this.lockedAngle;


            if (
                now -
                this.deathStartedAt >=
                this.deathDuration
            ) {
                this.alive = false;
            }


            return;
        }


        // Si el jugador ya no está vivo
        if (
            !player ||
            !player.alive
        ) {

            this.state =
                "SEARCH";

            return;
        }


        // DAÑO
        if (
            now -
            this.hitStartedAt <
            this.hitDuration
        ) {

            // La animación de daño se queda quieta
            this.x =
                this.lockedX;

            this.y =
                this.lockedY;

            this.directionAngle =
                this.lockedAngle;

            return;
        }


        const dx =
            player.x - this.x;

        const dy =
            player.y - this.y;


        const distance =
            Math.hypot(
                dx,
                dy
            );


        // Girar hacia el jugador
        if (
            distance > 0 &&
            this.state !== "ATTACK"
        ) {

            this.directionAngle =

                Math.atan2(
                    dy,
                    dx
                );
        }


        // SPAWN
        if (
            this.state === "SPAWN"
        ) {

            this.state =
                "CHASE";

            this.walkStartedAt =
                now;

            return;
        }


        // SEARCH
        if (
            this.state === "SEARCH"
        ) {

            this.state =
                "CHASE";

            this.walkStartedAt =
                now;
        }


        // ATTACK
        if (
            this.state === "ATTACK"
        ) {

            this.updateAttack(
                player,
                now
            );

            return;
        }


        // COMENZAR ATAQUE
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


        // MOVERSE EN GRUPO
        this.moveAsGroup(

            player,

            distance,

            dx,

            dy
        );


        this.keepInsideCanvas();
    }
    // ========================================================
// MOVIMIENTO ALREDEDOR DEL JUGADOR
// ========================================================

moveAsGroup(
    player,
    distance,
    dx,
    dy
) {

    if (distance <= 0) {
        return;
    }


    // Hace que la formación gire lentamente
    const rotation =
        performance.now() / 4200;


    // Ángulo exclusivo de este integrante
    const targetAngle =

        this.formationAngle +

        rotation;


    // Posición que debe ocupar alrededor del jugador
    const targetX =

        player.x +

        Math.cos(targetAngle) *

        this.desiredDistance;


    const targetY =

        player.y +

        Math.sin(targetAngle) *

        this.desiredDistance;


    // Dirección hacia su posición de formación
    let moveX =
        targetX - this.x;

    let moveY =
        targetY - this.y;


    const nearby =
        this.findNearbySwarm();


    // Separación para evitar que se encimen
    for (
        const other of nearby
    ) {

        const separationX =
            this.x - other.x;

        const separationY =
            this.y - other.y;


        const separationDistance =

            Math.hypot(

                separationX,

                separationY
            );


        if (
            separationDistance > 0 &&
            separationDistance < 62
        ) {

            const force =

                (
                    62 -
                    separationDistance
                )

                /

                62;


            moveX +=

                (
                    separationX /
                    separationDistance
                )

                *

                force

                *

                1.5;


            moveY +=

                (
                    separationY /
                    separationDistance
                )

                *

                force

                *

                1.5;
        }
    }


    const moveLength =

        Math.hypot(
            moveX,
            moveY
        );


    if (moveLength > 0) {

        this.x +=

            (
                moveX /
                moveLength
            )

            *

            this.speed;


        this.y +=

            (
                moveY /
                moveLength
            )

            *

            this.speed;
    }


    // Mirar hacia el jugador
    this.directionAngle =

        Math.atan2(

            player.y -
            this.y,

            player.x -
            this.x
        );
}


    // ========================================================
    // BUSCAR OTROS SWARM
    // ========================================================

    findNearbySwarm() {

        if (
            typeof enemigos ===
            "undefined"
        ) {

            return [];
        }


        return enemigos.filter(

            (enemy) => {

                if (
                    enemy === this ||

                    !(enemy instanceof Swarm) ||

                    !enemy.alive
                ) {

                    return false;
                }


                const distance =

                    Math.hypot(

                        enemy.x -
                        this.x,

                        enemy.y -
                        this.y
                    );


                return distance < 115;
            }
        );
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


        // Guardar la posición para que
        // la animación no se desplace
        this.lockedX =
            this.x;

        this.lockedY =
            this.y;

        this.lockedAngle =
            this.directionAngle;
    }


    // ========================================================
    // ACTUALIZAR ATAQUE
    // ========================================================

    updateAttack(
        player,
        now
    ) {

        // Mantener la animación en un solo lugar
        this.x =
            this.lockedX;

        this.y =
            this.lockedY;

        this.directionAngle =
            this.lockedAngle;


        const elapsed =

            now -

            this.attackStartedAt;


        const frameDuration =

            this.attackDuration /

            8;


        const attackFrame =

            Math.min(

                7,

                Math.floor(

                    elapsed /

                    frameDuration
                )
            );


        // Disparar una sola vez por transición
        if (
            attackFrame >=
            this.projectileFrame

            &&

            !this.projectileReleased
        ) {

            this.projectileReleased =
                true;


            // Este método genera 3 proyectiles
            this.shoot(
                player
            );
        }


        // Terminar el ataque
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

                this.attackCooldown +

                Math.random() * 450;
        }
    }


    // ========================================================
    // DISPARAR 3 PROYECTILES
    // ========================================================

    shoot(player) {

        if (
            typeof projectiles ===
            "undefined"
        ) {

            return;
        }


        // Dirección central hacia el jugador
        const centerAngle =

            Math.atan2(

                player.y -
                this.y,

                player.x -
                this.x
            );


        const offset = 31;


        // Disparo izquierdo, central y derecho
        const spreadAngles = [

            -0.18,

            0,

            0.18
        ];


        // Cada Swarm lanza 3 proyectiles
        for (
            const spread of
            spreadAngles
        ) {

            const angle =

                centerAngle +

                spread;


            projectiles.push({

                x:

                    this.x +

                    Math.cos(angle) *
                    offset,


                y:

                    this.y +

                    Math.sin(angle) *
                    offset,


                radius: 7,

                speed: 5.6,

                angle:
                    angle,

                damage:
                    this.damage,

                enemyProjectile:
                    true,

                swarmProjectile:
                    true,

                color:
                    "#52ff28",

                trailColor:
                    "rgba(82, 255, 40, 0.32)",

                spriteStartedAt:
                    performance.now()
            });
        }
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


        // Guardar posición
        this.lockedX =
            this.x;

        this.lockedY =
            this.y;

        this.lockedAngle =
            this.directionAngle;


        // MUERTE
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
    // LÍMITES DEL CANVAS
    // ========================================================

    keepInsideCanvas() {

        const halfWidth =
            this.width / 2;

        const halfHeight =
            this.height / 2;


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
    // DIBUJAR CUADRO DEL SPRITE
    // ========================================================

    drawSprite(
        ctx,
        sprite,
        frame,
        columns,
        angle
    ) {

        if (
            !sprite.complete ||

            !sprite.naturalWidth ||

            !sprite.naturalHeight
        ) {

            return false;
        }


        const drawable =

            getSwarmFrame(

                sprite,

                frame,

                columns
            );


        const drawWidth =

            this.width *

            1.65;


        const drawHeight =

            this.height *

            1.65;


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

            -drawWidth / 2,

            -drawHeight / 2,

            drawWidth,

            drawHeight
        );


        ctx.restore();


        return true;
    }


    // ========================================================
    // DIBUJAR SWARM
    // ========================================================

    draw(ctx) {

        if (!this.alive) {
            return;
        }


        const now =
            performance.now();


        const isHit =

            now -

            this.hitStartedAt

            <

            this.hitDuration;


        // Caminar por defecto
        let sprite =
            swarmWalkSprite;


        let startedAt =
            this.walkStartedAt;


        let frameDuration =
            105;


        // MUERTE
        if (this.isDying) {

            sprite =
                swarmDeathSprite;


            startedAt =
                this.deathStartedAt;


            frameDuration =

                this.deathDuration /

                8;
        }


        // DAÑO
        else if (isHit) {

            sprite =
                swarmDamageSprite;


            startedAt =
                this.hitStartedAt;


            frameDuration =

                this.hitDuration /

                8;
        }


        // ATAQUE
        else if (
            this.state ===
            "ATTACK"
        ) {

            sprite =
                swarmAttackSprite;


            startedAt =
                this.attackStartedAt;


            frameDuration =

                this.attackDuration /

                8;
        }


        // Calcular cuadro actual
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


        // Ataque, daño y muerte solamente
        // pasan una vez cuadro por cuadro
        const oneTimeAnimation =

            this.isDying ||

            isHit ||

            this.state ===
            "ATTACK";


        const frame =

            oneTimeAnimation

                ? Math.min(
                    7,
                    rawFrame
                )

                : rawFrame % 8;


        const angle =

            this.directionAngle +

            this.spriteDirectionOffset;


        const drawn =

            this.drawSprite(

                ctx,

                sprite,

                frame,

                8,

                angle
            );


        // Figura de respaldo
        if (!drawn) {

            ctx.fillStyle =

                isHit

                    ? "#ffffff"

                    : "#52ff28";


            ctx.beginPath();


            ctx.arc(

                this.x,

                this.y,

                this.width / 2,

                0,

                Math.PI * 2
            );


            ctx.fill();
        }


        // BARRA DE VIDA
        if (!this.isDying) {

            this.drawHealthBar(

                ctx,

                42,

                5,

                14
            );
        }
    }
}