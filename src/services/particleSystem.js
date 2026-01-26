/**
 * Système de particules performant pour les effets visuels
 * Utilise object pooling pour éviter les allocations mémoire
 */

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.active = false;
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.life = 0;
    this.maxLife = 0;
    this.size = 0;
    this.color = '#ffffff';
    this.alpha = 1;
    this.decay = 0.95;
    this.gravity = 0;
    this.sparkle = false;
    this.rotation = 0;
    this.rotationSpeed = 0;
  }

  update(deltaTime) {
    if (!this.active) return;

    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vy += this.gravity * deltaTime;
    this.rotation += this.rotationSpeed * deltaTime;

    this.life -= deltaTime;
    this.alpha = Math.max(0, this.life / this.maxLife);
    this.vx *= this.decay;
    this.vy *= this.decay;

    if (this.life <= 0) {
      this.active = false;
    }
  }

  draw(ctx) {
    if (!this.active || this.alpha <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;

    if (this.sparkle) {
      // Effet scintillant
      const sparkleAlpha = Math.sin(Date.now() * 0.01 + this.x) * 0.3 + 0.7;
      ctx.globalAlpha = this.alpha * sparkleAlpha;
    }

    ctx.fillStyle = this.color;

    if (this.rotation !== 0) {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
    } else {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

class ParticlePool {
  constructor(maxParticles = 300) {
    this.particles = [];
    this.maxParticles = maxParticles;

    // Pré-allouer les particules (object pooling)
    for (let i = 0; i < maxParticles; i++) {
      this.particles.push(new Particle());
    }
  }

  getParticle() {
    // Trouver une particule inactive
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        return this.particles[i];
      }
    }
    return null; // Pool saturé
  }

  emit(config) {
    const particle = this.getParticle();
    if (!particle) return null;

    particle.reset();
    particle.active = true;
    particle.x = config.x;
    particle.y = config.y;
    particle.vx = config.vx || 0;
    particle.vy = config.vy || 0;
    particle.life = config.life || 1000;
    particle.maxLife = particle.life;
    particle.size = config.size || 3;
    particle.color = config.color || '#ffffff';
    particle.decay = config.decay || 0.95;
    particle.gravity = config.gravity || 0;
    particle.sparkle = config.sparkle || false;
    particle.rotationSpeed = config.rotationSpeed || 0;

    return particle;
  }

  update(deltaTime) {
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active) {
        this.particles[i].update(deltaTime);
      }
    }
  }

  draw(ctx) {
    for (let i = 0; i < this.particles.length; i++) {
      if (this.particles[i].active) {
        this.particles[i].draw(ctx);
      }
    }
  }

  getActiveCount() {
    return this.particles.filter(p => p.active).length;
  }
}

// Configuration des effets par type de gemme
export const PARTICLE_EFFECTS = {
  'poison': {
    projectileColor: '#22c55e',
    projectileGlow: 'rgba(34, 197, 94, 0.5)',
    trail: {
      enabled: true,
      color: '#4ade80',
      size: 2,
      frequency: 3,
      life: 300
    },
    impact: {
      count: 8,
      colors: ['#22c55e', '#4ade80', '#86efac'],
      size: { min: 2, max: 4 },
      speed: { min: 20, max: 60 },
      life: 500,
      gravity: 0.1
    }
  },
  'freeze': {
    projectileColor: '#3b82f6',
    projectileGlow: 'rgba(59, 130, 246, 0.6)',
    trail: {
      enabled: true,
      color: '#60a5fa',
      size: 3,
      frequency: 2,
      life: 400,
      sparkle: true
    },
    impact: {
      count: 12,
      colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
      size: { min: 2, max: 5 },
      speed: { min: 30, max: 80 },
      life: 600,
      gravity: -0.05,
      sparkle: true
    }
  },
  'burn': {
    projectileColor: '#ef4444',
    projectileGlow: 'rgba(239, 68, 68, 0.7)',
    trail: {
      enabled: true,
      color: '#f97316',
      size: 3,
      frequency: 2,
      life: 250,
      flicker: true
    },
    impact: {
      count: 10,
      colors: ['#ef4444', '#f97316', '#fb923c'],
      size: { min: 2, max: 4 },
      speed: { min: 25, max: 70 },
      life: 400,
      gravity: -0.15
    }
  },
  'stun': {
    projectileColor: '#a855f7',
    projectileGlow: 'rgba(168, 85, 247, 0.8)',
    trail: {
      enabled: false
    },
    impact: {
      count: 15,
      colors: ['#a855f7', '#c084fc', '#e9d5ff'],
      size: { min: 3, max: 6 },
      speed: { min: 40, max: 100 },
      life: 700,
      gravity: 0,
      sparkle: true,
      rotationSpeed: { min: -0.1, max: 0.1 }
    }
  },
  'slow': {
    projectileColor: '#06b6d4',
    projectileGlow: 'rgba(6, 182, 212, 0.5)',
    trail: {
      enabled: true,
      color: '#22d3ee',
      size: 2,
      frequency: 4,
      life: 350
    },
    impact: {
      count: 6,
      colors: ['#06b6d4', '#22d3ee', '#67e8f9'],
      size: { min: 2, max: 4 },
      speed: { min: 15, max: 40 },
      life: 450,
      gravity: 0.05
    }
  },
  'default': {
    projectileColor: '#f59e0b',
    projectileGlow: 'rgba(245, 158, 11, 0.5)',
    trail: {
      enabled: true,
      color: '#fbbf24',
      size: 2,
      frequency: 3,
      life: 300
    },
    impact: {
      count: 6,
      colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
      size: { min: 2, max: 3 },
      speed: { min: 20, max: 50 },
      life: 400,
      gravity: 0.1
    }
  }
};

class ParticleSystem {
  constructor() {
    this.pool = new ParticlePool(300);
    this.projectileTrails = new Map(); // Map projectile ID -> trail particles
    this.lastTime = Date.now();
  }

  /**
   * Créer une traînée pour un projectile
   */
  createTrail(projectile, effect) {
    const trailConfig = PARTICLE_EFFECTS[effect]?.trail || PARTICLE_EFFECTS.default.trail;
    if (!trailConfig.enabled) return;

    const projectileKey = `${projectile.x}-${projectile.y}`;
    const lastEmit = this.projectileTrails.get(projectileKey) || 0;
    const now = Date.now();

    if (now - lastEmit < 1000 / (trailConfig.frequency || 3)) return;

    this.projectileTrails.set(projectileKey, now);

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 10 + 5;

    this.pool.emit({
      x: projectile.x + (Math.random() - 0.5) * 4,
      y: projectile.y + (Math.random() - 0.5) * 4,
      vx: Math.cos(angle) * speed * 0.5,
      vy: Math.sin(angle) * speed * 0.5,
      size: trailConfig.size || 2,
      color: trailConfig.color,
      life: trailConfig.life || 300,
      decay: 0.92,
      sparkle: trailConfig.sparkle || false
    });
  }

  /**
   * Créer une explosion de particules à l'impact
   */
  createImpact(x, y, effect) {
    const impactConfig = PARTICLE_EFFECTS[effect]?.impact || PARTICLE_EFFECTS.default.impact;

    for (let i = 0; i < impactConfig.count; i++) {
      const angle = (Math.PI * 2 * i) / impactConfig.count + Math.random() * 0.3;
      const speed = impactConfig.speed.min + Math.random() * (impactConfig.speed.max - impactConfig.speed.min);
      const color = impactConfig.colors[Math.floor(Math.random() * impactConfig.colors.length)];
      const size = impactConfig.size.min + Math.random() * (impactConfig.size.max - impactConfig.size.min);

      this.pool.emit({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: size,
        color: color,
        life: impactConfig.life + Math.random() * 200,
        decay: 0.96,
        gravity: impactConfig.gravity || 0.1,
        sparkle: impactConfig.sparkle || false,
        rotationSpeed: impactConfig.rotationSpeed ?
          impactConfig.rotationSpeed.min + Math.random() * (impactConfig.rotationSpeed.max - impactConfig.rotationSpeed.min) : 0
      });
    }
  }

  update() {
    const now = Date.now();
    const deltaTime = Math.min((now - this.lastTime) / 16.67, 2); // Normaliser à 60fps, cap à 2x
    this.lastTime = now;

    this.pool.update(deltaTime);

    // Nettoyer les anciennes entrées de traînées
    const cutoff = now - 5000;
    for (const [key, time] of this.projectileTrails.entries()) {
      if (time < cutoff) {
        this.projectileTrails.delete(key);
      }
    }
  }

  draw(ctx) {
    this.pool.draw(ctx);
  }

  getActiveParticleCount() {
    return this.pool.getActiveCount();
  }
}

export const particleSystem = new ParticleSystem();
