// ============================================================
// JEFE1.JS - CERBERON
// PARTE 1 DE 4  (VERSION 2)
// CARGA Y PROCESAMIENTO DE SPRITES
//
// Cambios respecto a la version original:
//  1. Cantidad de cuadros corregida segun la hoja de referencia
//     (varias animaciones tenian una cantidad de mas).
//  2. Los cuadros ya NO se cortan en columnas iguales: en la hoja
//     los sprites tienen separaciones desiguales, asi que se corta
//     por los huecos vacios entre un sprite y el siguiente.
//  3. Cada cuadro se centra horizontalmente segun su contenido y
//     toda la hoja comparte la misma alineacion vertical (tomada
//     del primer cuadro), asi el cuerpo no se mueve al cambiar de
//     animacion.
//  4. Todos los cuadros se procesan al cargar la imagen, por lo que
//     el cambio de animacion es instantaneo (sin tirones).
//  5. Aviso en la consola si la cantidad configurada de cuadros no
//     coincide con los sprites que realmente hay en el archivo.
//  6. drawCerberonFrame(): dibuja el cuadro sin estirarlo a un
//     cuadrado (tus cuadros miden 108x65, no son cuadrados).
//  7. Drones: idle de 1 cuadro, nueva hoja de daño (drone-dano),
//     y tamaño normalizado por hoja (el idle es de menor resolucion
//     que las demas).
//  8. Las hojas con transparencia real NO pasan por el borrado de
//     fondo negro (se comeria la armadura oscura de los drones).
//  9. Se ignoran 2 px en los bordes de cada hoja (ruido/lineas).
// ============================================================

const CERBERON_PATH = "Sprites/Jefe1/";

function loadCerberonSprite(fileName) {
    const image = new Image();

    /*
     * Procesar todos los cuadros en cuanto
     * la imagen termine de cargar.
     */
    image.onload = function () {
        prepareCerberonSprite(image);
    };

    image.src = CERBERON_PATH + fileName;

    return image;
}

// ============================================================
// SPRITES
// ============================================================

const cerberonSprites = {
    idle1: loadCerberonSprite("Cerberon-idle-fase1.png"),
    walk1: loadCerberonSprite("Cerberon-caminar-fase1.png"),
    shot: loadCerberonSprite("Cerberon-ataque-disparo.png"),
    missiles: loadCerberonSprite("Cerberon-ataque-misiles.png"),

    idle2: loadCerberonSprite("Cerberon-idle-fase2.png"),
    fastWalk: loadCerberonSprite("Cerberon-movimiento-rapido.png"),
    rotatingLaser: loadCerberonSprite("Cerberon-laser-rotatorio.png"),
    impact: loadCerberonSprite("Cerberon-salto-impacto.png"),

    idle3: loadCerberonSprite("Cerberon-idle-fase3.png"),
    laserRain: loadCerberonSprite("Cerberon-lluvia-laseres.png"),
    summon: loadCerberonSprite("Cerberon-invocacion.png"),
    death: loadCerberonSprite("Cerberon-muerte.png"),

    drone: loadCerberonSprite("Cerberon-drone.png"),
    droneAttack: loadCerberonSprite("Cerberon-drone-ataque.png"),
    droneDamage: loadCerberonSprite("Cerberon-drone-dano.png"),
    droneDeath: loadCerberonSprite("Cerberon-drone-muerte.png"),

    projectile: loadCerberonSprite("Cerberon-proyectil.png"),
    missile: loadCerberonSprite("Cerberon-misil.png"),
    laser: loadCerberonSprite("Cerberon-laser.png"),
    explosion: loadCerberonSprite("Cerberon-explosion.png"),
    impactArea: loadCerberonSprite("Cerberon-area-impacto.png")
};

// ============================================================
// CANTIDAD EXACTA DE CUADROS
// (contados sobre la hoja de referencia de Cerberon)
// ============================================================

const cerberonFrameCache = new Map();

/*
 * Estas hojas (jefe y drones) se recortan por huecos
 * y se alinean entre si.
 *
 * IMPORTANTE: la cantidad debe ser la de CADA ARCHIVO.
 *  - caminar F1 y los 4 drones: VERIFICADOS con tus archivos.
 *  - El resto del jefe viene de la hoja general de referencia y puede
 *    no coincidir con tus archivos recortados. Si algo no cuadra,
 *    abre la consola (F12): aparece un aviso con la cantidad real.
 */
const cerberonExactFrameCounts = new Map([
    [cerberonSprites.idle1, 9],
    [cerberonSprites.walk1, 7],
    [cerberonSprites.shot, 9],
    [cerberonSprites.missiles, 8],

    [cerberonSprites.idle2, 7],
    [cerberonSprites.fastWalk, 7],
    [cerberonSprites.rotatingLaser, 8],
    [cerberonSprites.impact, 7],

    [cerberonSprites.idle3, 7],
    [cerberonSprites.laserRain, 7],
    [cerberonSprites.summon, 8],
    [cerberonSprites.death, 7],

    // Drones: VERIFICADOS con tus archivos.
    [cerberonSprites.drone, 1],         // 100x86, una sola imagen
    [cerberonSprites.droneAttack, 7],   // 1536x220
    [cerberonSprites.droneDamage, 7],   // 1536x232
    [cerberonSprites.droneDeath, 7]     // 1536x252
]);

/*
 * AJUSTE MANUAL OPCIONAL (en pixeles del sprite original).
 * Se suma a la alineacion automatica de TODA la hoja.
 *   x positivo = mueve a la derecha
 *   y positivo = mueve hacia abajo
 *
 * Ejemplo:
 *   [cerberonSprites.shot, { x: 0, y: -6 }],
 */
const cerberonManualOffsets = new Map([
    // [cerberonSprites.shot, { x: 0, y: 0 }],
]);

/*
 * Umbral para borrar el fondo negro (solo hojas SIN transparencia).
 * Por defecto 24. El idle del dron tiene un fondo con ruido.
 */
const cerberonBackgroundThresholds = new Map([
    [cerberonSprites.drone, 40]
]);

/*
 * Pixeles de borde que se ignoran en cada hoja (algunos
 * archivos traen una linea de ruido en la orilla).
 */
const CERBERON_EDGE_INSET = 2;

/*
 * Un pixel cuenta como "contenido" si su color es
 * mas claro que este valor (el fondo es casi negro).
 */
const CERBERON_CONTENT_THRESHOLD = 40;

/*
 * ESCALA DE DIBUJO
 *
 * JEFE: pixeles de pantalla por pixel del sprite, igual para todas
 * las animaciones (sus hojas salen de la misma imagen).
 * 1.75 deja el cuadro de caminar (108 px) en ~190 px.
 *
 * DRONES: sus hojas tienen resoluciones distintas (el idle mide
 * ~69 px de cuerpo y las demas ~170), asi que aqui se define el
 * ANCHO DEL CUERPO en pantalla y cada hoja se escala para
 * alcanzarlo. Asi el dron no cambia de tamano al cambiar de sprite.
 */
const CERBERON_BOSS_PIXEL_SCALE = 1.75;
const CERBERON_DRONE_BODY_WIDTH = 48;

/*
 * true  = el dron usa su archivo Cerberon-drone.png al caminar.
 * false = usa el primer cuadro de Cerberon-drone-ataque.png
 *         (misma resolucion y estilo que las demas animaciones).
 */
const CERBERON_DRONE_USE_IDLE_FILE = true;

/*
 * Dibuja un cuadro centrado en (0, 0), conservando su proporcion.
 * Se llama despues de ctx.translate y ctx.rotate.
 */
function drawCerberonFrame(ctx, drawable, scale) {
    const drawWidth = drawable.width * scale;
    const drawHeight = drawable.height * scale;

    ctx.drawImage(
        drawable,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
    );
}

/*
 * Escala que deja el cuerpo del primer cuadro de la hoja con el
 * ancho indicado (targetWidth). Si no se pueden leer los pixeles,
 * se supone que el cuerpo ocupa ~80 % del ancho del cuadro.
 */
function getCerberonBodyScale(
    sprite,
    columns,
    targetWidth,
    drawable
) {
    const layout = getCerberonSheetLayout(sprite, columns);

    if (layout) {
        const first = layout.cells[0];
        const bodyWidth = first.maximumX - first.minimumX + 1;

        if (bodyWidth > 0) {
            return targetWidth / bodyWidth;
        }
    }

    return targetWidth / (drawable.width * 0.8);
}

function getCerberonSpriteFrameCount(
    sprite,
    fallback = 1
) {
    if (
        !sprite ||
        !sprite.complete ||
        !sprite.naturalWidth ||
        !sprite.naturalHeight
    ) {
        return fallback;
    }

    if (cerberonExactFrameCounts.has(sprite)) {
        return cerberonExactFrameCounts.get(sprite);
    }

    /*
     * Calculo de respaldo para efectos
     * que no esten en la lista anterior.
     */
    const imageRatio =
        sprite.naturalWidth /
        sprite.naturalHeight;

    return Math.max(1, Math.round(imageRatio));
}

// ============================================================
// ELIMINAR FONDO NEGRO
// ============================================================

function removeCerberonBlackBackground(
    frameContext,
    width,
    height,
    threshold = 24
) {
    let imageData;

    try {
        imageData = frameContext.getImageData(
            0,
            0,
            width,
            height
        );
    } catch (error) {
        return;
    }

    const pixels = imageData.data;
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);

    let queueStart = 0;
    let queueEnd = 0;

    function isBackground(pixelIndex) {
        const dataIndex = pixelIndex * 4;

        const red = pixels[dataIndex];
        const green = pixels[dataIndex + 1];
        const blue = pixels[dataIndex + 2];
        const alpha = pixels[dataIndex + 3];

        /*
         * Solo elimina el negro conectado
         * con las orillas del cuadro.
         */
        return (
            alpha === 0 ||
            Math.max(red, green, blue) <= threshold
        );
    }

    function addPixel(x, y) {
        if (
            x < 0 ||
            x >= width ||
            y < 0 ||
            y >= height
        ) {
            return;
        }

        const pixelIndex = y * width + x;

        if (
            visited[pixelIndex] ||
            !isBackground(pixelIndex)
        ) {
            return;
        }

        visited[pixelIndex] = 1;
        queue[queueEnd] = pixelIndex;
        queueEnd += 1;
    }

    /*
     * Comenzar desde las cuatro orillas.
     */
    for (let x = 0; x < width; x += 1) {
        addPixel(x, 0);
        addPixel(x, height - 1);
    }

    for (let y = 0; y < height; y += 1) {
        addPixel(0, y);
        addPixel(width - 1, y);
    }

    while (queueStart < queueEnd) {
        const pixelIndex = queue[queueStart];
        queueStart += 1;

        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        pixels[pixelIndex * 4 + 3] = 0;

        addPixel(x - 1, y);
        addPixel(x + 1, y);
        addPixel(x, y - 1);
        addPixel(x, y + 1);
    }

    frameContext.putImageData(imageData, 0, 0);
}

// ============================================================
// BUSCAR LOS HUECOS ENTRE SPRITES
// ============================================================

/*
 * profile[x] = cantidad de pixeles con contenido en la columna x.
 * Devuelve columns + 1 posiciones: los limites de cada cuadro.
 *
 * 1) Primero se buscan los huecos vacios reales entre sprites.
 *    Si hay exactamente columns - 1 huecos, se corta por el
 *    centro de cada uno (funciona aunque la separacion sea
 *    muy desigual, como en la invocacion).
 * 2) Si no coincide (sprites que casi se tocan), se busca cada
 *    limite cerca de la division igual, en la columna mas vacia.
 */
function findCerberonGapCenters(profile) {
    const width = profile.length;

    let firstContent = -1;
    let lastContent = -1;

    for (let x = 0; x < width; x += 1) {
        if (profile[x] > 2) {
            if (firstContent < 0) {
                firstContent = x;
            }

            lastContent = x;
        }
    }

    const gapCenters = [];

    if (firstContent < 0) {
        return gapCenters;
    }

    let gapStart = -1;

    for (
        let x = firstContent;
        x <= lastContent + 1;
        x += 1
    ) {
        const isEmpty =
            x <= lastContent &&
            profile[x] <= 2;

        if (isEmpty && gapStart < 0) {
            gapStart = x;
        }

        if (!isEmpty && gapStart >= 0) {
            if (x - gapStart >= 4) {
                gapCenters.push(
                    Math.round((gapStart + x - 1) / 2)
                );
            }

            gapStart = -1;
        }
    }

    return gapCenters;
}

function findCerberonSplits(profile, columns) {
    const width = profile.length;

    if (columns > 1) {
        const gapCenters = findCerberonGapCenters(profile);

        if (gapCenters.length === columns - 1) {
            return [0, ...gapCenters, width];
        }
    }

    return findCerberonValleySplits(profile, columns);
}

function findCerberonValleySplits(profile, columns) {
    const width = profile.length;
    const cellWidth = width / columns;
    const radius = Math.floor(cellWidth * 0.45);
    const minimumCell = Math.max(1, Math.floor(cellWidth * 0.5));

    const splits = [0];

    function windowSum(x) {
        let total = 0;

        for (let k = -2; k <= 2; k += 1) {
            const index = x + k;

            if (index >= 0 && index < width) {
                total += profile[index];
            }
        }

        return total;
    }

    for (let i = 1; i < columns; i += 1) {
        const expected = Math.round(i * cellWidth);

        const from = Math.max(
            expected - radius,
            splits[i - 1] + minimumCell
        );

        const to = Math.min(
            expected + radius,
            width - 1
        );

        if (from > to) {
            splits.push(
                Math.min(
                    width - 1,
                    Math.max(expected, splits[i - 1] + 1)
                )
            );

            continue;
        }

        let bestScore = Infinity;

        for (let x = from; x <= to; x += 1) {
            bestScore = Math.min(bestScore, windowSum(x));
        }

        /*
         * Agrupar las columnas con el mejor puntaje en
         * tramos continuos y quedarse con el mas cercano
         * a la posicion esperada.
         */
        let bestRunStart = -1;
        let bestRunEnd = -1;
        let bestRunDistance = Infinity;

        let runStart = -1;

        for (let x = from; x <= to + 1; x += 1) {
            const isBest =
                x <= to &&
                windowSum(x) <= bestScore;

            if (isBest && runStart < 0) {
                runStart = x;
            }

            if (!isBest && runStart >= 0) {
                const runEnd = x - 1;
                const runMiddle = (runStart + runEnd) / 2;
                const distance = Math.abs(runMiddle - expected);

                if (distance < bestRunDistance) {
                    bestRunDistance = distance;
                    bestRunStart = runStart;
                    bestRunEnd = runEnd;
                }

                runStart = -1;
            }
        }

        splits.push(
            Math.round((bestRunStart + bestRunEnd) / 2)
        );
    }

    splits.push(width);

    return splits;
}

// ============================================================
// DISENO DE UNA HOJA (LIMITES + ALINEACION)
// ============================================================

const cerberonLayoutCache = new Map();

/*
 * Devuelve null si el navegador no permite leer los pixeles
 * (por ejemplo abriendo el juego con file://). En ese caso se
 * usa el recorte en columnas iguales de respaldo.
 */
function getCerberonSheetLayout(sprite, columns) {
    const key = `${sprite.src}-${columns}`;

    if (cerberonLayoutCache.has(key)) {
        return cerberonLayoutCache.get(key);
    }

    let layout = null;

    try {
        const width = sprite.naturalWidth;
        const height = sprite.naturalHeight;

        const sheetCanvas = document.createElement("canvas");

        sheetCanvas.width = width;
        sheetCanvas.height = height;

        const sheetContext = sheetCanvas.getContext("2d");

        sheetContext.drawImage(sprite, 0, 0);

        const pixels =
            sheetContext.getImageData(0, 0, width, height).data;

        /*
         * Hojas con transparencia real: el contenido se detecta
         * por opacidad y NO se borra fondo negro. Hojas opacas:
         * el contenido es lo que sea mas claro que el fondo.
         */
        let transparentPixels = 0;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 16) {
                transparentPixels += 1;
            }
        }

        const hasTransparency =
            transparentPixels > width * height * 0.2;

        const inset = CERBERON_EDGE_INSET;

        function hasContent(x, y) {
            if (
                x < inset ||
                y < inset ||
                x >= width - inset ||
                y >= height - inset
            ) {
                return false;
            }

            const index = (y * width + x) * 4;

            if (pixels[index + 3] <= 15) {
                return false;
            }

            if (hasTransparency) {
                return true;
            }

            return (
                Math.max(
                    pixels[index],
                    pixels[index + 1],
                    pixels[index + 2]
                ) > CERBERON_CONTENT_THRESHOLD
            );
        }

        const profile = new Int32Array(width);

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                if (hasContent(x, y)) {
                    profile[x] += 1;
                }
            }
        }

        const detectedFrames =
            findCerberonGapCenters(profile).length + 1;

        const splits = findCerberonSplits(profile, columns);

        const cells = [];
        let widestContent = 0;

        for (let i = 0; i < columns; i += 1) {
            const start = splits[i];
            const end = splits[i + 1];

            let minimumX = -1;
            let maximumX = -1;

            for (let x = start; x < end; x += 1) {
                if (profile[x] >= 2) {
                    if (minimumX < 0) {
                        minimumX = x;
                    }

                    maximumX = x;
                }
            }

            if (minimumX < 0) {
                minimumX = start;
                maximumX = end - 1;
            }

            cells.push({
                start,
                end,
                minimumX,
                maximumX
            });

            widestContent = Math.max(
                widestContent,
                maximumX - minimumX + 1
            );
        }

        /*
         * Alineacion vertical: el centro del primer cuadro
         * (pose previa a cualquier efecto) queda en el centro,
         * y el mismo desplazamiento se aplica a toda la hoja.
         * Una fila cuenta solo si tiene al menos 2 pixeles.
         */
        const firstCell = cells[0];

        let minimumY = height;
        let maximumY = -1;

        for (let y = 0; y < height; y += 1) {
            let rowCount = 0;

            for (
                let x = firstCell.minimumX;
                x <= firstCell.maximumX;
                x += 1
            ) {
                if (hasContent(x, y)) {
                    rowCount += 1;

                    if (rowCount >= 2) {
                        break;
                    }
                }
            }

            if (rowCount >= 2) {
                if (y < minimumY) minimumY = y;
                if (y > maximumY) maximumY = y;
            }
        }

        const manual =
            cerberonManualOffsets.get(sprite) || {};

        const offsetY =
            (
                maximumY >= minimumY
                    ? Math.round(
                        height / 2 -
                        (minimumY + maximumY) / 2
                    )
                    : 0
            ) + (manual.y || 0);

        layout = {
            cells,
            detectedFrames,
            hasTransparency,

            outWidth: Math.max(
                Math.round(width / columns),
                widestContent + 2
            ),

            offsetX: manual.x || 0,
            offsetY
        };
    } catch (error) {
        layout = null;
    }

    cerberonLayoutCache.set(key, layout);

    return layout;
}

// ============================================================
// CUADRO ALINEADO (JEFE Y DRONES)
// ============================================================

function buildCerberonAlignedFrame(
    sprite,
    frame,
    columns
) {
    const layout = getCerberonSheetLayout(sprite, columns);

    if (!layout) {
        return null;
    }

    const cell = layout.cells[frame];
    const height = sprite.naturalHeight;
    const inset = CERBERON_EDGE_INSET;

    /*
     * Solo se copia el interior de la celda (y sin los
     * pixeles de la orilla de la hoja), asi nunca entra
     * parte de un cuadro vecino ni ruido del borde.
     */
    const sourceStart = Math.max(cell.start, inset);

    const sourceEnd = Math.min(
        cell.end,
        sprite.naturalWidth - inset
    );

    const sourceWidth = sourceEnd - sourceStart;
    const sourceHeight = height - inset * 2;

    if (sourceWidth <= 0 || sourceHeight <= 0) {
        return null;
    }

    const frameCanvas = document.createElement("canvas");

    frameCanvas.width = layout.outWidth;
    frameCanvas.height = height;

    const frameContext = frameCanvas.getContext("2d");

    frameContext.imageSmoothingEnabled = false;
    frameContext.webkitImageSmoothingEnabled = false;
    frameContext.msImageSmoothingEnabled = false;

    const contentCenter =
        (cell.minimumX + cell.maximumX + 1) / 2 -
        cell.start;

    const drawX =
        Math.round(layout.outWidth / 2 - contentCenter) +
        layout.offsetX +
        (sourceStart - cell.start);

    frameContext.drawImage(
        sprite,

        sourceStart,
        inset,
        sourceWidth,
        sourceHeight,

        drawX,
        layout.offsetY + inset,
        sourceWidth,
        sourceHeight
    );

    /*
     * Las hojas con transparencia real ya tienen el fondo
     * limpio. Borrar "negro" ahi se comeria la armadura.
     */
    if (!layout.hasTransparency) {
        removeCerberonBlackBackground(
            frameContext,
            frameCanvas.width,
            frameCanvas.height,
            cerberonBackgroundThresholds.get(sprite) || 24
        );
    }

    return frameCanvas;
}

// ============================================================
// CUADRO EN COLUMNAS IGUALES
// (efectos, proyectiles y respaldo)
// ============================================================

function buildCerberonEqualFrame(
    sprite,
    frame,
    columns
) {
    const cellWidth = Math.max(
        1,
        Math.floor(sprite.naturalWidth / columns)
    );

    const sourceStartX = Math.max(
        0,
        Math.min(
            Math.round(
                frame * sprite.naturalWidth / columns
            ),
            sprite.naturalWidth - cellWidth
        )
    );

    /*
     * Quitar un pixel de cada extremo
     * para evitar contaminacion lateral.
     */
    const horizontalInset = cellWidth > 4 ? 1 : 0;

    const finalWidth = Math.max(
        1,
        cellWidth - horizontalInset * 2
    );

    const frameCanvas = document.createElement("canvas");

    frameCanvas.width = finalWidth;
    frameCanvas.height = sprite.naturalHeight;

    const frameContext = frameCanvas.getContext("2d");

    frameContext.imageSmoothingEnabled = false;
    frameContext.webkitImageSmoothingEnabled = false;
    frameContext.msImageSmoothingEnabled = false;

    frameContext.drawImage(
        sprite,

        sourceStartX + horizontalInset,
        0,
        finalWidth,
        sprite.naturalHeight,

        0,
        0,
        frameCanvas.width,
        frameCanvas.height
    );

    removeCerberonBlackBackground(
        frameContext,
        frameCanvas.width,
        frameCanvas.height
    );

    return frameCanvas;
}

// ============================================================
// EXTRAER UN SOLO CUADRO
// ============================================================

function getCerberonFrame(
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

    const safeColumns = Math.max(1, columns);

    const safeFrame = Math.max(
        0,
        Math.min(safeColumns - 1, frame)
    );

    const key =
        `${sprite.src}-${safeFrame}-${safeColumns}`;

    if (cerberonFrameCache.has(key)) {
        return cerberonFrameCache.get(key);
    }

    let frameCanvas = null;

    /*
     * Solo el jefe y los drones se recortan por huecos
     * y se alinean. Proyectiles, lasers y explosiones
     * mantienen el recorte anterior.
     */
    if (cerberonExactFrameCounts.has(sprite)) {
        frameCanvas =
            buildCerberonAlignedFrame(
                sprite,
                safeFrame,
                safeColumns
            );
    }

    if (!frameCanvas) {
        frameCanvas =
            buildCerberonEqualFrame(
                sprite,
                safeFrame,
                safeColumns
            );
    }

    cerberonFrameCache.set(key, frameCanvas);

    return frameCanvas;
}

// ============================================================
// PRECARGAR TODOS LOS CUADROS
// ============================================================

function prepareCerberonSprite(sprite) {
    if (
        !sprite ||
        !sprite.naturalWidth ||
        !sprite.naturalHeight
    ) {
        return;
    }

    let columns;

    if (cerberonExactFrameCounts.has(sprite)) {
        columns = cerberonExactFrameCounts.get(sprite);
    } else {
        /*
         * Misma regla que usa drawCerberonProjectile
         * (parte 4) para efectos y proyectiles.
         */
        columns =
            sprite.naturalWidth >=
            sprite.naturalHeight * 2
                ? 6
                : 1;
    }

    for (
        let frame = 0;
        frame < columns;
        frame += 1
    ) {
        getCerberonFrame(sprite, frame, columns);
    }

    /*
     * Avisar si la cantidad configurada no coincide con los
     * sprites separados que se ven en el archivo. (Puede ser un
     * falso aviso si dos sprites se tocan entre si.)
     */
    if (cerberonExactFrameCounts.has(sprite)) {
        const layout =
            cerberonLayoutCache.get(`${sprite.src}-${columns}`);

        if (layout && layout.detectedFrames !== columns) {
            console.warn(
                `[Cerberon] ${sprite.src.split("/").pop()}: ` +
                `configurado con ${columns} cuadros, pero se ` +
                `detectan ${layout.detectedFrames} sprites ` +
                `separados. Revisa cerberonExactFrameCounts.`
            );
        }
    }
}
// ============================================================
// PARTE 2 DE 4
// CLASE PRINCIPAL DEL JEFE CERBERON
//
// Unico cambio respecto a la version anterior: en draw() el
// cuadro se dibuja con drawCerberonFrame() (misma escala para
// todas las animaciones, sin estirarlo a un cuadrado).
// ============================================================

class Jefe1 extends Enemy {
    constructor(x, y) {
        super(x, y);

        this.name = "CERBERON";
        this.isBoss = true;

        this.width = 115;
        this.height = 115;
        this.speed = 1.3;

        this.health = 2000;
        this.maxHealth = 2000;
        this.damage = 18;

        this.phase = 1;
        this.state = "CHASE";

        this.directionAngle = 0;
        this.spriteDirectionOffset = -Math.PI / 2;

        this.preferredDistance = 300;
        this.attackRange = 560;
        this.attackCooldown = 1500;

        this.nextAttackTime =
            performance.now() + 1200;

        this.attackIndex = 0;

        this.isAttacking = false;
        this.attackType = "SHOT";
        this.attackStartedAt = -Infinity;
        this.attackDuration = 850;
        this.attackReleased = false;

        this.walkStartedAt = performance.now();
        this.hitStartedAt = -Infinity;
        this.hitDuration = 180;

        this.isDying = false;
        this.deathStartedAt = -Infinity;
        this.deathDuration = 1500;

        /*
         * Posición y rotación que se
         * conservan durante los ataques.
         */
        this.lockedX = x;
        this.lockedY = y;
        this.lockedAngle = 0;
    }

    // ========================================================
    // ACTUALIZAR JEFE
    // ========================================================

    update(player) {
        const now = performance.now();

        if (!this.alive) {
            return;
        }

        if (this.isDying) {
            this.keepLocked();

            if (
                now - this.deathStartedAt >=
                this.deathDuration
            ) {
                this.alive = false;
            }

            return;
        }

        if (!player || !player.alive) {
            return;
        }

        this.updatePhase();

        /*
         * Mientras ataca no se ejecuta
         * ninguna función de movimiento.
         */
        if (this.isAttacking) {
            this.updateAttack(player, now);
            return;
        }

        const distanceX =
            player.x - this.x;

        const distanceY =
            player.y - this.y;

        const distance =
            Math.hypot(
                distanceX,
                distanceY
            );

        if (distance > 0) {
            this.directionAngle =
                Math.atan2(
                    distanceY,
                    distanceX
                );
        }

        if (
            distance <= this.attackRange &&
            now >= this.nextAttackTime
        ) {
            this.startNextAttack(now);
            return;
        }

        this.moveBoss(
            distanceX,
            distanceY,
            distance
        );

        this.keepInsideCanvas();
    }

    // ========================================================
    // FASES
    // ========================================================

    updatePhase() {
        const healthPercentage =
            this.health /
            this.maxHealth;

        if (healthPercentage > 0.60) {
            this.phase = 1;
            this.speed = 1.3;
            this.attackCooldown = 1500;
        } else if (
            healthPercentage > 0.30
        ) {
            this.phase = 2;
            this.speed = 2.05;
            this.attackCooldown = 1150;
        } else {
            this.phase = 3;
            this.speed = 2.35;
            this.attackCooldown = 850;
        }
    }

    // ========================================================
    // MOVIMIENTO
    // ========================================================

    moveBoss(
        distanceX,
        distanceY,
        distance
    ) {
        if (distance <= 0) {
            return;
        }

        const directionX =
            distanceX / distance;

        const directionY =
            distanceY / distance;

        if (
            distance >
            this.preferredDistance + 45
        ) {
            this.x +=
                directionX *
                this.speed;

            this.y +=
                directionY *
                this.speed;
        } else if (
            distance <
            this.preferredDistance - 45
        ) {
            this.x -=
                directionX *
                this.speed *
                0.75;

            this.y -=
                directionY *
                this.speed *
                0.75;
        } else {
            const orbitDirection =
                this.phase === 1
                    ? 1
                    : -1;

            this.x +=
                -directionY *
                this.speed *
                0.65 *
                orbitDirection;

            this.y +=
                directionX *
                this.speed *
                0.65 *
                orbitDirection;
        }
    }

    // ========================================================
    // COMENZAR ATAQUE
    // ========================================================

    startNextAttack(now) {
        let attacks;

        if (this.phase === 1) {
            attacks = [
                "SHOT",
                "MISSILES"
            ];
        } else if (this.phase === 2) {
            attacks = [
                "ROTATING_LASER",
                "IMPACT",
                "MISSILES"
            ];
        } else {
            attacks = [
                "LASER_RAIN",
                "SUMMON",
                "ROTATING_LASER",
                "IMPACT"
            ];
        }

        this.attackType =
            attacks[
                this.attackIndex %
                attacks.length
            ];

        this.attackIndex += 1;

        /*
         * Bloquear antes de cambiar
         * al primer cuadro del ataque.
         */
        this.lockPosition();

        this.isAttacking = true;
        this.state = "ATTACK";

        this.attackStartedAt = now;
        this.attackReleased = false;

        if (
            this.attackType ===
            "ROTATING_LASER"
        ) {
            this.attackDuration = 1100;
        } else if (
            this.attackType === "IMPACT"
        ) {
            this.attackDuration = 1050;
        } else if (
            this.attackType ===
            "LASER_RAIN"
        ) {
            this.attackDuration = 1200;
        } else if (
            this.attackType === "SUMMON"
        ) {
            this.attackDuration = 1150;
        } else {
            this.attackDuration = 850;
        }

        const attackSprite = {
            SHOT:
                cerberonSprites.shot,

            MISSILES:
                cerberonSprites.missiles,

            ROTATING_LASER:
                cerberonSprites.rotatingLaser,

            IMPACT:
                cerberonSprites.impact,

            LASER_RAIN:
                cerberonSprites.laserRain,

            SUMMON:
                cerberonSprites.summon
        }[this.attackType];

        const attackFrames =
            getCerberonSpriteFrameCount(
                attackSprite,
                1
            );

        this.attackDuration =
            Math.max(
                this.attackDuration,
                attackFrames * 145
            );

        this.keepLocked();
    }

    // ========================================================
    // ACTUALIZAR ATAQUE
    // ========================================================

    updateAttack(player, now) {
        /*
         * Restaurar la misma posición
         * durante todos los cuadros.
         */
        this.keepLocked();

        const elapsed =
            now -
            this.attackStartedAt;

        if (
            !this.attackReleased &&
            elapsed >=
                this.attackDuration * 0.48
        ) {
            this.attackReleased = true;
            this.executeAttack(player);
        }

        if (
            elapsed >=
            this.attackDuration
        ) {
            /*
             * Conservar la posición hasta
             * terminar el último cuadro.
             */
            this.keepLocked();

            this.isAttacking = false;
            this.state = "CHASE";

            this.walkStartedAt = now;

            this.nextAttackTime =
                now +
                this.attackCooldown;
        }
    }

    // ========================================================
    // EJECUTAR ATAQUE
    // ========================================================

    executeAttack(player) {
        if (
            this.attackType === "SHOT"
        ) {
            this.shootAtPlayer(
                player,
                "SHOT",
                7.2,
                this.damage
            );
        } else if (
            this.attackType ===
            "MISSILES"
        ) {
            this.shootSpread(
                player,
                3,
                0.20,
                "MISSILE",
                5.1,
                this.damage + 5
            );
        } else if (
            this.attackType ===
            "ROTATING_LASER"
        ) {
            this.shootRadial(
                12,
                "LASER",
                4.8,
                this.damage
            );
        } else if (
            this.attackType === "IMPACT"
        ) {
            this.shootRadial(
                16,
                "IMPACT",
                4.1,
                this.damage + 7
            );
        } else if (
            this.attackType ===
            "LASER_RAIN"
        ) {
            this.createLaserRain(player);
        } else if (
            this.attackType === "SUMMON"
        ) {
            this.summonDrones();
        }
    }

    // ========================================================
    // CREAR PROYECTIL
    // ========================================================

    createProjectile(
        angle,
        type,
        speed,
        damage,
        x = this.x,
        y = this.y
    ) {
        if (
            typeof projectiles ===
            "undefined"
        ) {
            return;
        }

        projectiles.push({
            x:
                x +
                Math.cos(angle) * 55,

            y:
                y +
                Math.sin(angle) * 55,

            radius:
                type === "IMPACT"
                    ? 12
                    : 8,

            speed,
            angle,
            damage,

            enemyProjectile: true,
            cerberonProjectile: true,

            cerberonProjectileType:
                type,

            spriteStartedAt:
                performance.now()
        });
    }

    shootAtPlayer(
        player,
        type,
        speed,
        damage
    ) {
        const angle =
            Math.atan2(
                player.y - this.y,
                player.x - this.x
            );

        this.createProjectile(
            angle,
            type,
            speed,
            damage
        );
    }

    shootSpread(
        player,
        amount,
        separation,
        type,
        speed,
        damage
    ) {
        const centerAngle =
            Math.atan2(
                player.y - this.y,
                player.x - this.x
            );

        const middle =
            (amount - 1) / 2;

        for (
            let index = 0;
            index < amount;
            index += 1
        ) {
            const angle =
                centerAngle +
                (
                    index -
                    middle
                ) *
                separation;

            this.createProjectile(
                angle,
                type,
                speed,
                damage
            );
        }
    }

    shootRadial(
        amount,
        type,
        speed,
        damage
    ) {
        const initialAngle =
            performance.now() / 350;

        for (
            let index = 0;
            index < amount;
            index += 1
        ) {
            const angle =
                initialAngle +
                index *
                (
                    Math.PI * 2 /
                    amount
                );

            this.createProjectile(
                angle,
                type,
                speed,
                damage
            );
        }
    }

    // ========================================================
    // LLUVIA DE LÁSERES
    // ========================================================

    createLaserRain(player) {
        if (
            typeof projectiles ===
            "undefined"
        ) {
            return;
        }

        for (
            let index = 0;
            index < 5;
            index += 1
        ) {
            const startX =
                Math.max(
                    30,
                    Math.min(
                        canvas.width - 30,

                        player.x -
                        260 +
                        index * 130 +
                        (
                            Math.random() *
                            40 -
                            20
                        )
                    )
                );

            const now =
                performance.now();

            projectiles.push({
                x: startX,
                y: canvas.height / 2,

                radius: 16,
                speed: 0,
                angle: Math.PI / 2,

                damage:
                    this.damage + 4,

                enemyProjectile: true,
                cerberonProjectile: true,

                cerberonProjectileType:
                    "LASER",

                isVerticalCerberonLaser:
                    true,

                laserWidth: 32,

                warningDuration:
                    550 +
                    index * 70,

                activeDuration: 850,

                createdAt: now,

                hasDamagedPlayer:
                    false,

                spriteStartedAt: now
            });
        }
    }

    // ========================================================
    // INVOCAR DRONES
    // ========================================================

    summonDrones() {
        if (
            typeof enemigos ===
            "undefined"
        ) {
            return;
        }

        for (
            let index = 0;
            index < 3;
            index += 1
        ) {
            const angle =
                index *
                (
                    Math.PI * 2 / 3
                );

            enemigos.push(
                new CerberonDrone(
                    this.x +
                        Math.cos(angle) *
                        85,

                    this.y +
                        Math.sin(angle) *
                        85
                )
            );
        }
    }

    // ========================================================
    // RECIBIR DAÑO Y MORIR
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

        if (this.health === 0) {
            /*
             * Bloquear antes de comenzar
             * la animación de muerte.
             */
            this.lockPosition();

            this.state = "DEAD";
            this.isDying = true;
            this.isAttacking = false;

            this.deathStartedAt =
                performance.now();

            this.deathDuration =
                Math.max(
                    1200,

                    getCerberonSpriteFrameCount(
                        cerberonSprites.death,
                        1
                    ) * 165
                );

            this.keepLocked();
        }
    }

    // ========================================================
    // BLOQUEAR POSICIÓN
    // ========================================================

    lockPosition() {
        this.lockedX = this.x;
        this.lockedY = this.y;

        this.lockedAngle =
            this.directionAngle;
    }

    keepLocked() {
        this.x = this.lockedX;
        this.y = this.lockedY;

        this.directionAngle =
            this.lockedAngle;
    }

    keepInsideCanvas() {
        const margin =
            this.width / 2;

        this.x =
            Math.max(
                margin,
                Math.min(
                    canvas.width -
                        margin,

                    this.x
                )
            );

        this.y =
            Math.max(
                margin,
                Math.min(
                    canvas.height -
                        margin,

                    this.y
                )
            );
    }

    // ========================================================
    // SELECCIONAR ANIMACIÓN
    // ========================================================

    getAnimation() {
        if (this.isDying) {
            return {
                sprite:
                    cerberonSprites.death,

                frames:
                    getCerberonSpriteFrameCount(
                        cerberonSprites.death,
                        8
                    ),

                duration:
                    this.deathDuration,

                loop: false
            };
        }

        if (this.isAttacking) {
            const attackAnimations = {
                SHOT: {
                    sprite:
                        cerberonSprites.shot
                },

                MISSILES: {
                    sprite:
                        cerberonSprites.missiles
                },

                ROTATING_LASER: {
                    sprite:
                        cerberonSprites
                            .rotatingLaser
                },

                IMPACT: {
                    sprite:
                        cerberonSprites.impact
                },

                LASER_RAIN: {
                    sprite:
                        cerberonSprites
                            .laserRain
                },

                SUMMON: {
                    sprite:
                        cerberonSprites.summon
                }
            };

            const selectedAnimation =
                attackAnimations[
                    this.attackType
                ];

            return {
                sprite:
                    selectedAnimation.sprite,

                frames:
                    getCerberonSpriteFrameCount(
                        selectedAnimation.sprite,
                        1
                    ),

                duration:
                    this.attackDuration,

                loop: false
            };
        }

        if (this.phase === 1) {
            const frames =
                getCerberonSpriteFrameCount(
                    cerberonSprites.walk1,
                    1
                );

            return {
                sprite:
                    cerberonSprites.walk1,

                frames,

                duration:
                    frames * 170,

                loop: true
            };
        }

        if (this.phase === 2) {
            const frames =
                getCerberonSpriteFrameCount(
                    cerberonSprites.fastWalk,
                    1
                );

            return {
                sprite:
                    cerberonSprites.fastWalk,

                frames,

                duration:
                    frames * 145,

                loop: true
            };
        }

        const frames =
            getCerberonSpriteFrameCount(
                cerberonSprites.idle3,
                1
            );

        return {
            sprite:
                cerberonSprites.idle3,

            frames,

            duration:
                frames * 155,

            loop: true
        };
    }

    // ========================================================
    // DIBUJAR JEFE
    // ========================================================

    draw(ctx) {
        if (!this.alive) {
            return;
        }

        const now =
            performance.now();

        const animation =
            this.getAnimation();

        const startedAt =
            this.isDying
                ? this.deathStartedAt
                : this.isAttacking
                    ? this.attackStartedAt
                    : this.walkStartedAt;

        const frameDuration =
            animation.duration /
            Math.max(
                1,
                animation.frames
            );

        const rawFrame =
            Math.floor(
                Math.max(
                    0,
                    now - startedAt
                ) /
                frameDuration
            );

        const frame =
            animation.loop
                ? rawFrame %
                    animation.frames
                : Math.min(
                    animation.frames - 1,
                    rawFrame
                );

        let drawable =
            getCerberonFrame(
                animation.sprite,
                frame,
                animation.frames
            );

        /*
         * Si un sprite de ataque todavía
         * no carga, mostrar el sprite base.
         */
        if (
            !drawable &&
            this.isAttacking
        ) {
            let baseSprite;

            if (this.phase === 1) {
                baseSprite =
                    cerberonSprites.walk1;
            } else if (
                this.phase === 2
            ) {
                baseSprite =
                    cerberonSprites.fastWalk;
            } else {
                baseSprite =
                    cerberonSprites.idle3;
            }

            const baseFrames =
                getCerberonSpriteFrameCount(
                    baseSprite,
                    1
                );

            const baseFrame =
                Math.floor(
                    (
                        now -
                        this.walkStartedAt
                    ) / 100
                ) %
                baseFrames;

            drawable =
                getCerberonFrame(
                    baseSprite,
                    baseFrame,
                    baseFrames
                );
        }

        if (drawable) {
            /*
             * Durante ataque o muerte usa
             * exclusivamente las coordenadas
             * y la rotación bloqueadas.
             */
            const renderX =
                this.isAttacking ||
                this.isDying
                    ? this.lockedX
                    : this.x;

            const renderY =
                this.isAttacking ||
                this.isDying
                    ? this.lockedY
                    : this.y;

            const renderAngle =
                this.isAttacking ||
                this.isDying
                    ? this.lockedAngle
                    : this.directionAngle;

            ctx.save();

            ctx.translate(
                Math.round(renderX),
                Math.round(renderY)
            );

            ctx.rotate(
                renderAngle +
                this.spriteDirectionOffset
            );

            /*
             * Misma escala para todas las animaciones y
             * sin estirar el cuadro a un cuadrado.
             * (CERBERON_BOSS_PIXEL_SCALE esta en la parte 1)
             */
            drawCerberonFrame(
                ctx,
                drawable,
                CERBERON_BOSS_PIXEL_SCALE
            );

            ctx.restore();
        }

        this.drawBossHealth(ctx);
    }

    // ========================================================
    // BARRA DE VIDA DEL JEFE
    // ========================================================

    drawBossHealth(ctx) {
        if (this.isDying) {
            return;
        }

        const width =
            Math.min(
                620,
                canvas.width * 0.60
            );

        const height = 18;

        const x =
            (
                canvas.width -
                width
            ) / 2;

        const y =
            canvas.height - 42;

        const percentage =
            Math.max(
                0,
                this.health /
                this.maxHealth
            );

        ctx.save();

        ctx.fillStyle =
            "rgba(0, 0, 0, 0.75)";

        ctx.fillRect(
            x,
            y,
            width,
            height
        );

        ctx.fillStyle =
            this.phase === 1
                ? "#35e6a1"
                : this.phase === 2
                    ? "#ffb42e"
                    : "#ff334f";

        ctx.fillRect(
            x,
            y,
            width * percentage,
            height
        );

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;

        ctx.strokeRect(
            x,
            y,
            width,
            height
        );

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px Arial";
        ctx.textAlign = "center";

        ctx.fillText(
            `${this.name} - FASE ${this.phase} - ${this.health}/${this.maxHealth}`,
            canvas.width / 2,
            y - 7
        );

        ctx.restore();
    }
}
// ============================================================
// PARTE 3 DE 4
// DRONES GENERADOS POR CERBERON
//
// Cambios respecto a la version anterior:
//  1. draw() usa la nueva animacion de daño (Cerberon-drone-dano).
//  2. El tamaño se normaliza por hoja (CERBERON_DRONE_BODY_WIDTH),
//     porque el idle tiene menor resolucion que las demas hojas.
//  3. La animacion de ataque se reparte en toda la duracion del
//     ataque (antes duraba 945 ms pero el ataque terminaba a los
//     520 ms: se cortaba en el cuadro 4 y saltaba a caminar).
//  4. Sin estirar el cuadro a un cuadrado de 60x60.
// ============================================================

class CerberonDrone extends Enemy {
    constructor(x, y) {
        super(x, y);

        this.width = 32;
        this.height = 32;
        this.speed = 2.8;

        this.health = 55;
        this.maxHealth = 55;
        this.damage = 7;

        this.state = "CHASE";

        this.attackRange = 250;
        this.attackCooldown = 1500;

        this.nextAttackTime =
            performance.now() + 700;

        this.directionAngle = 0;

        this.spriteDirectionOffset =
            -Math.PI / 2;

        this.walkStartedAt =
            performance.now();

        this.hitStartedAt =
            -Infinity;

        this.hitDuration = 420;

        this.isAttacking = false;

        this.attackStartedAt =
            -Infinity;

        this.attackDuration = 520;
        this.attackReleased = false;

        this.isDying = false;

        this.deathStartedAt =
            -Infinity;

        this.deathDuration = 700;

        /*
         * Posición y ángulo que se
         * conservarán durante el ataque
         * y durante la muerte.
         */
        this.lockedX = x;
        this.lockedY = y;
        this.lockedAngle = 0;
    }

    // ========================================================
    // ACTUALIZAR DRON
    // ========================================================

    update(player) {
        const now =
            performance.now();

        if (!this.alive) {
            return;
        }

        if (this.isDying) {
            /*
             * Mantener la animación de
             * muerte en el mismo lugar.
             */
            this.keepLocked();

            if (
                now - this.deathStartedAt >=
                this.deathDuration
            ) {
                this.alive = false;
            }

            return;
        }

        if (
            !player ||
            !player.alive
        ) {
            return;
        }

        /*
         * Durante el ataque el dron no
         * puede cambiar de posición.
         */
        if (this.isAttacking) {
            this.keepLocked();

            const attackElapsed =
                now -
                this.attackStartedAt;

            if (
                !this.attackReleased &&
                attackElapsed >=
                    this.attackDuration *
                    0.45
            ) {
                this.attackReleased = true;
                this.shoot(player);
            }

            if (
                attackElapsed >=
                this.attackDuration
            ) {
                /*
                 * Mantener el bloqueo hasta
                 * terminar el último cuadro.
                 */
                this.keepLocked();

                this.isAttacking = false;
                this.state = "CHASE";

                this.walkStartedAt = now;

                this.nextAttackTime =
                    now +
                    this.attackCooldown;
            }

            return;
        }

        const distanceX =
            player.x - this.x;

        const distanceY =
            player.y - this.y;

        const distance =
            Math.hypot(
                distanceX,
                distanceY
            );

        if (distance > 0) {
            this.directionAngle =
                Math.atan2(
                    distanceY,
                    distanceX
                );
        }

        if (
            distance <=
                this.attackRange &&
            now >=
                this.nextAttackTime
        ) {
            /*
             * Bloquear primero y después
             * iniciar la animación.
             */
            this.lockPosition();

            this.isAttacking = true;
            this.state = "ATTACK";

            this.attackStartedAt = now;
            this.attackReleased = false;

            this.keepLocked();
        } else if (
            distance > 175 &&
            distance > 0
        ) {
            this.x +=
                (
                    distanceX /
                    distance
                ) *
                this.speed;

            this.y +=
                (
                    distanceY /
                    distance
                ) *
                this.speed;
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
                player.y - this.y,
                player.x - this.x
            );

        projectiles.push({
            x:
                this.x +
                Math.cos(angle) *
                22,

            y:
                this.y +
                Math.sin(angle) *
                22,

            radius: 6,
            speed: 5.4,
            angle,

            damage:
                this.damage,

            enemyProjectile: true,
            cerberonProjectile: true,

            cerberonProjectileType:
                "SHOT",

            spriteStartedAt:
                performance.now()
        });
    }

    // ========================================================
    // RECIBIR DAÑO Y MORIR
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

        if (this.health === 0) {
            /*
             * Bloquear antes de iniciar
             * la animación de muerte.
             */
            this.lockPosition();

            this.isDying = true;
            this.state = "DEAD";
            this.isAttacking = false;

            this.deathStartedAt =
                performance.now();

            this.deathDuration =
                Math.max(
                    600,

                    getCerberonSpriteFrameCount(
                        cerberonSprites
                            .droneDeath,

                        1
                    ) * 140
                );

            this.keepLocked();
        }
    }

    // ========================================================
    // BLOQUEAR POSICIÓN
    // ========================================================

    lockPosition() {
        this.lockedX = this.x;
        this.lockedY = this.y;

        this.lockedAngle =
            this.directionAngle;
    }

    keepLocked() {
        this.x = this.lockedX;
        this.y = this.lockedY;

        this.directionAngle =
            this.lockedAngle;
    }

    // ========================================================
    // DIBUJAR DRON
    // ========================================================

    draw(ctx) {
        if (!this.alive) {
            return;
        }

        const now =
            performance.now();

        function isReady(image) {
            return (
                image &&
                image.complete &&
                image.naturalWidth > 0
            );
        }

        let sprite =
            cerberonSprites.drone;

        let startedAt =
            this.walkStartedAt;

        let durationPerFrame = 145;
        let loop = true;
        let fixedFrame = null;

        const hitElapsed =
            now - this.hitStartedAt;

        const isHit =
            hitElapsed >= 0 &&
            hitElapsed < this.hitDuration;

        /*
         * Prioridad: muerte > ataque > daño > caminar.
         * Las tres primeras se reproducen completas y siempre
         * empiezan en el cuadro 1 (la pose neutral), por lo
         * que el cambio de sprite es instantaneo.
         */
        if (
            this.isDying &&
            isReady(cerberonSprites.droneDeath)
        ) {
            sprite =
                cerberonSprites.droneDeath;

            startedAt =
                this.deathStartedAt;

            durationPerFrame =
                this.deathDuration /
                getCerberonSpriteFrameCount(
                    sprite,
                    1
                );

            loop = false;
        } else if (
            this.isAttacking &&
            isReady(cerberonSprites.droneAttack)
        ) {
            sprite =
                cerberonSprites.droneAttack;

            startedAt =
                this.attackStartedAt;

            /*
             * Repartir todos los cuadros en la duracion real
             * del ataque, para que llegue al ultimo cuadro
             * justo cuando termina.
             */
            durationPerFrame =
                this.attackDuration /
                getCerberonSpriteFrameCount(
                    sprite,
                    1
                );

            loop = false;
        } else if (
            isHit &&
            isReady(cerberonSprites.droneDamage)
        ) {
            sprite =
                cerberonSprites.droneDamage;

            startedAt =
                this.hitStartedAt;

            durationPerFrame =
                this.hitDuration /
                getCerberonSpriteFrameCount(
                    sprite,
                    1
                );

            loop = false;
        } else if (
            !CERBERON_DRONE_USE_IDLE_FILE &&
            isReady(cerberonSprites.droneAttack)
        ) {
            /*
             * Caminar usando el primer cuadro de la hoja de
             * ataque (misma resolucion y estilo).
             */
            sprite =
                cerberonSprites.droneAttack;

            fixedFrame = 0;
        }

        const frameCount =
            getCerberonSpriteFrameCount(
                sprite,
                1
            );

        const rawFrame =
            Math.floor(
                Math.max(
                    0,
                    now - startedAt
                ) /
                durationPerFrame
            );

        const frame =
            fixedFrame !== null
                ? fixedFrame
                : loop
                    ? rawFrame %
                        frameCount
                    : Math.min(
                        frameCount - 1,
                        rawFrame
                    );

        const drawable =
            getCerberonFrame(
                sprite,
                frame,
                frameCount
            );

        if (drawable) {
            /*
             * Ataque y muerte utilizan
             * siempre la posición bloqueada.
             */
            const renderX =
                this.isAttacking ||
                this.isDying
                    ? this.lockedX
                    : this.x;

            const renderY =
                this.isAttacking ||
                this.isDying
                    ? this.lockedY
                    : this.y;

            const renderAngle =
                this.isAttacking ||
                this.isDying
                    ? this.lockedAngle
                    : this.directionAngle;

            ctx.save();

            ctx.translate(
                Math.round(renderX),
                Math.round(renderY)
            );

            ctx.rotate(
                renderAngle +
                this.spriteDirectionOffset
            );

            /*
             * Escala que deja el cuerpo del dron con el mismo
             * ancho en pantalla en TODAS las animaciones.
             * (CERBERON_DRONE_BODY_WIDTH esta en la parte 1)
             */
            drawCerberonFrame(
                ctx,
                drawable,
                getCerberonBodyScale(
                    sprite,
                    frameCount,
                    CERBERON_DRONE_BODY_WIDTH,
                    drawable
                )
            );

            ctx.restore();
        }

        if (!this.isDying) {
            this.drawHealthBar(
                ctx,
                34,
                4,
                9
            );
        }
    }
}
// ============================================================
// PARTE 4 DE 4
// DIBUJAR PROYECTILES Y LÁSERES DE CERBERON
// Esta función es llamada desde main.js
//
// Cambios respecto a la version anterior:
//  1. Cada proyectil se gira segun hacia donde "mira" su sprite
//     (el disparo tiene la cabeza a la izquierda; el misil y el
//     laser miran hacia arriba).
//  2. Ya no se estiran a un rectangulo fijo: se conserva la
//     proporcion del sprite y solo se define su largo.
//  3. La cantidad de cuadros es explicita. Antes toda imagen con
//     ancho >= 2 veces el alto se cortaba en 6 cuadros, y el
//     disparo (proporcion 3.2) se habria cortado en 6 tiras.
//  4. El area de impacto (elipse) ya no gira ni se aplasta.
// ============================================================

/*
 * Cantidad de cuadros de cada proyectil.
 * Todos los sprites de la hoja son imagenes sueltas (1 cuadro).
 * Si mas adelante haces uno animado, cambia aqui su cantidad.
 */
const cerberonProjectileFrameCounts = {
    SHOT: 1,
    MISSILE: 1,
    LASER: 1,
    IMPACT: 1
};

/*
 * Como se dibuja cada proyectil:
 *  - length:         largo en pantalla (en pixeles).
 *  - lengthAxis:     eje del sprite al que corresponde ese largo;
 *                    el otro eje sale de la proporcion original.
 *  - rotates:        si gira siguiendo la direccion del proyectil.
 *  - rotationOffset: giro extra segun hacia donde mira el sprite.
 *      SHOT:    cabeza a la izquierda -> Math.PI
 *      MISSILE: punta hacia arriba    -> Math.PI / 2
 *      LASER:   punta hacia arriba    -> Math.PI / 2
 *
 * Si algun proyectil sale de espaldas, cambia su rotationOffset
 * (suma o resta Math.PI).
 */
const cerberonProjectileDrawConfig = {
    SHOT: {
        length: 48,
        lengthAxis: "width",
        rotates: true,
        rotationOffset: Math.PI
    },

    MISSILE: {
        length: 52,
        lengthAxis: "height",
        rotates: true,
        rotationOffset: Math.PI / 2
    },

    LASER: {
        length: 72,
        lengthAxis: "height",
        rotates: true,
        rotationOffset: Math.PI / 2
    },

    IMPACT: {
        length: 60,
        lengthAxis: "width",
        rotates: false,
        rotationOffset: 0
    }
};

function drawCerberonProjectile(
    ctx,
    projectile
) {
    const spriteByType = {
        SHOT:
            cerberonSprites.projectile,

        MISSILE:
            cerberonSprites.missile,

        LASER:
            cerberonSprites.laser,

        IMPACT:
            cerberonSprites.impactArea
    };

    const type =
        projectile
            .cerberonProjectileType;

    const sprite =
        spriteByType[type];

    /*
     * Cantidad de cuadros definida
     * de forma explicita por tipo.
     */
    const frameCount =
        cerberonProjectileFrameCounts[type] ||
        1;

    const elapsed =
        performance.now() -
        projectile.spriteStartedAt;

    const frame =
        Math.max(
            0,
            Math.floor(
                elapsed / 75
            )
        ) %
        frameCount;

    const drawable =
        getCerberonFrame(
            sprite,
            frame,
            frameCount
        );

    if (!drawable) {
        return false;
    }

    // ========================================================
    // LÁSER VERTICAL
    // ========================================================

    if (
        projectile
            .isVerticalCerberonLaser
    ) {
        const laserElapsed =
            performance.now() -
            projectile.createdAt;

        const active =
            laserElapsed >=
            projectile.warningDuration;

        /*
         * Antes de activarse se dibuja una
         * línea delgada de advertencia.
         */
        const beamWidth =
            active
                ? projectile.laserWidth
                : 4;

        ctx.save();

        ctx.globalAlpha =
            active
                ? 0.95
                : 0.55;

        ctx.shadowColor =
            "#ff233f";

        ctx.shadowBlur =
            active
                ? 26
                : 12;

        if (active) {
            const gradient =
                ctx.createLinearGradient(
                    projectile.x -
                        beamWidth / 2,

                    0,

                    projectile.x +
                        beamWidth / 2,

                    0
                );

            gradient.addColorStop(
                0,
                "rgba(255, 20, 40, 0.15)"
            );

            gradient.addColorStop(
                0.35,
                "#ff243f"
            );

            gradient.addColorStop(
                0.50,
                "#ffffff"
            );

            gradient.addColorStop(
                0.65,
                "#ff243f"
            );

            gradient.addColorStop(
                1,
                "rgba(255, 20, 40, 0.15)"
            );

            ctx.fillStyle =
                gradient;
        } else {
            ctx.fillStyle =
                "#ff4055";
        }

        /*
         * Dibuja el láser como una línea
         * recta desde arriba hasta abajo.
         */
        ctx.fillRect(
            projectile.x -
                beamWidth / 2,

            0,

            beamWidth,

            canvas.height
        );

        /*
         * Colocar el sprite sobre la
         * misma columna vertical.
         */
        if (active) {
            ctx.globalAlpha = 0.65;

            ctx.drawImage(
                drawable,

                projectile.x -
                    beamWidth,

                0,

                beamWidth * 2,

                canvas.height
            );
        }

        ctx.restore();

        return true;
    }

    // ========================================================
    // TAMAÑO Y ORIENTACIÓN DE PROYECTILES NORMALES
    // ========================================================

    const config =
        cerberonProjectileDrawConfig[type] ||
        cerberonProjectileDrawConfig.SHOT;

    /*
     * Se define solo el largo; el otro lado sale
     * de la proporcion original del sprite.
     */
    const scale =
        config.lengthAxis === "height"
            ? config.length / drawable.height
            : config.length / drawable.width;

    const drawWidth =
        drawable.width * scale;

    const drawHeight =
        drawable.height * scale;

    // ========================================================
    // DIBUJAR PROYECTIL NORMAL
    // ========================================================

    ctx.save();

    ctx.translate(
        projectile.x,
        projectile.y
    );

    if (config.rotates) {
        ctx.rotate(
            projectile.angle +
            config.rotationOffset
        );
    }

    ctx.shadowColor =
        "#ff233f";

    ctx.shadowBlur = 18;

    /*
     * El proyectil se dibuja centrado
     * exactamente sobre sus coordenadas.
     */
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