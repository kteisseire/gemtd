import { Howl } from 'howler';

/**
 * Gestionnaire centralisé des sons du jeu
 * Style: Fantasy/Magique
 */
class SoundManager {
  constructor() {
    this.sounds = {};
    this.music = null;
    this.musicVolume = 0.2;
    this.sfxVolume = 0.5;
    this.enabled = true;
    this.musicEnabled = true;
    this.initialized = false;
  }

  /**
   * Initialiser tous les sons du jeu
   */
  init() {
    if (this.initialized) return;

    // Pour l'instant, on va créer des sons de placeholder
    // Vous pourrez les remplacer par de vrais fichiers audio plus tard
    console.log('🎵 SoundManager initialisé (mode placeholder)');

    this.initialized = true;
  }

  /**
   * Charger un son
   */
  load(name, src, options = {}) {
    try {
      this.sounds[name] = new Howl({
        src: [src],
        volume: options.volume !== undefined ? options.volume : this.sfxVolume,
        ...options
      });
    } catch (error) {
      console.warn(`Impossible de charger le son: ${name}`, error);
    }
  }

  /**
   * Jouer un effet sonore
   */
  play(name, options = {}) {
    if (!this.enabled || !this.sounds[name]) return;

    const sound = this.sounds[name];

    // Appliquer le volume si spécifié
    if (options.volume !== undefined) {
      sound.volume(options.volume * this.sfxVolume);
    } else {
      sound.volume(this.sfxVolume);
    }

    sound.play();
  }

  /**
   * Jouer un son avec variation de pitch (pour éviter la répétition)
   */
  playVariant(name, pitchVariation = 0.1) {
    if (!this.enabled || !this.sounds[name]) return;

    const sound = this.sounds[name];
    const pitch = 1 + (Math.random() * pitchVariation * 2 - pitchVariation);
    sound.rate(pitch);
    sound.volume(this.sfxVolume);
    sound.play();
  }

  /**
   * Jouer la musique de fond
   */
  playMusic(name) {
    if (!this.musicEnabled || !this.sounds[name]) return;

    // Arrêter la musique actuelle
    this.stopMusic();

    this.music = this.sounds[name];
    this.music.volume(this.musicVolume);
    this.music.loop(true);
    this.music.play();
  }

  /**
   * Arrêter la musique
   */
  stopMusic() {
    if (this.music) {
      this.music.stop();
      this.music = null;
    }
  }

  /**
   * Fade musique
   */
  fadeMusicTo(volume, duration = 1000) {
    if (this.music) {
      this.music.fade(this.music.volume(), volume * this.musicVolume, duration);
    }
  }

  /**
   * Définir le volume des effets sonores (0-1)
   */
  setSFXVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));

    // Mettre à jour tous les sons sauf la musique
    Object.entries(this.sounds).forEach(([name, sound]) => {
      if (this.music !== sound) {
        sound.volume(this.sfxVolume);
      }
    });
  }

  /**
   * Définir le volume de la musique (0-1)
   */
  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.music) {
      this.music.volume(this.musicVolume);
    }
  }

  /**
   * Activer/Désactiver tous les sons
   */
  toggleEnabled() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stopAll();
    }
    return this.enabled;
  }

  /**
   * Activer/Désactiver la musique
   */
  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  /**
   * Arrêter tous les sons
   */
  stopAll() {
    Object.values(this.sounds).forEach(sound => sound.stop());
    this.stopMusic();
  }

  /**
   * Sons spécifiques au gameplay
   */

  // Placement et gestion des tours
  placeTower(gemType) {
    this.playVariant('place', 0.05);
  }

  sellTower() {
    this.play('sell');
  }

  fuseTowers() {
    this.play('fuse');
  }

  // Combat
  shootProjectile(gemType) {
    // Variation légère selon le type
    this.playVariant('shoot', 0.15);
  }

  hitEnemy(effectType) {
    if (effectType) {
      this.play(`hit_${effectType.toLowerCase()}`, { volume: 0.4 });
    } else {
      this.playVariant('hit', 0.1);
    }
  }

  enemyDeath() {
    this.playVariant('death', 0.15);
  }

  // UI
  buttonClick() {
    this.play('click', { volume: 0.3 });
  }

  buttonHover() {
    this.play('hover', { volume: 0.2 });
  }

  error() {
    this.play('error');
  }

  success() {
    this.play('success');
  }

  // Vagues
  waveStart() {
    this.play('wave_start');
  }

  waveComplete() {
    this.play('wave_complete');
  }

  gameOver() {
    this.stopMusic();
    this.play('game_over');
  }
}

// Instance singleton
export const soundManager = new SoundManager();
