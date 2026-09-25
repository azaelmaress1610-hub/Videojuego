// ============================================================
// ADITAMENTOS.JS
// Botiquín, mejora de daño y mejora de resistencia.
// ============================================================

const ADITAMENTOS_PATH = "Sprites/Aditamentos/";

const aditamentoSprites = {
    botiquin: new Image(),
    dano: new Image(),
    resistencia: new Image()
};

// Nombres exactos de las imágenes.
aditamentoSprites.botiquin.src =
    ADITAMENTOS_PATH + "Botiquin.jpg";

aditamentoSprites.dano.src =
    ADITAMENTOS_PATH + "Mejora-Dano.jpg";

aditamentoSprites.resistencia.src =
    ADITAMENTOS_PATH + "Mejora-Resistencia.jpg";

// Cada imagen tiene 6 cuadros de animación.
const ADITAMENTO_FRAMES = 6;

// Parte izquierda ocupada por el texto de la imagen.
const ADITAMENTO_LABEL_RATIO = 0.205;

// Guarda los cuadros ya procesados.
const aditamentoFrameCache = new Map();

// Lista de aditamentos existentes.
const aditamentos = [];

// Mensaje mostrado al recoger un aditamento.
let aditamentoMessage = "";
let aditamentoMessageColor = "#ffffff";
let aditamentoMessageUntil = 0;


// ============================================================
// QUITAR EL FONDO BLANCO
// ============================================================

function removeAditamentoWhiteBackground(
    context,
    width,
    height
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

    let queueStart = 0;
    let queueEnd = 0;

    function isWhiteBackground(position) {
        const index = position * 4;

        const red = pixels[index];
        const green = pixels[index + 1];
        const blue = pixels[index + 2];

        const minimum = Math.min(red, green, blue);
        const maximum = Math.max(red, green, blue);

        return (
            pixels[index + 3] === 0 ||
            (
                minimum >= 215 &&
                maximum - minimum <= 30
            )
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

        const position = y * width + x;

        if (
            visited[position] ||
            !isWhiteBackground(position)
        ) {
            return;
        }

        visited[position] = 1;
        queue[queueEnd] = position;
        queueEnd += 1;
    }

    // Revisa los bordes superior e inferior.
    for (let x = 0; x < width; x += 1) {
        addPixel(x, 0);
        addPixel(x, height - 1);
    }

    // Revisa los bordes izquierdo y derecho.
    for (let y = 0; y < height; y += 1) {
        addPixel(0, y);
        addPixel(width - 1, y);
    }

    // Elimina solamente el blanco conectado
    // con los bordes de la imagen.
    while (queueStart < queueEnd) {
        const position = queue[queueStart];
        queueStart += 1;

        const x = position % width;
        const y = Math.floor(position / width);

        pixels[position * 4 + 3] = 0;

        addPixel(x - 1, y);
        addPixel(x + 1, y);
        addPixel(x, y - 1);
        addPixel(x, y + 1);
    }

    context.putImageData(imageData, 0, 0);
}


// ============================================================
// OBTENER UN CUADRO DEL SPRITE
// ============================================================

function getAditamentoFrame(type, frame) {
    const sprite = aditamentoSprites[type];

    if (
        !sprite ||
        !sprite.complete ||
        !sprite.naturalWidth
    ) {
        return null;
    }

    const safeFrame = Math.max(
        0,
        Math.min(ADITAMENTO_FRAMES - 1, frame)
    );

    const key = `${type}-${safeFrame}`;

    if (aditamentoFrameCache.has(key)) {
        return aditamentoFrameCache.get(key);
    }

    // Ignora la sección izquierda que contiene el texto.
    const animationStart = Math.round(
        sprite.naturalWidth * ADITAMENTO_LABEL_RATIO
    );

    const animationWidth =
        sprite.naturalWidth - animationStart;

    const sourceStartX = Math.round(
        animationStart +
        safeFrame *
        animationWidth /
        ADITAMENTO_FRAMES
    );

    const sourceEndX = Math.round(
        animationStart +
        (safeFrame + 1) *
        animationWidth /
        ADITAMENTO_FRAMES
    );

    const sourceWidth = Math.max(
        1,
        sourceEndX - sourceStartX
    );

    const frameCanvas =
        document.createElement("canvas");

    frameCanvas.width = sourceWidth;
    frameCanvas.height = sprite.naturalHeight;

    const frameContext =
        frameCanvas.getContext("2d");

    frameContext.imageSmoothingEnabled = false;

    frameContext.drawImage(
        sprite,

        sourceStartX,
        0,
        sourceWidth,
        sprite.naturalHeight,

        0,
        0,
        frameCanvas.width,
        frameCanvas.height
    );

    removeAditamentoWhiteBackground(
        frameContext,
        frameCanvas.width,
        frameCanvas.height
    );

    aditamentoFrameCache.set(
        key,
        frameCanvas
    );

    return frameCanvas;
}


// ============================================================
// CLASE ADITAMENTO
// ============================================================

class Aditamento {

    constructor(x, y, type) {
        this.x = x;
        this.y = y;

        this.type = type;

        this.width = 52;
        this.height = 52;

        this.pickupRadius = 38;

        this.createdAt = performance.now();

        // Desaparece después de 15 segundos.
        this.duration = 15000;

        this.collected = false;
    }


    // --------------------------------------------------------
    // ACTUALIZAR
    // --------------------------------------------------------

    update(player) {
        if (this.collected) {
            return;
        }

        const distance = Math.hypot(
            player.x - this.x,
            player.y - this.y
        );

        const playerRadius =
            Math.max(player.width, player.height) / 2;

        if (
            distance <=
            this.pickupRadius + playerRadius
        ) {
            this.apply(player);
        }
    }


    // --------------------------------------------------------
    // APLICAR EFECTO
    // --------------------------------------------------------

    apply(player) {

        // BOTIQUÍN
        if (this.type === "botiquin") {

            // No se recoge si la vida ya está llena.
            if (player.health >= player.maxHealth) {
                return;
            }

            player.health = Math.min(
                player.maxHealth,
                player.health + 30
            );

            showAditamentoMessage(
                "+30 DE VIDA",
                "#4fffff"
            );
        }

        // MEJORA DE DAÑO
        else if (this.type === "dano") {

            player.damage = Math.min(
                60,
                player.damage + 5
            );

            showAditamentoMessage(
                "DAÑO +5",
                "#ff9c32"
            );
        }

        // MEJORA DE RESISTENCIA
        else if (this.type === "resistencia") {

            player.resistance = Math.min(
                0.50,
                (player.resistance || 0) + 0.10
            );

            showAditamentoMessage(
                "RESISTENCIA +10%",
                "#43dfff"
            );
        }

        this.collected = true;
    }


    // --------------------------------------------------------
    // DIBUJAR
    // --------------------------------------------------------

    draw(context) {
        if (this.collected) {
            return;
        }

        const elapsed =
            performance.now() - this.createdAt;

        const frame =
            Math.floor(elapsed / 160) %
            ADITAMENTO_FRAMES;

        const drawable =
            getAditamentoFrame(
                this.type,
                frame
            );

        // Dibujo provisional si la imagen aún no carga.
        if (!drawable) {

            if (this.type === "dano") {
                context.fillStyle = "#ff722b";
            } else {
                context.fillStyle = "#28e8ff";
            }

            context.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );

            return;
        }

        context.save();

        // La posición del aditamento no cambia.
        // Solamente cambia el cuadro del sprite.
        context.translate(
            Math.round(this.x),
            Math.round(this.y)
        );

        context.drawImage(
            drawable,

            -this.width / 2,
            -this.height / 2,

            this.width,
            this.height
        );

        context.restore();
    }


    // --------------------------------------------------------
    // COMPROBAR SI EXPIRÓ
    // --------------------------------------------------------

    isExpired() {
        return (
            performance.now() - this.createdAt >=
            this.duration
        );
    }
}


// ============================================================
// MENSAJE DEL ADITAMENTO
// ============================================================

function showAditamentoMessage(text, color) {
    aditamentoMessage = text;
    aditamentoMessageColor = color;

    aditamentoMessageUntil =
        performance.now() + 1500;
}


// ============================================================
// ELEGIR TIPO DE ADITAMENTO
// ============================================================

function chooseAditamentoType() {
    const random = Math.random();

    // 45% botiquín.
    if (random < 0.45) {
        return "botiquin";
    }

    // 30% mejora de daño.
    if (random < 0.75) {
        return "dano";
    }

    // 25% mejora de resistencia.
    return "resistencia";
}


// ============================================================
// INTENTAR SOLTAR UN ADITAMENTO
// ============================================================

function tryDropAditamento(
    x,
    y,
    guaranteed = false
) {
    // Enemigos normales:
    // 18% de posibilidad de soltar un aditamento.
    if (
        !guaranteed &&
        Math.random() > 0.18
    ) {
        return false;
    }

    const type = chooseAditamentoType();

    const newAditamento =
        new Aditamento(
            x,
            y,
            type
        );

    aditamentos.push(newAditamento);

    return true;
}


// ============================================================
// ACTUALIZAR TODOS LOS ADITAMENTOS
// ============================================================

function updateAditamentos(player) {

    for (
        let index = aditamentos.length - 1;
        index >= 0;
        index -= 1
    ) {
        const aditamento =
            aditamentos[index];

        aditamento.update(player);

        if (
            aditamento.collected ||
            aditamento.isExpired()
        ) {
            aditamentos.splice(index, 1);
        }
    }
}


// ============================================================
// DIBUJAR TODOS LOS ADITAMENTOS
// ============================================================

function drawAditamentos(context) {

    for (const aditamento of aditamentos) {
        aditamento.draw(context);
    }
}


// ============================================================
// DIBUJAR INFORMACIÓN EN PANTALLA
// ============================================================
function drawAditamentosHUD(context, player) {
    const damageX = 36;
    const resistanceX = 190;
    const informationY = 119;

    context.save();

    context.textAlign = "left";
    context.font = "bold 14px Arial";

    // Daño.
    context.fillStyle = "#ffb52e";
    context.shadowColor = "#ff8a00";
    context.shadowBlur = 7;

    context.fillText(
        `DAÑO: ${Math.round(player.damage)}`,
        damageX,
        informationY
    );

    // Separador.
    context.shadowBlur = 0;
    context.fillStyle =
        "rgba(255, 255, 255, 0.35)";

    context.fillRect(
        169,
        informationY - 15,
        1,
        18
    );

    // Resistencia.
    const resistancePercentage =
        Math.round(
            (player.resistance || 0) *
            100
        );

    context.fillStyle = "#55eaff";
    context.shadowColor = "#00d9ff";
    context.shadowBlur = 7;

    context.fillText(
        `RESISTENCIA: ${resistancePercentage}%`,
        resistanceX,
        informationY
    );

    context.shadowBlur = 0;

    if (
        performance.now() <
        aditamentoMessageUntil
    ) {
        context.textAlign = "center";
        context.font = "bold 24px Arial";
        context.fillStyle =
            aditamentoMessageColor;

        context.shadowColor =
            aditamentoMessageColor;

        context.shadowBlur = 12;

        context.fillText(
            aditamentoMessage,
            canvas.width / 2,
            92
        );
    }

    context.restore();
}