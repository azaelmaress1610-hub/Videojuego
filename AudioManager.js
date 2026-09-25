// ============================================================
// ADMINISTRADOR DE AUDIO
// NEON SIEGE
// ============================================================

(function () {
    "use strict";


    // ========================================================
    // CONFIGURACIÓN
    // ========================================================

    const AUDIO_PATH =
        "Audio/";

    const musicVolume =
        0.35;

    const effectsVolume =
        0.55;


    // ========================================================
    // CREAR AUDIO
    // ========================================================

    function createAudio(
        fileName,
        volume,
        loop = false
    ) {
        const audio =
            new Audio(
                AUDIO_PATH +
                fileName
            );

        audio.volume =
            volume;

        audio.loop =
            loop;

        audio.preload =
            "auto";

        return audio;
    }


    // ========================================================
    // MÚSICA DE JEFES
    // ========================================================

    const bossMusic = {
        jefe1:
            createAudio(
                "jefe1.mp3",
                musicVolume,
                true
            ),

        jefe2:
            createAudio(
                "jefe2.mp3",
                musicVolume,
                true
            )
    };


    // ========================================================
    // EFECTOS DE SONIDO
    // ========================================================

    const soundEffects = {
        shot:
            createAudio(
                "disparo.mp3",
                effectsVolume
            ),

        damage:
            createAudio(
                "dano.mp3",
                effectsVolume
            ),

        death:
            createAudio(
                "muerte.mp3",
                effectsVolume
            )
    };


    // ========================================================
    // ESTADO DEL AUDIO
    // ========================================================

    let audioEnabled =
        true;

    let audioUnlocked =
        false;

    let currentBossMusic =
        null;

    let currentMusicName =
        null;

    let currentMusicVolume =
        musicVolume;

    let currentEffectsVolume =
        effectsVolume;


    // ========================================================
    // DESBLOQUEAR AUDIO DEL NAVEGADOR
    // Debe ejecutarse después de pulsar un botón.
    // ========================================================

    function unlockAudio() {
        audioUnlocked =
            true;
    }


    // ========================================================
    // REPRODUCIR EFECTO
    // ========================================================

    function playEffect(
        effectName
    ) {
        if (
            !audioEnabled ||
            !audioUnlocked
        ) {
            return;
        }

        const originalEffect =
            soundEffects[
                effectName
            ];

        if (!originalEffect) {
            return;
        }

        // Crear una copia permite reproducir
        // varios disparos al mismo tiempo.
        const effect =
            originalEffect.cloneNode(
                true
            );

        effect.volume =
            currentEffectsVolume;

        effect.play()
            .catch(
                function (error) {
                    console.warn(
                        `No se pudo reproducir ${effectName}:`,
                        error
                    );
                }
            );
    }


    // ========================================================
    // SONIDO DE DISPARO
    // ========================================================

    function playShot() {
        playEffect(
            "shot"
        );
    }


    // ========================================================
    // SONIDO DE DAÑO
    // ========================================================

    function playDamage() {
        playEffect(
            "damage"
        );
    }


    // ========================================================
    // SONIDO DE MUERTE
    // ========================================================

    function playDeath() {
        playEffect(
            "death"
        );
    }


    // ========================================================
    // DETENER MÚSICA ACTUAL
    // ========================================================

    function stopBossMusic() {
        if (
            currentBossMusic
        ) {
            currentBossMusic.pause();

            currentBossMusic.currentTime =
                0;
        }

        currentBossMusic =
            null;

        currentMusicName =
            null;
    }


    // ========================================================
    // REPRODUCIR MÚSICA DE JEFE
    // ========================================================

    function playBossMusic(
        musicName
    ) {
        if (
            !audioEnabled ||
            !audioUnlocked
        ) {
            return;
        }

        const selectedMusic =
            bossMusic[
                musicName
            ];

        if (!selectedMusic) {
            return;
        }

        // No reiniciar la misma canción
        // en cada fotograma.
        if (
            currentMusicName ===
                musicName &&
            currentBossMusic &&
            !currentBossMusic.paused
        ) {
            return;
        }

        stopBossMusic();

        currentBossMusic =
            selectedMusic;

        currentMusicName =
            musicName;

        currentBossMusic.volume =
            currentMusicVolume;

        currentBossMusic.currentTime =
            0;

        currentBossMusic.play()
            .catch(
                function (error) {
                    console.warn(
                        "No se pudo reproducir la música:",
                        error
                    );
                }
            );
    }


    // ========================================================
    // ACTUALIZAR MÚSICA SEGÚN LA OLEADA
    // ========================================================

    function updateBossMusic(
        currentWave,
        waveState
    ) {
        if (
            !audioEnabled ||
            !audioUnlocked
        ) {
            return;
        }

        // No reproducir música durante
        // el descanso entre oleadas.
        if (
            waveState !==
            "FIGHTING"
        ) {
            stopBossMusic();

            return;
        }

        // Jefe 2: Nexus Prime.
        // Oleadas 10, 20, 30...
        if (
            currentWave > 0 &&
            currentWave % 10 === 0
        ) {
            playBossMusic(
                "jefe2"
            );

            return;
        }

        // Jefe 1: Cerberon.
        // Oleadas 5, 15, 25...
        if (
            currentWave > 0 &&
            currentWave % 5 === 0
        ) {
            playBossMusic(
                "jefe1"
            );

            return;
        }

        // Oleada normal.
        stopBossMusic();
    }


    // ========================================================
    // PAUSAR MÚSICA
    // ========================================================

    function pauseMusic() {
        if (
            currentBossMusic &&
            !currentBossMusic.paused
        ) {
            currentBossMusic.pause();
        }
    }


    // ========================================================
    // CONTINUAR MÚSICA
    // ========================================================

    function resumeMusic() {
        if (
            !audioEnabled ||
            !audioUnlocked ||
            !currentBossMusic
        ) {
            return;
        }

        currentBossMusic.play()
            .catch(
                function (error) {
                    console.warn(
                        "No se pudo continuar la música:",
                        error
                    );
                }
            );
    }


    // ========================================================
    // ACTIVAR O DESACTIVAR AUDIO
    // ========================================================

    function setAudioEnabled(
        enabled
    ) {
        audioEnabled =
            Boolean(enabled);

        if (!audioEnabled) {
            stopBossMusic();
        }
    }


    // ========================================================
    // CAMBIAR VOLUMEN DE MÚSICA
    // Valor permitido: 0 a 1
    // ========================================================

    function setMusicVolume(
        volume
    ) {
        currentMusicVolume =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(volume) || 0
                )
            );

        bossMusic.jefe1.volume =
            currentMusicVolume;

        bossMusic.jefe2.volume =
            currentMusicVolume;
    }


    // ========================================================
    // CAMBIAR VOLUMEN DE EFECTOS
    // Valor permitido: 0 a 1
    // ========================================================

    function setEffectsVolume(
        volume
    ) {
        currentEffectsVolume =
            Math.max(
                0,
                Math.min(
                    1,
                    Number(volume) || 0
                )
            );

        soundEffects.shot.volume =
            currentEffectsVolume;

        soundEffects.damage.volume =
            currentEffectsVolume;

        soundEffects.death.volume =
            currentEffectsVolume;
    }


    // ========================================================
    // HACER FUNCIONES DISPONIBLES
    // ========================================================

    window.NeonAudio = {
        unlock:
            unlockAudio,

        updateBossMusic:
            updateBossMusic,

        stopBossMusic:
            stopBossMusic,

        pauseMusic:
            pauseMusic,

        resumeMusic:
            resumeMusic,

        playShot:
            playShot,

        playDamage:
            playDamage,

        playDeath:
            playDeath,

        setEnabled:
            setAudioEnabled,

        setMusicVolume:
            setMusicVolume,

        setEffectsVolume:
            setEffectsVolume
    };

})();
