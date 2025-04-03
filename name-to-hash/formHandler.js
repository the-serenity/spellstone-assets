document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('#card-form');
  const input = document.querySelector('#card-input');
  const resultDiv = document.querySelector('#result');
  const missingDiv = document.querySelector('#missing-cards');
  const copyResultBtn = document.querySelector('#copy-result');
  const copyMissingBtn = document.querySelector('#copy-missing');
  const clearButton = document.querySelector('#clear-button');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const inputValue = input.value.trim();
    let result = '';
    let missingCards = [];

    if (!inputValue) {
      resultDiv.textContent = 'Please enter data.';
      return;
    }

    const parts = inputValue.split(':');

    let commanderInput = null;
    let cardString = inputValue;

    // Если есть командир, разбиваем на командир и карты
    if (parts.length === 2) {
      commanderInput = parts[0].trim().toLowerCase();
      cardString = parts[1].trim();
    }

    // Обрабатываем командир, если он есть
    if (commanderInput) {
      const foundCommander = Object.keys(CardsDB.commanders).find(
        (key) => key.toLowerCase() === commanderInput
      );

      if (foundCommander) {
        result += CardsDB.commanders[foundCommander];
      }
    }

    // Обрабатываем карты
    const cards = cardString.split(',');
    cards.forEach((card) => {
      let cardKey = card.trim();
      let count = 1;

      const match = cardKey.match(/(.*) x(\d+)$/);
      if (match) {
        cardKey = match[1].trim();
        count = parseInt(match[2], 10);
      }

      const cardKeyLower = cardKey.toLowerCase();
      const foundCardKey = Object.keys(CardsDB.cards).find(
        (key) => key.toLowerCase() === cardKeyLower
      );

      if (foundCardKey) {
        result += CardsDB.cards[foundCardKey].repeat(count);
      } else {
        missingCards.push(cardKey);
      }
    });

    resultDiv.textContent = result.trim() || 'No data available.';
    missingDiv.textContent = missingCards.length
      ? missingCards.join(', ')
      : 'All cards found.';
  });

  copyResultBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(resultDiv.textContent).then(() => {
      const resultDiv = copyResultBtn.nextElementSibling;
      resultDiv.classList.add('copied');
      const originalHTML = copyResultBtn.innerHTML;
      copyResultBtn.innerHTML = '✅';

      setTimeout(() => {
        copyResultBtn.innerHTML = originalHTML;
        resultDiv.classList.remove('copied');
      }, 1000);
    });

    console.log('Copied:', resultDiv.textContent);
  });

  copyMissingBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(missingDiv.textContent);
    console.log('Copied missing cards:', missingDiv.textContent);
  });

  clearButton.addEventListener('click', () => {
    input.value = '';
    resultDiv.textContent = '';
    missingDiv.textContent = '';
  });
});
