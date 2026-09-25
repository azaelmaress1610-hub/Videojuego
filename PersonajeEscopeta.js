"use strict";

/*
 * PersonajeEscopeta.js
 * Configuración del personaje equipado con escopeta.
 *
 * Debe cargarse antes de main.js.
 */

(function registrarPersonajeEscopeta(global) {

    const RUTA_SPRITES =
        "Sprites/Personaje-Principal/Escopeta/";

    const animaciones = {

        aparicion: {
            src:
                RUTA_SPRITES +
                "Personaje-Principal-escopeta-aparicion.png",

            frames: 7,
            fps: 9,
            repetir: false
        },

        espera: {
            src:
                RUTA_SPRITES +
                "Personaje-Principal-escopeta-espera.png",

            frames: 8,
            fps: 8,
            repetir: true
        },

        caminar: {
            src:
                RUTA_SPRITES +
                "Personaje-Principal-escopeta-caminar.png",

            frames: 8,
            fps: 10,
            repetir: true
        },

        correr: {
            src:
                RUTA_SPRITES +
                "Personaje-Principal-escopeta-correr.png",

            frames: 8,
            fps: 14,
            repetir: true
        },

        apuntar: {
            src:
                RUTA_SPRITES +
                "Personaje-Principal-escopeta-apuntar.png",

            frames: 8,
            fps: 8,
            repetir: true
        },

        disparar: {
            src:
                RUTA_SPRITES +
                "Personaje-Principal-escopeta-disparar.png",

            frames: 8,
            fps: 18,
            repetir: false
        },

        dano: {
            src:
                RUTA_SPRITES +
                "Personaje-Principal-escopeta-dano.png",

            frames: 7,
            fps: 14,
            repetir: false
        },

        muerte: {
            src:
                RUTA_SPRITES +
                "Personaje-Principal-escopeta-muerte.png",

            frames: 6,
            fps: 9,
            repetir: false
        }

    };


    /*
     * Comprueba que un valor sea numérico.
     */

    function numeroValido(valor, respaldo) {

        if (Number.isFinite(valor)) {
            return valor;
        }

        return respaldo;
    }


    /*
     * Obtiene el centro del jugador.
     */

    function obtenerCentro(jugador) {

        const ancho = numeroValido(
            jugador.width,
            42
        );

        const alto = numeroValido(
            jugador.height,
            58
        );

        return {
            x:
                numeroValido(jugador.x, 0) +
                ancho / 2,

            y:
                numeroValido(jugador.y, 0) +
                alto / 2
        };
    }


    /*
     * Obtiene el ángulo hacia el que apunta.
     */

    function obtenerAngulo(jugador) {

        if (Number.isFinite(jugador.aimAngle)) {
            return jugador.aimAngle;
        }

        if (Number.isFinite(jugador.angle)) {
            return jugador.angle;
        }

        return 0;
    }


    /*
     * Crea los cinco perdigones de la escopeta.
     */

    function crearProyectiles(jugador) {

        const centro = obtenerCentro(jugador);

        const anguloCentral =
            obtenerAngulo(jugador);

        const separacionInicial = 34;

        const dispersiones = [
            -0.18,
            -0.09,
            0,
            0.09,
            0.18
        ];

        return dispersiones.map(
            function crearPerdigon(
                dispersion,
                indice
            ) {

                const angulo =
                    anguloCentral +
                    dispersion;

                return {

                    x:
                        centro.x +
                        Math.cos(angulo) *
                        separacionInicial,

                    y:
                        centro.y +
                        Math.sin(angulo) *
                        separacionInicial,

                    previousX: centro.x,

                    previousY: centro.y,

                    angle: angulo,

                    speed: 12,

                    radius: 4,

                    damage: 14,

                    color: "#ffb229",

                    glowColor:
                        "rgba(255, 178, 41, 0.9)",

                    life: 550,

                    distanceTraveled: 0,

                    maximumDistance: 380,

                    enemyProjectile: false,

                    playerProjectile: true,

                    shotgunProjectile: true,

                    pelletIndex: indice,

                    weaponId: "SHOTGUN"

                };
            }
        );
    }


    /*
     * Aplica las estadísticas de la escopeta
     * al objeto del jugador.
     */

    function aplicarAlJugador(jugador) {

        jugador.weaponId = "SHOTGUN";

        jugador.weaponName = "ESCOPETA";

        jugador.damage = 14;

        jugador.fireCooldown = 680;

        jugador.projectileSpeed = 12;

        jugador.projectileColor = "#ffb229";

        jugador.width = 42;

        jugador.height = 58;

        return jugador;
    }


    /*
     * Obtiene una animación.
     */

    function obtenerAnimacion(estado) {

        if (animaciones[estado]) {
            return animaciones[estado];
        }

        return animaciones.espera;
    }


    /*
     * Configuración de la escopeta.
     */

    const PersonajeEscopeta = {

        id: "SHOTGUN",

        nombre: "ESCOPETA",

        teclaCambio: "q",

        dimensiones: {
            width: 58,
            height: 68
        },

        estadisticas: {
            damagePerPellet: 14,
            pellets: 5,
            spread: 0.18,
            fireCooldown: 680,
            projectileSpeed: 12,
            projectileRadius: 4,
            projectileRange: 380
        },

        animaciones: animaciones,

        aplicarAlJugador:
            aplicarAlJugador,

        crearProyectiles:
            crearProyectiles,

        obtenerAnimacion:
            obtenerAnimacion

    };


    /*
     * Permite utilizarlo desde main.js:
     *
     * window.PersonajeEscopeta
     */

    global.PersonajeEscopeta =
        Object.freeze(PersonajeEscopeta);

})(globalThis);