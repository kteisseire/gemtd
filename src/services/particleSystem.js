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

// Configuration des effets par type de gemme (basé sur DEFAULT_GEM_TYPES)
export const PARTICLE_EFFECTS = {
  // GREEN - Poison (effet: poison) ☠️
  'poison': {
    projectileColor: '#22c55e',
    projectileGlow: 'rgba(34, 197, 94, 0.6)',
    trail: {
      enabled: true,
      color: '#4ade80',
      size: 2,
      frequency: 3,
      life: 400
    },
    impact: {
      count: 10,
      colors: ['#22c55e', '#4ade80', '#86efac'],
      size: { min: 2, max: 4 },
      speed: { min: 20, max: 60 },
      life: 600,
      gravity: 0.08
    }
  },

  // BLUE - Glace (effet: slow) ❄️
  'slow': {
    projectileColor: '#3b82f6',
    projectileGlow: 'rgba(59, 130, 246, 0.7)',
    trail: {
      enabled: true,
      color: '#60a5fa',
      size: 3,
      frequency: 2,
      life: 450,
      sparkle: true
    },
    impact: {
      count: 12,
      colors: ['#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'],
      size: { min: 2, max: 5 },
      speed: { min: 15, max: 50 },
      life: 700,
      gravity: -0.05,
      sparkle: true
    }
  },

  // RED - Feu (effet: damage/burn) 🔥
  'damage': {
    projectileColor: '#ef4444',
    projectileGlow: 'rgba(239, 68, 68, 0.8)',
    trail: {
      enabled: true,
      color: '#f97316',
      size: 3,
      frequency: 2,
      life: 300,
      flicker: true
    },
    impact: {
      count: 12,
      colors: ['#ef4444', '#f97316', '#fb923c', '#fdba74'],
      size: { min: 2, max: 5 },
      speed: { min: 30, max: 80 },
      life: 500,
      gravity: -0.2
    }
  },

  // GRAY - Pierre (effet: stun) 🗿
  'stun': {
    projectileColor: '#6b7280',
    projectileGlow: 'rgba(107, 114, 128, 0.7)',
    trail: {
      enabled: false
    },
    impact: {
      count: 16,
      colors: ['#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb'],
      size: { min: 3, max: 7 },
      speed: { min: 50, max: 120 },
      life: 800,
      gravity: 0.15,
      rotationSpeed: { min: -0.15, max: 0.15 }
    }
  },

  // YELLOW - Foudre (effet: fast) ⚡
  'fast': {
    projectileColor: '#eab308',
    projectileGlow: 'rgba(234, 179, 8, 0.9)',
    trail: {
      enabled: true,
      color: '#fde047',
      size: 2,
      frequency: 5,
      life: 200,
      sparkle: true
    },
    impact: {
      count: 8,
      colors: ['#eab308', '#fde047', '#fef08a', '#ffffff'],
      size: { min: 2, max: 4 },
      speed: { min: 60, max: 140 },
      life: 400,
      gravity: 0,
      sparkle: true
    }
  },

  // PURPLE - Arcane (effet: magic) 🔮
  'magic': {
    projectileColor: '#a855f7',
    projectileGlow: 'rgba(168, 85, 247, 0.9)',
    trail: {
      enabled: true,
      color: '#c084fc',
      size: 3,
      frequency: 2,
      life: 500,
      sparkle: true
    },
    impact: {
      count: 14,
      colors: ['#a855f7', '#c084fc', '#e9d5ff', '#fae8ff'],
      size: { min: 3, max: 6 },
      speed: { min: 40, max: 100 },
      life: 800,
      gravity: 0,
      sparkle: true,
      rotationSpeed: { min: -0.1, max: 0.1 }
    }
  },

  // ORANGE - Explosion (effet: aoe) 💥
  'aoe': {
    projectileColor: '#f97316',
    projectileGlow: 'rgba(249, 115, 22, 0.8)',
    trail: {
      enabled: true,
      color: '#fb923c',
      size: 4,
      frequency: 3,
      life: 350
    },
    impact: {
      count: 20,
      colors: ['#f97316', '#fb923c', '#fdba74', '#fed7aa'],
      size: { min: 3, max: 8 },
      speed: { min: 40, max: 120 },
      life: 600,
      gravity: 0.1
    }
  },

  // CYAN - Eau (effet: rapid) 💧
  'rapid': {
    projectileColor: '#06b6d4',
    projectileGlow: 'rgba(6, 182, 212, 0.6)',
    trail: {
      enabled: true,
      color: '#22d3ee',
      size: 2,
      frequency: 6,
      life: 300
    },
    impact: {
      count: 8,
      colors: ['#06b6d4', '#22d3ee', '#67e8f9', '#cffafe'],
      size: { min: 2, max: 4 },
      speed: { min: 30, max: 70 },
      life: 500,
      gravity: 0.12
    }
  },

  // PINK - Lumière (effet: crit) ✨
  'crit': {
    projectileColor: '#ec4899',
    projectileGlow: 'rgba(236, 72, 153, 0.9)',
    trail: {
      enabled: true,
      color: '#f9a8d4',
      size: 3,
      frequency: 3,
      life: 400,
      sparkle: true
    },
    impact: {
      count: 16,
      colors: ['#ec4899', '#f9a8d4', '#fbcfe8', '#fce7f3'],
      size: { min: 3, max: 7 },
      speed: { min: 50, max: 130 },
      life: 700,
      gravity: -0.1,
      sparkle: true
    }
  },

  // BLACK - Ombre (effet: chain) 🌑
  'chain': {
    projectileColor: '#1f2937',
    projectileGlow: 'rgba(31, 41, 55, 0.8)',
    trail: {
      enabled: true,
      color: '#374151',
      size: 2,
      frequency: 4,
      life: 450
    },
    impact: {
      count: 10,
      colors: ['#1f2937', '#374151', '#4b5563', '#6b7280'],
      size: { min: 2, max: 5 },
      speed: { min: 35, max: 90 },
      life: 650,
      gravity: 0.05
    }
  },

  // BASE/NONE - Neutre ⚪
  'none': {
    projectileColor: '#94a3b8',
    projectileGlow: 'rgba(148, 163, 184, 0.4)',
    trail: {
      enabled: true,
      color: '#cbd5e1',
      size: 2,
      frequency: 3,
      life: 300
    },
    impact: {
      count: 6,
      colors: ['#94a3b8', '#cbd5e1', '#e2e8f0'],
      size: { min: 2, max: 3 },
      speed: { min: 20, max: 50 },
      life: 400,
      gravity: 0.1
    }
  },

  // DEFAULT (fallback)
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
    this.persistentEffects = []; // Effets de persistance au sol (feu, poison)
    this.chainEffects = []; // Effets de chaîne (lightning entre ennemis)
    this.aoeRings = []; // Anneaux d'explosion AOE
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

    // Créer un effet de persistance pour le feu et le poison
    if (effect === 'damage' || effect === 'poison') {
      this.createPersistentEffect(x, y, effect);
    }

    // Créer un anneau AOE pour les explosions
    if (effect === 'aoe') {
      this.createAOERing(x, y);
    }
  }

  /**
   * Créer un effet de persistance au sol (feu ou poison)
   */
  createPersistentEffect(x, y, effect) {
    const duration = effect === 'damage' ? 3000 : 4000; // Feu: 3s, Poison: 4s
    const colors = effect === 'damage'
      ? ['#ef4444', '#f97316', '#fb923c']
      : ['#22c55e', '#4ade80', '#86efac'];

    this.persistentEffects.push({
      x: x,
      y: y,
      effect: effect,
      life: duration,
      maxLife: duration,
      colors: colors,
      lastEmit: Date.now()
    });
  }

  /**
   * Créer un anneau d'explosion AOE
   */
  createAOERing(x, y) {
    this.aoeRings.push({
      x: x,
      y: y,
      radius: 0,
      maxRadius: 120,
      life: 600,
      maxLife: 600,
      color: '#f97316'
    });
  }

  /**
   * Créer un effet de chaîne entre ennemis
   */
  createChainEffect(startX, startY, endX, endY) {
    this.chainEffects.push({
      startX: startX,
      startY: startY,
      endX: endX,
      endY: endY,
      life: 300,
      maxLife: 300,
      segments: []
    });

    // Créer quelques particules le long de la chaîne
    const steps = 8;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = startX + (endX - startX) * t;
      const y = startY + (endY - startY) * t;
      const angle = Math.random() * Math.PI * 2;
      const speed = 20 + Math.random() * 30;

      this.pool.emit({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        color: ['#1f2937', '#374151', '#4b5563'][Math.floor(Math.random() * 3)],
        life: 400,
        decay: 0.95,
        gravity: 0.05
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

    // Mettre à jour les effets de persistance
    this.persistentEffects = this.persistentEffects.filter(effect => {
      effect.life -= deltaTime * 16.67; // Convertir en ms

      // Émettre des particules périodiquement
      if (now - effect.lastEmit > 100) {
        effect.lastEmit = now;

        // Feu: particules montantes
        if (effect.effect === 'damage') {
          for (let i = 0; i < 2; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 15;
            this.pool.emit({
              x: effect.x + Math.cos(angle) * radius,
              y: effect.y + Math.sin(angle) * radius,
              vx: (Math.random() - 0.5) * 10,
              vy: -30 - Math.random() * 20,
              size: 3 + Math.random() * 3,
              color: effect.colors[Math.floor(Math.random() * effect.colors.length)],
              life: 600,
              decay: 0.97,
              gravity: -0.15,
              sparkle: true
            });
          }
        }
        // Poison: bulles toxiques
        else if (effect.effect === 'poison') {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.random() * 20;
          this.pool.emit({
            x: effect.x + Math.cos(angle) * radius,
            y: effect.y + Math.sin(angle) * radius,
            vx: (Math.random() - 0.5) * 15,
            vy: -10 - Math.random() * 15,
            size: 2 + Math.random() * 4,
            color: effect.colors[Math.floor(Math.random() * effect.colors.length)],
            life: 800,
            decay: 0.98,
            gravity: -0.08,
            sparkle: false
          });
        }
      }

      return effect.life > 0;
    });

    // Mettre à jour les anneaux AOE
    this.aoeRings = this.aoeRings.filter(ring => {
      ring.life -= deltaTime * 16.67;
      ring.radius = ring.maxRadius * (1 - ring.life / ring.maxLife);
      return ring.life > 0;
    });

    // Mettre à jour les effets de chaîne
    this.chainEffects = this.chainEffects.filter(chain => {
      chain.life -= deltaTime * 16.67;
      return chain.life > 0;
    });
  }

  draw(ctx) {
    // Dessiner les effets de persistance au sol d'abord (en arrière-plan)
    this.persistentEffects.forEach(effect => {
      const alpha = Math.max(0.3, effect.life / effect.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha * 0.4;

      // Zone circulaire de l'effet
      const gradient = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, 25);
      gradient.addColorStop(0, effect.colors[0]);
      gradient.addColorStop(0.5, effect.colors[1]);
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, 25, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    // Dessiner les anneaux AOE
    this.aoeRings.forEach(ring => {
      const alpha = ring.life / ring.maxLife;
      const thickness = 4 + (1 - alpha) * 8;

      ctx.save();
      ctx.globalAlpha = alpha * 0.8;

      // Anneau extérieur
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = thickness;
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Anneau de glow
      ctx.globalAlpha = alpha * 0.4;
      ctx.shadowColor = ring.color;
      ctx.shadowBlur = 20;
      ctx.lineWidth = thickness * 2;
      ctx.stroke();

      ctx.restore();
    });

    // Dessiner les effets de chaîne (lightning)
    this.chainEffects.forEach(chain => {
      const alpha = chain.life / chain.maxLife;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      // Dessiner une ligne avec des segments aléatoires pour un effet éclair
      ctx.beginPath();
      ctx.moveTo(chain.startX, chain.startY);

      const steps = 8;
      for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = chain.startX + (chain.endX - chain.startX) * t;
        const y = chain.startY + (chain.endY - chain.startY) * t;
        // Ajouter un décalage aléatoire perpendiculaire
        const offset = (Math.random() - 0.5) * 15;
        const angle = Math.atan2(chain.endY - chain.startY, chain.endX - chain.startX) + Math.PI / 2;
        const offsetX = Math.cos(angle) * offset;
        const offsetY = Math.sin(angle) * offset;
        ctx.lineTo(x + offsetX, y + offsetY);
      }

      ctx.lineTo(chain.endX, chain.endY);
      ctx.stroke();

      // Ligne de glow
      ctx.globalAlpha = alpha * 0.6;
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#1f2937';
      ctx.shadowBlur = 10;
      ctx.stroke();

      ctx.restore();
    });

    // Dessiner les particules normales par dessus
    this.pool.draw(ctx);
  }

  getActiveParticleCount() {
    return this.pool.getActiveCount();
  }
}

export const particleSystem = new ParticleSystem();
