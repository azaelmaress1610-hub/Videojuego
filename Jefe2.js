// ============================================================
// JEFE2.JS - NEXUS PRIME
// PARTE 1 DE 3
// CARGA Y PROCESAMIENTO DE SPRITES
//
// Mismo enfoque que ya se aplico a Cerberon (jefe1.js):
//  1. Los cuadros se recortan por los huecos vacios entre
//     sprites (no en columnas iguales), y se alinean todos
//     con el mismo punto, para que el cuerpo no se desplace
//     al cambiar de animacion.
//  2. Todos los cuadros se procesan al cargar la imagen, asi
//     el cambio de animacion es instantaneo.
//  3. El tamano en pantalla se normaliza por hoja, para que
//     Nexus no cambie de tamano al cambiar de sprite.
//  4. Se agregan sprites de EFECTOS (proyectil, rayo, aguja,
//     meteoro) para que los ataques se vean como en tu hoja
//     de referencia, en vez de las formas genericas actuales.
//  5. Se agrega un enfoque (unsharp mask) aplicado UNA SOLA VEZ
//     a cada cuadro ya recortado. Esto ayuda a que un jpg con
//     algo de compresion se vea mas nitido, pero no puede
//     arreglar un archivo fuente que ya viene muy comprimido.
//  6. RENDIMIENTO: antes, cada cuadro se escalaba a su tamano
//     final EN CADA FOTOGRAMA (60 veces por segundo, encima
//     rotado). Ahora cada cuadro se escala una sola vez, con
//     la mejor calidad, y el resultado se guarda en cache
//     (getNexusDisplayFrame). En pantalla solo se rota y se
//     dibuja 1:1, sin volver a escalar, lo que evita tirones
//     y ademas se ve mas nitido (una sola pasada de escalado
//     de alta calidad, en vez de reescalar sobre algo ya
//     reescalado cuadro a cuadro).
//
// IMPORTANTE - archivos que faltan:
// No tengo tus archivos reales de Nexus (solo la hoja de
// referencia general), asi que:
//  - Las cantidades de cuadros son las que ya tenias en tu
//    codigo (9, 8, 8...). Si tu archivo real tiene otra
//    cantidad, cambia el numero en nexusFrameCounts (abajo)
//    y revisa la consola (F12): avisa si no coincide.
//  - Los 4 archivos de efectos (proyectil, rayo, aguja,
//    meteoro) son NOMBRES SUPUESTOS. Si no existen en tu
//    carpeta, el juego sigue funcionando: cada ataque cae
//    automaticamente en su dibujo vectorial de respaldo
//    (el mismo que ya tenias). Solo tienes que colocar un
//    archivo con ese nombre en Sprites/Jefe2/ para que se
//    use la imagen real.
// ============================================================

const NEXUS_PATH = "Sprites/Jefe2/";

function loadNexusSprite(fileName) {
    const image = new Image();

    image.onload = function () {
        prepareNexusSprite(image);
    };

    image.src = NEXUS_PATH + fileName;

    return image;
}

// ============================================================
// SPRITES DEL CUERPO (ANIMACIONES)
// ============================================================

const nexusSprites = {
    idle1: loadNexusSprite("Nexus-idle-fase1.jpg"),
    walk1: loadNexusSprite("Nexus-movimiento-fase1.jpg"),
    rays: loadNexusSprite("Nexus-ataque-rayos.jpg"),
    projectiles: loadNexusSprite("Nexus-ataque-proyectiles.jpg"),

    idle2: loadNexusSprite("Nexus-idle-fase2.jpg"),
    fastWalk: loadNexusSprite("Nexus-movimiento-rapido.jpg"),
    orbitalLaser: loadNexusSprite("Nexus-laser-orbital.jpg"),
    summon: loadNexusSprite("Nexus-invocacion.jpg"),

    idle3: loadNexusSprite("Nexus-idle-fase3.jpg"),
    meteors: loadNexusSprite("Nexus-lluvia-meteoros.jpg"),
    needles: loadNexusSprite("Nexus-agujas-gravitacionales.jpg"),
    army: loadNexusSprite("Nexus-ejercito.jpg"),

    death: loadNexusSprite("Nexus-muerte.jpg")
};

// ============================================================
// SPRITES DE EFECTOS (PROYECTILES)
// Nombres supuestos. Si el archivo no existe, el juego usa
// el dibujo vectorial de respaldo sin romperse.
// ============================================================

/*
 * Hoja real de efectos (nos la pasaste): 7 iconos en una fila,
 * en este orden: Proyectil, Rayo, Laser orbital, Meteoro,
 * Aguja gravitacional, Explosion, Singularidad.
 * Se recortan en runtime con getNexusEffectIcon() (mas abajo).
 */
const nexusEffectsSheet =
    loadNexusSprite("Nexus-efectos-ataque.jpg");

const NEXUS_EFFECT_ICON_ORDER = [
    "projectile",
    "ray",
    "orbitalBeam",
    "meteor",
    "needle",
    "explosion",
    "singularity"
];

// ============================================================
// CANTIDAD DE CUADROS
// ============================================================

const nexusFrameCounts = new Map([
    /*
     * VERIFICADOS contando a mano sobre tus archivos reales
     * (superpuse una cuadricula y confirme donde cae cada
     * division; cuando el ancho de cuadro no era parejo,
     * conte las poses una por una):
     */
    [nexusSprites.idle1, 7],       // antes 9
    [nexusSprites.walk1, 8],       // antes 9
    [nexusSprites.rays, 9],        // ya estaba bien
    [nexusSprites.projectiles, 9], // ya estaba bien

    [nexusSprites.idle2, 7],       // antes 8
    [nexusSprites.fastWalk, 7],    // antes 8
    [nexusSprites.orbitalLaser, 8],// ya estaba bien
    [nexusSprites.summon, 8],      // ya estaba bien

    [nexusSprites.idle3, 8],       // ya estaba bien
    [nexusSprites.meteors, 8],     // ya estaba bien
    [nexusSprites.army, 9],        // antes 8 (mejor conteo a ojo)

    /*
     * NO VERIFICADO. Esta hoja tiene rafagas con varias puas
     * separadas por huecos tan anchos como los huecos entre
     * cuadros distintos: no hay forma automatica confiable de
     * saber cuales son "una pua mas" y cuales son "un cuadro
     * nuevo". Deje 8 como estaba. Si en el juego ves que se
     * corta o salta raro, dime cuantas poses distintas ves en
     * el archivo (cuerpo + cada rafaga + cada pua sola) y lo
     * ajusto, o mandame el archivo ya recortado en cuadros
     * individuales, como hiciste con el dron de Cerberon.
     */
    [nexusSprites.needles, 8],

    [nexusSprites.death, 9],       // ya estaba bien

    // Hoja de efectos: VERIFICADA con tu archivo real (7 iconos).
    [nexusEffectsSheet, 7]
]);

const nexusFrameCache = new Map();

/*
 * AJUSTE MANUAL OPCIONAL (en pixeles del sprite original).
 * Se suma a la alineacion automatica de toda la hoja.
 */
const nexusManualOffsets = new Map([
    // [nexusSprites.rays, { x: 0, y: 0 }],
]);

/*
 * Ancho en pantalla (pixeles) que debe tener el CUERPO de
 * Nexus, igual en todas las animaciones. Si se ve muy
 * grande o muy chico, cambia solo este numero.
 */
const NEXUS_BODY_WIDTH = 210;

const NEXUS_CONTENT_THRESHOLD = 40;
const NEXUS_EDGE_INSET = 2;

/*
 * Intensidad del enfoque aplicado a cada cuadro ya recortado.
 * 0 = desactivado. Valores tipicos: 0.3 (sutil) a 0.8 (fuerte).
 * Si al aumentarlo aparece "halo" o ruido en los bordes, bajalo.
 */
const NEXUS_SHARPEN_AMOUNT = 0.5;

function getNexusFrameCount(
    sprite,
    fallback = 1
) {
    return (
        nexusFrameCounts.get(sprite) ||
        fallback
    );
}

// ============================================================
// DIBUJAR UN CUADRO SIN ESTIRARLO
// ============================================================

function drawNexusFrame(context, drawable, scale) {
    const drawWidth = drawable.width * scale;
    const drawHeight = drawable.height * scale;

    /*
     * Suavizado de alta calidad al agrandar el cuadro. El
     * navegador usa un escalado mas barato por defecto, que
     * se ve mas borroso al ampliar bastante una imagen chica.
     */
    context.imageSmoothingEnabled = true;

    if ("imageSmoothingQuality" in context) {
        context.imageSmoothingQuality = "high";
    }

    context.drawImage(
        drawable,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
    );
}

/*
 * Escala que deja el cuerpo del primer cuadro de la hoja
 * con el ancho NEXUS_BODY_WIDTH. Si no se puede leer la
 * hoja (o el archivo no cargo), se usa un valor aproximado.
 */
function getNexusBodyScale(
    sprite,
    columns,
    drawable
) {
    const layout = getNexusSheetLayout(sprite, columns);

    if (layout) {
        const first = layout.cells[0];
        const bodyWidth = first.maximumX - first.minimumX + 1;

        if (bodyWidth > 0) {
            return NEXUS_BODY_WIDTH / bodyWidth;
        }
    }

    return NEXUS_BODY_WIDTH / (drawable.width * 0.8);
}

// ============================================================
// CUADRO YA ESCALADO AL TAMAÑO FINAL (CACHEADO)
//
// getNexusFrame() da el cuadro recortado a su tamaño original.
// Esta funcion lo escala UNA SOLA VEZ al tamano que se vera en
// pantalla (con la mejor calidad) y guarda el resultado, para
// que dibujarlo en cada fotograma sea solo "rotar y pegar",
// sin volver a escalar.
// ============================================================

const nexusDisplayFrameCache = new Map();

function getNexusDisplayFrame(sprite, frame, frameCount) {
    const source = getNexusFrame(sprite, frame, frameCount);

    if (!source) {
        return null;
    }

    const scale = getNexusBodyScale(sprite, frameCount, source);

    const key =
        `${sprite.src}-${frame}-${frameCount}-${scale.toFixed(4)}`;

    if (nexusDisplayFrameCache.has(key)) {
        return nexusDisplayFrameCache.get(key);
    }

    const displayCanvas = document.createElement("canvas");

    displayCanvas.width =
        Math.max(1, Math.round(source.width * scale));

    displayCanvas.height =
        Math.max(1, Math.round(source.height * scale));

    const displayContext = displayCanvas.getContext("2d");

    displayContext.imageSmoothingEnabled = true;

    if ("imageSmoothingQuality" in displayContext) {
        displayContext.imageSmoothingQuality = "high";
    }

    displayContext.drawImage(
        source,
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

    nexusDisplayFrameCache.set(key, displayCanvas);

    return displayCanvas;
}

/*
 * Dibuja un cuadro YA escalado, centrado en (0, 0), a su tamano
 * real (1:1, sin volver a escalar). Se llama despues de
 * ctx.translate y ctx.rotate.
 */
function drawNexusFrameNative(context, drawable) {
    context.imageSmoothingEnabled = false;

    context.drawImage(
        drawable,
        -drawable.width / 2,
        -drawable.height / 2
    );
}

// ============================================================
// QUITAR FONDO NEGRO
// (solo para hojas SIN transparencia real, como los .jpg)
// ============================================================

function removeNexusBlackBackground(
    context,
    width,
    height,
    threshold = 24
) {
    let imageData;

    try {
        imageData = context.getImageData(
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

    let start = 0;
    let end = 0;

    function isBackground(position) {
        const index = position * 4;

        return (
            pixels[index + 3] === 0 ||
            Math.max(
                pixels[index],
                pixels[index + 1],
                pixels[index + 2]
            ) <= threshold
        );
    }

    function add(x, y) {
        if (
            x < 0 ||
            x >= width ||
            y < 0 ||
            y >= height
        ) {
            return;
        }

        const position = y * width + x;

        if (
            visited[position] ||
            !isBackground(position)
        ) {
            return;
        }

        visited[position] = 1;
        queue[end] = position;
        end += 1;
    }

    for (let x = 0; x < width; x += 1) {
        add(x, 0);
        add(x, height - 1);
    }

    for (let y = 0; y < height; y += 1) {
        add(0, y);
        add(width - 1, y);
    }

    while (start < end) {
        const position = queue[start];
        start += 1;

        const x = position % width;
        const y = Math.floor(position / width);

        pixels[position * 4 + 3] = 0;

        add(x - 1, y);
        add(x + 1, y);
        add(x, y - 1);
        add(x, y + 1);
    }

    context.putImageData(imageData, 0, 0);
}

// ============================================================
// ENFOQUE (UNSHARP MASK)
// Se aplica una sola vez a cada cuadro ya recortado, nunca en
// cada fotograma dibujado (el resultado queda en la cache).
// ============================================================

function sharpenNexusCanvas(canvas, amount) {
    if (!amount) {
        return;
    }

    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    let imageData;

    try {
        imageData = context.getImageData(0, 0, width, height);
    } catch (error) {
        return;
    }

    const source = imageData.data;
    const output = new Uint8ClampedArray(source);

    const center = 1 + 4 * amount;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4;

            /*
             * No tocar pixeles transparentes ni sus vecinos
             * inmediatos, para no crear un borde artificial
             * alrededor de la silueta.
             */
            if (source[index + 3] < 200) {
                continue;
            }

            const left = x > 0 ? index - 4 : index;
            const right = x < width - 1 ? index + 4 : index;
            const up = y > 0 ? index - width * 4 : index;
            const down = y < height - 1 ? index + width * 4 : index;

            if (
                source[left + 3] < 200 ||
                source[right + 3] < 200 ||
                source[up + 3] < 200 ||
                source[down + 3] < 200
            ) {
                continue;
            }

            for (let channel = 0; channel < 3; channel += 1) {
                const value =
                    source[index + channel] * center -
                    amount * (
                        source[left + channel] +
                        source[right + channel] +
                        source[up + channel] +
                        source[down + channel]
                    );

                output[index + channel] =
                    Math.max(0, Math.min(255, value));
            }
        }
    }

    imageData.data.set(output);

    context.putImageData(imageData, 0, 0);
}

// ============================================================
// BUSCAR LOS HUECOS ENTRE SPRITES
// ============================================================

function findNexusGapCenters(profile) {
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

/*
 * 1) Si hay exactamente columns - 1 huecos vacios reales,
 *    se corta por el centro de cada uno.
 * 2) Si no (sprites que casi se tocan), se busca cada limite
 *    cerca de la division igual, en la columna mas vacia.
 */
function findNexusSplits(profile, columns) {
    const width = profile.length;

    if (columns > 1) {
        const gapCenters = findNexusGapCenters(profile);

        if (gapCenters.length === columns - 1) {
            return [0, ...gapCenters, width];
        }
    }

    return findNexusValleySplits(profile, columns);
}

function findNexusValleySplits(profile, columns) {
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

const nexusLayoutCache = new Map();

function getNexusSheetLayout(sprite, columns) {
    const key = `${sprite.src}-${columns}`;

    if (nexusLayoutCache.has(key)) {
        return nexusLayoutCache.get(key);
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

        let transparentPixels = 0;

        for (let i = 3; i < pixels.length; i += 4) {
            if (pixels[i] < 16) {
                transparentPixels += 1;
            }
        }

        const hasTransparency =
            transparentPixels > width * height * 0.2;

        const inset = NEXUS_EDGE_INSET;

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
                ) > NEXUS_CONTENT_THRESHOLD
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
            findNexusGapCenters(profile).length + 1;

        const splits = findNexusSplits(profile, columns);

        const cells = [];
        let widestContent = 0;

        for (let i = 0; i < columns; i += 1) {
            const cellStart = splits[i];
            const cellEnd = splits[i + 1];

            let minimumX = -1;
            let maximumX = -1;

            for (let x = cellStart; x < cellEnd; x += 1) {
                if (profile[x] >= 2) {
                    if (minimumX < 0) {
                        minimumX = x;
                    }

                    maximumX = x;
                }
            }

            if (minimumX < 0) {
                minimumX = cellStart;
                maximumX = cellEnd - 1;
            }

            cells.push({
                start: cellStart,
                end: cellEnd,
                minimumX,
                maximumX
            });

            widestContent = Math.max(
                widestContent,
                maximumX - minimumX + 1
            );
        }

        /*
         * Alineacion vertical con el primer cuadro de la
         * hoja, aplicada por igual a todos los cuadros.
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

        const manual = nexusManualOffsets.get(sprite) || {};

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

    nexusLayoutCache.set(key, layout);

    return layout;
}

// ============================================================
// CUADRO ALINEADO (SOLO HOJAS DE VARIOS CUADROS)
// ============================================================

function buildNexusAlignedFrame(
    sprite,
    frame,
    columns
) {
    const layout = getNexusSheetLayout(sprite, columns);

    if (!layout) {
        return null;
    }

    const cell = layout.cells[frame];
    const height = sprite.naturalHeight;
    const inset = NEXUS_EDGE_INSET;

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

    if (!layout.hasTransparency) {
        removeNexusBlackBackground(
            frameContext,
            frameCanvas.width,
            frameCanvas.height
        );
    }

    sharpenNexusCanvas(frameCanvas, NEXUS_SHARPEN_AMOUNT);

    return frameCanvas;
}

// ============================================================
// CUADRO SIN ALINEAR (RESPALDO / HOJAS DE 1 CUADRO)
// ============================================================

function buildNexusEqualFrame(
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

    /*
     * Los efectos ya vienen con su propio fondo transparente
     * (png). Solo se intenta limpiar fondo si NO lo tienen.
     */
    if (sprite.naturalWidth > 0) {
        const testData = frameContext.getImageData(
            0, 0, frameCanvas.width, frameCanvas.height
        ).data;

        let hasAlpha = false;

        for (let i = 3; i < testData.length; i += 4) {
            if (testData[i] < 250) {
                hasAlpha = true;
                break;
            }
        }

        if (!hasAlpha) {
            removeNexusBlackBackground(
                frameContext,
                frameCanvas.width,
                frameCanvas.height
            );
        }
    }

    sharpenNexusCanvas(frameCanvas, NEXUS_SHARPEN_AMOUNT);

    return frameCanvas;
}

// ============================================================
// EXTRAER UN SOLO CUADRO
// ============================================================

function getNexusFrame(
    sprite,
    frame,
    frameCount
) {
    if (
        !sprite ||
        !sprite.complete ||
        !sprite.naturalWidth
    ) {
        return null;
    }

    const safeColumns = Math.max(1, frameCount);

    const safeFrame = Math.max(
        0,
        Math.min(safeColumns - 1, frame)
    );

    const key =
        `${sprite.src}-${safeFrame}-${safeColumns}`;

    if (nexusFrameCache.has(key)) {
        return nexusFrameCache.get(key);
    }

    let frameCanvas = null;

    if (safeColumns > 1) {
        frameCanvas =
            buildNexusAlignedFrame(
                sprite,
                safeFrame,
                safeColumns
            );
    }

    if (!frameCanvas) {
        frameCanvas =
            buildNexusEqualFrame(
                sprite,
                safeFrame,
                safeColumns
            );
    }

    nexusFrameCache.set(key, frameCanvas);

    return frameCanvas;
}

// ============================================================
// ICONOS DE LA HOJA DE EFECTOS
//
// A diferencia del cuerpo de Nexus (donde todos los cuadros
// comparten un mismo punto de alineacion, porque son la misma
// figura en distintas poses), aqui cada icono es una figura
// DISTINTA (un proyectil chico, un rayo alto, un anillo de
// singularidad...), asi que cada uno se centra en SU PROPIO
// contenido, sin estirarlo y sin compartir alineacion con
// los demas.
// ============================================================

const nexusEffectIconCache = new Map();

function getNexusEffectIcon(name) {
    if (nexusEffectIconCache.has(name)) {
        return nexusEffectIconCache.get(name);
    }

    const sprite = nexusEffectsSheet;
    const index = NEXUS_EFFECT_ICON_ORDER.indexOf(name);

    if (
        index < 0 ||
        !sprite.complete ||
        !sprite.naturalWidth
    ) {
        return null;
    }

    const columns = NEXUS_EFFECT_ICON_ORDER.length;
    const layout = getNexusSheetLayout(sprite, columns);

    if (!layout) {
        return null;
    }

    const cell = layout.cells[index];
    const height = sprite.naturalHeight;
    const inset = NEXUS_EDGE_INSET;

    const sourceStart = Math.max(cell.start, inset);
    const sourceEnd = Math.min(cell.end, sprite.naturalWidth - inset);
    const sourceWidth = sourceEnd - sourceStart;

    let minimumY = height;
    let maximumY = -1;

    /*
     * Buscar el alto real de ESTE icono (no el del primero),
     * para poder centrarlo verticalmente en su propio recorte.
     */
    {
        const sheetCanvas = document.createElement("canvas");
        sheetCanvas.width = sprite.naturalWidth;
        sheetCanvas.height = height;

        const sheetContext = sheetCanvas.getContext("2d");
        sheetContext.drawImage(sprite, 0, 0);

        const pixels = sheetContext.getImageData(
            0, 0, sprite.naturalWidth, height
        ).data;

        for (let y = 0; y < height; y += 1) {
            let rowCount = 0;

            for (let x = sourceStart; x < sourceEnd; x += 1) {
                const i = (y * sprite.naturalWidth + x) * 4;

                if (
                    pixels[i + 3] > 15 &&
                    Math.max(pixels[i], pixels[i + 1], pixels[i + 2]) >
                        NEXUS_CONTENT_THRESHOLD
                ) {
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
    }

    if (maximumY < minimumY) {
        minimumY = 0;
        maximumY = height - 1;
    }

    const contentHeight = maximumY - minimumY + 1;
    const contentWidth = cell.maximumX - cell.minimumX + 1;

    const iconCanvas = document.createElement("canvas");
    iconCanvas.width = Math.max(1, contentWidth + 4);
    iconCanvas.height = Math.max(1, contentHeight + 4);

    const iconContext = iconCanvas.getContext("2d");
    iconContext.imageSmoothingEnabled = false;

    iconContext.drawImage(
        sprite,

        cell.minimumX,
        minimumY,
        contentWidth,
        contentHeight,

        2,
        2,
        contentWidth,
        contentHeight
    );

    if (!layout.hasTransparency) {
        removeNexusBlackBackground(
            iconContext,
            iconCanvas.width,
            iconCanvas.height
        );
    }

    sharpenNexusCanvas(iconCanvas, NEXUS_SHARPEN_AMOUNT);

    nexusEffectIconCache.set(name, iconCanvas);

    return iconCanvas;
}

// ============================================================
// ICONO DE EFECTO YA ESCALADO (CACHEADO)
//
// Los proyectiles se dibujan muchas veces por segundo (puede
// haber varios en pantalla a la vez). Igual que con el cuerpo
// de Nexus, cada icono se escala UNA SOLA VEZ por tamano usado
// y se reutiliza, en vez de reescalar en cada disparo.
// ============================================================

const nexusEffectDisplayCache = new Map();

function getNexusEffectIconScaled(name, targetLength) {
    const source = getNexusEffectIcon(name);

    if (!source) {
        return null;
    }

    const scale = targetLength / source.width;

    const key =
        `${name}-${Math.round(targetLength)}`;

    if (nexusEffectDisplayCache.has(key)) {
        return nexusEffectDisplayCache.get(key);
    }

    const displayCanvas = document.createElement("canvas");

    displayCanvas.width =
        Math.max(1, Math.round(source.width * scale));

    displayCanvas.height =
        Math.max(1, Math.round(source.height * scale));

    const displayContext = displayCanvas.getContext("2d");

    displayContext.imageSmoothingEnabled = true;

    if ("imageSmoothingQuality" in displayContext) {
        displayContext.imageSmoothingQuality = "high";
    }

    displayContext.drawImage(
        source,
        0,
        0,
        displayCanvas.width,
        displayCanvas.height
    );

    nexusEffectDisplayCache.set(key, displayCanvas);

    return displayCanvas;
}

// ============================================================
// PRECARGAR TODOS LOS CUADROS DE UNA HOJA
// ============================================================

function prepareNexusSprite(sprite) {
    if (
        !sprite ||
        !sprite.naturalWidth ||
        !sprite.naturalHeight
    ) {
        return;
    }

    /*
     * La hoja de efectos usa su propio recorte (cada icono es
     * una figura distinta, no cuadros de una misma animacion).
     */
    if (sprite === nexusEffectsSheet) {
        for (const name of NEXUS_EFFECT_ICON_ORDER) {
            getNexusEffectIcon(name);
        }

        return;
    }

    const columns = getNexusFrameCount(sprite, 1);

    for (
        let frame = 0;
        frame < columns;
        frame += 1
    ) {
        getNexusFrame(sprite, frame, columns);
    }

    if (columns > 1) {
        const layout = getNexusSheetLayout(sprite, columns);

        if (layout && layout.detectedFrames !== columns) {
            console.warn(
                `[Nexus] ${sprite.src.split("/").pop()}: ` +
                `configurado con ${columns} cuadros, pero se ` +
                `detectan ${layout.detectedFrames} sprites ` +
                `separados. Revisa nexusFrameCounts.`
            );
        }
    }
}
// ============================================================
// PARTE 2 DE 3
// CLASE JEFE 2 - NEXUS PRIME
//
// Logica igual a tu codigo original. Cambios:
//  1. draw() usa el cuadro ya escalado en cache (getNexusDisplayFrame
//     + drawNexusFrameNative, definidas en la parte 1): se escala
//     una sola vez con la mejor calidad, y en cada fotograma solo
//     se rota y se dibuja 1:1 (mas nitido y menos costoso).
//  2. attackDuration nunca queda mas corta que lo que tarda la
//     hoja en reproducir todos sus cuadros (mismo ajuste que
//     se hizo para Cerberon), asi ningun ataque se corta antes
//     de terminar su animacion.
// ============================================================

class Jefe2 extends Enemy {

    constructor(x, y) {
        super(x, y);

        this.name =
            "NEXUS PRIME";

        this.isBoss = true;

        this.isNexusPrime = true;

        this.width = 150;
        this.height = 150;

        this.speed = 1.15;

        this.health = 3600;
        this.maxHealth = 3600;

        this.damage = 30;

        this.phase = 1;

        this.state = "MOVE";

        this.directionAngle = 0;

        this.spriteDirectionOffset =
            -Math.PI / 2;

        this.preferredDistance = 330;

        this.attackIndex = 0;

        this.attackCooldown = 1650;

        this.nextAttackAt =
            performance.now() + 1600;

        this.isAttacking = false;

        this.attackType = "RAYS";

        this.attackStartedAt = 0;

        this.attackDuration = 950;

        this.attackReleased = false;

        this.lastSummonAt =
            performance.now();

        this.summonInterval = 8500;

        this.maxSummonedEnemies = 18;

        this.walkStartedAt =
            performance.now();

        this.hitStartedAt =
            -Infinity;

        this.deathStartedAt = 0;

        this.deathDuration = 1800;

        this.isDying = false;

        this.lockedX = x;
        this.lockedY = y;
        this.lockedAngle = 0;
    }


    // ========================================================
    // ACTUALIZAR JEFE
    // ========================================================

    update(player) {
        const now =
            performance.now();

        if (!this.alive) {
            return;
        }

        if (this.isDying) {
            this.keepLocked();

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
            !player ||
            !player.alive
        ) {
            return;
        }

        this.updatePhase();

        // Durante un ataque no puede moverse.
        if (this.isAttacking) {
            this.keepLocked();

            this.updateAttack(
                player,
                now
            );

            return;
        }

        // Invocación automática mientras siga vivo.
        if (
            now -
            this.lastSummonAt >=
            this.summonInterval
        ) {
            this.startAttack(
                "SUMMON",
                now,
                1100
            );

            return;
        }

        const differenceX =
            player.x - this.x;

        const differenceY =
            player.y - this.y;

        const distance =
            Math.hypot(
                differenceX,
                differenceY
            );

        if (distance > 0) {
            this.directionAngle =
                Math.atan2(
                    differenceY,
                    differenceX
                );
        }

        if (
            now >=
            this.nextAttackAt
        ) {
            this.startNextAttack(now);

            return;
        }

        this.moveBoss(
            differenceX,
            differenceY,
            distance
        );

        this.keepInsideCanvas();
    }


    // ========================================================
    // CAMBIAR FASE
    // ========================================================

    updatePhase() {
        const percentage =
            this.health /
            this.maxHealth;

        // FASE 1: 100% a 60%.
        if (percentage > 0.60) {
            this.phase = 1;

            this.speed =
                1.15 *
                (
                    this.waveSpeedMultiplier ||
                    1
                );

            this.attackCooldown = 1650;

            this.summonInterval = 8500;
        }

        // FASE 2: 60% a 30%.
        else if (percentage > 0.30) {
            this.phase = 2;

            this.speed =
                1.75 *
                (
                    this.waveSpeedMultiplier ||
                    1
                );

            this.attackCooldown = 1250;

            this.summonInterval = 6200;
        }

        // FASE 3: 30% a 0%.
        else {
            this.phase = 3;

            this.speed =
                2.15 *
                (
                    this.waveSpeedMultiplier ||
                    1
                );

            this.attackCooldown = 900;

            this.summonInterval = 4300;
        }
    }


    // ========================================================
    // MOVIMIENTO
    // ========================================================

    moveBoss(
        differenceX,
        differenceY,
        distance
    ) {
        if (distance <= 0) {
            return;
        }

        const directionX =
            differenceX /
            distance;

        const directionY =
            differenceY /
            distance;

        if (
            distance >
            this.preferredDistance + 55
        ) {
            this.x +=
                directionX *
                this.speed;

            this.y +=
                directionY *
                this.speed;
        }

        else if (
            distance <
            this.preferredDistance - 55
        ) {
            this.x -=
                directionX *
                this.speed *
                0.75;

            this.y -=
                directionY *
                this.speed *
                0.75;
        }

        else {
            const orbit =
                this.phase === 2
                    ? -1
                    : 1;

            this.x +=
                -directionY *
                this.speed *
                0.55 *
                orbit;

            this.y +=
                directionX *
                this.speed *
                0.55 *
                orbit;
        }
    }


    // ========================================================
    // ELEGIR ATAQUE
    // ========================================================

    startNextAttack(now) {
        const attacks =
            this.phase === 1
                ? [
                    "RAYS",
                    "PROJECTILES"
                ]

                : this.phase === 2
                    ? [
                        "PROJECTILES",
                        "ORBITAL_LASER",
                        "SUMMON"
                    ]

                    : [
                        "METEORS",
                        "NEEDLES",
                        "ARMY",
                        "ORBITAL_LASER"
                    ];

        const type =
            attacks[
                this.attackIndex %
                attacks.length
            ];

        this.attackIndex += 1;

        this.startAttack(
            type,
            now,

            type === "ARMY"
                ? 1250
                : 1000
        );
    }


    // ========================================================
    // COMENZAR ATAQUE
    // ========================================================

    startAttack(
        type,
        now,
        duration
    ) {
        this.isAttacking = true;

        this.attackType = type;

        this.attackStartedAt = now;

        /*
         * La duracion nunca queda mas corta que lo que tarda
         * la hoja de esta animacion en mostrar todos sus
         * cuadros, para que el ataque no se corte a la mitad.
         */
        const attackSprite = {
            RAYS: nexusSprites.rays,
            PROJECTILES: nexusSprites.projectiles,
            ORBITAL_LASER: nexusSprites.orbitalLaser,
            SUMMON: nexusSprites.summon,
            METEORS: nexusSprites.meteors,
            NEEDLES: nexusSprites.needles,
            ARMY: nexusSprites.army
        }[type];

        const attackFrames =
            getNexusFrameCount(attackSprite, 8);

        this.attackDuration =
            Math.max(
                duration,
                attackFrames * 120
            );

        this.attackReleased = false;

        this.lockPosition();
    }


    // ========================================================
    // ACTUALIZAR ATAQUE
    // ========================================================

    updateAttack(player, now) {
        const elapsed =
            now -
            this.attackStartedAt;

        if (
            !this.attackReleased &&
            elapsed >=
            this.attackDuration * 0.48
        ) {
            this.releaseAttack(player);

            this.attackReleased = true;
        }

        if (
            elapsed >=
            this.attackDuration
        ) {
            this.isAttacking = false;

            this.walkStartedAt = now;

            this.nextAttackAt =
                now +
                this.attackCooldown;
        }
    }


    // ========================================================
    // LIBERAR ATAQUE
    // ========================================================

    releaseAttack(player) {
        if (
            this.attackType === "RAYS"
        ) {
            this.fireSpread(
                player,
                7,
                0.18,
                7.5,
                this.scaleDamage(18)
            );
        }

        if (
            this.attackType ===
            "PROJECTILES"
        ) {
            this.fireRadial(
                this.phase === 1
                    ? 10
                    : 14,

                6.3,

                this.scaleDamage(16)
            );
        }

        if (
            this.attackType ===
            "ORBITAL_LASER"
        ) {
            this.createOrbitalLasers(
                player
            );
        }

        if (
            this.attackType ===
            "METEORS"
        ) {
            this.createMeteorRain(
                player
            );
        }

        if (
            this.attackType ===
            "NEEDLES"
        ) {
            this.fireRadial(
                20,
                8.2,
                this.scaleDamage(20)
            );
        }

        if (
            this.attackType ===
                "SUMMON" ||

            this.attackType ===
                "ARMY"
        ) {
            this.summonEnemies(
                this.attackType ===
                    "ARMY"
                    ? 6
                    : 3
            );

            this.lastSummonAt =
                performance.now();
        }
    }


    // ========================================================
    // ESCALAR DAÑO
    // ========================================================

    scaleDamage(baseDamage) {
        return Math.max(
            1,

            Math.round(
                baseDamage *
                (
                    this.damage / 30
                )
            )
        );
    }


    // ========================================================
    // CREAR PROYECTIL
    // ========================================================

    pushProjectile(
        x,
        y,
        angle,
        speed,
        damage,
        radius = 8,
        kind = "ORB"
    ) {
        projectiles.push({
            x: x,
            y: y,

            angle: angle,
            speed: speed,

            damage: damage,
            radius: radius,

            enemyProjectile: true,

            nexusProjectile: true,

            nexusKind: kind,

            color:
                kind === "NEEDLE"
                    ? "#ff315f"
                    : "#ff174f",

            createdAt:
                performance.now()
        });
    }


    // ========================================================
    // ATAQUE EN ABANICO
    // ========================================================

    fireSpread(
        player,
        count,
        spread,
        speed,
        damage
    ) {
        const centerAngle =
            Math.atan2(
                player.y - this.y,
                player.x - this.x
            );

        const middle =
            (count - 1) / 2;

        for (
            let index = 0;
            index < count;
            index += 1
        ) {
            this.pushProjectile(
                this.x,
                this.y,

                centerAngle +
                (
                    index -
                    middle
                ) *
                spread,

                speed,
                damage,

                8,
                "RAY"
            );
        }
    }


    // ========================================================
    // ATAQUE RADIAL
    // ========================================================

    fireRadial(
        count,
        speed,
        damage
    ) {
        for (
            let index = 0;
            index < count;
            index += 1
        ) {
            const angle =
                index *
                Math.PI *
                2 /
                count;

            this.pushProjectile(
                this.x,
                this.y,

                angle,
                speed,
                damage,

                this.attackType ===
                    "NEEDLES"
                    ? 6
                    : 9,

                this.attackType ===
                    "NEEDLES"
                    ? "NEEDLE"
                    : "ORB"
            );
        }
    }


    // ========================================================
    // LÁSERES ORBITALES
    // ========================================================

    createOrbitalLasers(player) {
        const positions = [
            player.x - 160,
            player.x,
            player.x + 160,
            this.x
        ];

        for (
            const positionX
            of positions
        ) {
            projectiles.push({
                x:
                    Math.max(
                        25,

                        Math.min(
                            canvas.width - 25,
                            positionX
                        )
                    ),

                y:
                    canvas.height / 2,

                radius: 0,
                speed: 0,
                angle: 0,

                damage:
                    this.scaleDamage(28),

                enemyProjectile: true,

                isVerticalCerberonLaser:
                    true,

                nexusProjectile: true,

                nexusKind: "LASER",

                laserWidth: 26,

                warningDuration: 650,

                activeDuration: 650,

                createdAt:
                    performance.now(),

                hasDamagedPlayer: false
            });
        }
    }


    // ========================================================
    // LLUVIA DE METEOROS
    //
    // Ya NO usa isVerticalCerberonLaser: se dibuja con su
    // propio efecto en drawNexusProjectile (parte 3), para
    // que se vea como un meteoro y no como el laser rojo
    // de Cerberon.
    // ========================================================

    createMeteorRain(player) {
        const count = 7;

        for (
            let index = 0;
            index < count;
            index += 1
        ) {
            const targetX =
                player.x +
                (
                    index - 3
                ) * 85;

            const now =
                performance.now();

            projectiles.push({
                x:
                    Math.max(
                        25,

                        Math.min(
                            canvas.width - 25,
                            targetX
                        )
                    ),

                y:
                    canvas.height / 2,

                radius: 26,
                speed: 0,
                angle: Math.PI / 2,

                damage:
                    this.scaleDamage(34),

                enemyProjectile: true,

                nexusProjectile: true,

                nexusKind: "METEOR",

                isFallingNexusMeteor: true,

                warningDuration:
                    800 +
                    index * 90,

                activeDuration: 260,

                createdAt: now,

                hasDamagedPlayer: false
            });
        }
    }


    // ========================================================
    // INVOCAR ENEMIGOS
    // ========================================================

    summonEnemies(amount) {
        if (
            typeof enemigos ===
            "undefined"
        ) {
            return;
        }

        const livingSummoned =
            enemigos.filter(
                function (enemy) {
                    return (
                        enemy.alive &&
                        enemy.nexusSummoned
                    );
                }
            ).length;

        const availableSlots =
            Math.max(
                0,

                this.maxSummonedEnemies -
                livingSummoned
            );

        const total =
            Math.min(
                amount,
                availableSlots
            );

        const factories = [];

        if (
            typeof Hunter !==
            "undefined"
        ) {
            factories.push(
                function (x, y) {
                    return new Hunter(x, y);
                }
            );
        }

        if (
            typeof Ranger !==
            "undefined"
        ) {
            factories.push(
                function (x, y) {
                    return new Ranger(x, y);
                }
            );
        }

        if (
            typeof Swarm !==
            "undefined"
        ) {
            factories.push(
                function (x, y) {
                    return new Swarm(x, y);
                }
            );
        }

        if (
            typeof Kamikaze !==
            "undefined"
        ) {
            factories.push(
                function (x, y) {
                    return new Kamikaze(x, y);
                }
            );
        }

        if (
            this.phase >= 2 &&
            typeof Tank !==
                "undefined"
        ) {
            factories.push(
                function (x, y) {
                    return new Tank(x, y);
                }
            );
        }

        if (
            this.phase >= 3 &&
            typeof Antrex !==
                "undefined"
        ) {
            factories.push(
                function (x, y) {
                    return new Antrex(x, y);
                }
            );
        }

        if (
            factories.length === 0
        ) {
            return;
        }

        for (
            let index = 0;
            index < total;
            index += 1
        ) {
            const angle =
                index *
                Math.PI *
                2 /
                Math.max(1, total);

            const distance =
                130 +
                (
                    index % 2
                ) * 55;

            const spawnX =
                Math.max(
                    45,

                    Math.min(
                        canvas.width - 45,

                        this.x +
                        Math.cos(angle) *
                        distance
                    )
                );

            const spawnY =
                Math.max(
                    45,

                    Math.min(
                        canvas.height - 45,

                        this.y +
                        Math.sin(angle) *
                        distance
                    )
                );

            const factory =
                factories[
                    Math.floor(
                        Math.random() *
                        factories.length
                    )
                ];

            const enemy =
                factory(
                    spawnX,
                    spawnY
                );

            enemy.nexusSummoned = true;

            if (
                typeof addEnemy ===
                "function"
            ) {
                addEnemy(enemy);
            } else {
                enemigos.push(enemy);
            }
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

        if (
            this.health === 0
        ) {
            this.isDying = true;

            this.isAttacking = false;

            this.state = "DEAD";

            this.deathStartedAt =
                performance.now();

            this.deathDuration =
                Math.max(
                    1500,

                    getNexusFrameCount(
                        nexusSprites.death,
                        9
                    ) * 180
                );

            this.lockPosition();
        }
    }


    // ========================================================
    // FIJAR POSICIÓN
    // ========================================================

    lockPosition() {
        this.lockedX = this.x;

        this.lockedY = this.y;

        this.lockedAngle =
            this.directionAngle;
    }

    keepLocked() {
        this.x =
            this.lockedX;

        this.y =
            this.lockedY;

        this.directionAngle =
            this.lockedAngle;
    }


    // ========================================================
    // LÍMITES EXTERIORES
    // ========================================================

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
                    nexusSprites.death,

                duration:
                    this.deathDuration,

                loop: false
            };
        }

        if (this.isAttacking) {
            const attacks = {
                RAYS:
                    nexusSprites.rays,

                PROJECTILES:
                    nexusSprites.projectiles,

                ORBITAL_LASER:
                    nexusSprites.orbitalLaser,

                SUMMON:
                    nexusSprites.summon,

                METEORS:
                    nexusSprites.meteors,

                NEEDLES:
                    nexusSprites.needles,

                ARMY:
                    nexusSprites.army
            };

            return {
                sprite:
                    attacks[
                        this.attackType
                    ],

                duration:
                    this.attackDuration,

                loop: false
            };
        }

        if (this.phase === 1) {
            return {
                sprite:
                    nexusSprites.walk1,

                duration: 1800,

                loop: true
            };
        }

        if (this.phase === 2) {
            return {
                sprite:
                    nexusSprites.fastWalk,

                duration: 1400,

                loop: true
            };
        }

        return {
            sprite:
                nexusSprites.idle3,

            duration: 1300,

            loop: true
        };
    }


    // ========================================================
    // DIBUJAR JEFE
    // ========================================================

    draw(context) {
        if (!this.alive) {
            return;
        }

        const animation =
            this.getAnimation();

        const frames =
            getNexusFrameCount(
                animation.sprite,
                8
            );

        const startedAt =
            this.isDying

                ? this.deathStartedAt

                : this.isAttacking

                    ? this.attackStartedAt

                    : this.walkStartedAt;

        const frameDuration =
            animation.duration /
            frames;

        const rawFrame =
            Math.floor(
                Math.max(
                    0,

                    performance.now() -
                    startedAt
                ) /
                frameDuration
            );

        const frame =
            animation.loop

                ? rawFrame %
                    frames

                : Math.min(
                    frames - 1,
                    rawFrame
                );

        const drawable =
            getNexusDisplayFrame(
                animation.sprite,
                frame,
                frames
            );

        if (drawable) {
            // Durante ataques y muerte usa
            // exactamente la posición bloqueada.
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

            context.save();

            context.translate(
                Math.round(renderX),
                Math.round(renderY)
            );

            context.rotate(
                renderAngle +
                this.spriteDirectionOffset
            );

            /*
             * El cuadro ya viene escalado al tamano final
             * (parte 1): aqui solo se rota y se dibuja 1:1.
             */
            drawNexusFrameNative(
                context,
                drawable
            );

            context.restore();
        } else {
            // Forma provisional si el sprite
            // todavía no termina de cargar.
            context.save();

            context.fillStyle =
                "#9b123b";

            context.beginPath();

            context.arc(
                this.x,
                this.y,
                this.width / 2,
                0,
                Math.PI * 2
            );

            context.fill();

            context.restore();
        }

        this.drawBossHealth(
            context
        );
    }


    // ========================================================
    // BARRA DE VIDA
    // ========================================================

    drawBossHealth(context) {
        if (this.isDying) {
            return;
        }

        const width =
            Math.min(
                680,
                canvas.width * 0.66
            );

        const height = 20;

        const positionX =
            (
                canvas.width -
                width
            ) / 2;

        const positionY =
            canvas.height - 48;

        const percentage =
            Math.max(
                0,

                this.health /
                this.maxHealth
            );

        context.save();

        context.fillStyle =
            "rgba(0, 0, 0, 0.80)";

        context.fillRect(
            positionX,
            positionY,
            width,
            height
        );

        context.fillStyle =
            "#ff174f";

        context.fillRect(
            positionX,
            positionY,
            width * percentage,
            height
        );

        context.strokeStyle =
            "#ff9bb4";

        context.lineWidth = 2;

        context.strokeRect(
            positionX,
            positionY,
            width,
            height
        );

        context.textAlign =
            "center";

        context.font =
            "bold 15px Arial";

        context.fillStyle =
            "#ffffff";

        context.fillText(
            `NEXUS PRIME - FASE ${this.phase} - ${Math.ceil(this.health)} / ${this.maxHealth}`,

            canvas.width / 2,

            positionY - 8
        );

        context.restore();
    }
}
// ============================================================
// PARTE 3 DE 3
// DIBUJAR PROYECTILES DE NEXUS
//
// Cambios respecto a tu version original:
//  1. RAY, ORB y NEEDLE ahora usan la imagen real del efecto
//     (nexusEffectSprites, definida en la parte 1) girada
//     segun su direccion. Si el archivo no existe todavia,
//     se dibuja exactamente igual que antes (triangulo o
//     circulo), asi el juego nunca se rompe por un archivo
//     faltante.
//  2. METEOR ya no depende de isVerticalCerberonLaser (el
//     sistema de laser vertical de Cerberon): tiene su propio
//     dibujo de advertencia + roca cayendo + impacto, para
//     que se vea como un meteoro y no como un laser rojo.
//  3. LASER (laser orbital) se sigue dibujando con el sistema
//     compartido de Cerberon (isVerticalCerberonLaser), que
//     ya se ve como un haz vertical — es lo correcto para
//     este ataque.
// ============================================================

/*
 * Orientacion de cada sprite de efecto: hacia donde "mira"
 * el dibujo dentro de su archivo. Si al probarlo sale de
 * espaldas, suma o resta Math.PI aqui.
 *   RAY / NEEDLE: se asume punta hacia la derecha.
 */
const nexusEffectRotationOffset = {
    RAY: 0,
    NEEDLE: 0
};

function drawNexusProjectile(
    context,
    projectile
) {
    if (!projectile.nexusProjectile) {
        return false;
    }

    // ========================================================
    // METEORO (propio, no usa el sistema de Cerberon)
    // ========================================================

    if (projectile.isFallingNexusMeteor) {
        return drawNexusMeteor(context, projectile);
    }

    // ========================================================
    // LÁSER ORBITAL: lo dibuja el sistema compartido de
    // Cerberon (isVerticalCerberonLaser). Aqui no se hace
    // nada, solo se le cede el paso.
    // ========================================================

    if (projectile.isVerticalCerberonLaser) {
        return false;
    }

    // ========================================================
    // RAYOS / AGUJAS / PROYECTILES NORMALES
    // ========================================================

    const iconByKind = {
        RAY: "ray",
        NEEDLE: "needle",
        ORB: "projectile"
    };

    const drawable =
        getNexusEffectIcon(
            iconByKind[projectile.nexusKind]
        );

    context.save();

    context.translate(
        projectile.x,
        projectile.y
    );

    context.rotate(
        projectile.angle
    );

    context.shadowColor =
        projectile.color ||
        "#ff174f";

    context.shadowBlur = 18;

    if (drawable) {
        /*
         * Largo en pantalla, igual para todos los disparos de
         * un mismo tipo, asi el icono ya escalado (parte 1)
         * se reutiliza sin volver a escalar.
         */
        const length =
            projectile.nexusKind === "NEEDLE"
                ? 46
                : projectile.nexusKind === "RAY"
                    ? 42
                    : 30;

        const scaledDrawable =
            getNexusEffectIconScaled(
                iconByKind[projectile.nexusKind],
                length
            );

        context.rotate(
            nexusEffectRotationOffset[
                projectile.nexusKind
            ] || 0
        );

        context.imageSmoothingEnabled = false;

        context.drawImage(
            scaledDrawable,
            -scaledDrawable.width / 2,
            -scaledDrawable.height / 2
        );
    } else if (
        projectile.nexusKind === "NEEDLE" ||
        projectile.nexusKind === "RAY"
    ) {
        /*
         * Respaldo vectorial (igual al original) mientras
         * no exista el archivo de imagen del efecto.
         */
        context.fillStyle = "#ff9cb3";

        context.beginPath();
        context.moveTo(15, 0);
        context.lineTo(-18, -4);
        context.lineTo(-18, 4);
        context.closePath();
        context.fill();
    } else {
        const pulse =
            1 +
            Math.sin(
                (
                    performance.now() -
                    projectile.createdAt
                ) / 55
            ) *
            0.18;

        context.fillStyle = "#fff0f4";

        context.beginPath();
        context.arc(
            0,
            0,
            projectile.radius * pulse,
            0,
            Math.PI * 2
        );
        context.fill();

        context.strokeStyle = "#ff174f";
        context.lineWidth = 3;
        context.stroke();
    }

    context.restore();

    return true;
}

// ============================================================
// DIBUJAR UN METEORO
// (advertencia en el suelo -> roca cayendo -> impacto)
// ============================================================

function drawNexusMeteor(context, projectile) {
    const elapsed =
        performance.now() -
        projectile.createdAt;

    const active =
        elapsed >= projectile.warningDuration;

    const impactElapsed =
        elapsed - projectile.warningDuration;

    context.save();

    if (!active) {
        // ----------------------------------------------------
        // ADVERTENCIA: circulo en el suelo que se va cerrando.
        // ----------------------------------------------------

        const warningProgress =
            Math.min(
                1,
                elapsed / projectile.warningDuration
            );

        const ringRadius =
            projectile.radius *
            (1.8 - warningProgress * 0.8);

        context.globalAlpha = 0.55 + warningProgress * 0.35;
        context.strokeStyle = "#ff7a3d";
        context.lineWidth = 3;
        context.shadowColor = "#ff5a2d";
        context.shadowBlur = 14;

        context.beginPath();
        context.arc(
            projectile.x,
            projectile.y,
            Math.max(4, ringRadius),
            0,
            Math.PI * 2
        );
        context.stroke();
    } else if (impactElapsed < projectile.activeDuration) {
        // ----------------------------------------------------
        // IMPACTO: usa la imagen real si existe, si no un
        // destello + onda expansiva.
        // ----------------------------------------------------

        const drawable =
            getNexusEffectIcon("meteor");

        const impactProgress =
            impactElapsed / projectile.activeDuration;

        context.translate(
            projectile.x,
            projectile.y
        );

        context.shadowColor = "#ff5a2d";
        context.shadowBlur = 24;

        if (drawable) {
            const size =
                projectile.radius * 2.4 *
                (0.7 + impactProgress * 0.3);

            const scale = size / drawable.width;

            context.globalAlpha =
                1 - impactProgress * 0.6;

            /*
             * El meteoro crece durante el impacto (no es un
             * tamano fijo como los demas efectos), asi que
             * aqui si se escala en tiempo real. Se pide la
             * mejor calidad disponible para que no se vea
             * borroso mientras crece.
             */
            context.imageSmoothingEnabled = true;

            if ("imageSmoothingQuality" in context) {
                context.imageSmoothingQuality = "high";
            }

            context.drawImage(
                drawable,
                -drawable.width * scale / 2,
                -drawable.height * scale / 2,
                drawable.width * scale,
                drawable.height * scale
            );
        } else {
            context.globalAlpha =
                1 - impactProgress * 0.7;

            context.fillStyle = "#ffb347";

            context.beginPath();
            context.arc(
                0,
                0,
                projectile.radius *
                (0.6 + impactProgress * 0.8),
                0,
                Math.PI * 2
            );
            context.fill();

            context.strokeStyle = "#ff5a2d";
            context.lineWidth = 4;
            context.stroke();
        }
    }

    context.restore();

    return true;
}
