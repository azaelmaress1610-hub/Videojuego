const tankSpritePath = "Sprites/Tank/";

const tankIdleSprite = new Image();
tankIdleSprite.src = `${tankSpritePath}Tank-quieto.png`;

const tankMovementSprite = new Image();
tankMovementSprite.src = `${tankSpritePath}Tank-buscando.png`;

const tankAttackSprite = new Image();
tankAttackSprite.src = `${tankSpritePath}Tank-ataque.png`;

const tankProjectileSprite = new Image();
tankProjectileSprite.src = `${tankSpritePath}Tank-Proyectil.jpg`;

const tankDamageSprite = new Image();
tankDamageSprite.src = `${tankSpritePath}Tank-daño.png`;

const tankDeathSprite = new Image();
tankDeathSprite.src = `${tankSpritePath}Tank-muerte.png`;

const tankFrameCache = new Map();

let tankProjectileCanvas = null;


// ============================================================
// QUITAR FONDO NEGRO
// ============================================================

function removeTankBlackBackground(canvas) {

    const context = canvas.getContext(
        "2d",
        { willReadFrequently: true }
    );

    const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (
        let index = 0;
        index < pixels.data.length;
        index += 4
    ) {

        const red = pixels.data[index];
        const green = pixels.data[index + 1];
        const blue = pixels.data[index + 2];

        if (
            red < 28 &&
            green < 28 &&
            blue < 28
        ) {

            pixels.data[index + 3] = 0;
        }
    }

    context.putImageData(
        pixels,
        0,
        0
    );
}


// ============================================================
// ELIMINAR LA FIGURA DUPLICADA
// ============================================================

function keepMainTankFigure(canvas) {

    const context = canvas.getContext(
        "2d",
        { willReadFrequently: true }
    );

    const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const pixelCount =
        canvas.width *
        canvas.height;

    const visited =
        new Uint8Array(pixelCount);

    const components = [];

    const isVisible = (position) => {

        return (
            pixels.data[
                position * 4 + 3
            ] > 10
        );
    };


    for (
        let start = 0;
        start < pixelCount;
        start++
    ) {

        if (
            visited[start] ||
            !isVisible(start)
        ) {
            continue;
        }

        const component = [];

        const pending = [
            start
        ];

        visited[start] = 1;


        while (
            pending.length > 0
        ) {

            const position =
                pending.pop();

            component.push(
                position
            );

            const x =
                position %
                canvas.width;

            const y =
                Math.floor(
                    position /
                    canvas.width
                );


            for (
                let offsetY = -1;
                offsetY <= 1;
                offsetY++
            ) {

                for (
                    let offsetX = -1;
                    offsetX <= 1;
                    offsetX++
                ) {

                    if (
                        offsetX === 0 &&
                        offsetY === 0
                    ) {
                        continue;
                    }

                    const nextX =
                        x + offsetX;

                    const nextY =
                        y + offsetY;


                    if (
                        nextX < 0 ||
                        nextX >= canvas.width ||
                        nextY < 0 ||
                        nextY >= canvas.height
                    ) {
                        continue;
                    }


                    const nextPosition =
                        nextY *
                        canvas.width +
                        nextX;


                    if (
                        !visited[nextPosition] &&
                        isVisible(nextPosition)
                    ) {

                        visited[nextPosition] = 1;

                        pending.push(
                            nextPosition
                        );
                    }
                }
            }
        }

        components.push(
            component
        );
    }


    if (
        components.length <= 1
    ) {
        return;
    }


    components.sort(
        (first, second) =>
            second.length -
            first.length
    );


    const mainComponent =
        new Set(
            components[0]
        );


    for (
        let position = 0;
        position < pixelCount;
        position++
    ) {

        if (
            isVisible(position) &&
            !mainComponent.has(position)
        ) {

            pixels.data[
                position * 4 + 3
            ] = 0;
        }
    }


    context.putImageData(
        pixels,
        0,
        0
    );
}


// ============================================================
// CENTRAR CADA CUADRO
// ============================================================

function centerTankFrame(frameCanvas) {

    const context = frameCanvas.getContext(
        "2d",
        { willReadFrequently: true }
    );

    const pixels = context.getImageData(
        0,
        0,
        frameCanvas.width,
        frameCanvas.height
    );

    let minX = frameCanvas.width;
    let minY = frameCanvas.height;

    let maxX = -1;
    let maxY = -1;


    for (
        let y = 0;
        y < frameCanvas.height;
        y++
    ) {

        for (
            let x = 0;
            x < frameCanvas.width;
            x++
        ) {

            const index =
                (
                    y *
                    frameCanvas.width +
                    x
                ) * 4;

            const alpha =
                pixels.data[index + 3];

            if (alpha > 10) {

                minX = Math.min(
                    minX,
                    x
                );

                minY = Math.min(
                    minY,
                    y
                );

                maxX = Math.max(
                    maxX,
                    x
                );

                maxY = Math.max(
                    maxY,
                    y
                );
            }
        }
    }


    if (
        maxX < minX ||
        maxY < minY
    ) {

        return frameCanvas;
    }


    const visibleWidth =
        maxX - minX + 1;

    const visibleHeight =
        maxY - minY + 1;


    const centeredCanvas =
        document.createElement("canvas");

    centeredCanvas.width =
        frameCanvas.width;

    centeredCanvas.height =
        frameCanvas.height;


    const centeredContext =
        centeredCanvas.getContext("2d");


    const destinationX =
        Math.round(
            (
                centeredCanvas.width -
                visibleWidth
            ) / 2
        );

    const destinationY =
        Math.round(
            (
                centeredCanvas.height -
                visibleHeight
            ) / 2
        );


    centeredContext.drawImage(
        frameCanvas,

        minX,
        minY,

        visibleWidth,
        visibleHeight,

        destinationX,
        destinationY,

        visibleWidth,
        visibleHeight
    );


    return centeredCanvas;
}


// ============================================================
// EXTRAER CUADRO DEL SPRITE SHEET
// ============================================================

function getTankTransparentFrame(
    sprite,
    frame,
    columns
) {

    if (
        !sprite ||
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


    const cacheKey =
        `${sprite.src}-${safeFrame}-${columns}`;


    if (
        tankFrameCache.has(cacheKey)
    ) {

        return tankFrameCache.get(
            cacheKey
        );
    }


    const frameWidth =
        sprite.naturalWidth /
        columns;

    const frameHeight =
        sprite.naturalHeight;


    const frameCanvas =
        document.createElement("canvas");

    frameCanvas.width =
        Math.round(frameWidth);

    frameCanvas.height =
        frameHeight;


    const frameContext =
        frameCanvas.getContext(
            "2d",
            { willReadFrequently: true }
        );


    frameContext.drawImage(
        sprite,

        safeFrame * frameWidth,
        0,

        frameWidth,
        frameHeight,

        0,
        0,

        frameCanvas.width,
        frameCanvas.height
    );


    // El orden de estas funciones es importante

    removeTankBlackBackground(
        frameCanvas
    );

    keepMainTankFigure(
        frameCanvas
    );

    const centeredFrame =
        centerTankFrame(
            frameCanvas
        );


    tankFrameCache.set(
        cacheKey,
        centeredFrame
    );


    return centeredFrame;
}


// ============================================================
// PREPARAR PROYECTIL
// ============================================================

function getTankProjectileImage() {

    if (
        !tankProjectileSprite.complete ||
        !tankProjectileSprite.naturalWidth ||
        !tankProjectileSprite.naturalHeight
    ) {

        return null;
    }


    if (tankProjectileCanvas) {

        return tankProjectileCanvas;
    }


    tankProjectileCanvas =
        document.createElement("canvas");

    tankProjectileCanvas.width =
        tankProjectileSprite.naturalWidth;

    tankProjectileCanvas.height =
        tankProjectileSprite.naturalHeight;


    const context =
        tankProjectileCanvas.getContext(
            "2d",
            { willReadFrequently: true }
        );


    context.drawImage(
        tankProjectileSprite,
        0,
        0
    );


    removeTankBlackBackground(
        tankProjectileCanvas
    );


    return tankProjectileCanvas;
}


// ============================================================
// CLASE TANK
// ============================================================

class Tank extends Enemy {

    constructor(x, y) {

        super(x, y);

        this.width = 58;
        this.height = 58;

        this.speed = 0.7;

        this.health = 300;
        this.maxHealth = 300;

        this.damage = 25;

        this.state = "SPAWN";

        this.moving = false;

        this.attackRange = 250;

        this.directionX = 0;
        this.directionY = 0;

        this.attackAngle = 0;

        this.spriteDirectionOffset =
            -Math.PI / 2;


        // CAMINATA

        this.movementFrames = 5;

        this.walkStartedAt =
            performance.now();

        this.walkFrameDuration = 340;


        // ATAQUE

        this.attackColumns = 10;
        this.attackFrames = 9;

        this.attackDuration = 1350;

        this.projectileFrame = 5;

        this.attackCooldown = 3000;

        this.nextAttackTime =
            performance.now() + 1200;

        this.isAttacking = false;

        this.attackStartedAt =
            -Infinity;

        this.projectileReleased =
            false;

        this.lockedAttackX = x;
        this.lockedAttackY = y;
        this.lockedAttackAngle = 0;


        // DAÑO

        this.hitDuration = 500;

        this.lockedHitX = x;
        this.lockedHitY = y;
        this.lockedHitAngle = 0;


        // MUERTE

        this.deathDuration = 1400;

        this.lockedDeathX = x;
        this.lockedDeathY = y;
        this.lockedDeathAngle = 0;
    }


    // ========================================================
    // ACTUALIZAR
    // ========================================================

    update(player) {

        const now =
            performance.now();


        if (!this.alive) {

            return;
        }


        if (this.isDying) {

            if (
                now -
                this.deathStartedAt >=
                this.deathDuration
            ) {

                this.alive = false;
            }

            return;
        }


        if (
            this.state === "SPAWN"
        ) {

            this.state = "SEARCH";
        }


        if (!player.alive) {

            this.moving = false;

            return;
        }


        const dx =
            player.x - this.x;

        const dy =
            player.y - this.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );


        if (
            distance > 0 &&
            !this.isAttacking
        ) {

            this.directionX =
                dx / distance;

            this.directionY =
                dy / distance;

            this.attackAngle =
                Math.atan2(
                    dy,
                    dx
                );
        }


        // RECIBIENDO DAÑO

        if (
            now -
            this.hitStartedAt <
            this.hitDuration
        ) {

            this.moving = false;

            this.x =
                this.lockedHitX;

            this.y =
                this.lockedHitY;

            this.attackAngle =
                this.lockedHitAngle;

            return;
        }


        // ATACANDO

        if (this.isAttacking) {

            this.updateAttack(
                player,
                now
            );

            return;
        }


        // PERSEGUIR AL JUGADOR

        if (
            distance >
            this.attackRange
        ) {

            this.state = "CHASE";

            this.moving = true;


            if (!this.walkStartedAt) {

                this.walkStartedAt =
                    now;
            }


            this.x +=
                this.directionX *
                this.speed;

            this.y +=
                this.directionY *
                this.speed;


            this.keepInsideCanvas();

            return;
        }


        // DETENERSE PARA ATACAR

        this.state = "ATTACK";

        this.moving = false;

        this.walkStartedAt = 0;


        if (
            now >=
            this.nextAttackTime
        ) {

            this.startAttack(now);
        }
    }


    // ========================================================
    // COMENZAR ATAQUE
    // ========================================================

    startAttack(now) {

        this.isAttacking = true;

        this.projectileReleased =
            false;

        this.attackStartedAt =
            now;


        this.lockedAttackX =
            this.x;

        this.lockedAttackY =
            this.y;

        this.lockedAttackAngle =
            this.attackAngle;
    }


    // ========================================================
    // ACTUALIZAR ATAQUE
    // ========================================================

    updateAttack(player, now) {

        this.moving = false;

        this.x =
            this.lockedAttackX;

        this.y =
            this.lockedAttackY;

        this.attackAngle =
            this.lockedAttackAngle;


        const elapsed =
            now -
            this.attackStartedAt;


        const frameDuration =
            this.attackDuration /
            this.attackFrames;


        const attackFrame =
            Math.min(

                this.attackFrames - 1,

                Math.floor(
                    elapsed /
                    frameDuration
                )
            );


        // Lanzar un solo proyectil

        if (
            attackFrame >=
            this.projectileFrame &&

            !this.projectileReleased
        ) {

            this.projectileReleased =
                true;

            this.shoot(player);
        }


        // Terminar ataque

        if (
            elapsed >=
            this.attackDuration
        ) {

            this.isAttacking =
                false;

            this.projectileReleased =
                false;

            this.nextAttackTime =
                now +
                this.attackCooldown;


            const distance =
                this.getDistanceToPlayer(
                    player
                );


            if (
                distance >
                this.attackRange
            ) {

                this.state = "CHASE";

            } else {

                this.state = "ATTACK";
            }
        }
    }


    // ========================================================
    // DISPARAR
    // ========================================================

    shoot(player) {

        const angle =
            Math.atan2(
                player.y - this.y,
                player.x - this.x
            );


        const projectileOffset = 42;


        projectiles.push({

            x:
                this.x +
                Math.cos(angle) *
                projectileOffset,

            y:
                this.y +
                Math.sin(angle) *
                projectileOffset,

            radius: 9,

            speed: 5,

            angle: angle,

            damage:
                this.damage,

            enemyProjectile:
                true,

            tankProjectile:
                true
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
                this.health - amount
            );


        this.hitStartedAt =
            performance.now();


        this.lockedHitX =
            this.x;

        this.lockedHitY =
            this.y;

        this.lockedHitAngle =
            this.attackAngle;


        if (
            this.health === 0
        ) {

            this.isDying = true;

            this.isAttacking = false;

            this.state = "DEAD";


            this.deathStartedAt =
                performance.now();


            this.lockedDeathX =
                this.x;

            this.lockedDeathY =
                this.y;

            this.lockedDeathAngle =
                this.attackAngle;
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
    // DIBUJAR SPRITE
    // ========================================================

    drawTankSprite(
        ctx,
        sprite,
        frame,
        columns,
        scale,
        angle
    ) {

        const drawable =
            getTankTransparentFrame(
                sprite,
                frame,
                columns
            );


        if (!drawable) {

            return false;
        }


        const drawWidth =
            this.width *
            scale;

        const drawHeight =
            this.height *
            scale;


        ctx.save();


        ctx.translate(
            Math.round(this.x),
            Math.round(this.y)
        );


        ctx.rotate(angle);


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
    // DIBUJAR TANK
    // ========================================================

    draw(ctx) {

        if (!this.alive) {

            return;
        }


        const now =
            performance.now();


        let sprite =
            tankIdleSprite;

        let columns = 5;

        let frame = 0;

        let angle =
            this.attackAngle +
            this.spriteDirectionOffset;


        // MUERTE

        if (this.isDying) {

            this.x =
                this.lockedDeathX;

            this.y =
                this.lockedDeathY;


            sprite =
                tankDeathSprite;

            columns = 5;


            frame =
                Math.min(

                    4,

                    Math.floor(

                        (
                            now -
                            this.deathStartedAt
                        ) /

                        (
                            this.deathDuration /
                            5
                        )
                    )
                );


            angle =
                this.lockedDeathAngle +
                this.spriteDirectionOffset;


        // DAÑO

        } else if (

            now -
            this.hitStartedAt <

            this.hitDuration
        ) {

            sprite =
                tankDamageSprite;

            columns = 5;


            frame =
                Math.min(

                    4,

                    Math.floor(

                        (
                            now -
                            this.hitStartedAt
                        ) /

                        (
                            this.hitDuration /
                            5
                        )
                    )
                );


            angle =
                this.lockedHitAngle +
                this.spriteDirectionOffset;


        // ATAQUE

        } else if (
            this.isAttacking
        ) {

            sprite =
                tankAttackSprite;

            columns =
                this.attackColumns;


            frame =
                Math.min(

                    this.attackFrames - 1,

                    Math.floor(

                        (
                            now -
                            this.attackStartedAt
                        ) /

                        (
                            this.attackDuration /
                            this.attackFrames
                        )
                    )
                );


            angle =
                this.lockedAttackAngle +
                this.spriteDirectionOffset;


        // CAMINATA

        } else if (
            this.moving
        ) {

            sprite =
                tankMovementSprite;

            // Tank-buscando.png tiene 5 cuadros
            columns =
                this.movementFrames;


            frame =
                Math.floor(

                    (
                        now -
                        this.walkStartedAt
                    ) /

                    this.walkFrameDuration
                )

                % this.movementFrames;


        // REPOSO

        } else {

            sprite =
                tankIdleSprite;

            columns = 5;


            frame =
                Math.floor(
                    now / 220
                ) % 5;
        }


        const spriteDrawn =
            this.drawTankSprite(

                ctx,

                sprite,

                frame,

                columns,

                1.7,

                angle
            );


        if (!spriteDrawn) {

            ctx.fillStyle =
                "#8844ff";

            ctx.fillRect(

                this.x -
                this.width / 2,

                this.y -
                this.height / 2,

                this.width,
                this.height
            );
        }


        if (!this.isDying) {

            this.drawHealthBar(
                ctx,
                60,
                6,
                13
            );
        }
    }
}