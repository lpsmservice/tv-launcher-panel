let password = localStorage.getItem('launcherAdminPassword') || '';
let captchaTotal = 0;

const loginScreen = document.querySelector('#loginScreen');
const appScreen = document.querySelector('#appScreen');
const successBox = document.querySelector('#successBox');
const loginForm = document.querySelector('#loginForm');
const passwordInput = document.querySelector('#password');
const userNameInput = document.querySelector('#userName');
const captchaCard = document.querySelector('#captchaCard');
const captchaAnswer = document.querySelector('#captchaAnswer');
const wallpaperPreview = document.querySelector('#wallpaperPreview');
const devicesEl = document.querySelector('#devices');
const bannersEl = document.querySelector('#banners');
const clientsCount = document.querySelector('#clientsCount');
const pendingCount = document.querySelector('#pendingCount');
const welcomeName = document.querySelector('#welcomeName');
const bannerCountPill = document.querySelector('#bannerCountPill');
const launcherDarkToggle = document.querySelector('#launcherDarkToggle');

passwordInput.value = password;
userNameInput.value = localStorage.getItem('launcherUserName') || 'lpzovendas vacaria rs';
appScreen.classList.toggle('launcher-dark', localStorage.getItem('launcherDark') !== 'false');

function generateCaptcha() {
  const a = Math.floor(Math.random() * 8) + 1;
  const b = Math.floor(Math.random() * 8) + 1;
  captchaTotal = a + b;
  captchaCard.textContent = `${a} + ${b}`;
  captchaAnswer.value = '';
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      ...(options.headers || {}),
      'x-admin-password': password
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Erro no painel');
  return data;
}

function openApp() {
  loginScreen.classList.add('hidden');
  appScreen.classList.remove('hidden');
  successBox.classList.remove('hidden');
  setTimeout(() => successBox.classList.add('hidden'), 1800);
}

async function refresh() {
  const data = await api('/api/admin/overview');
  openApp();
  welcomeName.textContent = userNameInput.value || 'usuario';
  wallpaperPreview.src = data.wallpaper || '';
  wallpaperPreview.style.display = data.wallpaper ? 'block' : 'none';

  const activeDevices = data.devices.filter((item) => item.active).length;
  const pendingDevices = data.devices.filter((item) => !item.active).length;
  clientsCount.innerHTML = `${data.devices.length || 0}<small>Clientes</small>`;
  pendingCount.innerHTML = `${pendingDevices}<small>Expirando</small>`;
  if (bannerCountPill) bannerCountPill.textContent = data.banners.length || 0;

  devicesEl.innerHTML = data.devices.map((item) => `
    <div class="device-row">
      <strong>${item.code}</strong>
      <span>${item.label || 'Sem nome'}</span>
      <span class="badge ${item.active ? 'active' : ''}">${item.active ? 'Ativo' : 'Aguardando'}</span>
      <button data-deactivate="${item.id}" class="danger">Desativar</button>
    </div>
  `).join('') || '<p class="muted">Nenhum aparelho abriu o launcher ainda.</p>';

  bannersEl.innerHTML = data.banners.map((item) => `
    <article class="banner-row">
      <img src="${item.imageUrl}" alt="">
      <div>
        <strong>${item.title}</strong>
        <div class="muted">Ordem ${item.position}</div>
      </div>
      <button class="danger" data-banner="${item.id}">Apagar</button>
    </article>
  `).join('') || '<p class="muted">Nenhum banner enviado.</p>';
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (Number(captchaAnswer.value) !== captchaTotal) {
    alert('Resultado da soma incorreto');
    generateCaptcha();
    return;
  }
  password = passwordInput.value;
  localStorage.setItem('launcherAdminPassword', password);
  localStorage.setItem('launcherUserName', userNameInput.value);
  await refresh().catch((error) => {
    alert(error.message);
    generateCaptcha();
  });
});

document.querySelector('#togglePassword').addEventListener('click', () => {
  passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password';
});

document.querySelector('#newSum').addEventListener('click', generateCaptcha);

document.querySelectorAll('.option-row').forEach((button) => {
  button.addEventListener('click', () => {
    if (button.dataset.action === 'launcher') {
      showLauncherPage();
      return;
    }
    const panel = document.querySelector(`#${button.dataset.panel}`);
    if (panel) {
      showDashboard();
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

function showLauncherPage() {
  appScreen.classList.add('show-launcher-page');
  document.querySelector('#launcherPage').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showDashboard() {
  appScreen.classList.remove('show-launcher-page');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.querySelectorAll('[data-action="home"]').forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    showDashboard();
  });
});

document.querySelectorAll('[data-action="launcher"]').forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    showLauncherPage();
  });
});

document.querySelectorAll('[data-action="top"]').forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
});

document.querySelectorAll('.launcher-list button').forEach((button) => {
  button.addEventListener('click', () => {
    const panel = document.querySelector(`#${button.dataset.subpanel}`);
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

if (launcherDarkToggle) {
  launcherDarkToggle.checked = localStorage.getItem('launcherDark') !== 'false';
  launcherDarkToggle.addEventListener('change', () => {
    appScreen.classList.toggle('launcher-dark', launcherDarkToggle.checked);
    localStorage.setItem('launcherDark', launcherDarkToggle.checked ? 'true' : 'false');
  });
}

document.querySelector('#wallpaperForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  await api('/api/admin/wallpaper', { method: 'POST', body: new FormData(event.target) });
  event.target.reset();
  await refresh();
});

document.querySelector('#bannerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  await api('/api/admin/banners', { method: 'POST', body: new FormData(event.target) });
  event.target.reset();
  await refresh();
});

document.querySelector('#activateForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = Object.fromEntries(new FormData(event.target).entries());
  await api('/api/admin/devices/activate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
  event.target.reset();
  await refresh();
});

document.addEventListener('click', async (event) => {
  const bannerId = event.target.dataset.banner;
  const deviceId = event.target.dataset.deactivate;
  if (bannerId) {
    await api(`/api/admin/banners/${bannerId}`, { method: 'DELETE' });
    await refresh();
  }
  if (deviceId) {
    await api(`/api/admin/devices/${deviceId}/deactivate`, { method: 'POST' });
    await refresh();
  }
});

generateCaptcha();
if (password) refresh().catch(() => appScreen.classList.add('hidden'));
