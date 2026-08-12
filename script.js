// ===== ПЕРЕКЛЮЧЕНИЕ ЭКРАНОВ =====
document.querySelectorAll('.nav-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    const screenId = this.getAttribute('data-screen');

    document.querySelectorAll('.screen').forEach(function (s) {
      s.classList.remove('active');
    });

    document.getElementById('screen-' + screenId).classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(function (b) {
      b.classList.remove('active');
    });
    this.classList.add('active');
  });
});

// ===== ПАМЯТЬ (localStorage) =====
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
  log.unshift(record);
  saveLog(log);

  ['sugar', 'xe', 'bolus', 'basal', 'correction', 'note'].forEach(function (id) {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('.tag input').forEach(function (box) {
    box.checked = false;
  });

  document.querySelector('.nav-btn[data-screen="home"]').click();
  renderHistory();
  renderDashboard();
});

// ===== ИСТОРИЯ =====
function renderHistory() {
  const log = getLog();
  const box = document.getElementById('history');

  if (log.length === 0) {
    box.innerHTML = '<p class="empty">Здесь появятся ваши записи 🌱</p>';
    return;
  }

  box.innerHTML = log.slice(0, 5).map(function (r) {
    let color = 'normal';
    if (r.sugar < 3.9) color = 'low';
    if (r.sugar > 10) color = 'high';

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

// ===== ДАШБОРД (Главная) =====
function renderDashboard() {
  const log = getLog();

  if (log.length > 0) {
    const last = log[0];
    const sugarEl = document.getElementById('lastSugar');
    sugarEl.textContent = last.sugar + ' ммоль/л';
    document.getElementById('lastTime').textContent = last.time;

    let colorClass = 'normal';
    if (last.sugar < 3.9) colorClass = 'low';
    if (last.sugar > 10) colorClass = 'high';
    sugarEl.className = 'big-sugar ' + colorClass;
  }

  const today = new Date().toDateString();
  const todayLog = log.filter(function (r) {
    return new Date(r.time).toDateString() === today;
  });

  document.getElementById('statCount').textContent = todayLog.length;

  if (todayLog.length > 0) {
    const avg = todayLog.reduce(function (sum, r) { return sum + r.sugar; }, 0) / todayLog.length;
    document.getElementById('statAvg').textContent = avg.toFixed(1);
  } else {
    document.getElementById('statAvg').textContent = '—';
  }

  const totalXe = todayLog.reduce(function (sum, r) { return sum + r.xe; }, 0);
  document.getElementById('statXe').textContent = totalXe.toFixed(1);

  const totalIns = todayLog.reduce(function (sum, r) {
    return sum + (r.bolus || 0) + (r.basal || 0) + (r.correction || 0);
  }, 0);
  document.getElementById('statIns').textContent = totalIns.toFixed(1);
}

// Запуск при загрузке
renderHistory();
renderDashboard();
