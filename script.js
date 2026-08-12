// ===== ПАМЯТЬ ПРИЛОЖЕНИЯ (localStorage) =====
function getLog() {
  return JSON.parse(localStorage.getItem('diaryLog') || '[]');
}

function saveLog(log) {
  localStorage.setItem('diaryLog', JSON.stringify(log));
}

// ===== СОХРАНЕНИЕ ЗАМЕРА =====
const saveBtn = document.getElementById('saveBtn');

saveBtn.addEventListener('click', function () {
  const sugar = parseFloat(document.getElementById('sugar').value);

  if (!sugar || sugar <= 0) {
    alert('Введите сахар!');
    return;
  }

  // Собираем отмеченные теги состояния
  const tags = [];
  document.querySelectorAll('.tag input:checked').forEach(function (box) {
    tags.push(box.value);
  });

  const record = {
    time: new Date().toLocaleString('ru-RU'),
    sugar: sugar,
    xe: parseFloat(document.getElementById('xe').value) || 0,
    bolus: parseFloat(document.getElementById('bolus').value) || 0,
    basal: parseFloat(document.getElementById('basal').value) || 0,
    correction: parseFloat(document.getElementById('correction').value) || 0,
    tags: tags,
    note: document.getElementById('note').value
  };

  const log = getLog();
  log.unshift(record); // новая запись — сверху
  saveLog(log);

  // Очищаем форму
  ['sugar', 'xe', 'bolus', 'basal', 'correction', 'note'].forEach(function (id) {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('.tag input').forEach(function (box) {
    box.checked = false;
  });

  renderHistory();
});

// ===== ИСТОРИЯ =====
function renderHistory() {
  const log = getLog();
  const box = document.getElementById('history');

  if (log.length === 0) {
    box.innerHTML = '<p class="empty">Пока пусто</p>';
    return;
  }

  box.innerHTML = log.map(function (r) {
    // Цвет сахара: гипо / норма / гипер
    let color = 'normal';
    if (r.sugar < 3.9) color = 'low';
    if (r.sugar > 10) color = 'high';

    // Инсулин: показываем только то, что вводили
    const ins = [];
    if (r.bolus) ins.push('болюс ' + r.bolus);
    if (r.basal) ins.push('база ' + r.basal);
    if (r.correction) ins.push('подколка ' + r.correction);
    const insText = ins.length ? ' • 💉 ' + ins.join(', ') : '';

    const tagsText = r.tags.length ? ' • 🏷️ ' + r.tags.join(', ') : '';
    const noteText = r.note ? '<div class="meta">📝 ' + r.note + '</div>' : '';

    return (
      '<div class="history-item">' +
        '<div class="sugar-big ' + color + '">' + r.sugar + ' ммоль/л</div>' +
        '<div class="meta">' + r.time + ' • 🍞 ' + r.xe + ' ХЕ' + insText + tagsText + '</div>' +
        noteText +
      '</div>'
    );
  }).join('');
}

// Показываем историю при запуске приложения
renderHistory();
