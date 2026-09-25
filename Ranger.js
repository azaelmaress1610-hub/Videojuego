const rangerSpritePath = "Sprites/Ranger/";

const rangerIdleSprite = new Image();
rangerIdleSprite.src = `${rangerSpritePath}Ranger-quieto.png`;
const rangerMovementSprite = new Image();
rangerMovementSprite.src = `${rangerSpritePath}Ranger-movimiento.png`;
const rangerAttackSprite = new Image();
rangerAttackSprite.src = `${rangerSpritePath}Ranger-ataque.png`;
const rangerAttackEffectSprite = new Image();
rangerAttackEffectSprite.src = `${rangerSpritePath}Ranger-disparo.png`;
const rangerHitSprite = new Image();
rangerHitSprite.src = `${rangerSpritePath}Ranger-daño.png`;
const rangerDeathSprite = new Image();
rangerDeathSprite.src = `${rangerSpritePath}Ranger-muerte.png`;
const rangerFrameCount = 10;

class Ranger extends Enemy {

    constructor(x, y) {

        super(x, y);

        this.width = 35;
        this.height = 35;

        this.speed = 1.5;

        this.health = 60;
        this.maxHealth = 60;

        this.damage = 1;

        // Distancias de comportamiento
        this.minDistance = 180;
        this.maxDistance = 300;

        this.state = "SPAWN";
        this.distanceFromPlayer = Infinity;

        this.attackRange = 300;
        
        this.attackCooldown = 1500;
        this.lastAttackTime = 0;
        this.shotsRemaining = 0;
        this.nextShotAt = 0;
        this.shotInterval = 150;
        this.attackStartedAt = -Infinity;
        this.attackDuration = 600;
        this.hitStartedAt = -Infinity;
        this.hitDuration = 180;
        this.isDying = false;
        this.deathStartedAt = 0;
        this.deathDuration = 1200;
    }
    update(player) {
        
        if (!this.alive || this.isDying) {
            return;
        }
        
        if (this.state === "SPAWN") {
            
            this.state = "SEARCH";
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        
        const distance = Math.sqrt(
            
            dx * dx +
            dy * dy
        );
        this.distanceFromPlayer = distance;

        if (this.state === "SEARCH") {

            if (distance > this.attackRange && distance > 0) {
                const directionX = dx / distance;
                const directionY = dy / distance;

                this.x += directionX * this.speed;
                this.y += directionY * this.speed;
            } else if (distance <= this.attackRange) {
                this.state = "ATTACK";
            }
        }
        
        else if (this.state === "ATTACK") {
            
            if (distance > this.attackRange) {
                
                this.state = "SEARCH";
                this.shotsRemaining = 0;
            
            } else {
                
                const currentTime = Date.now();

                if (this.shotsRemaining > 0) {
                    if (currentTime >= this.nextShotAt) {
                        const shotIndex = 4 - this.shotsRemaining;
                        this.shoot(player, shotIndex);
                        this.shotsRemaining -= 1;
                        this.nextShotAt = currentTime + this.shotInterval;
                    }
                } else if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                    this.shotsRemaining = 4;
                    this.lastAttackTime = currentTime;
                    this.nextShotAt = currentTime;
                }
            }
        }
        
        // Mantener al Ranger dentro de la arena
         
        const halfWidth = this.width / 2;
        const halfHeight = this.height / 2;
        
        if (this.x - halfWidth < 0) {
            this.x = halfWidth;
        }
        
        if (this.x + halfWidth > canvas.width) {
            this.x = canvas.width - halfWidth;
        }
        
        if (this.y - halfHeight < 0) {
            this.y = halfHeight;
        }
        
        if (this.y + halfHeight > canvas.height) {
            this.y = canvas.height - halfHeight;
        }
    }
    shoot(player, shotIndex = 0) {
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        
        const angle = Math.atan2(dy, dx);
        
        const projectile = {
            x: this.x,
            y: this.y,
            radius: 5,
            speed: 5,
            angle: angle,
            damage: this.damage,
            enemyProjectile: true,
            rangerProjectile: true,
            spriteIndex: shotIndex,
            spriteStartedAt: performance.now()
        };
        projectiles.push(projectile);
        this.attackStartedAt = performance.now();
    }

    takeDamage(amount) {

        if (!this.alive || this.isDying) {
            return;
        }

        this.health = Math.max(0, this.health - amount);
        this.hitStartedAt = performance.now();

        if (this.health === 0) {
            this.isDying = true;
            this.state = "DEAD";
            this.deathStartedAt = performance.now();
        }
    }

    drawRangerSprite(ctx, sprite, frame, scale = 1.5) {

        if (!sprite.complete || !sprite.naturalWidth) {
            return false;
        }

        const frameWidth = sprite.naturalWidth / rangerFrameCount;
        const frameHeight = sprite.naturalHeight - 4;
        const drawWidth = this.width * scale;
        const drawHeight = this.height * scale;

        ctx.drawImage(
            sprite,
            frame * frameWidth,
            0,
            frameWidth,
            frameHeight,
            this.x - drawWidth / 2,
            this.y - drawHeight / 2,
            drawWidth,
            drawHeight
        );

        return true;
    }

    draw(ctx) {

        if (!this.alive) {
            return;
        }

        const now = performance.now();
        let sprite = rangerIdleSprite;
        let frame = 0;

        if (this.isDying) {
            const elapsed = now - this.deathStartedAt;
            frame = Math.min(rangerFrameCount - 1, Math.floor(elapsed / (this.deathDuration / rangerFrameCount)));
            sprite = rangerDeathSprite;

            if (elapsed >= this.deathDuration) {
                this.alive = false;
            }
        } else if (now - this.hitStartedAt < this.hitDuration) {
            frame = Math.min(rangerFrameCount - 1, Math.floor((now - this.hitStartedAt) / (this.hitDuration / rangerFrameCount)));
            sprite = rangerHitSprite;
        }

        if (!this.drawRangerSprite(ctx, sprite, frame)) {
            ctx.fillStyle = "#ffaa00";
            ctx.fillRect(
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }

        if (this.isDying) {
            return;
        }

        // Barra de vida
         
        const barWidth = 40;
        const barHeight = 5;
        
        const healthWidth =
        (this.health / this.maxHealth) * barWidth;
        ctx.fillStyle = "#222222";
        
        ctx.fillRect(
            this.x - barWidth / 2,
            this.y - this.height / 2 - 10,
            barWidth,
            barHeight
        );
        
        ctx.fillStyle = "#00ff88";
        
        ctx.fillRect(
            this.x - barWidth / 2,
            this.y - this.height / 2 - 10,
            healthWidth,
            barHeight
        );
    }
}