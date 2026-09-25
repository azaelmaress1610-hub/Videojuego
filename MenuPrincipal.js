// ============================================================
// MENÚ PRINCIPAL - NEON SIEGE
// ============================================================

(function () {
    "use strict";

    const API_URL =
        "http://localhost:3000/api";

    let pendingResult = null;


    // ========================================================
    // VARIABLES GLOBALES DEL JUEGO
    // ========================================================

    window.neonMenuLoaded = true;
    window.neonGameStarted = false;
    window.neonGamePaused = false;
    window.neonGameFinished = false;
    window.neonSessionStartedAt = 0;


    // ========================================================
    // ESTILOS DEL MENÚ
    // ========================================================

    function createStyles() {
        if (
            document.getElementById(
                "neon-menu-styles"
            )
        ) {
            return;
        }

        const style =
            document.createElement(
                "style"
            );

        style.id =
            "neon-menu-styles";

        style.textContent = `
            .neon-screen {
                position: fixed;
                inset: 0;
                z-index: 10000;

                display: flex;
                align-items: center;
                justify-content: center;

                padding: 20px;
                box-sizing: border-box;

                color: #ffffff;
                font-family: Arial, sans-serif;

                background:
                    radial-gradient(
                        circle at 50% 20%,
                        rgba(0,234,255,.18),
                        transparent 35%
                    ),
                    linear-gradient(
                        135deg,
                        rgba(2,7,19,.98),
                        rgba(13,3,31,.98)
                    );
            }

            .neon-hidden {
                display: none !important;
            }

            .neon-panel {
                width: min(820px,94vw);
                max-height: 90vh;
                overflow-y: auto;

                padding: 34px;
                box-sizing: border-box;

                border: 2px solid #00eaff;
                border-radius: 18px;

                background:
                    rgba(4,12,27,.96);

                box-shadow:
                    0 0 25px
                    rgba(0,234,255,.4);

                text-align: center;
            }

            .neon-title {
                margin: 0;

                color: #ffffff;

                font-size:
                    clamp(45px,8vw,88px);

                line-height: 1;
                letter-spacing: 5px;
                text-transform: uppercase;

                text-shadow:
                    0 0 8px #ffffff,
                    0 0 20px #00eaff,
                    0 0 40px #7a24ff;
            }

            .neon-subtitle {
                margin: 14px 0 28px;

                color: #7df7ff;

                letter-spacing: 3px;
                text-transform: uppercase;
            }

            .neon-section-title {
                margin: 0 0 22px;

                color: #7df7ff;

                font-size: 30px;
                letter-spacing: 3px;
                text-transform: uppercase;
            }

            .neon-description {
                max-width: 650px;

                margin: 0 auto 25px;

                color: #d8e9ff;

                font-size: 16px;
                line-height: 1.6;
            }

            .neon-actions {
                display: grid;
                gap: 13px;

                width: min(390px,100%);
                margin: 0 auto;
            }

            .neon-button {
                width: 100%;

                padding: 15px 22px;

                border: 1px solid #20efff;
                border-radius: 8px;

                color: #ffffff;

                background:
                    linear-gradient(
                        90deg,
                        rgba(0,176,210,.25),
                        rgba(114,35,255,.25)
                    );

                font:
                    bold 16px Arial,
                    sans-serif;

                letter-spacing: 2px;
                text-transform: uppercase;

                cursor: pointer;

                transition:
                    transform .2s,
                    box-shadow .2s;
            }

            .neon-button:hover {
                transform:
                    translateY(-2px);

                box-shadow:
                    0 0 18px
                    rgba(0,234,255,.45);
            }

            .neon-button:disabled {
                opacity: .55;
                cursor: wait;
                transform: none;
            }

            .neon-button-danger {
                border-color: #ff315f;

                background:
                    rgba(135,12,49,.35);
            }

            .neon-ranking {
                width: 100%;

                margin: 0 0 24px;

                border-collapse: collapse;
                color: #ffffff;
            }

            .neon-ranking th,
            .neon-ranking td {
                padding: 11px 7px;

                border-bottom:
                    1px solid
                    rgba(91,226,255,.22);

                text-align: center;
            }

            .neon-ranking th {
                color: #7df7ff;

                font-size: 12px;
                letter-spacing: 1px;
                text-transform: uppercase;
            }

            .neon-ranking-current {
                background:
                    rgba(0,234,255,.22);
            }

            .neon-empty-ranking {
                padding: 25px;
                color: #9db0c9;
            }

            .neon-error-ranking {
                padding: 25px;
                color: #ff6b89;
            }

            .neon-name-input {
                width: min(390px,100%);

                margin: 0 auto 18px;
                padding: 14px 16px;

                box-sizing: border-box;

                border: 1px solid #20efff;
                border-radius: 8px;
                outline: none;

                color: #ffffff;
                background: #05101f;

                font:
                    bold 17px Arial,
                    sans-serif;

                text-align: center;
            }

            .neon-name-input:focus {
                box-shadow:
                    0 0 16px
                    rgba(0,234,255,.45);
            }

            .neon-result-card {
                margin: 0 auto 22px;
                padding: 18px;

                border:
                    1px solid
                    rgba(125,247,255,.4);

                border-radius: 10px;

                color: #d8e9ff;

                background:
                    rgba(0,234,255,.07);

                font-size: 18px;
                line-height: 1.7;
            }

            .neon-result-highlight {
                color: #7dffef;

                font-size: 25px;
                font-weight: bold;
            }

            .neon-pause-hint {
                margin-top: 24px;

                color: #839bb8;

                font-size: 13px;
                letter-spacing: 1px;
            }

            .neon-server-status {
                margin-top: 16px;

                color: #63ffad;

                font-size: 12px;
                letter-spacing: 1px;
            }

            @media (max-width:650px) {
                .neon-panel {
                    padding: 24px 10px;
                }

                .neon-ranking th,
                .neon-ranking td {
                    padding: 8px 2px;
                    font-size: 10px;
                }
            }
        `;

        document.head.appendChild(
            style
        );
    }


    // ========================================================
    // CREAR PANTALLA
    // ========================================================

    function createScreen(
        id,
        html
    ) {
        const screen =
            document.createElement(
                "section"
            );

        screen.id = id;

        screen.className =
            "neon-screen neon-hidden";

        screen.innerHTML = `
            <div class="neon-panel">
                ${html}
            </div>
        `;

        document.body.appendChild(
            screen
        );

        return screen;
    }


    // ========================================================
    // MOSTRAR UNA PANTALLA
    // ========================================================

    function showOnly(
        selectedScreen
    ) {
        document
            .querySelectorAll(
                ".neon-screen"
            )
            .forEach(
                function (screen) {
                    screen.classList.add(
                        "neon-hidden"
                    );

                    screen.style.display =
                        "none";
                }
            );

        if (selectedScreen) {
            selectedScreen
                .classList
                .remove(
                    "neon-hidden"
                );

            selectedScreen.style.display =
                "flex";
        }
    }


    // ========================================================
    // PROTEGER TEXTO
    // ========================================================

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    // ========================================================
    // FORMATEAR TIEMPO
    // ========================================================

    function formatTime(
        totalSeconds
    ) {
        const total =
            Math.max(
                0,
                Number(totalSeconds) ||
                0
            );

        const minutes =
            Math.floor(
                total / 60
            );

        const seconds =
            String(
                Math.floor(
                    total % 60
                )
            ).padStart(
                2,
                "0"
            );

        return (
            `${minutes}:${seconds}`
        );
    }


    // ========================================================
    // DESBLOQUEAR AUDIO
    // ========================================================

    async function unlockAudio() {
        if (
            !window.NeonAudio
        ) {
            console.warn(
                "AudioManager no está cargado"
            );

            return;
        }

        try {
            if (
                typeof window
                    .NeonAudio
                    .unlock ===
                    "function"
            ) {
                await window
                    .NeonAudio
                    .unlock();
            }

            console.log(
                "AUDIO DESBLOQUEADO"
            );
        } catch (error) {
            console.warn(
                "No se pudo desbloquear el audio:",
                error
            );
        }
    }


    // ========================================================
    // PAUSAR MÚSICA
    // ========================================================

    function pauseMusic() {
        if (
            window.NeonAudio &&
            typeof window
                .NeonAudio
                .pauseMusic ===
                "function"
        ) {
            window.NeonAudio
                .pauseMusic();
        }
    }


    // ========================================================
    // REANUDAR MÚSICA
    // ========================================================

    function resumeMusic() {
        if (
            window.NeonAudio &&
            typeof window
                .NeonAudio
                .resumeMusic ===
                "function"
        ) {
            window.NeonAudio
                .resumeMusic();
        }
    }


    // ========================================================
    // CALCULAR PUNTUACIÓN
    // ========================================================

    function calculateScore(
        wave,
        enemies,
        seconds
    ) {
        return (
            wave * 1000 +
            enemies * 100 +
            Math.floor(seconds)
        );
    }


    // ========================================================
    // CREAR FILAS DEL RANKING
    // ========================================================

    function createRows(
        records,
        highlightedId = null
    ) {
        if (
            !Array.isArray(records) ||
            records.length === 0
        ) {
            return `
                <tr>
                    <td
                        colspan="6"
                        class="neon-empty-ranking"
                    >
                        Todavía no hay puntuaciones registradas.
                    </td>
                </tr>
            `;
        }

        return records
            .map(
                function (
                    record,
                    index
                ) {
                    const enemies =
                        Number(
                            record
                                .enemiesDefeated ??
                            record.kills
                        ) || 0;

                    const time =
                        record
                            .timeSurvived ??
                        record.time ??
                        0;

                    const rowClass =
                        record.id ===
                        highlightedId

                            ? "neon-ranking-current"
                            : "";

                    return `
                        <tr class="${rowClass}">
                            <td>
                                ${index + 1}
                            </td>

                            <td>
                                ${escapeHtml(
                                    record.name ||
                                    "Jugador"
                                )}
                            </td>

                            <td>
                                ${
                                    Number(
                                        record.wave
                                    ) || 0
                                }
                            </td>

                            <td>
                                ${enemies}
                            </td>

                            <td>
                                ${formatTime(time)}
                            </td>

                            <td>
                                ${
                                    Number(
                                        record.score
                                    ) || 0
                                }
                            </td>
                        </tr>
                    `;
                }
            )
            .join("");
    }


    // ========================================================
    // INICIAR PARTIDA
    // ========================================================

    window.iniciarNeonSiege =
        async function () {
            await unlockAudio();

            pendingResult = null;

            window.neonGameStarted =
                true;

            window.neonGamePaused =
                false;

            window.neonGameFinished =
                false;

            window.neonSessionStartedAt =
                performance.now();

            resumeMusic();

            showOnly(null);

            const canvas =
                document.getElementById(
                    "gameCanvas"
                );

            if (canvas) {
                canvas.style.display =
                    "block";

                canvas.style.visibility =
                    "visible";

                canvas.focus();
            }

            console.log(
                "NEON SIEGE INICIADO"
            );
        };


    // ========================================================
    // ABRIR RANKING
    // ========================================================

    window.abrirRankingNeon =
        async function () {
            const rankingScreen =
                document.getElementById(
                    "neon-ranking-menu"
                );

            const body =
                document.getElementById(
                    "neon-ranking-body"
                );

            if (
                !rankingScreen ||
                !body
            ) {
                console.error(
                    "No se encontró la pantalla del ranking"
                );

                return;
            }

            body.innerHTML = `
                <tr>
                    <td
                        colspan="6"
                        class="neon-empty-ranking"
                    >
                        Consultando servidor...
                    </td>
                </tr>
            `;

            showOnly(
                rankingScreen
            );

            try {
                const response =
                    await fetch(
                        `${API_URL}/scores?limit=10`
                    );

                if (!response.ok) {
                    throw new Error(
                        `Error ${response.status}`
                    );
                }

                const data =
                    await response.json();

                const ranking =
                    Array.isArray(
                        data.scores
                    )
                        ? data.scores
                        : [];

                body.innerHTML =
                    createRows(
                        ranking
                    );
            } catch (error) {
                console.error(
                    "Error al consultar ranking:",
                    error
                );

                body.innerHTML = `
                    <tr>
                        <td
                            colspan="6"
                            class="neon-error-ranking"
                        >
                            No se pudo conectar con Node.js.

                            <br><br>

                            Ejecuta npm start dentro de backend.
                        </td>
                    </tr>
                `;
            }
        };


    // ========================================================
    // VOLVER AL MENÚ PRINCIPAL
    // ========================================================

    window.volverMenuPrincipalNeon =
        function () {
            const mainScreen =
                document.getElementById(
                    "neon-main-menu"
                );

            if (!mainScreen) {
                console.error(
                    "No se encontró el menú principal"
                );

                return;
            }

            showOnly(
                mainScreen
            );
        };


    // ========================================================
    // PAUSAR PARTIDA
    // ========================================================

    function pauseGame() {
        if (
            !window.neonGameStarted ||
            window.neonGamePaused ||
            window.neonGameFinished
        ) {
            return;
        }

        window.neonGamePaused =
            true;

        pauseMusic();

        showOnly(
            document.getElementById(
                "neon-pause-menu"
            )
        );
    }


    // ========================================================
    // CONTINUAR PARTIDA
    // ========================================================

    async function continueGame() {
        if (
            !window.neonGameStarted ||
            window.neonGameFinished
        ) {
            return;
        }

        await unlockAudio();

        window.neonGamePaused =
            false;

        resumeMusic();

        showOnly(null);
    }


    // ========================================================
    // SOLICITAR NOMBRE AL MORIR
    // ========================================================

    function requestPlayerName(
        wave,
        enemies,
        timeSeconds
    ) {
        const safeWave =
            Math.max(
                0,
                Number(wave) || 0
            );

        const safeEnemies =
            Math.max(
                0,
                Number(enemies) || 0
            );

        const safeTime =
            Math.max(
                0,
                Number(timeSeconds) || 0
            );

        pendingResult = {
            wave:
                safeWave,

            enemiesDefeated:
                safeEnemies,

            timeSurvived:
                Math.floor(
                    safeTime
                ),

            score:
                calculateScore(
                    safeWave,
                    safeEnemies,
                    safeTime
                )
        };

        window.neonGamePaused =
            true;

        window.neonGameFinished =
            true;

        pauseMusic();

        document.getElementById(
            "neon-final-wave"
        ).textContent =
            pendingResult.wave;

        document.getElementById(
            "neon-final-enemies"
        ).textContent =
            pendingResult
                .enemiesDefeated;

        document.getElementById(
            "neon-final-score"
        ).textContent =
            pendingResult.score;

        const input =
            document.getElementById(
                "neon-player-name"
            );

        input.value = "";

        showOnly(
            document.getElementById(
                "neon-name-menu"
            )
        );

        setTimeout(
            function () {
                input.focus();
            },
            50
        );
    }


    window.saveNeonSiegeScore =
        requestPlayerName;


    // ========================================================
    // GUARDAR RESULTADO EN NODE.JS
    // ========================================================

    async function savePendingResult() {
        if (!pendingResult) {
            return;
        }

        const input =
            document.getElementById(
                "neon-player-name"
            );

        const button =
            document.getElementById(
                "neon-save-score"
            );

        const name =
            input.value
                .trim()
                .slice(0, 20);

        if (
            name.length < 2
        ) {
            input.value = "";

            input.placeholder =
                "Escribe mínimo 2 caracteres";

            input.focus();

            return;
        }

        button.disabled = true;

        button.textContent =
            "Guardando...";

        try {
            const response =
                await fetch(
                    `${API_URL}/scores`,

                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                name:
                                    name,

                                score:
                                    pendingResult
                                        .score,

                                wave:
                                    pendingResult
                                        .wave,

                                enemiesDefeated:
                                    pendingResult
                                        .enemiesDefeated,

                                bossesDefeated:
                                    0,

                                timeSurvived:
                                    pendingResult
                                        .timeSurvived
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {
                throw new Error(
                    data.message ||
                    "No se pudo guardar la puntuación."
                );
            }

            showFinalResult(
                data.score,
                data.position,
                Array.isArray(
                    data.ranking
                )
                    ? data.ranking
                    : []
            );

            pendingResult = null;
        } catch (error) {
            alert(
                error.message +
                "\n\nInicia el servidor con npm start."
            );
        } finally {
            button.disabled = false;

            button.textContent =
                "Guardar resultado";
        }
    }


    // ========================================================
    // MOSTRAR RESULTADO FINAL
    // ========================================================

    function showFinalResult(
        record,
        position,
        ranking
    ) {
        const title =
            document.getElementById(
                "neon-result-title"
            );

        const summary =
            document.getElementById(
                "neon-result-summary"
            );

        const table =
            document.getElementById(
                "neon-result-top-table"
            );

        if (
            position > 0 &&
            position <= 10
        ) {
            title.textContent =
                "¡ENTRASTE AL TOP 10!";

            summary.innerHTML = `
                <div class="neon-result-highlight">
                    Posición #${position}
                </div>

                ${escapeHtml(record.name)}
                consiguió
                ${record.score}
                puntos.
            `;

            document.getElementById(
                "neon-result-ranking-body"
            ).innerHTML =
                createRows(
                    ranking,
                    record.id
                );

            table.classList.remove(
                "neon-hidden"
            );
        } else {
            title.textContent =
                "RESULTADO DE LA PARTIDA";

            summary.innerHTML = `
                <div class="neon-result-highlight">
                    Posición #${position}
                </div>

                ${escapeHtml(record.name)}
                consiguió
                ${record.score}
                puntos.

                <br>

                No alcanzaste el Top 10.
            `;

            table.classList.add(
                "neon-hidden"
            );
        }

        showOnly(
            document.getElementById(
                "neon-result-menu"
            )
        );
    }


    // ========================================================
    // INICIALIZAR MENÚ
    // ========================================================

    function initializeMenu() {
        createStyles();

        const tableHeader = `
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nombre</th>
                    <th>Oleada</th>
                    <th>Enemigos</th>
                    <th>Tiempo</th>
                    <th>Puntos</th>
                </tr>
            </thead>
        `;


        // ----------------------------------------------------
        // MENÚ PRINCIPAL
        // ----------------------------------------------------

        createScreen(
            "neon-main-menu",

            `
                <h1 class="neon-title">
                    Neon Siege
                </h1>

                <p class="neon-subtitle">
                    Sobrevive · Evoluciona · Domina
                </p>

                <p class="neon-description">
                    Enfréntate a oleadas,
                    consigue mejoras y derrota
                    a Cerberon y Nexus Prime.
                </p>
                
                <p class="neon elige">
                Al ganar experiencia podras elegir entre 3 mejoras
                </p>

                <p class="neon cambiar">
                Puedes presionar Q para cambiar de arma
                </p>

                <div class="neon-actions">
                    <button
                        id="neon-start-button"
                        class="neon-button"
                        type="button"
                        onclick="window.iniciarNeonSiege()"
                    >
                        Iniciar partida
                    </button>

                    <button
                        id="neon-ranking-button"
                        class="neon-button"
                        type="button"
                        onclick="window.abrirRankingNeon()"
                    >
                        Ver ranking
                    </button>
                </div>

                <p class="neon-pause-hint">
                    
                </p>

                <p class="neon-server-status">
                    
                </p>
            `
        );


        // ----------------------------------------------------
        // RANKING
        // ----------------------------------------------------

        createScreen(
            "neon-ranking-menu",

            `
                <h2 class="neon-section-title">
                    Top 10
                </h2>

                <table class="neon-ranking">
                    ${tableHeader}

                    <tbody id="neon-ranking-body">
                    </tbody>
                </table>

                <div class="neon-actions">
                    <button
                        id="neon-ranking-back"
                        class="neon-button"
                        type="button"
                        onclick="window.volverMenuPrincipalNeon()"
                    >
                        Volver
                    </button>
                </div>
            `
        );


        // ----------------------------------------------------
        // MENÚ DE PAUSA
        // ----------------------------------------------------

        createScreen(
            "neon-pause-menu",

            `
                <h2 class="neon-section-title">
                    Juego pausado
                </h2>

                <div class="neon-actions">
                    <button
                        id="neon-continue-button"
                        class="neon-button"
                        type="button"
                    >
                        Continuar
                    </button>

                    <button
                        id="neon-exit-button"
                        class="
                            neon-button
                            neon-button-danger
                        "
                        type="button"
                    >
                        Salir
                    </button>
                </div>
            `
        );


        // ----------------------------------------------------
        // PEDIR NOMBRE
        // ----------------------------------------------------

        createScreen(
            "neon-name-menu",

            `
                <h2 class="neon-section-title">
                    Fin de la partida
                </h2>

                <div class="neon-result-card">
                    Oleada:
                    <strong id="neon-final-wave">
                        0
                    </strong>

                    <br>

                    Enemigos derrotados:
                    <strong id="neon-final-enemies">
                        0
                    </strong>

                    <br>

                    Puntos:
                    <strong id="neon-final-score">
                        0
                    </strong>
                </div>

                <p class="neon-description">
                    Escribe tu nombre para guardar
                    la puntuación.
                </p>

                <input
                    id="neon-player-name"
                    class="neon-name-input"
                    maxlength="20"
                    autocomplete="off"
                    placeholder="Tu nombre"
                >

                <div class="neon-actions">
                    <button
                        id="neon-save-score"
                        class="neon-button"
                        type="button"
                    >
                        Guardar resultado
                    </button>
                </div>
            `
        );


        // ----------------------------------------------------
        // RESULTADO FINAL
        // ----------------------------------------------------

        createScreen(
            "neon-result-menu",

            `
                <h2
                    id="neon-result-title"
                    class="neon-section-title"
                >
                    Resultado
                </h2>

                <div
                    id="neon-result-summary"
                    class="neon-result-card"
                >
                </div>

                <div id="neon-result-top-table">
                    <table class="neon-ranking">
                        ${tableHeader}

                        <tbody
                            id="neon-result-ranking-body"
                        >
                        </tbody>
                    </table>
                </div>

                <div class="neon-actions">
                    <button
                        id="neon-result-restart"
                        class="neon-button"
                        type="button"
                    >
                        Jugar de nuevo
                    </button>

                    <button
                        id="neon-result-exit"
                        class="
                            neon-button
                            neon-button-danger
                        "
                        type="button"
                    >
                        Salir al menú
                    </button>
                </div>
            `
        );


        // ====================================================
        // EVENTOS
        // ====================================================

        document.getElementById(
            "neon-continue-button"
        ).addEventListener(
            "click",
            continueGame
        );


        document.getElementById(
            "neon-exit-button"
        ).addEventListener(
            "click",

            function () {
                pauseMusic();

                window.location
                    .reload();
            }
        );


        document.getElementById(
            "neon-save-score"
        ).addEventListener(
            "click",
            savePendingResult
        );


        document.getElementById(
            "neon-player-name"
        ).addEventListener(
            "keydown",

            function (event) {
                if (
                    event.key ===
                    "Enter"
                ) {
                    savePendingResult();
                }
            }
        );


        document.getElementById(
            "neon-result-restart"
        ).addEventListener(
            "click",

            function () {
                window.location
                    .reload();
            }
        );


        document.getElementById(
            "neon-result-exit"
        ).addEventListener(
            "click",

            function () {
                window.location
                    .reload();
            }
        );


        // ----------------------------------------------------
        // ESC PARA PAUSAR
        // ----------------------------------------------------

        window.addEventListener(
            "keydown",

            function (event) {
                if (
                    event.key !==
                        "Escape" ||

                    !window
                        .neonGameStarted ||

                    window
                        .neonGameFinished
                ) {
                    return;
                }

                event.preventDefault();

                if (
                    window.neonGamePaused
                ) {
                    continueGame();
                } else {
                    pauseGame();
                }
            }
        );


        // Mostrar menú inicial.

        showOnly(
            document.getElementById(
                "neon-main-menu"
            )
        );
    }


    // ========================================================
    // EJECUTAR MENÚ
    // ========================================================

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initializeMenu,
            {
                once: true
            }
        );
    } else {
        initializeMenu();
    }
})();