import { useEffect, useRef } from 'react';
import { getEnemyPosition, findTowerTarget, createProjectile } from '../services/combatSystem';

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
          if (enemy.health <= 0 || !currentPath) return null;

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
            return null;
          }

          const speed = 250;
          const moveX = (dx / dist) * speed * adjustedDeltaTime;
          const moveY = (dy / dist) * speed * adjustedDeltaTime;
          return { ...proj, x: proj.x + moveX, y: proj.y + moveY };
        }).filter(Boolean);

        if (damageToApply.length > 0) {
          setEnemies(currentEnemies => {
            return currentEnemies.map(e => {
              const damage = damageToApply.find(d => d.enemyId === e.id);
              if (damage) {
                const isResistant = e.resistances && e.resistances.includes(damage.towerType);
                const actualDamage = isResistant ? damage.damage * 0.5 : damage.damage;
                const newHealth = e.health - actualDamage;

                const effects = damage.effect.split(',');
                effects.forEach(eff => {
                  if (eff === 'slow') e.effects.slow = 2;
                  else if (eff === 'poison') e.effects.poison = 3;
                  else if (eff === 'stun') e.effects.stun = 1;
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

        if (towerAttackTimers.current[timerId] >= tower.speed) {
          towerAttackTimers.current[timerId] = 0;
          const closestEnemy = findTowerTarget(tower, enemies, currentPath);
          if (closestEnemy) {
            setProjectiles(prev => [...prev, createProjectile(tower, closestEnemy)]);
          }
        }
      });

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    return () => { if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current); };
  }, [gameState, towers, tempTowers, enemies, currentPath, gameSpeed, setEnemies, setProjectiles, setLives, setScore]);
};
