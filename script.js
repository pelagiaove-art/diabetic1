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

// ===== ПАМЯТЬ =====
function getLog() {
  return JSON.parse(localStorage.getItem('diaryLog') || '[]');
}
function saveLog(log) {
  localStorage.setItem('diaryLog', JSON.stringify(log));
}

// ===== ЕДА: РАСЧЁТ ХЕ ПО ВАШЕЙ ФОРМУЛЕ =====
// ХЕ = (углеводы на 100 г × вес / 100) / 10
let meal = [];
let currentFood = null;

function giClass(gi) {
  if (gi <= 55) return 'low';
  if (gi <= 70) return 'mid';
  return 'high';
}

function renderFoodList(q) {
  q = (q || '').toLowerCase();
  const html = FOODS
    .map(function (f, i) { return { f: f, i: i }; })
    .filter(function (o) { return o.f.name.toLowerCase().indexOf(q) !== -1; })
    .map(function (o) {
      return '<button class="food-item" data-idx="' + o.i + '">' +
        '<span>' + o.f.name + '</span>' +
        '<span class="gi gi-' + giClass(o.f.gi) + '">ГИ ' + o.f.gi + '</span>' +
        '</button>';
    }).join('');
  document.getElementById('foodList').innerHTML = html || '<p class="empty">Не найдено 😕</p>';
}

document.getElementById('foodSearch').addEventListener('input', function () {
  renderFoodList(this.value);
});

document.getElementById('foodList').addEventListener('click', function (e) {
  const btn = e.target.closest('.food-item');
  if (!btn) return;
  currentFood = FOODS[parseInt(btn.getAttribute('data-idx'), 10)];
  document.getElementById('calcName').textContent = currentFood.name;
  document.getElementById('foodWeight').value = '';
  document.getElementById('foodPieces').value = '';
  document.getElementById('pieceRow').style.display = currentFood.piece ? 'block' : 'none';
  document.getElementById('foodCalc').style.display = 'block';
  updateXeCalc();
});

function currentWeight() {
  let w = parseFloat(document.getElementById('foodWeight').value) || 0;
  const p = parseFloat(document.getElementById('foodPieces').value) || 0;
  if (p > 0 && currentFood && currentFood.piece) {
    w = p * currentFood.piece; // штуки × вес штуки
  }
  return w;
}

function calcXE(food, weight) {
  const carbsPer100 = 1000 / food.perXE;
  return (carbsPer100 * weight / 100) / 10; // ← ваша формула из больницы
}

function updateXeCalc() {
  if (!currentFood) return;
  const w = currentWeight();
  const xe = calcXE(currentFood, w);
  document.getElementById('xeResult').textContent = xe.toFixed(1);
  document.getElementById('carbsResult').textContent = Math.round(xe * 10);
}

document.getElementById('foodWeight').addEventListener('input', updateXeCalc);
document.getElementById('foodPieces').addEventListener('input', updateXeCalc);

document.getElementById('addMealBtn').addEventListener('click', function () {
  const w = currentWeight();
  if (!currentFood || w <= 0) {
    alert('Укажите вес или штуки!');
    return;
  }
  meal.push({ name: currentFood.name, weight: w, xe: calcXE(currentFood, w) });
  document.getElementById('foodCalc').style.display = 'none';
  renderMeal();
});

function renderMeal() {
  const box = document.getElementById('mealList');
  if (meal.length === 0) {
    box.innerHTML = '<p class="empty">Выберите продукты выше</p>';
  } else {
    box.innerHTML = meal.map(function (m, i) {
      return '<div class="meal-item"><span>' + m.name + ' · ' + m.weight + ' г</span>' +
        '<span><b>' + m.xe.toFixed(1) + ' ХЕ</b>' +
        '<button class="del-btn" data-i="' + i + '">✖</button></span></div>';
    }).join('');
  }
  const total = meal.reduce(function (s, m) { return s + m.xe; }, 0);
  document.getElementById('mealXe').textContent = total.toFixed(1);
}

document.getElementById('mealList').addEventListener('click', function (e) {
  const btn = e.target.closest('.del-btn');
  if (!btn) return;
  meal.splice(parseInt(btn.getAttribute('data-i'), 10), 1);
  renderMeal();
});

document.getElementById('toMeasureBtn').addEventListener('click', function () {
  const total = meal.reduce(function (s, m) { return s + m.xe; }, 0);
  if (total > 0) {
    document.getElementById('xe').value = (Math.round(total * 2) / 2).toFixed(1);
  }
  document.querySelector('.nav-btn[data-screen="add"]').click();
});

// ===== СОХРАНЕНИЕ ЗАМЕРА =====
document.getElementById('saveBtn').addEventListener('click', function () {
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
    ts: Date.now(),
    time: new Date().toLocaleString('ru-RU'),
    sugar: sugar,
    xe: parseFloat(document.getElementById('xe').value) || 0,
    bolus: parseFloat(document.getElementById('bolus').value) || 0,
    basal: parseFloat(document.getElementById('basal').value) || 0,
    correction: parseFloat(document.getElementById('correction').value) || 0,
    tags: tags,
    note: document.getElementById('note').value,
    foods: meal.map(function (m) { return m.name + ' ' + m.weight + 'г'; }).join(', ')
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
  meal = [];
  renderMeal();

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
    const tagsText = r.tags && r.tags.length ? ' • 🏷️ ' + r.tags.join(', ') : '';
    const foodsText = r.foods ? '<div class="meta">🍽️ ' + r.foods + '</div>' : '';
    const noteText = r.note ? '<div class="meta">📝 ' + r.note + '</div>' : '';

    return (
      '<div class="history-item">' +
        '<div class="sugar-big ' + color + '">' + r.sugar + ' ммоль/л</div>' +
        '<div class="meta">' + r.time + ' • 🍞 ' + r.xe + ' ХЕ' + insText + tagsText + '</div>' +
        foodsText + noteText +
      '</div>'
    );
  }).join('');
}

// ===== ДАШБОРД =====
function renderDashboard() {
  const log = getLog();

  if (log.length > 0) {
    const last = log[0];
    let colorClass = 'normal';
    if (last.sugar < 3.9) colorClass = 'low';
    if (last.sugar > 10) colorClass = 'high';
    const el = document.getElementById('lastSugar');
    el.textContent = last.sugar + ' ммоль/л';
    el.className = 'big-sugar ' + colorClass;
    document.getElementById('lastTime').textContent = last.time;
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayLog = log.filter(function (r) {
    return (r.ts || 0) >= todayStart.getTime();
  });

  document.getElementById('statCount').textContent = todayLog.length;

  if (todayLog.length > 0) {
    const avg = todayLog.reduce(function (s, r) { return s + r.sugar; }, 0) / todayLog.length;
    document.getElementById('statAvg').textContent = avg.toFixed(1);
  } else {
    document.getElementById('statAvg').textContent = '—';
  }

  const totalXe = todayLog.reduce(function (s, r) { return s + (r.xe || 0); }, 0);
  document.getElementById('statXe').textContent = totalXe.toFixed(1);

  const totalIns = todayLog.reduce(function (s, r) {
    return s + (r.bolus || 0) + (r.basal || 0) + (r.correction || 0);
  }, 0);
  document.getElementById('statIns').textContent = totalIns.toFixed(1);
}

// ===== СТАРТ =====
renderFoodList('');
renderMeal();
renderHistory();
renderDashboard();
