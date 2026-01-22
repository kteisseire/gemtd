import { useState, useEffect, useRef } from 'react';

export const useImages = () => {
  const [logoImage, setLogoImage] = useState(null);
  const [grassImage, setGrassImage] = useState(null);
  const [portailImage, setPortailImage] = useState(null);
  const [arriveeImage, setArriveeImage] = useState(null);
  const [checkpointImages, setCheckpointImages] = useState({});
  const [gemImages, setGemImages] = useState({});
  const grassCanvasRef = useRef(null);

  // Charger l'image du logo
  useEffect(() => {
    const img = new Image();
    img.src = '/images/logo.png';
    img.onload = () => setLogoImage(img);
    img.onerror = () => console.error('Erreur lors du chargement du logo');
  }, []);

  // Charger l'image d'herbe
  useEffect(() => {
    const img = new Image();
    img.src = '/images/grass.png';
    img.onload = () => {
      grassCanvasRef.current = null;
      setGrassImage(img);
    };
    img.onerror = () => console.error('Erreur lors du chargement de l\'image d\'herbe');
  }, []);

  // Charger l'image du portail
  useEffect(() => {
    const img = new Image();
    img.src = '/images/portail.png';
    img.onload = () => setPortailImage(img);
    img.onerror = () => console.error('Erreur lors du chargement de l\'image du portail');
  }, []);

  // Charger l'image de l'arrivee
  useEffect(() => {
    const img = new Image();
    img.src = '/images/arrivee.png';
    img.onload = () => setArriveeImage(img);
    img.onerror = () => console.error('Erreur lors du chargement de l\'image de l\'arrivee');
  }, []);

  // Charger les images des checkpoints
  useEffect(() => {
    const loadCheckpointImages = async () => {
      const images = {};

      for (let i = 1; i <= 5; i++) {
        const img = new Image();
        img.src = `/images/checkpoint${i}.png`;

        await new Promise((resolve) => {
          img.onload = () => {
            images[`CP${i}`] = img;
            resolve();
          };
          img.onerror = () => {
            console.error(`Erreur lors du chargement de checkpoint${i}.png`);
            resolve();
          };
        });
      }

      setCheckpointImages(images);
    };

    loadCheckpointImages();
  }, []);

  // Charger les images des gemmes
  // Cette fonction sera appelée depuis TowerDefense.jsx avec les gemTypes pour charger les images
  const loadGemImages = (gemTypes) => {
    const loadedImages = {};
    const loadPromises = [];

    Object.entries(gemTypes).forEach(([key, gem]) => {
      const promise = new Promise((resolve) => {
        const img = new Image();
        img.src = gem.image || '/images/gemviolette.png';
        img.onload = () => {
          loadedImages[key] = img;
          resolve();
        };
        img.onerror = () => {
          console.error(`Erreur lors du chargement de l'image de gemme ${key}`);
          // Fallback sur l'image par défaut
          const fallbackImg = new Image();
          fallbackImg.src = '/images/gemviolette.png';
          fallbackImg.onload = () => {
            loadedImages[key] = fallbackImg;
            resolve();
          };
          fallbackImg.onerror = () => resolve();
        };
      });
      loadPromises.push(promise);
    });

    Promise.all(loadPromises).then(() => {
      setGemImages(loadedImages);
    });
  };

  useEffect(() => {
    // Charger l'image par défaut au démarrage
    const img = new Image();
    img.src = '/images/gemviolette.png';
    img.onload = () => {
      const gems = {
        BASE: img,
        RED: img,
        BLUE: img,
        GREEN: img,
        YELLOW: img,
        PURPLE: img,
        ORANGE: img,
        CYAN: img,
        PINK: img,
        GRAY: img,
        BLACK: img,
      };
      setGemImages(gems);
    };
    img.onerror = () => console.error('Erreur lors du chargement de l\'image de gemme');
  }, []);

  return {
    logoImage,
    grassImage,
    portailImage,
    arriveeImage,
    checkpointImages,
    gemImages,
    grassCanvasRef,
    loadGemImages
  };
};
