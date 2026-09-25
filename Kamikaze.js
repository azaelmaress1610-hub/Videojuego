// ============================================================
// KAMIKAZE.JS
// Persigue al jugador y explota únicamente al tocarlo
// ============================================================

const kamikazeSpritePath = "Sprites/Kamikaze/";

const kamikazeSearchSprite = new Image();
kamikazeSearchSprite.src =
    `${kamikazeSpritePath}Kamikaze-buscar.png`;

const kamikazeWalkSprite = new Image();
kamikazeWalkSprite.src =
    `${kamikazeSpritePath}Kamikaze-caminar.png`;

const kamikazeDamageSprite = new Image();
kamikazeDamageSprite.src =
    `${kamikazeSpritePath}Kamikaze-daño.png`;

const kamikazeDeathSprite = new Image();
kamikazeDeathSprite.src =
    `${kamikazeSpritePath}Kamikaze-muerte.png`;


// Guarda los cuadros ya procesados
const kamikazeFrameCache = new Map();


// ============================================================
// ELIMINAR FONDO BLANCO O CUADRICULADO
// ============================================================

function removeKamikazeBackground(canvas) {

    const context = canvas.getContext(
        "2d",
        {
            willReadFrequently: true
        }
    );

    const pixels = context.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
    );

    const visited =
        new Uint8Array(
            canvas.width *
            canvas.height
        );

    const pending = [];


    // Detecta colores blancos y grises del fondo
    const isCheckerPixel = (x, y) => {

        const index =
            (y * canvas.width + x) * 4;

        const red =
            pixels.data[index];

        const green =
            pixels.data[index + 1];

        const blue =
            pixels.data[index + 2];

        const alpha =
            pixels.data[index + 3];

        const difference =
            Math.max(red, green, blue) -
            Math.min(red, green, blue);

        return (
            alpha > 0 &&
            difference < 24 &&
            red > 120 &&
            green > 120 &&
            blue > 120
        );
    };


    const addPixel = (x, y) => {

        const position =
            y * canvas.width + x;

        if (
            !visited[position] &&
            isCheckerPixel(x, y)
        ) {
            visited[position] = 1;
            pending.push(position);
        }
    };


    // Revisar bordes superior e inferior
    for (
        let x = 0;
        x < canvas.width;
        x += 1
    ) {
        addPixel(x, 0);

        addPixel(
            x,
            canvas.height - 1
        );
    }


    // Revisar bordes izquierdo y derecho
    for (
        let y = 1;
        y < canvas.height - 1;
        y += 1
    ) {
        addPixel(0, y);

        addPixel(
            canvas.width - 1,
            y
        );
    }


    // Eliminar fondo conectado con los bordes
    while (pending.length > 0) {

        const position =
            pending.pop();

        const x =
            position % canvas.width;

        const y =
            Math.floor(
                position / canvas.width
            );

        pixels.data[
            position * 4 + 3
        ] = 0;


        if (x > 0) {
            addPixel(x - 1, y);
        }

        if (x < canvas.width - 1) {
            addPixel(x + 1, y);
        }

        if (y > 0) {
            addPixel(x, y - 1);
        }

        if (y < canvas.height - 1) {
            addPixel(x, y + 1);
        }
    }


    // Eliminar cuadros claros que quedaron dentro
    for (
        let index = 0;
        index < pixels.data.length;
        index += 4
    ) {

        const red =
            pixels.data[index];

        const green =
            pixels.data[index + 1];

        const blue =
            pixels.data[index + 2];

        const difference =
            Math.max(red, green, blue) -
            Math.min(red, green, blue);

        if (
            difference < 24 &&
            red > 120 &&
            green > 120 &&
            blue > 120
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
// OBTENER UN SOLO CUADRO DEL SPRITE SHEET
// ============================================================

function getKamikazeFrame(
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
        kamikazeFrameCache.has(cacheKey)
    ) {
        return kamikazeFrameCache.get(
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
        Math.round(frameWidth);

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


    removeKamikazeBackground(
        frameCanvas
    );


    kamikazeFrameCache.set(
        cacheKey,
        frameCanvas
    );


    return frameCanvas;
}


// ============================================================
// CLASE KAMIKAZE
// ============================================================

class Kamikaze extends Enemy {

    constructor(x, y) {

        super(x, y);


        // TAMAÑO
        this.width = 34;
        this.height = 34;


        // ESTADÍSTICAS
        this.speed = 4.2;

        this.health = 55;
        this.maxHealth = 55;

        this.damage = 28;


        // ESTADO INICIAL
        this.state = "SPAWN";


        // ROTACIÓN
        this.directionAngle = 0;

        this.spriteDirectionOffset =
            -Math.PI / 2;


        // TIEMPOS DE ANIMACIÓN
        this.spawnStartedAt =
            performance.now();

        this.searchStartedAt =
            performance.now();

        this.walkStartedAt =
            performance.now();


        // DURACIONES
        this.searchDuration = 700;

        this.deathDuration = 900;

        this.hitDuration = 560;
    }


    // ========================================================
    // ACTUALIZAR KAMIKAZE
    // ========================================================

    update(player) {

        const now =
            performance.now();


        if (!this.alive) {
            return;
        }


        // Terminar animación de explosión
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


        // Si el jugador murió, deja de perseguirlo
        if (!player.alive) {

            this.state = "SEARCH";

            return;
        }


        // Dirección hacia el jugador
        const dx =
            player.x - this.x;

        const dy =
            player.y - this.y;

        const distance =
            Math.hypot(dx, dy);


        // Girar hacia el jugador
        if (distance > 0) {

            this.directionAngle =
                Math.atan2(dy, dx);
        }


        // Mientras recibe daño no se mueve
        if (
            now -
            this.hitStartedAt <
            this.hitDuration
        ) {
            return;
        }


        // ESTADO SPAWN
        if (this.state === "SPAWN") {

            this.state = "SEARCH";

            this.searchStartedAt = now;

            return;
        }


        // ESTADO SEARCH
        if (this.state === "SEARCH") {

            if (
                now -
                this.searchStartedAt >=
                this.searchDuration
            ) {
                this.state = "CHASE";

                this.walkStartedAt = now;
            }

            return;
        }


        // ESTADO CHASE
        if (this.state === "CHASE") {

            const playerWidth =
                Number.isFinite(player.width)
                    ? player.width
                    : 36;


            const playerHeight =
                Number.isFinite(player.height)
                    ? player.height
                    : playerWidth;


            const contactDistanceX =
                this.width / 2 +
                playerWidth / 2;


            const contactDistanceY =
                this.height / 2 +
                playerHeight / 2;


            // ================================================
            // COLISIÓN REAL CON EL JUGADOR
            // ================================================

            const touchingPlayer = (

                Math.abs(
                    player.x - this.x
                ) <= contactDistanceX

                &&

                Math.abs(
                    player.y - this.y
                ) <= contactDistanceY
            );


            // Solamente explota cuando toca al jugador
            if (touchingPlayer) {

                // Hace daño una sola vez
                damagePlayer(
                    this.damage
                );


                // Comienza inmediatamente la explosión
                this.health = 0;

                this.state = "DEAD";

                this.isDying = true;

                this.deathStartedAt = now;


                // Se queda quieto donde tocó al jugador
                return;
            }


            // Perseguir al jugador
            if (distance > 0) {

                this.x +=
                    (dx / distance) *
                    this.speed;

                this.y +=
                    (dy / distance) *
                    this.speed;
            }


            this.keepInsideCanvas();

            return;
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
                this.health - amount
            );


        this.hitStartedAt =
            performance.now();


        // Si se queda sin vida
        if (this.health === 0) {

            this.state = "DEAD";

            this.isDying = true;

            this.deathStartedAt =
                performance.now();
        }
    }


    // ========================================================
    // RESPETAR LÍMITES DEL CANVAS
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
    // DIBUJAR UN CUADRO DEL SPRITE
    // ========================================================

    drawSprite(
        ctx,
        sprite,
        frame,
        columns,
        scale,
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
            getKamikazeFrame(
                sprite,
                frame,
                columns
            );


        const drawWidth =
            this.width * scale;

        const drawHeight =
            this.height * scale;


        ctx.save();


        // Dibujar todos los cuadros exactamente
        // en el centro del Kamikaze
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
    // DIBUJAR KAMIKAZE
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


        let sprite =
            kamikazeSearchSprite;

        let columns = 7;

        let frameDuration = 110;

        let startedAt =
            this.searchStartedAt;

        let angle =

            this.directionAngle +

            this.spriteDirectionOffset;


        // ================================================
        // ANIMACIÓN DE EXPLOSIÓN
        // ================================================

        if (this.isDying) {

            sprite =
                kamikazeDeathSprite;

            columns = 5;

            frameDuration =

                this.deathDuration /

                columns;

            startedAt =
                this.deathStartedAt;


            angle =

                this.directionAngle +

                this.spriteDirectionOffset;
        }


        // ================================================
        // ANIMACIÓN DE DAÑO
        // ================================================

        else if (isHit) {

            sprite =
                kamikazeDamageSprite;

            columns = 7;

            frameDuration =

                this.hitDuration /

                columns;

            startedAt =
                this.hitStartedAt;
        }


        // ================================================
        // ANIMACIÓN DE CAMINATA
        // ================================================

        else if (
            this.state === "CHASE"
        ) {

            sprite =
                kamikazeWalkSprite;

            columns = 7;

            frameDuration = 95;

            startedAt =
                this.walkStartedAt;
        }


        // ================================================
        // CALCULAR CUADRO ACTUAL
        // ================================================

        const elapsed =
            Math.max(
                0,
                now - startedAt
            );


        const rawFrame =
            Math.floor(
                elapsed /
                frameDuration
            );


        // Daño y explosión solamente avanzan una vez.
        // Buscar y caminar se repiten continuamente.
        const frame =

            this.isDying ||
            isHit

                ? Math.min(
                    columns - 1,
                    rawFrame
                )

                : rawFrame %
                  columns;


        // ================================================
        // DIBUJAR SPRITE
        // ================================================

        const spriteDrawn =
            this.drawSprite(

                ctx,

                sprite,

                frame,

                columns,

                1.35,

                angle
            );


        // Figura de respaldo si el sprite no carga
        if (!spriteDrawn) {

            ctx.fillStyle =
                isHit
                    ? "#ffffff"
                    : "#ff2b2b";


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


        // Barra de vida
        if (!this.isDying) {

            this.drawHealthBar(

                ctx,

                44,
                5,
                11
            );
        }
    }
}