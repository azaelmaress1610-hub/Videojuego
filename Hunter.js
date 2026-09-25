// ============================================================
// HUNTER.JS
// ============================================================

const hunterSpritePath = "Sprites/Hunter/";


// ============================================================
// CARGAR SPRITES
// ============================================================

const hunterIdleSprite = new Image();
hunterIdleSprite.src = `${hunterSpritePath}Hunter-Quieto.png`;

const hunterWalkSprite = new Image();
hunterWalkSprite.src = `${hunterSpritePath}Hunter-Caminar.png`;

const hunterRunSprite = new Image();
hunterRunSprite.src = `${hunterSpritePath}Hunter-Correr.png`;

const hunterAttackSprite = new Image();
hunterAttackSprite.src = `${hunterSpritePath}Hunter-Ataque.png`;

const hunterHitSprite = new Image();
hunterHitSprite.src = `${hunterSpritePath}Hunter-Daño.png`;

const hunterDeathSprite = new Image();
hunterDeathSprite.src = `${hunterSpritePath}Hunter-Muerte.png`;


// ============================================================
// CLASE HUNTER
// ============================================================

class Hunter extends Enemy {

    constructor(x, y) {

        super(x, y);

        // ====================================================
        // TAMAÑO
        // ====================================================

        this.width = 34;
        this.height = 34;


        // ====================================================
        // ESTADÍSTICAS
        // ====================================================

        this.speed = 1.5;

        this.health = 100;
        this.maxHealth = 100;

        this.damage = 10;


        // ====================================================
        // DISTANCIA DE ATAQUE
        // ====================================================

        this.attackRange = 50;


        // ====================================================
        // ESTADO
        // ====================================================

        this.state = "SPAWN";

        this.alive = true;
        this.isDying = false;


        // ====================================================
        // DIRECCIÓN
        // ====================================================

        this.direction = "DOWN";


        // ====================================================
        // ANIMACIÓN GENERAL
        // ====================================================

        this.animationStartedAt =
            performance.now();


        // ====================================================
        // ATAQUE
        // ====================================================

        this.attackStartedAt = 0;

        this.attackDuration = 600;

        this.attackCooldown = 900;

        this.lastAttackTime = 0;

        this.attackDamageDone = false;


        // ====================================================
        // DAÑO
        // ====================================================

        this.hitStartedAt = -Infinity;

        this.hitDuration = 450;


        // ====================================================
        // MUERTE
        // ====================================================

        this.deathStartedAt = 0;

        this.deathDuration = 1400;
    }


    // ========================================================
    // CALCULAR DIRECCIÓN HACIA EL JUGADOR
    // ========================================================

    calculateDirection(dx, dy) {

        if (Math.abs(dx) > Math.abs(dy)) {

            if (dx > 0) {

                this.direction = "RIGHT";

            } else {

                this.direction = "LEFT";
            }

        } else {

            if (dy > 0) {

                this.direction = "DOWN";

            } else {

                this.direction = "UP";
            }
        }
    }


    // ========================================================
    // UPDATE
    // ========================================================

    update(player) {

        if (!this.alive) {
            return;
        }

        if (this.isDying) {
            return;
        }


        // ====================================================
        // DISTANCIA AL JUGADOR
        // ====================================================

        const dx =
            player.x - this.x;

        const dy =
            player.y - this.y;


        const distance =
            Math.hypot(dx, dy);


        // ====================================================
        // DIRECCIÓN HACIA EL JUGADOR
        // ====================================================

        if (distance > 0) {

            this.calculateDirection(
                dx,
                dy
            );
        }


        // ====================================================
        // SPAWN
        // ====================================================

        if (this.state === "SPAWN") {

            this.state = "SEARCH";

            return;
        }


        // ====================================================
        // SEARCH
        // ====================================================

        if (this.state === "SEARCH") {

            this.state = "CHASE";

            this.animationStartedAt =
                performance.now();

            return;
        }


        // ====================================================
        // CHASE
        // ====================================================

        if (this.state === "CHASE") {


            // =================================================
            // SI ESTÁ CERCA -> ATACAR
            // =================================================

            if (
                distance <=
                this.attackRange
            ) {

                this.state = "ATTACK";

                this.attackStartedAt = 0;

                this.attackDamageDone = false;

                return;
            }


            // =================================================
            // MOVERSE HACIA EL JUGADOR
            // =================================================

            if (distance > 0) {

                const directionX =
                    dx / distance;

                const directionY =
                    dy / distance;


                this.x +=
                    directionX *
                    this.speed;


                this.y +=
                    directionY *
                    this.speed;
            }


            return;
        }


        // ====================================================
        // ATTACK
        // ====================================================

        if (this.state === "ATTACK") {


            // =================================================
            // SEGUIR MIRANDO AL JUGADOR
            // =================================================

            if (distance > 0) {

                this.calculateDirection(
                    dx,
                    dy
                );
            }


            // =================================================
            // SI EL JUGADOR SE ALEJA
            // =================================================

            if (
                distance >
                this.attackRange + 15
            ) {

                this.state = "CHASE";

                this.attackStartedAt = 0;

                this.attackDamageDone = false;

                return;
            }


            const now =
                performance.now();


            // =================================================
            // INICIAR ATAQUE
            // =================================================

            if (
                this.attackStartedAt === 0 &&
                now - this.lastAttackTime >=
                this.attackCooldown
            ) {

                this.attackStartedAt =
                    now;

                this.attackDamageDone =
                    false;
            }


            // =================================================
            // ATAQUE ACTIVO
            // =================================================

            if (
                this.attackStartedAt > 0
            ) {

                const elapsed =
                    now -
                    this.attackStartedAt;


                // =============================================
                // HACER DAÑO
                // =============================================

                if (
                    elapsed >=
                    this.attackDuration * 0.50 &&
                    !this.attackDamageDone
                ) {

                    if (
                        typeof damagePlayer ===
                        "function"
                    ) {

                        damagePlayer(
                            this.damage
                        );
                    }


                    this.attackDamageDone =
                        true;
                }


                // =============================================
                // TERMINAR ATAQUE
                // =============================================

                if (
                    elapsed >=
                    this.attackDuration
                ) {

                    this.lastAttackTime =
                        now;

                    this.attackStartedAt =
                        0;

                    this.attackDamageDone =
                        false;
                }
            }
        }
    }


    // ========================================================
    // RECIBIR DAÑO
    // ========================================================

    takeDamage(amount) {

        if (!this.alive) {
            return;
        }

        if (this.isDying) {
            return;
        }


        // ====================================================
        // RESTAR VIDA
        // ====================================================

        this.health -= amount;


        if (this.health < 0) {

            this.health = 0;
        }


        // ====================================================
        // MUERTE
        // ====================================================

        if (this.health <= 0) {

            this.health = 0;

            this.state = "DEAD";

            this.isDying = true;


            this.deathStartedAt =
                performance.now();


            // =================================================
            // CANCELAR DAÑO
            // =================================================

            this.hitStartedAt =
                -Infinity;


            // =================================================
            // CANCELAR ATAQUE
            // =================================================

            this.attackStartedAt =
                0;

            this.attackDamageDone =
                false;


            return;
        }


        // ====================================================
        // RECIBIÓ DAÑO
        // ====================================================

        this.hitStartedAt =
            performance.now();


        // ====================================================
        // CANCELAR ATAQUE
        // ====================================================

        this.attackStartedAt =
            0;

        this.attackDamageDone =
            false;
    }


    // ========================================================
    // FRAME SEGÚN DIRECCIÓN
    // ========================================================

    getDirectionalFrame() {

        switch (this.direction) {

            case "DOWN":

                return 0;


            case "UP":

                return 1;


            case "LEFT":

                return 2;


            case "RIGHT":

                return 3;


            default:

                return 0;
        }
    }


    // ========================================================
    // FRAME DE ATAQUE
    // ========================================================

    getAttackFrame(now) {

        if (
            this.attackStartedAt === 0
        ) {

            return 0;
        }


        const elapsed =
            now -
            this.attackStartedAt;


        // ====================================================
        // DOS FRAMES POR DIRECCIÓN
        // ====================================================

        const localFrame =
            Math.min(
                1,
                Math.floor(
                    elapsed /
                    (this.attackDuration / 2)
                )
            );


        switch (this.direction) {

            case "UP":

                return localFrame;


            case "DOWN":

                return 2 +
                    localFrame;


            case "LEFT":

                return 4 +
                    localFrame;


            case "RIGHT":

                return 6 +
                    localFrame;


            default:

                return 2 +
                    localFrame;
        }
    }


    // ========================================================
    // FRAME DE MUERTE
    // ========================================================

    getDeathFrame(now) {

        const elapsed =
            now -
            this.deathStartedAt;


        const frameDuration =
            this.deathDuration /
            8;


        let frame =
            Math.floor(
                elapsed /
                frameDuration
            );


        frame =
            Math.max(
                0,
                Math.min(
                    frame,
                    7
                )
            );


        return frame;
    }


    // ========================================================
    // DIBUJAR FRAME NORMAL
    // ========================================================

    drawFrame(
        ctx,
        sprite,
        frame,
        columns,
        scale = 1
    ) {

        if (
            !sprite ||
            !sprite.complete ||
            !sprite.naturalWidth ||
            !sprite.naturalHeight
        ) {

            return false;
        }


        // ====================================================
        // TAMAÑO DE CELDA
        // ====================================================

        const cellWidth =
            sprite.naturalWidth /
            columns;


        const cellHeight =
            sprite.naturalHeight;


        // ====================================================
        // RECORTE NORMAL
        // ====================================================

        const cutLeft = 2;

        const cutRight = 4;


        const sourceX =
            Math.round(
                frame *
                cellWidth +
                cutLeft
            );


        const sourceWidth =
            Math.max(
                1,
                Math.round(
                    cellWidth -
                    cutLeft -
                    cutRight
                )
            );


        // ====================================================
        // TAMAÑO EN PANTALLA
        // ====================================================

        const drawWidth =
            this.width *
            1.30 *
            scale;


        const drawHeight =
            this.height *
            1.60 *
            scale;


        // ====================================================
        // DIBUJAR
        // ====================================================

        ctx.drawImage(

            sprite,

            sourceX,
            0,

            sourceWidth,
            cellHeight,

            Math.round(
                this.x -
                drawWidth / 2
            ),

            Math.round(
                this.y -
                drawHeight / 2
            ),

            drawWidth,
            drawHeight
        );


        return true;
    }


    // ========================================================
    // DIBUJAR DAÑO
    // ========================================================

    drawHitFrame(ctx) {

        if (
            !hunterHitSprite.complete ||
            !hunterHitSprite.naturalWidth ||
            !hunterHitSprite.naturalHeight
        ) {

            return false;
        }


        // ====================================================
        // 4 FRAMES
        // ====================================================

        const columns = 4;


        const cellWidth =
            hunterHitSprite.naturalWidth /
            columns;


        const cellHeight =
            hunterHitSprite.naturalHeight;


        // ====================================================
        // DIRECCIÓN ACTUAL
        // ====================================================

        const frame =
            this.getDirectionalFrame();


        // ====================================================
        // RECORTE DE DAÑO
        //
        // MÁS ANCHO HACIA LA IZQUIERDA
        // MENOS HACIA LA DERECHA
        // ====================================================

        const cutLeft = 0;

        const cutRight = 26;


        // ====================================================
        // POSICIÓN DEL FRAME
        // ====================================================

        const frameStart =
            frame *
            cellWidth;


        const sourceX =
            Math.floor(
                frameStart +
                cutLeft
            );


        // ====================================================
        // ANCHO DEL RECORTE
        // ====================================================

        const sourceWidth =
            Math.max(
                1,
                Math.floor(
                    cellWidth -
                    cutLeft -
                    cutRight
                )
            );


        // ====================================================
        // TAMAÑO
        // ====================================================

        const drawWidth =
            this.width *
            1.30;


        const drawHeight =
            this.height *
            1.55;


        // ====================================================
        // MOVER HACIA LA IZQUIERDA
        // ====================================================

        const extendLeft = 8;


        const drawX =
            Math.round(
                this.x -
                drawWidth / 2 -
                extendLeft
            );


        const drawY =
            Math.round(
                this.y -
                drawHeight / 2
            );


        // ====================================================
        // LÍMITE DERECHO
        // ====================================================

        const rightLimit =
            this.x + 3;


        const visibleWidth =
            Math.max(
                1,
                rightLimit -
                drawX
            );


        // ====================================================
        // GUARDAR CANVAS
        // ====================================================

        ctx.save();


        // ====================================================
        // RECORTE VISUAL
        // ====================================================

        ctx.beginPath();


        ctx.rect(

            drawX - 10,

            drawY,

            visibleWidth + 10,

            drawHeight
        );


        ctx.clip();


        // ====================================================
        // DIBUJAR DAÑO
        // ====================================================

        ctx.drawImage(

            hunterHitSprite,

            sourceX,
            0,

            sourceWidth,
            cellHeight,

            drawX,
            drawY,

            drawWidth,
            drawHeight
        );


        ctx.restore();


        return true;
    }


    // ========================================================
    // DIBUJAR MUERTE
    // ========================================================

    drawDeathFrame(ctx, now) {

        if (
            !hunterDeathSprite.complete ||
            !hunterDeathSprite.naturalWidth ||
            !hunterDeathSprite.naturalHeight
        ) {

            return false;
        }


        // ====================================================
        // SPRITE DE MUERTE = 8 FRAMES
        // ====================================================

        const columns = 8;


        const cellWidth =
            hunterDeathSprite.naturalWidth /
            columns;


        const cellHeight =
            hunterDeathSprite.naturalHeight;


        // ====================================================
        // FRAME ACTUAL
        // ====================================================

        const frame =
            this.getDeathFrame(now);


        // ====================================================
        // RECORTE ESPECIAL
        //
        // IZQUIERDA:
        // NO quitamos nada.
        //
        // DERECHA:
        // quitamos todavía más para que NO aparezca
        // parte del siguiente Hunter.
        // ====================================================

        const cutLeft = 0;

        const cutRight = 38;


        // ====================================================
        // INICIO EXACTO DEL FRAME
        // ====================================================

        const frameStart =
            frame *
            cellWidth;


        const sourceX =
            Math.floor(
                frameStart
            );


        // ====================================================
        // ANCHO DEL FRAME
        //
        // TODO EL RECORTE SE HACE DEL LADO DERECHO
        // ====================================================

        const sourceWidth =
            Math.max(
                1,
                Math.floor(
                    cellWidth -
                    cutRight
                )
            );


        // ====================================================
        // TAMAÑO VISUAL
        // ====================================================

        const drawWidth =
            this.width *
            1.55;


        const drawHeight =
            this.height *
            1.45;


        // ====================================================
        // MOVER MÁS HACIA LA IZQUIERDA
        //
        // Antes = 12
        // Ahora = 18
        // ====================================================

        const extendLeft = 18;


        const drawX =
            Math.round(
                this.x -
                drawWidth / 2 -
                extendLeft
            );


        const drawY =
            Math.round(
                this.y -
                drawHeight / 2
            );


        // ====================================================
        // LÍMITE DERECHO
        //
        // Antes:
        // this.x + 5
        //
        // Ahora:
        // this.x - 3
        //
        // Esto corta todavía más la derecha.
        // ====================================================

        const rightLimit =
            this.x - 3;


        const visibleWidth =
            Math.max(
                1,
                rightLimit -
                drawX
            );


        // ====================================================
        // GUARDAR CANVAS
        // ====================================================

        ctx.save();


        // ====================================================
        // CLIP
        //
        // MÁS ESPACIO HACIA LA IZQUIERDA.
        // MENOS ESPACIO HACIA LA DERECHA.
        // ====================================================

        ctx.beginPath();


        ctx.rect(

            drawX - 15,

            drawY,

            visibleWidth + 15,

            drawHeight
        );


        ctx.clip();


        // ====================================================
        // DIBUJAR ÚNICAMENTE EL FRAME ACTUAL
        // ====================================================

        ctx.drawImage(

            hunterDeathSprite,

            sourceX,
            0,

            sourceWidth,
            cellHeight,

            drawX,
            drawY,

            drawWidth,
            drawHeight
        );


        // ====================================================
        // RESTAURAR CANVAS
        // ====================================================

        ctx.restore();


        return true;
    }


    // ========================================================
    // DRAW
    // ========================================================

    draw(ctx) {

        if (!this.alive) {

            return;
        }


        const now =
            performance.now();


        // ====================================================
        // 1. MUERTE
        //
        // PRIORIDAD ABSOLUTA
        // ====================================================

        if (this.isDying) {

            const elapsed =
                now -
                this.deathStartedAt;


            // =================================================
            // TERMINÓ LA ANIMACIÓN
            // =================================================

            if (
                elapsed >=
                this.deathDuration
            ) {

                this.alive = false;

                return;
            }


            // =================================================
            // SOLO DIBUJAR MUERTE
            // =================================================

            this.drawDeathFrame(
                ctx,
                now
            );


            // NO DIBUJAR NADA MÁS
            return;
        }


        // ====================================================
        // 2. DAÑO
        // ====================================================

        if (
            now -
            this.hitStartedAt <
            this.hitDuration
        ) {

            // =================================================
            // SOLO DIBUJAR DAÑO
            // =================================================

            this.drawHitFrame(
                ctx
            );


            this.drawHealthBar(
                ctx
            );


            // NO DIBUJAR OTRO SPRITE
            return;
        }


        // ====================================================
        // 3. ATAQUE
        // ====================================================

        if (
            this.state === "ATTACK" &&
            this.attackStartedAt > 0
        ) {

            const frame =
                this.getAttackFrame(
                    now
                );


            this.drawFrame(

                ctx,

                hunterAttackSprite,

                frame,

                8,

                0.85
            );


            this.drawHealthBar(
                ctx
            );


            return;
        }


        // ====================================================
        // 4. PERSEGUIR
        // ====================================================

        if (
            this.state === "CHASE"
        ) {

            const frame =
                this.getDirectionalFrame();


            this.drawFrame(

                ctx,

                hunterRunSprite,

                frame,

                4,

                1
            );


            this.drawHealthBar(
                ctx
            );


            return;
        }


        // ====================================================
        // 5. QUIETO
        // ====================================================

        const frame =
            this.getDirectionalFrame();


        this.drawFrame(

            ctx,

            hunterIdleSprite,

            frame,

            4,

            1
        );


        this.drawHealthBar(
            ctx
        );
    }


    // ========================================================
    // BARRA DE VIDA
    // ========================================================

    drawHealthBar(ctx) {

        if (
            !this.alive ||
            this.isDying
        ) {

            return;
        }


        const barWidth =
            42;

        const barHeight =
            5;


        // ====================================================
        // PORCENTAJE DE VIDA
        // ====================================================

        const healthPercent =
            Math.max(
                0,
                Math.min(
                    1,
                    this.health /
                    this.maxHealth
                )
            );


        const healthWidth =
            barWidth *
            healthPercent;


        // ====================================================
        // POSICIÓN
        // ====================================================

        const barX =
            this.x -
            barWidth / 2;


        const barY =
            this.y -
            this.height / 2 -
            25;


        // ====================================================
        // FONDO
        // ====================================================

        ctx.fillStyle =
            "#222222";


        ctx.fillRect(

            barX,
            barY,

            barWidth,
            barHeight
        );


        // ====================================================
        // VIDA
        // ====================================================

        ctx.fillStyle =
            "#00ff88";


        ctx.fillRect(

            barX,
            barY,

            healthWidth,
            barHeight
        );
    }
}