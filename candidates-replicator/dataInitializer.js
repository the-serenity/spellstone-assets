let CARDS = {};
let RUNES = {};
let FUSIONS = {};
let SKILL_DATA = {};

async function loadJSON(file) {
  try {
    const response = await fetch(file);
    if (!response.ok) throw new Error(`Load error ${file}`);
    return await response.json();
  } catch (error) {
    console.error(`Load error ${file}:`, error);
    return {};
  }
}

async function initializeData() {
  CARDS = await loadJSON('card_data.json');
  RUNES = await loadJSON('rune_data.json');
  FUSIONS = await loadJSON('fusion_data.json');
  SKILL_DATA = await loadJSON('skill_data.json');
  window.RUNES = RUNES;
  window.CARDS = CARDS;
  window.FUSIONS = FUSIONS;
  window.SKILL_DATA = SKILL_DATA;
}

document.addEventListener('DOMContentLoaded', () => {
  initializeData().then(() => {
    const script = document.createElement('script');
    script.src = 'app.js';
    document.body.appendChild(script);
    console.log('Card data loaded');
  });
});
