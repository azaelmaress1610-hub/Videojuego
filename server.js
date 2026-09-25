"use strict";

// ============================================================
// IMPORTACIONES
// ============================================================

const express = require("express");
const cors = require("cors");
const fs = require("fs/promises");
const path = require("path");


// ============================================================
// CONFIGURACIÓN DEL SERVIDOR
// ============================================================

const app = express();

const PORT =
    Number(process.env.PORT) ||
    3000;

const SCORES_FILE = path.join(
    __dirname,
    "data",
    "scores.json"
);


// ============================================================
// MIDDLEWARES
// ============================================================

// Permitir peticiones desde Live Server.
app.use(
    cors()
);

// Permitir recibir información JSON.
app.use(
    express.json({
        limit: "20kb"
    })
);


// ============================================================
// LEER PUNTUACIONES
// ============================================================

async function readScores() {
    try {
        const content =
            await fs.readFile(
                SCORES_FILE,
                "utf8"
            );

        const scores =
            JSON.parse(content);

        return Array.isArray(scores)
            ? scores
            : [];
    } catch (error) {
        // Si el archivo no existe,
        // se crea automáticamente.
        if (error.code === "ENOENT") {
            await writeScores([]);

            return [];
        }

        throw error;
    }
}


// ============================================================
// GUARDAR PUNTUACIONES
// ============================================================

async function writeScores(scores) {
    // Crear la carpeta data si no existe.
    await fs.mkdir(
        path.dirname(SCORES_FILE),
        {
            recursive: true
        }
    );

    const temporaryFile =
        `${SCORES_FILE}.tmp`;

    // Primero escribir en un archivo temporal.
    await fs.writeFile(
        temporaryFile,
        JSON.stringify(
            scores,
            null,
            2
        ),
        "utf8"
    );

    // Sustituir el archivo original.
    await fs.rename(
        temporaryFile,
        SCORES_FILE
    );
}


// ============================================================
// LIMPIAR EL NOMBRE DEL JUGADOR
// ============================================================

function sanitizeName(value) {
    return String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .slice(0, 20);
}


// ============================================================
// VALIDAR NÚMEROS
// ============================================================

function finiteNonNegative(
    value,
    fallback = 0
) {
    const number =
        Number(value);

    if (
        Number.isFinite(number) &&
        number >= 0
    ) {
        return number;
    }

    return fallback;
}


// ============================================================
// ORDENAR PUNTUACIONES
// ============================================================

function sortScores(scores) {
    return [...scores].sort(
        function (first, second) {
            // Primero ordenar por puntuación.
            if (
                second.score !==
                first.score
            ) {
                return (
                    second.score -
                    first.score
                );
            }

            // Después por oleada.
            if (
                second.wave !==
                first.wave
            ) {
                return (
                    second.wave -
                    first.wave
                );
            }

            // Después por enemigos eliminados.
            if (
                second.enemiesDefeated !==
                first.enemiesDefeated
            ) {
                return (
                    second.enemiesDefeated -
                    first.enemiesDefeated
                );
            }

            // Después por tiempo.
            if (
                second.timeSurvived !==
                first.timeSurvived
            ) {
                return (
                    second.timeSurvived -
                    first.timeSurvived
                );
            }

            // En caso de empate,
            // se conserva primero el registro anterior.
            return (
                new Date(first.createdAt) -
                new Date(second.createdAt)
            );
        }
    );
}


// ============================================================
// GET /api/scores
// OBTENER EL RANKING
// ============================================================

app.get(
    "/api/scores",

    async function (
        request,
        response,
        next
    ) {
        try {
            const requestedLimit =
                Number(
                    request.query.limit
                );

            const limit =
                Number.isInteger(
                    requestedLimit
                )
                    ? Math.min(
                        100,
                        Math.max(
                            1,
                            requestedLimit
                        )
                    )
                    : 10;

            const scores =
                sortScores(
                    await readScores()
                );

            response.json({
                success: true,

                count: Math.min(
                    limit,
                    scores.length
                ),

                scores: scores.slice(
                    0,
                    limit
                )
            });
        } catch (error) {
            next(error);
        }
    }
);


// ============================================================
// POST /api/scores
// GUARDAR UNA PUNTUACIÓN
// ============================================================

app.post(
    "/api/scores",

    async function (
        request,
        response,
        next
    ) {
        try {
            const name =
                sanitizeName(
                    request.body.name
                );

            // Validar nombre.
            if (name.length < 2) {
                return response
                    .status(400)
                    .json({
                        success: false,

                        message:
                            "El nombre debe contener entre 2 y 20 caracteres."
                    });
            }

            // Crear el registro.
            const record = {
                id:
                    `${Date.now()}-` +
                    Math.random()
                        .toString(16)
                        .slice(2),

                name: name,

                score: Math.round(
                    finiteNonNegative(
                        request.body.score
                    )
                ),

                wave: Math.round(
                    finiteNonNegative(
                        request.body.wave
                    )
                ),

                enemiesDefeated:
                    Math.round(
                        finiteNonNegative(
                            request.body
                                .enemiesDefeated
                        )
                    ),

                bossesDefeated:
                    Math.round(
                        finiteNonNegative(
                            request.body
                                .bossesDefeated
                        )
                    ),

                timeSurvived:
                    Math.round(
                        finiteNonNegative(
                            request.body
                                .timeSurvived
                        )
                    ),

                createdAt:
                    new Date()
                        .toISOString()
            };

            // Leer registros anteriores.
            const scores =
                await readScores();

            // Agregar el registro nuevo.
            scores.push(record);

            // Ordenar y conservar un máximo de 1000.
            const orderedScores =
                sortScores(scores)
                    .slice(0, 1000);

            await writeScores(
                orderedScores
            );

            // Calcular la posición del jugador.
            const position =
                orderedScores.findIndex(
                    function (item) {
                        return (
                            item.id ===
                            record.id
                        );
                    }
                ) + 1;

            response
                .status(201)
                .json({
                    success: true,

                    message:
                        "Puntuación registrada correctamente.",

                    position: position,

                    top10:
                        position > 0 &&
                        position <= 10,

                    score: record,

                    ranking:
                        orderedScores.slice(
                            0,
                            10
                        )
                });
        } catch (error) {
            next(error);
        }
    }
);


// ============================================================
// GET /api/stats
// OBTENER ESTADÍSTICAS GENERALES
// ============================================================

app.get(
    "/api/stats",

    async function (
        request,
        response,
        next
    ) {
        try {
            const scores =
                await readScores();

            const totalGames =
                scores.length;

            const totalScore =
                scores.reduce(
                    function (
                        total,
                        record
                    ) {
                        return (
                            total +
                            finiteNonNegative(
                                record.score
                            )
                        );
                    },
                    0
                );

            const totalEnemies =
                scores.reduce(
                    function (
                        total,
                        record
                    ) {
                        return (
                            total +
                            finiteNonNegative(
                                record
                                    .enemiesDefeated
                            )
                        );
                    },
                    0
                );

            const totalBosses =
                scores.reduce(
                    function (
                        total,
                        record
                    ) {
                        return (
                            total +
                            finiteNonNegative(
                                record
                                    .bossesDefeated
                            )
                        );
                    },
                    0
                );

            const totalTime =
                scores.reduce(
                    function (
                        total,
                        record
                    ) {
                        return (
                            total +
                            finiteNonNegative(
                                record.timeSurvived
                            )
                        );
                    },
                    0
                );

            const highestScore =
                scores.reduce(
                    function (
                        highest,
                        record
                    ) {
                        return Math.max(
                            highest,

                            finiteNonNegative(
                                record.score
                            )
                        );
                    },
                    0
                );

            const uniquePlayers =
                new Set(
                    scores.map(
                        function (record) {
                            return String(
                                record.name
                            ).toLowerCase();
                        }
                    )
                ).size;

            response.json({
                success: true,

                stats: {
                    totalGames:
                        totalGames,

                    uniquePlayers:
                        uniquePlayers,

                    highestScore:
                        highestScore,

                    averageScore:
                        totalGames > 0
                            ? Math.round(
                                totalScore /
                                totalGames
                            )
                            : 0,

                    totalEnemies:
                        totalEnemies,

                    totalBosses:
                        totalBosses,

                    totalTime:
                        totalTime
                }
            });
        } catch (error) {
            next(error);
        }
    }
);


// ============================================================
// GET /api/health
// COMPROBAR QUE EL SERVIDOR FUNCIONA
// ============================================================

app.get(
    "/api/health",

    function (
        request,
        response
    ) {
        response.json({
            success: true,
            service:
                "Neon Siege API"
        });
    }
);


// ============================================================
// MANEJO DE RUTAS NO ENCONTRADAS
// ============================================================

app.use(
    function (
        request,
        response
    ) {
        response
            .status(404)
            .json({
                success: false,

                message:
                    "La ruta solicitada no existe."
            });
    }
);


// ============================================================
// MANEJO DE ERRORES
// ============================================================

app.use(
    function (
        error,
        request,
        response,
        next
    ) {
        console.error(
            "Error del servidor:",
            error
        );

        response
            .status(500)
            .json({
                success: false,

                message:
                    "Ocurrió un error interno en el servidor."
            });
    }
);


// ============================================================
// INICIAR SERVIDOR
// ============================================================

app.listen(
    PORT,

    function () {
        console.log(
            "======================================"
        );

        console.log(
            "NEON SIEGE API INICIADA"
        );

        console.log(
            `Servidor: http://localhost:${PORT}`
        );

        console.log(
            `Ranking: http://localhost:${PORT}/api/scores`
        );

        console.log(
            `Estadísticas: http://localhost:${PORT}/api/stats`
        );

        console.log(
            "======================================"
        );
    }
);