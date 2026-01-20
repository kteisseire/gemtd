import db from './database.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function listGems() {
  const gems = db.prepare('SELECT * FROM gems').all();
  console.log('\n=== Liste des gemmes ===');
  gems.forEach(gem => {
    console.log(`\n${gem.icon} ${gem.id} - ${gem.name}`);
    console.log(`  Dégâts: ${gem.damage} | Vitesse: ${gem.speed}ms | Portée: ${gem.range}`);
    console.log(`  Effet: ${gem.effect} | Couleur: ${gem.color}`);
  });
  console.log('\n');
}

async function updateGem() {
  const id = await question('ID de la gemme à modifier: ');
  const gem = db.prepare('SELECT * FROM gems WHERE id = ?').get(id);

  if (!gem) {
    console.log('❌ Gemme non trouvée!\n');
    return;
  }

  console.log(`\nGemme actuelle: ${gem.icon} ${gem.name}`);
  console.log(`Dégâts: ${gem.damage} | Vitesse: ${gem.speed}ms | Portée: ${gem.range}`);
  console.log(`Effet: ${gem.effect}\n`);

  const damage = await question(`Nouveaux dégâts (${gem.damage}): `);
  const speed = await question(`Nouvelle vitesse en ms (${gem.speed}): `);
  const range = await question(`Nouvelle portée (${gem.range}): `);

  const newDamage = damage ? parseInt(damage) : gem.damage;
  const newSpeed = speed ? parseInt(speed) : gem.speed;
  const newRange = range ? parseInt(range) : gem.range;

  db.prepare(`
    UPDATE gems
    SET damage = ?, speed = ?, range = ?
    WHERE id = ?
  `).run(newDamage, newSpeed, newRange, id);

  console.log(`✅ Gemme ${id} mise à jour avec succès!\n`);
}

async function exportGems() {
  const gems = db.prepare('SELECT * FROM gems').all();
  const gemsObject = {};

  gems.forEach(gem => {
    gemsObject[gem.id] = {
      name: gem.name,
      color: gem.color,
      damage: gem.damage,
      speed: gem.speed,
      range: gem.range,
      effect: gem.effect,
      icon: gem.icon
    };
  });

  console.log('\n=== Export des gemmes (pour le code) ===\n');
  console.log('const GEM_TYPES = ' + JSON.stringify(gemsObject, null, 2) + ';\n');
}

async function compareStats() {
  const gems = db.prepare('SELECT * FROM gems WHERE id != "BASE" ORDER BY damage DESC').all();

  console.log('\n=== Comparaison des statistiques ===\n');
  console.log('Classement par dégâts:');
  gems.forEach((gem, i) => {
    console.log(`${i + 1}. ${gem.icon} ${gem.name}: ${gem.damage} dégâts`);
  });

  const bySpeed = [...gems].sort((a, b) => a.speed - b.speed);
  console.log('\nClassement par vitesse (du plus rapide au plus lent):');
  bySpeed.forEach((gem, i) => {
    console.log(`${i + 1}. ${gem.icon} ${gem.name}: ${gem.speed}ms`);
  });

  const byRange = [...gems].sort((a, b) => b.range - a.range);
  console.log('\nClassement par portée:');
  byRange.forEach((gem, i) => {
    console.log(`${i + 1}. ${gem.icon} ${gem.name}: ${gem.range} unités`);
  });

  const avgDamage = gems.reduce((sum, g) => sum + g.damage, 0) / gems.length;
  const avgSpeed = gems.reduce((sum, g) => sum + g.speed, 0) / gems.length;
  const avgRange = gems.reduce((sum, g) => sum + g.range, 0) / gems.length;

  console.log('\n=== Moyennes ===');
  console.log(`Dégâts moyens: ${avgDamage.toFixed(1)}`);
  console.log(`Vitesse moyenne: ${avgSpeed.toFixed(0)}ms`);
  console.log(`Portée moyenne: ${avgRange.toFixed(1)}\n`);
}

async function main() {
  console.log('🎮 Outil d\'équilibrage - Gem Tower Defense\n');

  while (true) {
    console.log('Options:');
    console.log('1. Lister toutes les gemmes');
    console.log('2. Modifier une gemme');
    console.log('3. Comparer les statistiques');
    console.log('4. Exporter les gemmes');
    console.log('5. Quitter\n');

    const choice = await question('Votre choix: ');

    switch (choice) {
      case '1':
        await listGems();
        break;
      case '2':
        await updateGem();
        break;
      case '3':
        await compareStats();
        break;
      case '4':
        await exportGems();
        break;
      case '5':
        console.log('👋 Au revoir!\n');
        rl.close();
        process.exit(0);
      default:
        console.log('❌ Choix invalide\n');
    }
  }
}

main();
