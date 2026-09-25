"use strict";

/*
 * SistemaExperiencia.js
 * Experiencia, niveles y selección de mejoras.
 */

(function registrarSistemaExperiencia(global) {

    const state = {

        level:
            1,

        experience:
            0,

        experienceNeeded:
            100,

        pendingLevels:
            0,

        choosingUpgrade:
            false,

        choices:
            [],

        choiceRects:
            [],

        player:
            null,

        damageMultiplier:
            1,

        cooldownMultiplier:
            1,

        projectileSizeMultiplier:
            1

    };


    // ========================================================
    // MEJORAS DISPONIBLES
    // ========================================================

    const upgrades = [

        // ----------------------------------------------------
        // MEJORA DE VIDA
        // ----------------------------------------------------

        {
            id:
                "MAX_HEALTH",

            title:
                "BLINDAJE REFORZADO",

            description:
                "+20 de vida máxima y recupera 20",

            color:
                "#38ff9b",

            canApply:
                function () {

                    return true;

                },

            apply:
                function (player) {

                    player.maxHealth +=
                        20;

                    player.health =
                        Math.min(

                            player.maxHealth,

                            player.health +
                                20

                        );
                }
        },


        // ----------------------------------------------------
        // MEJORA DE VELOCIDAD
        // ----------------------------------------------------

        {
            id:
                "SPEED",

            title:
                "IMPULSO CINÉTICO",

            description:
                "+0.35 de velocidad de movimiento",

            color:
                "#45d7ff",

            canApply:
                function (player) {

                    return (
                        player.speed <
                        8.5
                    );

                },

            apply:
                function (player) {

                    player.speed =
                        Math.min(

                            8.5,

                            player.speed +
                                0.35

                        );
                }
        },


        // ----------------------------------------------------
        // MEJORA DE DAÑO
        // ----------------------------------------------------

        {
            id:
                "DAMAGE",

            title:
                "NÚCLEO DE DAÑO",

            description:
                "+15% de daño con todas las armas",

            color:
                "#ff5b59",

            canApply:
                function () {

                    return (
                        state
                            .damageMultiplier <
                        3
                    );

                },

            apply:
                function () {

                    state.damageMultiplier =
                        Math.min(

                            3,

                            state
                                .damageMultiplier +
                                0.15

                        );
                }
        },


        // ----------------------------------------------------
        // MEJORA DE VELOCIDAD DE ATAQUE
        // ----------------------------------------------------

        {
            id:
                "FIRE_RATE",

            title:
                "SISTEMA DE RECARGA",

            description:
                "Reduce 10% el tiempo entre ataques",

            color:
                "#ffd34d",

            canApply:
                function () {

                    return (
                        state
                            .cooldownMultiplier >
                        0.5
                    );

                },

            apply:
                function (player) {

                    state.cooldownMultiplier =
                        Math.max(

                            0.5,

                            state
                                .cooldownMultiplier -
                                0.1

                        );

                    applyWeaponBonuses(
                        player
                    );
                }
        },


        // ----------------------------------------------------
        // MEJORA DEL TAMAÑO DE ATAQUE
        // ----------------------------------------------------

        {
            id:
                "PROJECTILE_SIZE",

            title:
                "MUNICIÓN EXPANSIVA",

            description:
                "+12% al tamaño de proyectiles y ataques",

            color:
                "#cf74ff",

            canApply:
                function () {

                    return (
                        state
                            .projectileSizeMultiplier <
                        2
                    );

                },

            apply:
                function () {

                    state.projectileSizeMultiplier =
                        Math.min(

                            2,

                            state
                                .projectileSizeMultiplier +
                                0.12

                        );
                }
        },


        // ----------------------------------------------------
        // MEJORA DE RESISTENCIA
        // ----------------------------------------------------

        {
            id:
                "RESISTANCE",

            title:
                "CAMPO DEFENSIVO",

            description:
                "+5% de resistencia al daño",

            color:
                "#62a8ff",

            canApply:
                function (player) {

                    return (
                        (
                            player.resistance ||
                            0
                        ) <
                        0.5
                    );

                },

            apply:
                function (player) {

                    player.resistance =
                        Math.min(

                            0.5,

                            (
                                player.resistance ||
                                0
                            ) +
                            0.05

                        );
                }
        }

    ];


    // ========================================================
    // EXPERIENCIA NECESARIA PARA EL SIGUIENTE NIVEL
    // ========================================================

    function calculateNextExperience(
        level
    ) {

        return (
            100 +
            (
                level -
                1
            ) *
            75
        );
    }


    // ========================================================
    // REVOLVER LA LISTA DE MEJORAS
    // ========================================================

    function shuffle(
        items
    ) {

        const result = [
            ...items
        ];


        for (
            let index =
                result.length -
                1;

            index >
                0;

            index -=
                1
        ) {
            const randomIndex =
                Math.floor(
                    Math.random() *
                    (
                        index +
                        1
                    )
                );


            const temporary =
                result[index];


            result[index] =
                result[
                    randomIndex
                ];


            result[
                randomIndex
            ] =
                temporary;
        }


        return result;
    }


    // ========================================================
    // CREAR TRES OPCIONES DE MEJORA
    // ========================================================

    function createChoices() {

        const player =
            state.player;


        const available =
            upgrades.filter(

                function (
                    upgrade
                ) {

                    return (
                        upgrade
                            .canApply(
                                player
                            )
                    );

                }

            );


        state.choices =
            shuffle(
                available
            ).slice(
                0,
                3
            );


        state.choiceRects =
            [];


        state.choosingUpgrade =
            state.choices.length >
            0;
    }


    // ========================================================
    // ABRIR EL SIGUIENTE NIVEL PENDIENTE
    // ========================================================

    function openNextPendingLevel() {

        if (
            state.pendingLevels <=
            0
        ) {
            state.choosingUpgrade =
                false;

            state.choices =
                [];

            state.choiceRects =
                [];

            return;
        }


        state.pendingLevels -=
            1;


        createChoices();
    }


    // ========================================================
    // AGREGAR EXPERIENCIA
    // ========================================================

    function addExperience(
        amount
    ) {

        if (
            !Number.isFinite(
                amount
            ) ||

            amount <=
                0
        ) {
            return;
        }


        state.experience +=
            Math.round(
                amount
            );


        /*
         * Se usa while porque el jugador
         * podría subir varios niveles
         * con una sola recompensa.
         */

        while (
            state.experience >=
            state.experienceNeeded
        ) {
            state.experience -=
                state
                    .experienceNeeded;


            state.level +=
                1;


            state.experienceNeeded =
                calculateNextExperience(
                    state.level
                );


            state.pendingLevels +=
                1;
        }


        if (
            state.pendingLevels >
                0 &&

            !state
                .choosingUpgrade
        ) {
            openNextPendingLevel();
        }
    }


    // ========================================================
    // EXPERIENCIA ENTREGADA POR CADA ENEMIGO
    // ========================================================

    function experienceForEnemy(
        enemy
    ) {

        if (
            enemy.isBoss ===
            true
        ) {
            return (
                250 +
                (
                    enemy.waveNumber ||
                    1
                ) *
                15
            );
        }


        const enemyName =
            enemy.constructor

                ? enemy
                    .constructor
                    .name
                    .toUpperCase()

                : "";


        const values = {

            HUNTER:
                20,

            RANGER:
                25,

            SWARM:
                12,

            TANK:
                45,

            KAMIKAZE:
                30,

            ANTREX:
                55,

            ANTREXCRIA:
                8

        };


        return (
            values[
                enemyName
            ] ||
            20
        );
    }


    // ========================================================
    // AGREGAR EXPERIENCIA AL MATAR UN ENEMIGO
    // ========================================================

    function addEnemyExperience(
        enemy
    ) {

        addExperience(
            experienceForEnemy(
                enemy
            )
        );
    }


    // ========================================================
    // SELECCIONAR UNA MEJORA
    // ========================================================

    function selectUpgrade(
        index
    ) {

        if (
            !state
                .choosingUpgrade
        ) {
            return false;
        }


        const upgrade =
            state.choices[
                index
            ];


        if (
            !upgrade ||
            !state.player
        ) {
            return false;
        }


        upgrade.apply(
            state.player
        );


        openNextPendingLevel();


        return true;
    }


    // ========================================================
    // APLICAR MEJORA DE RECARGA AL ARMA
    // ========================================================

    function applyWeaponBonuses(
        player
    ) {

        if (
            !player
        ) {
            return;
        }


        const baseCooldown =
            Number.isFinite(
                player
                    .baseFireCooldown
            )

                ? player
                    .baseFireCooldown

                : player
                    .fireCooldown;


        player.baseFireCooldown =
            baseCooldown;


        player.fireCooldown =
            Math.max(

                75,

                Math.round(
                    baseCooldown *
                    state
                        .cooldownMultiplier
                )

            );
    }


    // ========================================================
    // APLICAR MEJORAS A LOS PROYECTILES
    // ========================================================

    function applyProjectileBonuses(
        projectiles
    ) {

        for (
            const projectile
            of projectiles
        ) {
            if (
                Number.isFinite(
                    projectile.damage
                )
            ) {
                projectile.damage =
                    Math.round(

                        projectile.damage *

                        state
                            .damageMultiplier

                    );
            }


            if (
                Number.isFinite(
                    projectile.radius
                )
            ) {
                projectile.radius *=
                    state
                        .projectileSizeMultiplier;
            }
        }


        return projectiles;
    }


    // ========================================================
    // DIBUJAR BARRA DE EXPERIENCIA
    // ========================================================

    function drawHUD(context, canvas) {
        
        const panelWidth = 330;
        const panelHeight = 75;
        
        const panelX =
        canvas.width -
        panelWidth -
        18;
        
        const panelY = 18;
        
        const barX = panelX + 18;
        const barY = panelY + 43;
        const barWidth = panelWidth - 36;
        const barHeight = 13;
        
        const progress = Math.max(
            0,
            Math.min(
                1,
                state.experience /
                state.experienceNeeded
            )
        );
        context.save();
        // Panel derecho.
         
        const panelGradient =
        context.createLinearGradient(
            panelX,
            panelY,
            panelX + panelWidth,
            panelY + panelHeight
        );
        
        panelGradient.addColorStop(
            0,
            "rgba(17, 5, 30, 0.92)"
        );
        
        panelGradient.addColorStop(
            1,
            "rgba(5, 7, 18, 0.82)"
        );
        
        context.fillStyle = panelGradient;
        context.fillRect(
            panelX,
            panelY,
            panelWidth,
            panelHeight
        );
        
        context.strokeStyle =
        "rgba(184, 85, 255, 0.75)";
        
        context.lineWidth = 2;
        
        context.strokeRect(
            panelX,
            panelY,
            panelWidth,
            panelHeight
        );
        
        context.fillStyle = "#b855ff";
        context.fillRect(
            panelX,
            panelY,
            panelWidth,
            3
        );
        
        // Texto.
         
        context.textAlign = "left";
        context.font = "bold 14px Arial";
        context.fillStyle = "#d99bff";
        
        context.fillText(
            `NIVEL ${state.level}`,
            panelX + 18,
            panelY + 29
        );
        
        
        context.textAlign = "right";
        context.fillStyle = "#ffffff";
        
        context.fillText(
            `XP ${state.experience} / ${state.experienceNeeded}`,
            panelX + panelWidth - 18,
            panelY + 29
        );
        
        // Fondo de la barra.
         
        context.fillStyle =
        "rgba(0, 0, 0, 0.88)";
        
        context.fillRect(
            barX,
            barY,
            barWidth,
            barHeight
        );
        // Barra de experiencia.
 
        const experienceGradient =
        
        context.createLinearGradient(
            barX,
            barY,
            barX + barWidth,
            barY
        );
        experienceGradient.addColorStop(
            0,
            "#6f22bd"
        );
        
        experienceGradient.addColorStop(
            0.55,
            "#b855ff"
        );
        
        experienceGradient.addColorStop(
            1,
            "#e2a1ff"
        );
        
        context.fillStyle =
        experienceGradient;
        
        context.shadowColor = "#b855ff";
        context.shadowBlur = 10;
        
        context.fillRect(
            barX,
            barY,
            barWidth * progress,
            barHeight
        );
        
        context.shadowBlur = 0;
        context.strokeStyle =
        "rgba(255, 255, 255, 0.85)";
        context.lineWidth = 1;
        
        context.strokeRect(
            barX,
            barY,
            barWidth,
            barHeight
        );
        context.restore();
    }


    // ========================================================
    // DIBUJAR SELECCIÓN DE MEJORAS
    // ========================================================

    function drawUpgradeSelection(
        context,
        canvas
    ) {

        if (
            !state
                .choosingUpgrade
        ) {
            return;
        }


        context.save();


        context.fillStyle =
            "rgba(2, 4, 12, 0.88)";


        context.fillRect(
            0,
            0,

            canvas.width,
            canvas.height
        );


        context.textAlign =
            "center";


        context.fillStyle =
            "#ffffff";


        context.font =
            "bold 38px Arial";


        context.fillText(
            `NIVEL ${state.level}`,

            canvas.width /
                2,

            Math.max(
                70,

                canvas.height *
                0.18
            )
        );


        context.fillStyle =
            "#b855ff";


        context.font =
            "bold 20px Arial";


        context.fillText(
            "ELIGE UNA MEJORA",

            canvas.width /
                2,

            Math.max(

                105,

                canvas.height *
                0.18 +
                38

            )
        );


        const gap =
            22;


        const cardWidth =
            Math.min(

                260,

                (
                    canvas.width -
                    80 -
                    gap *
                    2
                ) /
                3

            );


        const cardHeight =
            190;


        const totalWidth =
            cardWidth *
            3 +
            gap *
            2;


        const startX =
            (
                canvas.width -
                totalWidth
            ) /
            2;


        const startY =
            Math.max(

                145,

                canvas.height *
                0.32

            );


        state.choiceRects =
            [];


        state.choices.forEach(

            function (
                upgrade,
                index
            ) {

                const x =
                    startX +
                    index *
                    (
                        cardWidth +
                        gap
                    );


                const y =
                    startY;


                state.choiceRects.push({

                    x:
                        x,

                    y:
                        y,

                    width:
                        cardWidth,

                    height:
                        cardHeight

                });


                context.fillStyle =
                    "rgba(11, 18, 35, 0.96)";


                context.fillRect(
                    x,
                    y,
                    cardWidth,
                    cardHeight
                );


                context.strokeStyle =
                    upgrade.color;


                context.lineWidth =
                    3;


                context.shadowColor =
                    upgrade.color;


                context.shadowBlur =
                    14;


                context.strokeRect(
                    x,
                    y,
                    cardWidth,
                    cardHeight
                );


                context.shadowBlur =
                    0;


                context.fillStyle =
                    upgrade.color;


                context.font =
                    "bold 24px Arial";


                context.fillText(
                    String(
                        index +
                        1
                    ),

                    x +
                    cardWidth /
                    2,

                    y +
                    40
                );


                context.fillStyle =
                    "#ffffff";


                context.font =
                    "bold 15px Arial";


                context.fillText(
                    upgrade.title,

                    x +
                    cardWidth /
                    2,

                    y +
                    79
                );


                context.fillStyle =
                    "#c8d2e7";


                context.font =
                    "14px Arial";


                const words =
                    upgrade
                        .description
                        .split(
                            " "
                        );


                let line =
                    "";


                let lineY =
                    y +
                    116;


                for (
                    const word
                    of words
                ) {
                    const testLine =
                        line +
                        word +
                        " ";


                    if (
                        context
                            .measureText(
                                testLine
                            )
                            .width >

                            cardWidth -
                            28 &&

                        line.length >
                            0
                    ) {
                        context.fillText(
                            line.trim(),

                            x +
                            cardWidth /
                            2,

                            lineY
                        );


                        line =
                            word +
                            " ";


                        lineY +=
                            21;
                    }

                    else {
                        line =
                            testLine;
                    }
                }


                context.fillText(
                    line.trim(),

                    x +
                    cardWidth /
                    2,

                    lineY
                );

            }

        );


        context.fillStyle =
            "#96a2b8";


        context.font =
            "14px Arial";


        context.fillText(
            "Presiona 1, 2 o 3, o selecciona una tarjeta",

            canvas.width /
                2,

            Math.min(

                canvas.height -
                30,

                startY +
                cardHeight +
                42

            )
        );


        context.restore();
    }


    // ========================================================
    // SELECCIONAR MEJORA CON CLIC
    // ========================================================

    function handleClick(
        x,
        y
    ) {

        if (
            !state
                .choosingUpgrade
        ) {
            return false;
        }


        const index =
            state
                .choiceRects
                .findIndex(

                    function (
                        rect
                    ) {

                        return (

                            x >=
                                rect.x &&

                            x <=
                                rect.x +
                                rect.width &&

                            y >=
                                rect.y &&

                            y <=
                                rect.y +
                                rect.height

                        );

                    }

                );


        if (
            index >=
            0
        ) {
            return selectUpgrade(
                index
            );
        }


        return false;
    }


    // ========================================================
    // INICIAR SISTEMA
    // ========================================================

    function initialize(
        player
    ) {

        state.player =
            player;


        player.baseFireCooldown =
            player.fireCooldown;
    }


    // ========================================================
    // COMPROBAR SI SE ESTÁ ELIGIENDO MEJORA
    // ========================================================

    function isChoosingUpgrade() {

        return (
            state
                .choosingUpgrade
        );
    }


    // ========================================================
    // SELECCIONAR CON 1, 2 O 3
    // ========================================================

    global.addEventListener(
        "keydown",

        function (
            event
        ) {

            if (
                !state
                    .choosingUpgrade
            ) {
                return;
            }


            if (
                [
                    "1",
                    "2",
                    "3"
                ].includes(
                    event.key
                )
            ) {
                event.preventDefault();


                selectUpgrade(
                    Number(
                        event.key
                    ) -
                    1
                );
            }

        }
    );


    // ========================================================
    // HACER EL SISTEMA DISPONIBLE PARA MAIN.JS
    // ========================================================

    global.NeonExperience =
        Object.freeze({

            initialize:
                initialize,

            addExperience:
                addExperience,

            addEnemyExperience:
                addEnemyExperience,

            selectUpgrade:
                selectUpgrade,

            applyWeaponBonuses:
                applyWeaponBonuses,

            applyProjectileBonuses:
                applyProjectileBonuses,

            drawHUD:
                drawHUD,

            drawUpgradeSelection:
                drawUpgradeSelection,

            handleClick:
                handleClick,

            isChoosingUpgrade:
                isChoosingUpgrade,

            state:
                state

        });

})(globalThis);
