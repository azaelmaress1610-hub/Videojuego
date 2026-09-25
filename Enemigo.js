// ============================================================
// ENEMIGO.JS
// Clase base para todos los enemigos
// ============================================================

class Enemy {

    constructor(x, y) {

        // POSICIÓN
        this.x = x;
        this.y = y;

        // TAMAÑO
        this.width = 35;
        this.height = 35;

        // ESTADÍSTICAS
        this.speed = 2;

        this.health = 100;
        this.maxHealth = 100;

        this.damage = 10;

        // ESTADO
        this.state = "SPAWN";

        // VIDA
        this.alive = true;

        // DAÑO
        this.hitStartedAt = -Infinity;
        this.hitDuration = 350;

        // MUERTE
        this.isDying = false;
        this.deathStartedAt = 0;
        this.deathDuration = 1200;

        // DIRECCIÓN
        this.direction = "DOWN";
    }


    // ========================================================
    // UPDATE
    // Cada enemigo implementa su comportamiento
    // ========================================================

    update(player) {

    }


    // ========================================================
    // DRAW
    // Cada enemigo dibuja sus propios sprites
    // ========================================================

    draw(ctx) {

    }


    // ========================================================
    // RECIBIR DAÑO
    // ========================================================

    takeDamage(amount) {

        if (!this.alive || this.isDying) {
            return;
        }

        this.health -= amount;

        if (this.health < 0) {
            this.health = 0;
        }

        // Todavía tiene vida
        if (this.health > 0) {

            this.hitStartedAt =
                performance.now();

            return;
        }

        // MUERTE
        this.health = 0;

        this.state = "DEAD";

        this.isDying = true;

        this.deathStartedAt =
            performance.now();
    }


    // ========================================================
    // DISTANCIA A JUGADOR
    // ========================================================

    getDistanceToPlayer(player) {

        const dx =
            player.x - this.x;

        const dy =
            player.y - this.y;

        return Math.sqrt(
            dx * dx +
            dy * dy
        );
    }


    // ========================================================
    // VECTOR HACIA JUGADOR
    // ========================================================

    getDirectionToPlayer(player) {

        const dx =
            player.x - this.x;

        const dy =
            player.y - this.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (distance === 0) {

            return {
                x: 0,
                y: 0
            };
        }

        return {

            x: dx / distance,
            y: dy / distance
        };
    }


    // ========================================================
    // ACTUALIZAR DIRECCIÓN
    // ========================================================

    updateDirection(dx, dy) {

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
    // MOVER HACIA JUGADOR
    // ========================================================

    moveTowardPlayer(player) {

        const dx =
            player.x - this.x;

        const dy =
            player.y - this.y;

        const distance =
            Math.sqrt(
                dx * dx +
                dy * dy
            );

        if (distance === 0) {
            return;
        }

        this.updateDirection(
            dx,
            dy
        );

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


    // ========================================================
    // DIBUJAR FRAME
    // ========================================================

    drawSpriteFrame(
        ctx,
        sprite,
        frame,
        columns,
        rows,
        scaleX = 1,
        scaleY = 1
    ) {

        if (
            !sprite ||
            !sprite.complete ||
            !sprite.naturalWidth
        ) {

            return false;
        }

        const frameWidth =
            sprite.naturalWidth /
            columns;

        const frameHeight =
            sprite.naturalHeight /
            rows;

        const column =
            frame % columns;

        const row =
            Math.floor(
                frame / columns
            );

        const sourceX =
            column *
            frameWidth;

        const sourceY =
            row *
            frameHeight;

        const drawWidth =
            this.width *
            scaleX;

        const drawHeight =
            this.height *
            scaleY;

        ctx.drawImage(

            sprite,

            sourceX,
            sourceY,

            frameWidth,
            frameHeight,

            this.x -
            drawWidth / 2,

            this.y -
            drawHeight / 2,

            drawWidth,
            drawHeight
        );

        return true;
    }


    // ========================================================
    // BARRA DE VIDA
    // ========================================================

    drawHealthBar(
        ctx,
        width = 40,
        height = 5,
        offsetY = 14
    ) {

        if (
            !this.alive ||
            this.isDying
        ) {
            return;
        }

        let percentage =
            this.health /
            this.maxHealth;

        percentage =
            Math.max(
                0,
                Math.min(
                    1,
                    percentage
                )
            );

        // FONDO
        ctx.fillStyle =
            "#222222";

        ctx.fillRect(

            this.x -
            width / 2,

            this.y -
            this.height / 2 -
            offsetY,

            width,
            height
        );

        // VIDA
        ctx.fillStyle =
            "#00ff88";

        ctx.fillRect(

            this.x -
            width / 2,

            this.y -
            this.height / 2 -
            offsetY,

            width *
            percentage,

            height
        );
    }


    // ========================================================
    // COLISIÓN CON PUNTO
    // ========================================================

    containsPoint(x, y) {

        return (

            x >=
            this.x -
            this.width / 2

            &&

            x <=
            this.x +
            this.width / 2

            &&

            y >=
            this.y -
            this.height / 2

            &&

            y <=
            this.y +
            this.height / 2
        );
    }


    // ========================================================
    // COLISIÓN CON OBJETO
    // ========================================================

    collidesWith(object) {

        if (!object) {
            return false;
        }

        return (

            this.x -
            this.width / 2

            <

            object.x +
            object.width / 2

            &&

            this.x +
            this.width / 2

            >

            object.x -
            object.width / 2

            &&

            this.y -
            this.height / 2

            <

            object.y +
            object.height / 2

            &&

            this.y +
            this.height / 2

            >

            object.y -
            object.height / 2
        );
    }
}