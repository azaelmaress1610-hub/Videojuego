"use strict";

/*
 * PersonajeNormal.js
 * Configuración del personaje con el arma normal.
 *
 * Este archivo contiene:
 * - Animaciones
 * - Estadísticas
 * - Creación del proyectil normal
 */

(function registrarPersonajeNormal(global) {

    const RUTA_SPRITES = "Sprites/Personaje-Principal/";

    const animaciones = {

        aparicion: {
            src: RUTA_SPRITES + "Personaje principal-Quieto.jpg",
            frames: 8,
            fps: 9,
            repetir: false
        },

        espera: {
            src: RUTA_SPRITES + "Personaje principal-Quieto.jpg",
            frames: 8,
            fps: 8,
            repetir: true
        },

        caminar: {
            src: RUTA_SPRITES + "Personaje-Derecha.jpg",
            frames: 8,
            fps: 10,
            repetir: true
        },

        correr: {
            src: RUTA_SPRITES + "Personaje-Derecha.jpg",
            frames: 8,
            fps: 14,
            repetir: true
        },

        apuntar: {
            src: RUTA_SPRITES + "Personaje principal-Quieto.jpg",
            frames: 8,
            fps: 8,
            repetir: true
        },

        disparar: {
            src:
                RUTA_SPRITES +
                "Personaje principal-Disparo dercha.jpg",

            frames: 8,
            fps: 18,
            repetir: false
        },

        dano: {
            src:
                RUTA_SPRITES +
                "Personaje principal-Recibir daño.jpg",

            frames: 8,
            fps: 14,
            repetir: false
        },

        muerte: {
            src:
                RUTA_SPRITES +
                "Personaje principal-muerte.jpg",

            frames: 8,
            fps: 10,
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
     * Obtiene el centro del personaje.
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
     * Obtiene la dirección hacia la que apunta.
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
     * Crea el disparo del arma normal.
     */

    function crearProyectiles(jugador) {

        const centro = obtenerCentro(jugador);

        const angulo = obtenerAngulo(jugador);

        const separacionInicial = 28;

        const proyectil = {

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

            speed: 11,

            radius: 5,

            damage: 25,

            color: "#00ffff",

            glowColor:
                "rgba(0, 255, 255, 0.85)",

            life: 1200,

            distanceTraveled: 0,

            maximumDistance: 900,

            enemyProjectile: false,

            playerProjectile: true,

            weaponId: "NORMAL"

        };

        return [proyectil];
    }


    /*
     * Coloca las estadísticas del arma normal
     * dentro del objeto del jugador.
     */

    function aplicarAlJugador(jugador) {

        jugador.weaponId = "NORMAL";

        jugador.weaponName = "ARMA NORMAL";

        jugador.damage = 25;

        jugador.fireCooldown = 180;

        jugador.projectileSpeed = 11;

        jugador.projectileColor = "#00ffff";

        jugador.width = 42;

        jugador.height = 58;

        return jugador;
    }


    /*
     * Regresa la animación solicitada.
     * Si no existe, utiliza la animación de espera.
     */

    function obtenerAnimacion(estado) {

        if (animaciones[estado]) {
            return animaciones[estado];
        }

        return animaciones.espera;
    }


    /*
     * Configuración completa del personaje normal.
     */

    const PersonajeNormal = {

        id: "NORMAL",

        nombre: "ARMA NORMAL",

        teclaCambio: "q",

        dimensiones: {
            width: 42,
            height: 58
        },

        estadisticas: {
            damage: 25,
            fireCooldown: 180,
            projectileSpeed: 11,
            projectileRadius: 5,
            projectileRange: 900
        },

        animaciones: animaciones,

        aplicarAlJugador: aplicarAlJugador,

        crearProyectiles: crearProyectiles,

        obtenerAnimacion: obtenerAnimacion

    };


    /*
     * Permite usarlo desde main.js:
     *
     * window.PersonajeNormal
     */

    global.PersonajeNormal =
        Object.freeze(PersonajeNormal);

})(globalThis);
