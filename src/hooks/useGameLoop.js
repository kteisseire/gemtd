import { useEffect, useRef } from 'react';
import { getEnemyPosition, findTowerTarget, createProjectile } from '../services/combatSystem';
import { EFFECT_CONFIG } from '../config/constants';
import { simpleSounds } from '../services/simpleSounds';
import { particleSystem } from '../services/particleSystem';

/**
 * Hook personnalisé pour gérer la boucle de jeu principale
 * Gère le déplacement des ennemis, projectiles, tirs des tourelles
 *
 * @param {Object} params - Paramètres de la boucle de jeu
 * @param {string} params.gameState - État du jeu
 * @param {number} params.gameSpeed - Vitesse du jeu
 * @param {Array} params.towers - Tourelles permanentes
 * @param {Array} params.tempTowers - Tourelles temporaires
 * @param {Array} params.enemies - Ennemis actifs
 * @param {Array} params.currentPath - Chemin des ennemis
 * @param {Function} params.setEnemies - Setter pour les ennemis
 * @param {Function} params.setProjectiles - Setter pour les projectiles
 * @param {Function} params.setLives - Setter pour les vies
 * @param {Function} params.setScore - Setter pour le score
 */
export const useGameLoop = ({
  gameState,
  gameSpeed,
  towers,
  tempTowers,
  enemies,
  currentPath,
  setEnemies,
  setProjectiles,
  setLives,
  setScore
}) => {
  const gameLoopRef = useRef();
  const lastTimeRef = useRef(null);
  const towerAttackTimers = useRef({});

  useEffect(() => {
    if (gameState !== 'wave') {
      lastTimeRef.current = null;
      return;
    }

    const gameLoop = () => {
      const now = Date.now();
      if (lastTimeRef.current === null) {
        lastTimeRef.current = now;
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const adjustedDeltaTime = deltaTime * gameSpeed;

      // Update enemies
      setEnemies(prev => {
        return prev.map(enemy => {
          if (enemy.health <= 0 || !currentPath) {
            if (enemy.health <= 0) simpleSounds.enemyDeath();
            return null;
          }

          let newPathIndex = enemy.pathIndex;
          if (enemy.effects.stun > 0) {
            enemy.effects.stun -= adjustedDeltaTime;
          } else {
            let movement = enemy.speed * adjustedDeltaTime;
            if (enemy.effects.slow > 0) {
              movement = (enemy.speed * 0.5) * adjustedDeltaTime;
              enemy.effects.slow -= adjustedDeltaTime;
            }
            newPathIndex = enemy.pathIndex + movement;
          }

          if (enemy.effects.poison > 0) {
            enemy.health -= 3 * adjustedDeltaTime;
            enemy.effects.poison -= adjustedDeltaTime;
          }

          if (newPathIndex >= currentPath.length) {
            setLives(l => Math.max(0, l - 1));
            return null;
          }

          return { ...enemy, pathIndex: newPathIndex };
        }).filter(Boolean);
      });

      // Update projectiles
      setProjectiles(prev => {
        const damageToApply = [];
        const updatedProjectiles = prev.map(proj => {
          const targetEnemy = enemies.find(e => e.id === proj.targetId);
          if (!targetEnemy) return null;

          const enemyPos = getEnemyPosition(targetEnemy, currentPath);
          if (!enemyPos) return null;

          const dx = enemyPos.x - proj.x;
          const dy = enemyPos.y - proj.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 15) {
            damageToApply.push({
              enemyId: proj.targetId, damage: proj.damage,
              effect: proj.effect, towerType: proj.towerType
            });

            // Créer des particules d'impact
            const mainEffect = proj.effect.split(',')[0] || 'default';
            particleSystem.createImpact(enemyPos.x, enemyPos.y, mainEffect);

            return null;
          }

          const speed = 250;
          let moveX = (dx / dist) * speed * adjustedDeltaTime;
          let moveY = (dy / dist) * speed * adjustedDeltaTime;

          // RAPID - Appliquer l'angle de dispersion
          if (proj.spreadAngle !== undefined) {
            const angleRad = (proj.spreadAngle * Math.PI) / 180;
            const cos = Math.cos(angleRad);
            const sin = Math.sin(angleRad);
            const rotatedX = moveX * cos - moveY * sin;
            const rotatedY = moveX * sin + moveY * cos;
            moveX = rotatedX;
            moveY = rotatedY;
          }

          return { ...proj, x: proj.x + moveX, y: proj.y + moveY };
        }).filter(Boolean);

        if (damageToApply.length > 0) {
          setEnemies(currentEnemies => {
            // Détecter les ennemis touchés par AOE et CHAIN
            const aoeTargets = [];
            damageToApply.forEach(damage => {
              const effects = damage.effect.split(',');

              // AOE - Dégâts de zone
              if (effects.includes('aoe')) {
                const aoeConfig = EFFECT_CONFIG.aoe;
                const primaryTarget = currentEnemies.find(e => e.id === damage.enemyId);
                if (primaryTarget) {
                  const primaryPos = getEnemyPosition(primaryTarget, currentPath);
                  if (primaryPos) {
                    currentEnemies.forEach(e => {
                      if (e.id !== damage.enemyId) {
                        const ePos = getEnemyPosition(e, currentPath);
                        if (ePos) {
                          const dx = ePos.x - primaryPos.x;
                          const dy = ePos.y - primaryPos.y;
                          const dist = Math.sqrt(dx * dx + dy * dy);
                          if (dist <= aoeConfig.radius) {
                            aoeTargets.push({
                              enemyId: e.id,
                              damage: damage.damage * aoeConfig.damageMultiplier,
                              effect: 'none',
                              towerType: damage.towerType
                            });
                          }
                        }
                      }
                    });
                  }
                }
              }

              // CHAIN - Propagation avec rebonds
              if (effects.includes('chain')) {
                const chainConfig = EFFECT_CONFIG.chain;
                const hitEnemies = new Set([damage.enemyId]);
                let currentTarget = currentEnemies.find(e => e.id === damage.enemyId);
                let currentDamage = damage.damage;

                for (let chain = 0; chain < chainConfig.maxChains; chain++) {
                  if (!currentTarget) break;

                  const currentPos = getEnemyPosition(currentTarget, currentPath);
                  if (!currentPos) break;

                  // Trouver l'ennemi le plus proche non touché dans le rayon
                  let nextTarget = null;
                  let minDist = Infinity;

                  currentEnemies.forEach(e => {
                    if (!hitEnemies.has(e.id)) {
                      const ePos = getEnemyPosition(e, currentPath);
                      if (ePos) {
                        const dx = ePos.x - currentPos.x;
                        const dy = ePos.y - currentPos.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist <= chainConfig.chainRange && dist < minDist) {
                          minDist = dist;
                          nextTarget = e;
                        }
                      }
                    }
                  });

                  if (nextTarget) {
                    currentDamage *= (1 - chainConfig.damageReduction);
                    hitEnemies.add(nextTarget.id);
                    aoeTargets.push({
                      enemyId: nextTarget.id,
                      damage: currentDamage,
                      effect: 'none',
                      towerType: damage.towerType
                    });
                    currentTarget = nextTarget;
                  } else {
                    break;
                  }
                }
              }
            });

            // Combiner les dégâts principaux et AOE
            const allDamage = [...damageToApply, ...aoeTargets];

            return currentEnemies.map(e => {
              const damage = allDamage.find(d => d.enemyId === e.id);
              if (damage) {
                const effects = damage.effect.split(',');
                const hasMagic = effects.includes('magic');
                const hasCrit = effects.includes('crit');
                const isResistant = e.resistances && e.resistances.includes(damage.towerType);

                // CRIT - Test de coup critique
                let isCriticalHit = false;
                if (hasCrit) {
                  const critConfig = EFFECT_CONFIG.crit;
                  isCriticalHit = Math.random() < critConfig.critChance;
                }

                // Si l'effet MAGIC est présent, réduire l'efficacité de la résistance
                let actualDamage = damage.damage;

                // Appliquer le critique avant les résistances
                if (isCriticalHit) {
                  const critConfig = EFFECT_CONFIG.crit;
                  actualDamage *= critConfig.critMultiplier;
                }

                // Nouveau système de résistance:
                // - Résistance globale (défaut 10%)
                // - +20% si résistant à l'élément
                const globalResistance = e.global_resistance || 0.1;
                const elementalResistance = isResistant ? 0.2 : 0;
                let totalResistance = globalResistance + elementalResistance;

                // MAGIC réduit la résistance élémentaire uniquement
                if (hasMagic && isResistant) {
                  const magicConfig = EFFECT_CONFIG.magic;
                  totalResistance = globalResistance + (elementalResistance * (1 - magicConfig.resistancePenetration));
                }

                actualDamage = actualDamage * (1 - totalResistance);

                // Son de hit avec effet si applicable
                const mainEffect = effects.find(eff => ['poison', 'freeze', 'burn', 'stun'].includes(eff));
                simpleSounds.hitEnemy(mainEffect);

                const newHealth = e.health - actualDamage;
                effects.forEach(eff => {
                  const config = EFFECT_CONFIG[eff];
                  if (!config) return;

                  if (eff === 'slow' && config.duration) {
                    e.effects.slow = config.duration;
                  } else if (eff === 'poison' && config.duration) {
                    e.effects.poison = config.duration;
                  } else if (eff === 'stun' && config.duration) {
                    e.effects.stun = config.duration;
                  } else if (eff === 'damage' && config.duration) {
                    e.effects.damage = config.duration;
                    e.effects.damagePerTick = damage.damage * config.damageMultiplier;
                  }
                });

                if (newHealth <= 0) {
                  setScore(s => s + e.reward * 10);
                  return null;
                }
                return { ...e, health: newHealth };
              }
              return e;
            }).filter(Boolean);
          });
        }

        return updatedProjectiles;
      });

      // Tower firing
      [...towers, ...tempTowers].forEach(tower => {
        if (tower.damage === 0) return;
        const timerId = `${tower.id}`;
        if (!towerAttackTimers.current[timerId]) towerAttackTimers.current[timerId] = 0;
        towerAttackTimers.current[timerId] += adjustedDeltaTime * 1000;

        // FAST - Réduire le temps d'attaque (augmenter la cadence)
        let effectiveSpeed = tower.speed;
        const effects = tower.effect.split(',');
        if (effects.includes('fast')) {
          const fastConfig = EFFECT_CONFIG.fast;
          effectiveSpeed = tower.speed * (1 - fastConfig.speedBonus);
        }

        if (towerAttackTimers.current[timerId] >= effectiveSpeed) {
          towerAttackTimers.current[timerId] = 0;
          const closestEnemy = findTowerTarget(tower, enemies, currentPath);
          if (closestEnemy) {
            // RAPID - Créer plusieurs projectiles
            if (effects.includes('rapid')) {
              const rapidConfig = EFFECT_CONFIG.rapid;
              const projectiles = [];
              const angleStep = rapidConfig.spreadAngle;
              const startAngle = -(rapidConfig.projectileCount - 1) * angleStep / 2;

              for (let i = 0; i < rapidConfig.projectileCount; i++) {
                const angle = startAngle + i * angleStep;
                const proj = createProjectile(tower, closestEnemy);
                // Ajouter un angle de dispersion au projectile
                proj.spreadAngle = angle;
                projectiles.push(proj);
              }
              setProjectiles(prev => [...prev, ...projectiles]);
              simpleSounds.shootProjectile(tower.type);
            } else {
              setProjectiles(prev => [...prev, createProjectile(tower, closestEnemy)]);
              simpleSounds.shootProjectile(tower.type);
            }
          }
        }
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameState, towers, tempTowers, enemies, currentPath, gameSpeed, setEnemies, setProjectiles, setLives, setScore]);
};
