"use strict";

/*
 * PersonajeEspada.js
 * Personaje equipado con espada de energía.
 *
 * Ataque:
 * - Corto alcance.
 * - Daño alto.
 * - Recarga media.
 * - Onda de energía pequeña.
 */

(function registrarPersonajeEspada(global) {

    const RUTA_SPRITES =
        "Sprites/Personaje-Principal/Espada/";


    // ========================================================
    // ANIMACIONES
    // ========================================================

    const animaciones = {

        aparicion: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-aparicion.png",

            frames: 7,
            fps: 9,
            repetir: false
        },

        espera: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-espera.png",

            frames: 8,
            fps: 8,
            repetir: true
        },

        caminar: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-caminar.png",

            frames: 8,
            fps: 10,
            repetir: true
        },

        correr: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-correr.png",

            frames: 8,
            fps: 14,
            repetir: true
        },

        apuntar: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-buscar.png",

            frames: 8,
            fps: 9,
            repetir: true
        },

        buscar: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-buscar.png",

            frames: 8,
            fps: 9,
            repetir: true
        },

        disparar: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-atacar.png",

            frames: 8,
            fps: 18,
            repetir: false
        },

        atacar: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-atacar.png",

            frames: 8,
            fps: 18,
            repetir: false
        },

        /*
         * Como todavía no existe un sprite
         * separado para recibir daño,
         * utilizamos temporalmente "buscar".
         */

        dano: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-buscar.png",

            frames: 8,
            fps: 14,
            repetir: false
        },

        muerte: {
            src:
                RUTA_SPRITES +
                "personaje-principal espada-muerte.png",

            frames: 6,
            fps: 9,
            repetir: false
        }

    };


    // ========================================================
    // VALIDAR NÚMEROS
    // ========================================================

    function numeroValido(
        valor,
        respaldo
    ) {
        if (
            Number.isFinite(valor)
        ) {
            return valor;
        }

        return respaldo;
    }


    // ========================================================
    // OBTENER CENTRO DEL PERSONAJE
    // ========================================================

    function obtenerCentro(jugador) {

        const ancho =
            numeroValido(
                jugador.width,
                42
            );

        const alto =
            numeroValido(
                jugador.height,
                58
            );

        return {

            x:
                numeroValido(
                    jugador.x,
                    0
                ) +
                ancho / 2,

            y:
                numeroValido(
                    jugador.y,
                    0
                ) +
                alto / 2

        };
    }


    // ========================================================
    // OBTENER ÁNGULO
    // ========================================================

    function obtenerAngulo(jugador) {

        if (
            Number.isFinite(
                jugador.aimAngle
            )
        ) {
            return jugador.aimAngle;
        }

        if (
            Number.isFinite(
                jugador.angle
            )
        ) {
            return jugador.angle;
        }

        return 0;
    }


    // ========================================================
    // CREAR ATAQUE DE ESPADA
    // ========================================================

    function crearProyectiles(jugador) {

        const centro =
            obtenerCentro(jugador);

        const angulo =
            obtenerAngulo(jugador);

        const separacionInicial = 32;

        const ataqueEspada = {

            x:
                centro.x +
                Math.cos(angulo) *
                separacionInicial,

            y:
                centro.y +
                Math.sin(angulo) *
                separacionInicial,

            previousX:
                centro.x,

            previousY:
                centro.y,

            angle:
                angulo,

            /*
             * La onda se desplaza rápidamente,
             * pero solo alcanza 90 píxeles.
             */

            speed: 14,

            /*
             * Radio grande para representar
             * el corte de la espada.
             */

            radius: 24,

            damage: 48,

            color:
                "#37eaff",

            glowColor:
                "rgba(55, 234, 255, 0.95)",

            life: 180,

            distanceTraveled: 0,

            maximumDistance: 90,

            enemyProjectile: false,

            playerProjectile: true,

            swordProjectile: true,

            weaponId: "SWORD"

        };

        return [
            ataqueEspada
        ];
    }


    // ========================================================
    // APLICAR ESTADÍSTICAS AL JUGADOR
    // ========================================================

    function aplicarAlJugador(jugador) {

        jugador.weaponId =
            "SWORD";

        jugador.weaponName =
            "ESPADA DE ENERGÍA";

        jugador.damage =
            48;

        jugador.fireCooldown =
            520;

        jugador.projectileSpeed =
            14;

        jugador.projectileColor =
            "#37eaff";

        /*
         * Mismo tamaño que el personaje normal.
         */

        jugador.width =
            42;

        jugador.height =
            58;

        return jugador;
    }


    // ========================================================
    // OBTENER ANIMACIÓN
    // ========================================================

    function obtenerAnimacion(estado) {

        if (
            animaciones[estado]
        ) {
            return animaciones[estado];
        }

        return animaciones.espera;
    }


    // ========================================================
    // CONFIGURACIÓN DEL PERSONAJE
    // ========================================================

    const PersonajeEspada = {

        id:
            "SWORD",

        nombre:
            "ESPADA DE ENERGÍA",

        teclaCambio:
            "q",

        dimensiones: {
            width: 42,
            height: 58
        },

        estadisticas: {

            damage: 48,

            fireCooldown: 520,

            attackRange: 90,

            slashRadius: 24,

            projectileSpeed: 14

        },

        animaciones:
            animaciones,

        aplicarAlJugador:
            aplicarAlJugador,

        crearProyectiles:
            crearProyectiles,

        obtenerAnimacion:
            obtenerAnimacion

    };


    // ========================================================
    // HACERLO DISPONIBLE PARA MAIN.JS
    // ========================================================

    global.PersonajeEspada =
        Object.freeze(
            PersonajeEspada
        );

})(globalThis);
