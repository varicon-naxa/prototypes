/* ═══════════════════════════════════════════════════════════════
   Varicon SiteDiary — Weather (Enhanced)
   ═══════════════════════════════════════════════════════════════ */

let selectedWxCard = null;

function selectWxCard(el) {
  // Deselect previous
  document.querySelectorAll('.wx-card-v2').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
  selectedWxCard = el;

  // Populate edit panel
  const time = el.querySelector('.wx-card-time').textContent;
  const temp = el.querySelector('.wx-card-temp').textContent.replace('°C', '');
  const condition = el.querySelector('.wx-card-condition').textContent;
  const details = el.querySelectorAll('.wx-detail-row span:last-child');
  const hum = details[0] ? details[0].textContent.replace('%', '') : '';
  const wind = details[1] ? details[1].textContent.replace(' km/h', '') : '';
  const rain = details[2] ? details[2].textContent.replace('%', '') : '';

  document.getElementById('wx-edit-time').textContent = time;
  document.getElementById('wx-edit-temp').value = temp.trim();
  document.getElementById('wx-edit-hum').value = hum.trim();
  document.getElementById('wx-edit-wind').value = wind.trim();
  document.getElementById('wx-edit-rain').value = rain.trim();

  // Set sky condition dropdown
  const skySelect = document.getElementById('wx-edit-sky');
  for (let i = 0; i < skySelect.options.length; i++) {
    if (skySelect.options[i].text === condition) {
      skySelect.selectedIndex = i;
      break;
    }
  }

  // Show edit panel
  document.getElementById('wx-edit-panel').style.display = '';
  document.getElementById('wx-edit-panel').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeWxEdit() {
  document.getElementById('wx-edit-panel').style.display = 'none';
  if (selectedWxCard) selectedWxCard.classList.remove('sel');
  selectedWxCard = null;
}

function applyWxEdit() {
  if (!selectedWxCard) return;

  const temp = document.getElementById('wx-edit-temp').value;
  const hum = document.getElementById('wx-edit-hum').value;
  const wind = document.getElementById('wx-edit-wind').value;
  const rain = document.getElementById('wx-edit-rain').value;
  const sky = document.getElementById('wx-edit-sky').value;

  // Update the card
  selectedWxCard.querySelector('.wx-card-temp').textContent = temp + '°C';
  selectedWxCard.querySelector('.wx-card-condition').textContent = sky;

  const details = selectedWxCard.querySelectorAll('.wx-detail-row span:last-child');
  if (details[0]) details[0].textContent = hum + '%';
  if (details[1]) details[1].textContent = wind + ' km/h';
  if (details[2]) details[2].textContent = rain + '%';

  // Update icon based on condition
  const iconMap = {
    'Clear': '☀️', 'Partly Cloudy': '⛅', 'Overcast': '☁️',
    'Light Rain': '🌦', 'Heavy Rain': '🌧', 'Storm': '⛈', 'Fog': '🌫'
  };
  const icon = selectedWxCard.querySelector('.wx-card-icon');
  if (iconMap[sky]) icon.textContent = iconMap[sky];

  showToast('Updated ' + document.getElementById('wx-edit-time').textContent);
  closeWxEdit();
}

function updateWxCard() {
  // Live preview when changing sky condition
}

function confirmWeather() {
  document.getElementById('ss-weather').textContent = 'Confirmed';
  document.getElementById('ss-weather').className = 'sstat done';
  document.getElementById('tv-wx').textContent = '22°C ⛅';
  if (typeof updStats === 'function') updStats();
  showToast('Weather confirmed for today');
}

function saveWeather() {
  confirmWeather();
}

function togWxDelay() {
  const fields = document.getElementById('wx-delay-fields');
  const chk = document.getElementById('wx-delay-chk');
  if (fields) fields.style.display = chk.checked ? '' : 'none';
}

// Legacy support
function selHour(el) {
  document.querySelectorAll('.wx-card').forEach(c => c.classList.remove('sel'));
  el.classList.add('sel');
}
