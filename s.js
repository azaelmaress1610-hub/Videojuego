const canvas =
    document.getElementById("gameCanvas");

const ctx =
    canvas.getContext("2d");

ctx.imageSmoothingEnabled =
    false;

ctx.webkitImageSmoothingEnabled =
    false;

ctx.msImageSmoothingEnabled =
    false;


// ============================================================
// CARGAR SPRITES
// ============================================================

const spriteSheets = {};

const SPRITES_PATH =
    "Sprites/";


function loadSprite(
    name,
    path
) {
    const image =
        new Image();

    image.src =
        path;

    spriteSheets[name] =
        image;
}


// ============================================================
// PERSONAJES Y ARMAS
// ============================================================

if (
    !window.PersonajeNormal ||
    !window.PersonajeEscopeta ||
    !window.PersonajeEspada
) {
    throw new Error(
        "Carga PersonajeNormal.js, PersonajeEscopeta.js y PersonajeEspada.js antes de main.js"
    );
}


const PLAYER_WEAPONS =
    Object.freeze({

        NORMAL:
            window
                .PersonajeNormal
                .id,

        SHOTGUN:
            window
                .PersonajeEscopeta
                .id,

        SWORD:
            window
                .PersonajeEspada
                .id

    });


const weaponConfig =
    Object.freeze({

        [PLAYER_WEAPONS.NORMAL]:
            window.PersonajeNormal,

        [PLAYER_WEAPONS.SHOTGUN]:
            window.PersonajeEscopeta,

        [PLAYER_WEAPONS.SWORD]:
            window.PersonajeEspada

    });


function createPlayerFrames(
    character,
    prefix
) {
    const states = {

        appearance:
            "aparicion",

        aim:
            "apuntar",

        walk:
            "caminar",

        run:
            "correr",

        hit:
            "dano",

        attack:
            "disparar",

        idle:
            "espera",

        death:
            "muerte"

    };

    const frames = {};

    for (
        const [
            gameState,
            characterState
        ]
        of Object.entries(
            states
        )
    ) {
        const animation =
            character
                .obtenerAnimacion(
                    characterState
                );

        const spriteName =
            `${prefix}_${gameState}`;

        loadSprite(
            spriteName,
            animation.src
        );

        frames[gameState] = {

            sprite:
                spriteName,

            frames:
                animation.frames,

            fps:
                animation.fps,

            repeat:
                animation.repetir

        };
    }

    return Object.freeze(
        frames
    );
}


// ============================================================
// ANIMACIONES DEL PERSONAJE NORMAL
// ============================================================

const playerFrames =
    createPlayerFrames(
        window.PersonajeNormal,
        "normal"
    );


// ============================================================
// ANIMACIONES DE LA ESCOPETA
// ============================================================

const shotgunFrames =
    createPlayerFrames(
        window.PersonajeEscopeta,
        "shotgun"
    );


// ============================================================
// ANIMACIONES DE LA ESPADA
// ============================================================

const swordFrames =
    createPlayerFrames(
        window.PersonajeEspada,
        "sword"
    );


// ============================================================
// OBTENER ANIMACIONES DEL ARMA ACTUAL
// ============================================================

function getActivePlayerFrames() {

    if (
        player.weapon ===
        PLAYER_WEAPONS.SHOTGUN
    ) {
        return shotgunFrames;
    }

    if (
        player.weapon ===
        PLAYER_WEAPONS.SWORD
    ) {
        return swordFrames;
    }

    return playerFrames;
}


const playerFrameCache =
    new Map();


// ============================================================
// QUITAR FONDO DEL JUGADOR
// ============================================================

function removePlayerCheckerboard(
    context,
    width,
    height,
    pixels
) {
    const visited =
        new Uint8Array(
            width * height
        );

    const pending = [];


    function isBackground(
        x,
        y
    ) {
        const index =
            (
                y * width +
                x
            ) * 4;

        const red =
            pixels[index];

        const green =
            pixels[
                index + 1
            ];

        const blue =
            pixels[
                index + 2
            ];

        const brightness =
            (
                red +
                green +
                blue
            ) / 3;

        const colorRange =
            Math.max(
                red,
                green,
                blue
            ) -
            Math.min(
                red,
                green,
                blue
            );

        return (
            pixels[index + 3] >
                0 &&

            colorRange < 35 &&

            (
                brightness < 45 ||
                brightness > 115
            )
        );
    }


    function addIfBackground(
        x,
        y
    ) {
        const position =
            y * width +
            x;

        if (
            !visited[position] &&
            isBackground(
                x,
                y
            )
        ) {
            visited[position] =
                1;

            pending.push(
                position
            );
        }
    }


    for (
        let x = 0;
        x < width;
        x += 1
    ) {
        addIfBackground(
            x,
            0
        );

        addIfBackground(
            x,
            height - 1
        );
    }


    for (
        let y = 1;
        y < height - 1;
        y += 1
    ) {
        addIfBackground(
            0,
            y
        );

        addIfBackground(
            width - 1,
            y
        );
    }


    while (
        pending.length > 0
    ) {
        const position =
            pending.pop();

        const x =
            position %
            width;

        const y =
            Math.floor(
                position /
                width
            );

        pixels[
            position * 4 + 3
        ] = 0;


        for (
            let offsetY = -1;
            offsetY <= 1;
            offsetY += 1
        ) {
            for (
                let offsetX = -1;
                offsetX <= 1;
                offsetX += 1
            ) {
                if (
                    offsetX === 0 &&
                    offsetY === 0
                ) {
                    continue;
                }

                const neighborX =
                    x +
                    offsetX;

                const neighborY =
                    y +
                    offsetY;

                if (
                    neighborX >= 0 &&
                    neighborX < width &&
                    neighborY >= 0 &&
                    neighborY < height
                ) {
                    addIfBackground(
                        neighborX,
                        neighborY
                    );
                }
            }
        }
    }
}


// ============================================================
// QUITAR FRAGMENTOS SOBRANTES
// ============================================================

function removeDetachedPlayerFragments(
    width,
    height,
    data
) {
    const visited =
        new Uint8Array(
            width * height
        );

    const components = [];


    for (
        let start = 0;
        start <
            width * height;
        start += 1
    ) {
        if (
            visited[start] ||

            data[
                start * 4 + 3
            ] === 0
        ) {
            continue;
        }

        const component = [];

        const pending = [
            start
        ];

        visited[start] =
            1;


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
                width;

            const y =
                Math.floor(
                    position /
                    width
                );


            for (
                let offsetY = -1;
                offsetY <= 1;
                offsetY += 1
            ) {
                for (
                    let offsetX = -1;
                    offsetX <= 1;
                    offsetX += 1
                ) {
                    if (
                        offsetX === 0 &&
                        offsetY === 0
                    ) {
                        continue;
                    }

                    const neighborX =
                        x +
                        offsetX;

                    const neighborY =
                        y +
                        offsetY;

                    if (
                        neighborX < 0 ||
                        neighborX >= width ||
                        neighborY < 0 ||
                        neighborY >= height
                    ) {
                        continue;
                    }

                    const neighbor =
                        neighborY *
                        width +
                        neighborX;

                    if (
                        !visited[
                            neighbor
                        ] &&

                        data[
                            neighbor *
                            4 +
                            3
                        ] > 0
                    ) {
                        visited[
                            neighbor
                        ] = 1;

                        pending.push(
                            neighbor
                        );
                    }
                }
            }
        }

        components.push(
            component
        );
    }


    for (
        const component
        of components
    ) {
        let minimumX =
            width;

        for (
            const position
            of component
        ) {
            minimumX =
                Math.min(
                    minimumX,

                    position %
                    width
                );
        }

        if (
            component.length <
                25 &&

            minimumX <
                width * 0.2
        ) {
            for (
                const position
                of component
            ) {
                data[
                    position *
                    4 +
                    3
                ] = 0;
            }
        }
    }
}


// ============================================================
// CARGAR MAPAS
// ============================================================

loadSprite(
    "arena1",
    `${SPRITES_PATH}Arena1.png`
);

loadSprite(
    "arena2",
    `${SPRITES_PATH}Arena2.png`
);

loadSprite(
    "arena3",
    `${SPRITES_PATH}Arena3.png`
);


// ============================================================
// SPRITES AUXILIARES DE ENEMIGOS
// ============================================================

loadSprite(
    "hunter",
    `${SPRITES_PATH}Hunter.png`
);

loadSprite(
    "ranger",
    `${SPRITES_PATH}Ranger.png`
);

loadSprite(
    "swarm",
    `${SPRITES_PATH}Swarm.png`
);

loadSprite(
    "tank",
    `${SPRITES_PATH}Tank.png`
);


// ============================================================
// DIBUJAR CUADRO DE UN SPRITE
// ============================================================

function drawSpriteFrame(
    context,
    spriteName,
    x,
    y,
    width,
    height,
    frame = 0,
    row = 0,
    angle = 0,
    flipX = false
) {
    const image =
        spriteSheets[
            spriteName
        ];

    if (
        !image ||
        !image.complete ||
        !image.naturalWidth
    ) {
        return false;
    }

    const columns = 8;

    const rows = 4;

    const sourceWidth =
        image.naturalWidth /
        columns;

    const sourceHeight =
        image.naturalHeight /
        rows;

    context.save();

    context.translate(
        x,
        y
    );

    context.rotate(
        angle
    );

    context.scale(
        flipX
            ? -1
            : 1,

        1
    );

    context.drawImage(
        image,

        (
            frame %
            columns
        ) *
        sourceWidth,

        (
            row %
            rows
        ) *
        sourceHeight,

        sourceWidth,
        sourceHeight,

        -width / 2,
        -height / 2,

        width,
        height
    );

    context.restore();

    return true;
}


// ============================================================
// PROCESAR CUADRO DEL JUGADOR
// ============================================================

function drawPlayerFrame(
    context,
    x,
    y,
    width,
    height,
    type,
    frame,
    direction = "down",
    flipX = false,
    rotation = 0
) {
    const activeFrames =
        getActivePlayerFrames();

    const animation =
        activeFrames[type] ||
        activeFrames.idle;

    const image =
        spriteSheets[
            animation.sprite
        ];

    const frameCount =
        animation.frames;

    const frameWidth =
        image
            ? Math.floor(
                image.naturalWidth /
                frameCount
            )
            : 0;

    const frameHeight =
        image
            ? Math.floor(
                image.naturalHeight
            )
            : 0;

    const source =
        image
            ? {
                x:
                    Math.min(
                        frame,

                        frameCount -
                        1
                    ) *
                    frameWidth,

                y:
                    0,

                width:
                    frameWidth,

                height:
                    frameHeight
            }

            : null;

    flipX =
        direction === "left" ||
        flipX;


    if (
        !image ||
        !image.complete ||
        !image.naturalWidth ||
        !source
    ) {
        return false;
    }


    const cacheKey =
        `${animation.sprite}-${type}-${direction}-${frame}`;


    let frameCanvas =
        playerFrameCache.get(
            cacheKey
        );


    if (!frameCanvas) {
        frameCanvas =
            document
                .createElement(
                    "canvas"
                );

        frameCanvas.width =
            source.width;

        frameCanvas.height =
            source.height;


        const frameContext =
            frameCanvas
                .getContext(
                    "2d"
                );

        frameContext
            .imageSmoothingEnabled =
            false;

        frameContext
            .webkitImageSmoothingEnabled =
            false;

        frameContext
            .msImageSmoothingEnabled =
            false;


        frameContext.drawImage(
            image,

            source.x,
            source.y,
            source.width,
            source.height,

            0,
            0,
            source.width,
            source.height
        );


        const edgeSize =
            type === "attackUp" ||
            type === "attackDown"
                ? 10
                : 3;


        frameContext.clearRect(
            0,
            0,
            source.width,
            edgeSize
        );

        frameContext.clearRect(
            0,

            source.height -
                edgeSize,

            source.width,
            edgeSize
        );

        frameContext.clearRect(
            0,
            0,
            edgeSize,
            source.height
        );

        frameContext.clearRect(
            source.width -
                edgeSize,

            0,
            edgeSize,
            source.height
        );


        const pixels =
            frameContext
                .getImageData(
                    0,
                    0,
                    source.width,
                    source.height
                );

        const data =
            pixels.data;


        removePlayerCheckerboard(
            frameContext,

            source.width,
            source.height,

            data
        );


        let minimumX =
            source.width;

        let minimumY =
            source.height;

        let maximumX =
            -1;

        let maximumY =
            -1;


        for (
            let pixelY = 0;
            pixelY < source.height;
            pixelY += 1
        ) {
            for (
                let pixelX = 0;
                pixelX < source.width;
                pixelX += 1
            ) {
                const index =
                    (
                        pixelY *
                        source.width +
                        pixelX
                    ) * 4;

                const alpha =
                    data[
                        index + 3
                    ];

                if (
                    alpha === 0
                ) {
                    continue;
                }

                const red =
                    data[index];

                const green =
                    data[
                        index + 1
                    ];

                const blue =
                    data[
                        index + 2
                    ];


                if (
                    red > 245 &&
                    green > 245 &&
                    blue > 245
                ) {
                    data[
                        index + 3
                    ] = 0;

                    continue;
                }


                minimumX =
                    Math.min(
                        minimumX,
                        pixelX
                    );

                minimumY =
                    Math.min(
                        minimumY,
                        pixelY
                    );

                maximumX =
                    Math.max(
                        maximumX,
                        pixelX
                    );

                maximumY =
                    Math.max(
                        maximumY,
                        pixelY
                    );
            }
        }


        frameContext.putImageData(
            pixels,
            0,
            0
        );


        if (
            minimumX <=
                maximumX &&

            minimumY <=
                maximumY
        ) {
            const cropWidth =
                maximumX -
                minimumX +
                1;

            const cropHeight =
                maximumY -
                minimumY +
                1;


            const croppedCanvas =
                document
                    .createElement(
                        "canvas"
                    );

            croppedCanvas.width =
                cropWidth;

            croppedCanvas.height =
                cropHeight;


            const croppedContext =
                croppedCanvas
                    .getContext(
                        "2d"
                    );

            croppedContext
                .imageSmoothingEnabled =
                false;


            croppedContext.drawImage(
                frameCanvas,

                minimumX,
                minimumY,
                cropWidth,
                cropHeight,

                0,
                0,
                cropWidth,
                cropHeight
            );


            const croppedPixels =
                croppedContext
                    .getImageData(
                        0,
                        0,
                        cropWidth,
                        cropHeight
                    );

            const croppedData =
                croppedPixels.data;


            for (
                let index = 0;
                index <
                    croppedData.length;
                index += 4
            ) {
                const red =
                    croppedData[
                        index
                    ];

                const green =
                    croppedData[
                        index + 1
                    ];

                const blue =
                    croppedData[
                        index + 2
                    ];

                const alpha =
                    croppedData[
                        index + 3
                    ];

                if (
                    alpha > 0 &&
                    red < 15 &&
                    green < 15 &&
                    blue < 15
                ) {
                    croppedData[
                        index + 3
                    ] = 0;
                }
            }


            croppedContext
                .putImageData(
                    croppedPixels,
                    0,
                    0
                );


            playerFrameCache.set(
                cacheKey,
                croppedCanvas
            );

            frameCanvas =
                croppedCanvas;
        }

        else {
            playerFrameCache.set(
                cacheKey,
                frameCanvas
            );
        }
    }


    context.save();

    context.translate(
        x,
        y
    );

    context.scale(
        flipX
            ? -1
            : 1,

        1
    );

    context.rotate(
        rotation
    );

    context.filter =
        "contrast(1.45) " +
        "brightness(1.22) " +
        "saturate(1.9) " +
        "hue-rotate(2deg)";


    context.drawImage(
        frameCanvas,

        0,
        0,

        frameCanvas.width,
        frameCanvas.height,

        -width / 2,
        -height / 2,

        width,
        height
    );

    context.restore();

    return true;
}

// ============================================================
// CONFIGURAR CANVAS
// ============================================================

canvas.width =
    window.innerWidth;

canvas.height =
    window.innerHeight;


// ============================================================
// JUGADOR
// ============================================================

const player = {

    x:
        canvas.width / 2,

    y:
        canvas.height * 0.67,

    width:
        42,

    height:
        58,

    collisionRadius:
        15,

    speed:
        5,

    angle:
        0,

    health:
        100,

    maxHealth:
        100,

    alive:
        true,

    damage:
        25,

    weapon:
        PLAYER_WEAPONS.NORMAL,

    weaponName:
        "ARMA NORMAL",

    weaponSwitching:
        false,

    weaponSwitchStartedAt:
        0,

    weaponSwitchDuration:
        700,

    resistance:
        0,

    moving:
        false,

    facing:
        1,

    direction:
        "down",

    movementPose:
        0,

    walkStartedAt:
        0,

    aimPose:
        2,

    shooting:
        false,

    shootingStartedAt:
        0,

    lastShotAt:
        0,

    fireCooldown:
        180,

    hit:
        false,

    hitStartedAt:
        0,

    deathStartedAt:
        0

};


// ============================================================
// ESTADÍSTICAS PARA EL RANKING
// ============================================================

let enemiesDefeated =
    0;

let neonScoreRegistered =
    false;


// ============================================================
// DIBUJAR ARENA
// ============================================================

function drawArena() {

    /*
     * Nexus Prime:
     * oleadas 10, 20, 30...
     */

    const nexusWaveActive =
        waveState ===
            "FIGHTING" &&

        currentWave > 0 &&

        currentWave %
            10 ===
            0;


    /*
     * Cerberon:
     * oleadas 5, 15, 25...
     */

    const cerberonWaveActive =
        waveState ===
            "FIGHTING" &&

        currentWave > 0 &&

        currentWave %
            5 ===
            0;


    let arena;


    if (
        nexusWaveActive
    ) {
        arena =
            spriteSheets.arena3;
    }

    else if (
        cerberonWaveActive
    ) {
        arena =
            spriteSheets.arena2;
    }

    else {
        arena =
            spriteSheets.arena1;
    }


    if (
        arena &&
        arena.complete &&
        arena.naturalWidth
    ) {
        ctx.drawImage(
            arena,

            0,
            0,

            canvas.width,
            canvas.height
        );

        return;
    }


    // ========================================================
    // FONDO PROVISIONAL
    // ========================================================

    const background =
        ctx.createLinearGradient(
            0,
            0,
            0,
            canvas.height
        );


    background.addColorStop(
        0,
        "#08152b"
    );

    background.addColorStop(
        0.55,
        "#101d35"
    );

    background.addColorStop(
        1,
        "#160d2b"
    );


    ctx.fillStyle =
        background;


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.strokeStyle =
        "rgba(0, 225, 255, 0.22)";

    ctx.lineWidth =
        1;


    const horizon =
        canvas.height *
        0.42;


    for (
        let y = horizon;
        y < canvas.height;
        y += 38
    ) {
        ctx.beginPath();

        ctx.moveTo(
            0,
            y
        );

        ctx.lineTo(
            canvas.width,
            y
        );

        ctx.stroke();
    }


    for (
        let x =
            -canvas.width;

        x <
            canvas.width *
            2;

        x += 90
    ) {
        ctx.beginPath();

        ctx.moveTo(
            canvas.width /
                2,

            horizon
        );

        ctx.lineTo(
            x,
            canvas.height
        );

        ctx.stroke();
    }


    ctx.fillStyle =
        "rgba(0, 255, 255, 0.08)";


    ctx.fillRect(
        0,

        horizon -
            2,

        canvas.width,

        4
    );


    ctx.strokeStyle =
        "rgba(130, 75, 255, 0.35)";

    ctx.lineWidth =
        2;


    ctx.strokeRect(
        16,
        16,

        canvas.width -
            32,

        canvas.height -
            32
    );
}


// ============================================================
// DIBUJAR JUGADOR
// ============================================================

function drawPlayer() {

    const shootingDuration =
        420;

    const hitDuration =
        160;

    const deathDuration =
        2400;


    let frame =
        0;

    let animation =
        "idle";


    const activeFrames =
        getActivePlayerFrames();


    // ========================================================
    // CAMBIO DE ARMA
    // ========================================================

    if (
        player.alive &&
        player.weaponSwitching
    ) {
        const elapsed =
            performance.now() -
            player
                .weaponSwitchStartedAt;


        if (
            elapsed >=
            player
                .weaponSwitchDuration
        ) {
            player.weaponSwitching =
                false;
        }

        else if (
            player.weapon !==
            PLAYER_WEAPONS.NORMAL
        ) {
            animation =
                "appearance";


            const frameCount =
                activeFrames
                    .appearance
                    .frames;


            frame =
                Math.min(
                    frameCount -
                        1,

                    Math.floor(
                        elapsed /
                        (
                            player
                                .weaponSwitchDuration /
                            frameCount
                        )
                    )
                );
        }
    }


    // ========================================================
    // MUERTE
    // ========================================================

    if (
        !player.alive
    ) {
        const elapsed =
            performance.now() -
            player
                .deathStartedAt;


        const frameCount =
            activeFrames
                .death
                .frames;


        frame =
            Math.min(
                frameCount -
                    1,

                Math.floor(
                    elapsed /
                    (
                        deathDuration /
                        frameCount
                    )
                )
            );


        animation =
            "death";
    }


    // ========================================================
    // RECIBIR DAÑO
    // ========================================================

    else if (
        !player.weaponSwitching &&
        player.hit
    ) {
        const elapsed =
            performance.now() -
            player
                .hitStartedAt;


        if (
            elapsed >=
            hitDuration
        ) {
            player.hit =
                false;
        }

        else {
            const frameCount =
                activeFrames
                    .hit
                    .frames;


            frame =
                Math.min(
                    frameCount -
                        1,

                    Math.floor(
                        elapsed /
                        (
                            hitDuration /
                            frameCount
                        )
                    )
                );


            animation =
                "hit";
        }
    }


    // ========================================================
    // ATAQUE
    // ========================================================

    if (
        player.alive &&
        !player.weaponSwitching &&
        !player.hit &&
        player.shooting
    ) {
        const elapsed =
            performance.now() -
            player
                .shootingStartedAt;


        if (
            elapsed >=
            shootingDuration
        ) {
            player.shooting =
                false;
        }

        else {
            const frameCount =
                activeFrames
                    .attack
                    .frames;


            frame =
                Math.min(
                    frameCount -
                        1,

                    Math.floor(
                        elapsed /
                        (
                            shootingDuration /
                            frameCount
                        )
                    )
                );


            animation =
                "attack";
        }
    }


    // ========================================================
    // CAMINAR O ESTAR QUIETO
    // ========================================================

    if (
        player.alive &&
        !player.weaponSwitching &&
        !player.hit &&
        !player.shooting
    ) {
        animation =
            player.moving
                ? "walk"
                : "idle";


        if (
            player.moving
        ) {
            const frameCount =
                activeFrames
                    .walk
                    .frames;


            frame =
                Math.floor(
                    (
                        performance.now() -
                        player
                            .walkStartedAt
                    ) /
                    90
                ) %
                frameCount;
        }

        else {
            frame =
                player.direction ===
                    "left"
                    ? 1
                    : 0;
        }
    }


    const flipSprite =
        player.direction ===
        "left";


    const activeCharacter =
        weaponConfig[
            player.weapon
        ];


    /*
     * Los tres personajes utilizan
     * exactamente 42 x 58.
     */

    const drawWidth =
        activeCharacter
            .dimensiones
            .width;


    const drawHeight =
        activeCharacter
            .dimensiones
            .height;


    const playerWasDrawn =
        drawPlayerFrame(
            ctx,

            player.x,
            player.y,

            drawWidth,
            drawHeight,

            animation,
            frame,

            player.direction,
            flipSprite,

            0
        );


    if (
        !playerWasDrawn
    ) {
        ctx.fillStyle =
            "#00ffff";

        ctx.fillRect(
            player.x -
                player.width /
                2,

            player.y -
                player.height /
                2,

            player.width,
            player.height
        );
    }
}


// ============================================================
// BARRA DE VIDA
// ============================================================

function drawPlayerHealth() {

    const barWidth =
        250;

    const barHeight =
        20;

    const positionX =
        20;

    const positionY =
        20;


    ctx.fillStyle =
        "#222222";


    ctx.fillRect(
        positionX,
        positionY,
        barWidth,
        barHeight
    );


    const healthPercentage =
        Math.max(
            0,

            player.health /
            player.maxHealth
        );


    ctx.fillStyle =
        "#00ff88";


    ctx.fillRect(
        positionX,
        positionY,

        barWidth *
        healthPercentage,

        barHeight
    );


    ctx.strokeStyle =
        "#ffffff";

    ctx.lineWidth =
        2;


    ctx.strokeRect(
        positionX,
        positionY,
        barWidth,
        barHeight
    );


    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "16px Arial";


    ctx.fillText(
        `VIDA: ${player.health} / ${player.maxHealth}`,

        positionX,

        positionY +
            45
    );
}


// ============================================================
// INDICADOR DEL ARMA
// ============================================================

function drawWeaponHUD() {

    ctx.save();


    if (
        player.weapon ===
        PLAYER_WEAPONS.SWORD
    ) {
        ctx.fillStyle =
            "#37eaff";
    }

    else if (
        player.weapon ===
        PLAYER_WEAPONS.SHOTGUN
    ) {
        ctx.fillStyle =
            "#ffb229";
    }

    else {
        ctx.fillStyle =
            "#ffffff";
    }


    ctx.font =
        "bold 16px Arial";

    ctx.textAlign =
        "left";


    ctx.fillText(
        `ARMA: ${player.weaponName}  [Q PARA CAMBIAR]`,

        20,
        86
    );


    ctx.restore();
}


// ============================================================
// CONTROLES
// ============================================================

const keys = {};


// ============================================================
// CAMBIAR ARMA
// ============================================================

function changePlayerWeapon() {

    if (
        !player.alive ||
        player.weaponSwitching ||
        (
            window.neonMenuLoaded ===
                true &&

            (
                window.neonGameStarted !==
                    true ||

                window.neonGamePaused ===
                    true
            )
        )
    ) {
        return;
    }


    /*
     * Orden de las armas:
     *
     * Normal -> Escopeta -> Espada -> Normal
     */

    const weaponOrder = [

        PLAYER_WEAPONS.NORMAL,

        PLAYER_WEAPONS.SHOTGUN,

        PLAYER_WEAPONS.SWORD

    ];


    const currentWeaponIndex =
        weaponOrder.indexOf(
            player.weapon
        );


    const nextWeaponIndex =
        (
            currentWeaponIndex +
            1
        ) %
        weaponOrder.length;


    player.weapon =
        weaponOrder[
            nextWeaponIndex
        ];


    const configuration =
        weaponConfig[
            player.weapon
        ];


    configuration
        .aplicarAlJugador(
            player
        );


    player.weapon =
        configuration.id;


    player.weaponSwitching =
        true;


    player.weaponSwitchStartedAt =
        performance.now();


    player.shooting =
        false;


    player.moving =
        false;
}


// ============================================================
// PRESIONAR TECLA
// ============================================================

window.addEventListener(
    "keydown",

    function (event) {

        const key =
            event.key
                .toLowerCase();


        if (
            key === "arrowup" ||
            key === "arrowdown" ||
            key === "arrowleft" ||
            key === "arrowright"
        ) {
            event.preventDefault();
        }


        if (
            key === "q" &&
            !event.repeat
        ) {
            changePlayerWeapon();
        }


        keys[key] =
            true;
    }
);


// ============================================================
// SOLTAR TECLA
// ============================================================

window.addEventListener(
    "keyup",

    function (event) {

        keys[
            event.key
                .toLowerCase()
        ] = false;

    }
);


// ============================================================
// VENTANA SIN ENFOQUE
// ============================================================

window.addEventListener(
    "blur",

    function () {

        for (
            const key
            in keys
        ) {
            keys[key] =
                false;
        }

        player.moving =
            false;
    }
);


// ============================================================
// MOUSE
// ============================================================

const mouse = {

    x:
        0,

    y:
        0

};


canvas.addEventListener(
    "mousemove",

    function (event) {

        const rect =
            canvas
                .getBoundingClientRect();


        mouse.x =
            (
                event.clientX -
                rect.left
            ) *
            (
                canvas.width /
                rect.width
            );


        mouse.y =
            (
                event.clientY -
                rect.top
            ) *
            (
                canvas.height /
                rect.height
            );


        player.angle =
            Math.atan2(
                mouse.y -
                    player.y,

                mouse.x -
                    player.x
            );


        player.aimPose =
            Math.round(
                (
                    player.angle +
                    Math.PI /
                    2
                ) /
                (
                    Math.PI /
                    4
                )
            ) %
            8;


        if (
            player.aimPose <
            0
        ) {
            player.aimPose +=
                8;
        }
    }
);


// ============================================================
// PROYECTILES
// ============================================================

const projectiles = [];


// ============================================================
// ACTUALIZAR JUGADOR
// ============================================================

function updatePlayer() {

    if (
        !player.alive ||
        player.weaponSwitching
    ) {
        player.moving =
            false;

        return;
    }


    let directionX =
        0;

    let directionY =
        0;


    // ========================================================
    // MOVIMIENTO VERTICAL
    // ========================================================

    if (
        keys["w"] ||
        keys["arrowup"]
    ) {
        directionY -=
            1;
    }


    if (
        keys["s"] ||
        keys["arrowdown"]
    ) {
        directionY +=
            1;
    }


    // ========================================================
    // MOVIMIENTO HORIZONTAL
    // ========================================================

    if (
        keys["a"] ||
        keys["arrowleft"]
    ) {
        directionX -=
            1;
    }


    if (
        keys["d"] ||
        keys["arrowright"]
    ) {
        directionX +=
            1;
    }


    const wasMoving =
        player.moving;


    player.moving =
        directionX !==
            0 ||

        directionY !==
            0;


    if (
        player.moving &&
        !wasMoving
    ) {
        player.walkStartedAt =
            performance.now();
    }


    // ========================================================
    // DIRECCIÓN DEL PERSONAJE
    // ========================================================

    if (
        player.moving
    ) {
        if (
            directionY <
            0
        ) {
            player.direction =
                "up";
        }

        else if (
            directionY >
            0
        ) {
            player.direction =
                "down";
        }

        else if (
            directionX >
            0
        ) {
            player.direction =
                "right";
        }

        else if (
            directionX <
            0
        ) {
            player.direction =
                "left";
        }


        player.movementPose =
            Math.floor(
                (
                    performance.now() -
                    player.walkStartedAt
                ) /
                90
            ) %
            8;


        if (
            directionX >
            0
        ) {
            player.facing =
                1;
        }

        else if (
            directionX <
            0
        ) {
            player.facing =
                -1;
        }
    }


    else if (
        player.angle >=
            -Math.PI /
            2 &&

        player.angle <=
            Math.PI /
            2
    ) {
        player.direction =
            "right";
    }


    else {
        player.direction =
            "left";
    }


    // ========================================================
    // MOVER AL JUGADOR
    // ========================================================

    if (
        directionX !==
            0 ||

        directionY !==
            0
    ) {
        const length =
            Math.sqrt(
                directionX *
                    directionX +

                directionY *
                    directionY
            );


        player.x +=
            (
                directionX /
                length
            ) *
            player.speed;


        player.y +=
            (
                directionY /
                length
            ) *
            player.speed;
    }
}


// ============================================================
// LISTA DE ENEMIGOS
// ============================================================

const enemigos = [];

// ============================================================
// SISTEMA DE OLEADAS
// ============================================================

let currentWave =
    0;

let waveState =
    "WAITING";

let nextWaveAt =
    performance.now() +
    1000;

let waveAnnouncementUntil =
    0;

const waveRestDuration =
    3000;


// ============================================================
// POSICIÓN PARA CREAR ENEMIGO
// ============================================================

function getEnemySpawnPosition() {

    const margin =
        75;

    const minimumPlayerDistance =
        260;

    let positionX =
        margin;

    let positionY =
        margin;


    for (
        let attempt = 0;
        attempt < 30;
        attempt += 1
    ) {
        const side =
            Math.floor(
                Math.random() *
                4
            );


        if (
            side === 0
        ) {
            positionX =
                margin;

            positionY =
                margin +
                Math.random() *
                (
                    canvas.height -
                    margin * 2
                );
        }


        else if (
            side === 1
        ) {
            positionX =
                canvas.width -
                margin;

            positionY =
                margin +
                Math.random() *
                (
                    canvas.height -
                    margin * 2
                );
        }


        else if (
            side === 2
        ) {
            positionX =
                margin +
                Math.random() *
                (
                    canvas.width -
                    margin * 2
                );

            positionY =
                margin;
        }


        else {
            positionX =
                margin +
                Math.random() *
                (
                    canvas.width -
                    margin * 2
                );

            positionY =
                canvas.height -
                margin;
        }


        const distance =
            Math.hypot(
                positionX -
                    player.x,

                positionY -
                    player.y
            );


        if (
            distance >=
            minimumPlayerDistance
        ) {
            break;
        }
    }


    return {
        x:
            positionX,

        y:
            positionY
    };
}


// ============================================================
// AUMENTAR DIFICULTAD
// ============================================================

function applyWaveDifficulty(
    enemy
) {
    const healthMultiplier =
        1 +
        (
            currentWave -
            1
        ) *
        0.15;


    const damageMultiplier =
        1 +
        (
            currentWave -
            1
        ) *
        0.10;


    const speedMultiplier =
        Math.min(
            1.60,

            1 +
            (
                currentWave -
                1
            ) *
            0.025
        );


    enemy.maxHealth =
        Math.round(
            enemy.maxHealth *
            healthMultiplier
        );


    enemy.health =
        enemy.maxHealth;


    enemy.damage =
        Math.round(
            enemy.damage *
            damageMultiplier
        );


    enemy.speed *=
        speedMultiplier;


    enemy.waveSpeedMultiplier =
        speedMultiplier;


    enemy.waveNumber =
        currentWave;


    return enemy;
}


// ============================================================
// AGREGAR ENEMIGO
// ============================================================

function addEnemy(
    enemy
) {
    enemigos.push(
        applyWaveDifficulty(
            enemy
        )
    );
}


// ============================================================
// CREAR GRUPO SWARM
// ============================================================

function spawnSwarmGroup(
    position
) {
    const offsets = [

        {
            x: 0,
            y: -42
        },

        {
            x: -40,
            y: 32
        },

        {
            x: 40,
            y: 32
        }

    ];


    for (
        const offset
        of offsets
    ) {
        addEnemy(
            new Swarm(

                position.x +
                    offset.x,

                position.y +
                    offset.y

            )
        );
    }
}


// ============================================================
// CREAR ENEMIGO NORMAL
// ============================================================

function spawnEnemyForWave() {

    const position =
        getEnemySpawnPosition();


    const availableTypes = [
        "HUNTER"
    ];


    if (
        currentWave >=
        2
    ) {
        availableTypes.push(
            "RANGER"
        );
    }


    if (
        currentWave >=
        3
    ) {
        availableTypes.push(
            "SWARM"
        );
    }


    if (
        currentWave >=
        4
    ) {
        availableTypes.push(
            "TANK",
            "KAMIKAZE"
        );
    }


    if (
        currentWave >=
        5
    ) {
        availableTypes.push(
            "ANTREX"
        );
    }


    const type =
        availableTypes[
            Math.floor(
                Math.random() *
                availableTypes.length
            )
        ];


    if (
        type ===
        "HUNTER"
    ) {
        addEnemy(
            new Hunter(
                position.x,
                position.y
            )
        );
    }


    else if (
        type ===
        "RANGER"
    ) {
        addEnemy(
            new Ranger(
                position.x,
                position.y
            )
        );
    }


    else if (
        type ===
        "SWARM"
    ) {
        spawnSwarmGroup(
            position
        );
    }


    else if (
        type ===
        "TANK"
    ) {
        addEnemy(
            new Tank(
                position.x,
                position.y
            )
        );
    }


    else if (
        type ===
        "KAMIKAZE"
    ) {
        addEnemy(
            new Kamikaze(
                position.x,
                position.y
            )
        );
    }


    else if (
        type ===
        "ANTREX"
    ) {
        addEnemy(
            new Antrex(
                position.x,
                position.y
            )
        );
    }
}


// ============================================================
// INICIAR SIGUIENTE OLEADA
// ============================================================

function startNextWave() {

    currentWave +=
        1;


    waveState =
        "FIGHTING";


    waveAnnouncementUntil =
        performance.now() +
        1800;


    /*
     * Eliminar enemigos muertos
     * de la oleada anterior.
     */

    for (
        let index =
            enemigos.length -
            1;

        index >= 0;

        index -= 1
    ) {
        if (
            !enemigos[
                index
            ].alive
        ) {
            enemigos.splice(
                index,
                1
            );
        }
    }


    // --------------------------------------------------------
    // JEFE 2: NEXUS PRIME
    // OLEADAS 10, 20, 30...
    // --------------------------------------------------------

    if (
        currentWave %
        10 ===
        0
    ) {
        const position =
            getEnemySpawnPosition();


        const boss =
            new Jefe2(
                position.x,
                position.y
            );


        boss.isBoss =
            true;


        addEnemy(
            boss
        );


        const initialGroups =
            Math.min(
                12,

                3 +
                Math.floor(
                    currentWave /
                    2
                )
            );


        for (
            let index = 0;
            index <
                initialGroups;
            index += 1
        ) {
            spawnEnemyForWave();
        }


        return;
    }


    // --------------------------------------------------------
    // JEFE 1: CERBERON
    // OLEADAS 5, 15, 25...
    // --------------------------------------------------------

    if (
        currentWave %
        5 ===
        0
    ) {
        const position =
            getEnemySpawnPosition();


        const boss =
            new Jefe1(
                position.x,
                position.y
            );


        boss.isBoss =
            true;


        addEnemy(
            boss
        );


        const normalGroups =
            Math.min(
                10,

                2 +
                Math.floor(
                    currentWave /
                    2
                )
            );


        for (
            let index = 0;
            index <
                normalGroups;
            index += 1
        ) {
            spawnEnemyForWave();
        }


        return;
    }


    // --------------------------------------------------------
    // OLEADA NORMAL
    // --------------------------------------------------------

    const spawnGroups =
        Math.min(
            14,

            2 +
            currentWave
        );


    for (
        let index = 0;
        index <
            spawnGroups;
        index += 1
    ) {
        spawnEnemyForWave();
    }
}


// ============================================================
// ACTUALIZAR SISTEMA DE OLEADAS
// ============================================================

function updateWaveSystem() {

    if (
        !player.alive
    ) {
        return;
    }


    const now =
        performance.now();


    const hasLivingEnemies =
        enemigos.some(

            function (enemy) {

                return enemy.alive;

            }

        );


    if (
        waveState ===
            "FIGHTING" &&

        !hasLivingEnemies
    ) {
        waveState =
            "WAITING";


        nextWaveAt =
            now +
            waveRestDuration;


        /*
         * Limpiar proyectiles enemigos
         * al terminar la oleada.
         */

        for (
            let index =
                projectiles.length -
                1;

            index >= 0;

            index -= 1
        ) {
            if (
                projectiles[
                    index
                ].enemyProjectile
            ) {
                projectiles.splice(
                    index,
                    1
                );
            }
        }
    }


    if (
        waveState ===
            "WAITING" &&

        now >=
            nextWaveAt
    ) {
        startNextWave();
    }
}


// ============================================================
// INTERFAZ DE OLEADAS
// ============================================================

function drawWaveHUD() {

    const now =
        performance.now();


    const livingEnemies =
        enemigos.filter(

            function (enemy) {

                return enemy.alive;

            }

        ).length;


    ctx.save();


    ctx.textAlign =
        "center";


    ctx.font =
        "bold 20px Arial";


    ctx.fillStyle =
        "#7dffef";


    ctx.shadowColor =
        "#00ffe1";


    ctx.shadowBlur =
        10;


    ctx.fillText(
        `OLEADA ${currentWave}`,

        canvas.width /
            2,

        34
    );


    ctx.font =
        "bold 14px Arial";


    ctx.fillStyle =
        "#ffffff";


    if (
        waveState ===
        "WAITING"
    ) {
        const seconds =
            Math.max(
                0,

                Math.ceil(
                    (
                        nextWaveAt -
                        now
                    ) /
                    1000
                )
            );


        ctx.fillText(
            `SIGUIENTE OLEADA EN ${seconds}`,

            canvas.width /
                2,

            56
        );
    }


    else {
        ctx.fillText(
            `ENEMIGOS: ${livingEnemies}`,

            canvas.width /
                2,

            56
        );
    }


    if (
        now <
        waveAnnouncementUntil
    ) {
        ctx.font =
            "bold 42px Arial";


        ctx.fillStyle =
            currentWave %
                5 ===
                0

                ? "#ff4fcf"

                : "#ffffff";


        let announcement =
            `OLEADA ${currentWave}`;


        if (
            currentWave %
            10 ===
            0
        ) {
            announcement =
                `OLEADA ${currentWave} - NEXUS PRIME`;
        }


        else if (
            currentWave %
            5 ===
            0
        ) {
            announcement =
                `OLEADA ${currentWave} - CERBERON`;
        }


        ctx.fillText(
            announcement,

            canvas.width /
                2,

            canvas.height /
                2 -
                100
        );
    }


    ctx.restore();
}


// ============================================================
// MENSAJES DEL JUEGO
// ============================================================

const message =
    document.getElementById(
        "message"
    );


const messageTitle =
    document.getElementById(
        "messageTitle"
    );


const messageText =
    document.getElementById(
        "messageText"
    );


const restartButton =
    document.getElementById(
        "restartButton"
    );


function showMessage(
    title,
    text
) {
    if (
        messageTitle
    ) {
        messageTitle.textContent =
            title;
    }


    if (
        messageText
    ) {
        messageText.textContent =
            text;
    }


    if (
        message
    ) {
        message.classList.remove(
            "hidden"
        );
    }
}


// ============================================================
// ACTUALIZAR ENEMIGOS
// ============================================================

function updateEnemigos() {

    for (
        const enemy
        of enemigos
    ) {
        if (
            !enemy.alive
        ) {
            continue;
        }

        enemy.update(
            player
        );
    }
}


// ============================================================
// DIBUJAR ENEMIGOS
// ============================================================

function drawEnemigos() {

    for (
        const enemy
        of enemigos
    ) {
        enemy.draw(
            ctx
        );
    }
}


// ============================================================
// ATAQUE DEL JUGADOR
// ============================================================

function shoot() {

    if (
        !player.alive ||
        player.weaponSwitching ||
        (
            window.neonMenuLoaded ===
                true &&

            (
                window.neonGameStarted !==
                    true ||

                window.neonGamePaused ===
                    true
            )
        )
    ) {
        return;
    }


    const now =
        performance.now();


    if (
        now -
        player.lastShotAt <
        player.fireCooldown
    ) {
        return;
    }


    player.lastShotAt =
        now;


    player.shooting =
        true;


    player.shootingStartedAt =
        now;


    /*
     * La configuración puede ser:
     *
     * PersonajeNormal
     * PersonajeEscopeta
     * PersonajeEspada
     */

    const configuration =
        weaponConfig[
            player.weapon
        ];


    /*
     * Los módulos reciben x/y como
     * esquina superior izquierda.
     *
     * En main.js player.x/player.y
     * representan el centro.
     */

    const projectilePlayer = {

        ...player,

        x:
            player.x -
            player.width /
            2,

        y:
            player.y -
            player.height /
            2,

        aimAngle:
            player.angle

    };


    const newProjectiles =
        configuration
            .crearProyectiles(
                projectilePlayer
            );


    projectiles.push(
        ...newProjectiles
    );


    if (
        window.NeonAudio
    ) {
        window.NeonAudio
            .playShot();
    }
}


// ============================================================
// ATACAR CON CLIC
// ============================================================

canvas.addEventListener(
    "click",

    function (event) {

        if (
            event.button ===
            0
        ) {
            shoot();
        }

    }
);
// ============================================================
// COLISIÓN PROYECTIL CONTRA ENEMIGO
// ============================================================

function checkProjectileEnemyCollisions() {

    for (
        let projectileIndex =
            projectiles.length - 1;

        projectileIndex >= 0;

        projectileIndex -= 1
    ) {
        const projectile =
            projectiles[
                projectileIndex
            ];


        if (
            projectile.enemyProjectile
        ) {
            continue;
        }


        for (
            const enemy
            of enemigos
        ) {
            if (
                !enemy.alive
            ) {
                continue;
            }


            const differenceX =
                projectile.x -
                enemy.x;


            const differenceY =
                projectile.y -
                enemy.y;


            const distance =
                Math.sqrt(
                    differenceX *
                        differenceX +

                    differenceY *
                        differenceY
                );


            const collisionDistance =
                projectile.radius +
                enemy.width / 2;


            if (
                distance <=
                collisionDistance
            ) {
                enemy.takeDamage(
                    projectile.damage ??
                    player.damage
                );


                /*
                 * Contar al enemigo eliminado
                 * solamente una vez.
                 */

                if (
                    enemy.health <= 0 &&
                    !enemy.neonScoreCounted
                ) {
                    enemy.neonScoreCounted =
                        true;

                    enemiesDefeated +=
                        1;
                }


                /*
                 * Intentar generar un aditamento.
                 */

                if (
                    enemy.health <= 0 &&
                    !enemy.aditamentoDropped
                ) {
                    enemy.aditamentoDropped =
                        true;


                    if (
                        typeof tryDropAditamento ===
                        "function"
                    ) {
                        tryDropAditamento(

                            enemy.x,

                            enemy.y,

                            enemy.isBoss ===
                                true

                        );
                    }
                }


                projectiles.splice(
                    projectileIndex,
                    1
                );


                break;
            }
        }
    }
}


// ============================================================
// ACTUALIZAR PROYECTILES
// ============================================================

function updateProjectiles() {

    for (
        let index =
            projectiles.length - 1;

        index >= 0;

        index -= 1
    ) {
        const projectile =
            projectiles[index];


        // ----------------------------------------------------
        // LÁSER VERTICAL DE LOS JEFES
        // ----------------------------------------------------

        if (
            projectile
                .isVerticalCerberonLaser
        ) {
            const now =
                performance.now();


            const elapsed =
                now -
                projectile.createdAt;


            const totalDuration =
                projectile
                    .warningDuration +

                projectile
                    .activeDuration;


            if (
                elapsed >=
                projectile
                    .warningDuration
            ) {
                const playerLeft =
                    player.x -
                    player.width / 2;


                const playerRight =
                    player.x +
                    player.width / 2;


                const laserLeft =
                    projectile.x -
                    projectile
                        .laserWidth / 2;


                const laserRight =
                    projectile.x +
                    projectile
                        .laserWidth / 2;


                const touchesLaser =
                    playerRight >=
                        laserLeft &&

                    playerLeft <=
                        laserRight;


                if (
                    touchesLaser &&

                    !projectile
                        .hasDamagedPlayer
                ) {
                    damagePlayer(
                        projectile.damage
                    );


                    projectile
                        .hasDamagedPlayer =
                        true;
                }
            }


            if (
                elapsed >=
                totalDuration
            ) {
                projectiles.splice(
                    index,
                    1
                );
            }


            continue;
        }


        // ----------------------------------------------------
        // PROYECTIL ENEMIGO CONTRA EL JUGADOR
        // ----------------------------------------------------

        if (
            projectile.enemyProjectile
        ) {
            const differenceX =
                projectile.x -
                player.x;


            const differenceY =
                projectile.y -
                player.y;


            const distance =
                Math.sqrt(
                    differenceX *
                        differenceX +

                    differenceY *
                        differenceY
                );


            const collisionDistance =
                projectile.radius +
                player.width / 2;


            if (
                distance <=
                collisionDistance
            ) {
                damagePlayer(
                    projectile.damage
                );


                projectiles.splice(
                    index,
                    1
                );


                continue;
            }
        }


        // ----------------------------------------------------
        // MOVIMIENTO DEL PROYECTIL
        // ----------------------------------------------------

        projectile.x +=
            Math.cos(
                projectile.angle
            ) *
            projectile.speed;


        projectile.y +=
            Math.sin(
                projectile.angle
            ) *
            projectile.speed;


        if (
            !projectile.enemyProjectile
        ) {
            projectile.distanceTraveled =
                (
                    projectile
                        .distanceTraveled ||
                    0
                ) +
                projectile.speed;
        }


        // ----------------------------------------------------
        // ELIMINAR FUERA DE PANTALLA O FUERA DE ALCANCE
        // ----------------------------------------------------

        const outsideCanvas =
            projectile.x < 0 ||

            projectile.x >
                canvas.width ||

            projectile.y < 0 ||

            projectile.y >
                canvas.height;


        const reachedMaximumDistance =
            Number.isFinite(
                projectile.maximumDistance
            ) &&

            projectile.distanceTraveled >=
                projectile.maximumDistance;


        if (
            outsideCanvas ||
            reachedMaximumDistance
        ) {
            projectiles.splice(
                index,
                1
            );
        }
    }
}


// ============================================================
// DIBUJAR PROYECTILES
// ============================================================

function drawProjectiles() {

    for (
        const projectile
        of projectiles
    ) {

        // ----------------------------------------------------
        // PROYECTILES DE NEXUS PRIME
        // ----------------------------------------------------

        if (
            projectile.nexusProjectile &&

            typeof drawNexusProjectile ===
                "function" &&

            drawNexusProjectile(
                ctx,
                projectile
            )
        ) {
            continue;
        }


        // ----------------------------------------------------
        // PROYECTILES DE CERBERON
        // ----------------------------------------------------

        if (
            projectile.cerberonProjectile &&

            typeof drawCerberonProjectile ===
                "function" &&

            drawCerberonProjectile(
                ctx,
                projectile
            )
        ) {
            continue;
        }


        // ----------------------------------------------------
        // PROYECTIL DEL RANGER
        // ----------------------------------------------------

        if (
            projectile.rangerProjectile &&

            typeof rangerAttackEffectSprite !==
                "undefined" &&

            rangerAttackEffectSprite
                .complete &&

            rangerAttackEffectSprite
                .naturalWidth
        ) {
            const frameCount =
                6;


            const frame =
                Math.floor(
                    (
                        performance.now() -

                        projectile
                            .spriteStartedAt
                    ) /
                    70
                ) %
                frameCount;


            const frameWidth =
                rangerAttackEffectSprite
                    .naturalWidth /
                frameCount;


            const frameHeight =
                rangerAttackEffectSprite
                    .naturalHeight;


            ctx.save();


            ctx.translate(
                projectile.x,
                projectile.y
            );


            ctx.rotate(
                projectile.angle
            );


            ctx.drawImage(
                rangerAttackEffectSprite,

                frame *
                    frameWidth,

                0,

                frameWidth,
                frameHeight,

                0,
                -10,

                56,
                20
            );


            ctx.restore();


            continue;
        }


        // ----------------------------------------------------
        // PROYECTIL DEL TANK
        // ----------------------------------------------------

        if (
            projectile.tankProjectile
        ) {
            const tankProjectileImage =
                typeof getTankProjectileImage ===
                    "function"

                    ? getTankProjectileImage()

                    : null;


            if (
                tankProjectileImage
            ) {
                ctx.save();


                ctx.translate(
                    projectile.x,
                    projectile.y
                );


                ctx.rotate(
                    projectile.angle
                );


                ctx.drawImage(
                    tankProjectileImage,

                    0,
                    -13,

                    72,
                    26
                );


                ctx.restore();


                continue;
            }
        }


        // ----------------------------------------------------
        // PROYECTIL VERDE DEL SWARM
        // ----------------------------------------------------

        if (
            projectile.swarmProjectile
        ) {
            ctx.save();


            ctx.translate(
                projectile.x,
                projectile.y
            );


            ctx.rotate(
                projectile.angle
            );


            const animationTime =
                performance.now() -

                projectile
                    .spriteStartedAt;


            const pulse =
                1 +

                Math.sin(
                    animationTime /
                    65
                ) *

                0.15;


            const gradient =
                ctx.createLinearGradient(
                    -30,
                    0,
                    10,
                    0
                );


            gradient.addColorStop(
                0,

                "rgba(82, 255, 40, 0)"
            );


            gradient.addColorStop(
                0.55,

                projectile.trailColor ||

                "rgba(82, 255, 40, 0.55)"
            );


            gradient.addColorStop(
                1,

                projectile.color ||

                "#52ff28"
            );


            ctx.fillStyle =
                gradient;


            ctx.beginPath();


            ctx.moveTo(
                -32,
                0
            );


            ctx.lineTo(
                4,

                -6 *
                pulse
            );


            ctx.lineTo(
                12,
                0
            );


            ctx.lineTo(
                4,

                6 *
                pulse
            );


            ctx.closePath();


            ctx.fill();


            ctx.shadowColor =
                projectile.color ||

                "#52ff28";


            ctx.shadowBlur =
                16;


            ctx.fillStyle =
                "#d8ffbf";


            ctx.beginPath();


            ctx.arc(
                7,
                0,

                projectile.radius *
                    pulse,

                0,

                Math.PI *
                    2
            );


            ctx.fill();


            ctx.restore();


            continue;
        }


        // ----------------------------------------------------
        // PROYECTIL ROSA DE ANTREX
        // ----------------------------------------------------

        if (
            projectile.antrexProjectile
        ) {
            ctx.save();


            ctx.translate(
                projectile.x,
                projectile.y
            );


            ctx.rotate(
                projectile.angle
            );


            const animationTime =
                performance.now() -

                projectile
                    .spriteStartedAt;


            const pulse =
                1 +

                Math.sin(
                    animationTime /
                    70
                ) *

                0.18;


            ctx.shadowColor =
                projectile.color ||

                "#ff28c8";


            ctx.shadowBlur =
                22;


            const gradient =
                ctx.createLinearGradient(
                    -32,
                    0,
                    12,
                    0
                );


            gradient.addColorStop(
                0,

                "rgba(255, 40, 200, 0)"
            );


            gradient.addColorStop(
                0.65,

                "rgba(255, 40, 200, 0.55)"
            );


            gradient.addColorStop(
                1,

                "#ffb5ef"
            );


            ctx.fillStyle =
                gradient;


            ctx.beginPath();


            ctx.moveTo(
                -34,
                0
            );


            ctx.lineTo(
                5,

                -8 *
                pulse
            );


            ctx.lineTo(
                14,
                0
            );


            ctx.lineTo(
                5,

                8 *
                pulse
            );


            ctx.closePath();


            ctx.fill();


            ctx.restore();


            continue;
        }


        // ----------------------------------------------------
        // CORTE DE LA ESPADA DE ENERGÍA
        // ----------------------------------------------------

        if (
            projectile.swordProjectile
        ) {
            ctx.save();


            ctx.translate(
                projectile.x,
                projectile.y
            );


            ctx.rotate(
                projectile.angle
            );


            ctx.shadowColor =
                projectile.glowColor ||

                "#37eaff";


            ctx.shadowBlur =
                22;


            ctx.strokeStyle =
                projectile.color ||

                "#37eaff";


            ctx.lineWidth =
                8;


            ctx.lineCap =
                "round";


            /*
             * Arco exterior del ataque.
             */

            ctx.beginPath();


            ctx.arc(
                0,
                0,

                22,

                -0.85,

                0.85
            );


            ctx.stroke();


            /*
             * Línea brillante interior.
             */

            ctx.strokeStyle =
                "rgba(220, 255, 255, 0.95)";


            ctx.lineWidth =
                3;


            ctx.beginPath();


            ctx.arc(
                0,
                0,

                22,

                -0.85,

                0.85
            );


            ctx.stroke();


            ctx.restore();


            continue;
        }


        // ----------------------------------------------------
        // PROYECTIL NORMAL Y ESCOPETA
        // ----------------------------------------------------

        ctx.save();


        if (
            projectile.enemyProjectile
        ) {
            ctx.fillStyle =
                "#ff3333";


            ctx.shadowColor =
                "#ff3333";
        }


        else if (
            projectile.shotgunProjectile
        ) {
            ctx.fillStyle =
                projectile.color ||

                "#ffb229";


            ctx.shadowColor =
                projectile.glowColor ||

                "#ffb229";
        }


        else {
            ctx.fillStyle =
                projectile.color ||

                "#00ffff";


            ctx.shadowColor =
                projectile.glowColor ||

                "#00ffff";
        }


        ctx.shadowBlur =
            12;


        ctx.beginPath();


        ctx.arc(
            projectile.x,
            projectile.y,

            projectile.radius,

            0,

            Math.PI *
                2
        );


        ctx.fill();


        ctx.restore();
    }
}


// ============================================================
// LÍMITES EXTERIORES DEL MAPA
// ============================================================

function keepPlayerInsideArena() {

    const halfWidth =
        player.width /
        2;


    const halfHeight =
        player.height /
        2;


    // Límite izquierdo.

    if (
        player.x -
        halfWidth <
        0
    ) {
        player.x =
            halfWidth;
    }


    // Límite derecho.

    if (
        player.x +
        halfWidth >
        canvas.width
    ) {
        player.x =
            canvas.width -
            halfWidth;
    }


    // Límite superior.

    if (
        player.y -
        halfHeight <
        0
    ) {
        player.y =
            halfHeight;
    }


    // Límite inferior.

    if (
        player.y +
        halfHeight >
        canvas.height
    ) {
        player.y =
            canvas.height -
            halfHeight;
    }
}


// ============================================================
// DAÑO AL JUGADOR
// ============================================================

function damagePlayer(
    amount
) {
    if (
        !player.alive
    ) {
        return;
    }


    /*
     * La resistencia puede reducir
     * como máximo el 50% del daño.
     */

    const resistance =
        Math.max(
            0,

            Math.min(
                0.50,

                player.resistance ||
                0
            )
        );


    const finalDamage =
        Math.max(
            1,

            Math.round(
                amount *
                (
                    1 -
                    resistance
                )
            )
        );


    player.health -=
        finalDamage;


    if (
        window.NeonAudio &&
        player.health > 0
    ) {
        window.NeonAudio
            .playDamage();
    }


    player.hit =
        true;


    player.hitStartedAt =
        performance.now();


    if (
        player.health <= 0
    ) {
        player.health =
            0;


        player.alive =
            false;


        player.shooting =
            false;


        player.moving =
            false;


        player.deathStartedAt =
            performance.now();


        if (
            window.NeonAudio
        ) {
            window.NeonAudio
                .stopBossMusic();


            window.NeonAudio
                .playDeath();
        }


        /*
         * Registrar la puntuación
         * solamente una vez.
         */

        if (
            !neonScoreRegistered &&

            typeof window
                .saveNeonSiegeScore ===
                "function"
        ) {
            neonScoreRegistered =
                true;


            const playedSeconds =
                window
                    .neonSessionStartedAt >
                    0

                    ? (
                        performance.now() -

                        window
                            .neonSessionStartedAt
                    ) /
                    1000

                    : 0;


            window
                .saveNeonSiegeScore(
                    currentWave,

                    enemiesDefeated,

                    playedSeconds
                );
        }


        console.log(
            "PLAYER DEAD"
        );
    }


    console.log(
        "Daño recibido:",

        finalDamage
    );


    console.log(
        "Vida del jugador:",

        player.health
    );
}


// ============================================================
// PANTALLA GAME OVER
// ============================================================

function drawGameOver() {

    if (
        player.alive
    ) {
        return;
    }


    ctx.fillStyle =
        "rgba(0, 0, 0, 0.20)";


    ctx.fillRect(
        0,
        0,

        canvas.width,
        canvas.height
    );


    ctx.save();


    ctx.textAlign =
        "center";


    ctx.fillStyle =
        "#ff334f";


    ctx.font =
        "bold 52px Arial";


    ctx.shadowColor =
        "#ff001f";


    ctx.shadowBlur =
        20;


    ctx.fillText(
        "GAME OVER",

        canvas.width /
            2,

        canvas.height /
            2
    );


    ctx.shadowBlur =
        0;


    ctx.fillStyle =
        "#ffffff";


    ctx.font =
        "20px Arial";


    ctx.fillText(
        "Presiona ENTER para continuar",

        canvas.width /
            2,

        canvas.height /
            2 +
            42
    );


    ctx.restore();
}


// ============================================================
// REINICIAR JUEGO
// ============================================================

if (
    restartButton
) {
    restartButton.addEventListener(
        "click",

        function () {

            window.location.reload();

        }
    );
}


// ============================================================
// ACTUALIZAR ADITAMENTOS
// ============================================================

function updateGameAditamentos() {

    if (
        typeof updateAditamentos ===
        "function"
    ) {
        updateAditamentos(
            player
        );
    }
}


// ============================================================
// DIBUJAR ADITAMENTOS
// ============================================================

function drawGameAditamentos() {

    if (
        typeof drawAditamentos ===
        "function"
    ) {
        drawAditamentos(
            ctx
        );
    }
}


// ============================================================
// DIBUJAR INFORMACIÓN DE ADITAMENTOS
// ============================================================

function drawGameAditamentosHUD() {

    if (
        typeof drawAditamentosHUD ===
        "function"
    ) {
        drawAditamentosHUD(
            ctx,
            player
        );
    }
}


// ============================================================
// CICLO PRINCIPAL
// ============================================================

function gameLoop() {

    const menuControlsGame =
        window.neonMenuLoaded ===
        true;


    const gameplayActive =
        !menuControlsGame ||

        (
            window.neonGameStarted ===
                true &&

            window.neonGamePaused !==
                true
        );


    // ========================================================
    // ACTUALIZAR JUEGO
    // ========================================================

    if (
        gameplayActive
    ) {
        updatePlayer();


        keepPlayerInsideArena();


        updateProjectiles();


        checkProjectileEnemyCollisions();


        updateEnemigos();


        updateWaveSystem();


        if (
            window.NeonAudio
        ) {
            window.NeonAudio
                .updateBossMusic(
                    currentWave,
                    waveState
                );
        }


        updateGameAditamentos();
    }


    // ========================================================
    // DIBUJAR ESCENARIO
    // ========================================================

    drawArena();


    // ========================================================
    // DIBUJAR PERSONAJES Y EFECTOS
    // ========================================================

    drawPlayer();


    drawProjectiles();


    drawEnemigos();


    drawGameAditamentos();


    // ========================================================
    // DIBUJAR INTERFAZ
    // ========================================================

    drawPlayerHealth();


    drawWeaponHUD();


    drawWaveHUD();


    drawGameAditamentosHUD();


    drawGameOver();


    // ========================================================
    // SOLICITAR EL SIGUIENTE CUADRO
    // ========================================================

    requestAnimationFrame(
        gameLoop
    );
}


// ============================================================
// INICIAR JUEGO
// ============================================================

gameLoop();
