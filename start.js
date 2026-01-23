import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Démarrage du jeu Tower Defense...\n');

// Démarrer le serveur API
const apiServer = spawn('node', ['server/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Démarrer le serveur de développement Vite
const devServer = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

// Gestion de l'arrêt propre
const cleanup = () => {
  console.log('\n\n🛑 Arrêt des serveurs...');
  apiServer.kill();
  devServer.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Gestion des erreurs
apiServer.on('error', (err) => {
  console.error('❌ Erreur du serveur API:', err);
});

devServer.on('error', (err) => {
  console.error('❌ Erreur du serveur de dev:', err);
});

apiServer.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Le serveur API s'est arrêté avec le code ${code}`);
    cleanup();
  }
});

devServer.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Le serveur de dev s'est arrêté avec le code ${code}`);
    cleanup();
  }
});

console.log('✅ Les serveurs démarrent...');
console.log('📡 API Server: http://localhost:3001');
console.log('🌐 Dev Server: http://localhost:5176');
console.log('\nAppuyez sur Ctrl+C pour arrêter les serveurs.\n');
