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
const menuButton = document.querySelector('#menuButton');
const sideDrawer = document.querySelector('#sideDrawer');
const closeDrawer = document.querySelector('#closeDrawer');
const drawerName = document.querySelector('#drawerName');
const drawerDarkToggle = document.querySelector('#drawerDarkToggle');
const logoutButton = document.querySelector('#logoutButton');
const drawerLogoutBottom = document.querySelector('#drawerLogoutBottom');
const displayModal = document.querySelector('#displayModal');
const searchModal = document.querySelector('#searchModal');
const deviceDisplayModal = document.querySelector('#deviceDisplayModal');
const deviceSearchModal = document.querySelector('#deviceSearchModal');
const layoutSearchInput = document.querySelector('#layoutSearchInput');
const deviceClientSearchInput = document.querySelector('#deviceClientSearchInput');
const deviceCodeSearchInput = document.querySelector('#deviceCodeSearchInput');
const deviceLayoutSearchInput = document.querySelector('#deviceLayoutSearchInput');

passwordInput.value = password;
userNameInput.value = localStorage.getItem('launcherUserName') || 'lpzovendas vacaria rs';
setLauncherDark(localStorage.getItem('launcherDark') !== 'false');

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
  drawerName.textContent = userNameInput.value || 'lpzovendas vacaria rs';
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

  if (!devicesEl.dataset.static) {
    devicesEl.innerHTML = data.devices.map((item) => `
      <div class="device-row">
        <strong>${item.code}</strong>
        <span>${item.label || 'Sem nome'}</span>
        <span class="badge ${item.active ? 'active' : ''}">${item.active ? 'Ativo' : 'Aguardando'}</span>
        <button data-deactivate="${item.id}" class="danger">Desativar</button>
      </div>
    `).join('') || '<p class="muted">Nenhum aparelho abriu o launcher ainda.</p>';
  }

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
    if (button.dataset.action === 'devices') {
      showDevicesPage();
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
  appScreen.classList.remove('show-devices-page');
  appScreen.classList.add('show-launcher-page');
  document.querySelector('#launcherPage').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showDevicesPage() {
  appScreen.classList.remove('show-launcher-page');
  appScreen.classList.add('show-devices-page');
  document.querySelector('#devicesPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showDashboard() {
  appScreen.classList.remove('show-launcher-page');
  appScreen.classList.remove('show-devices-page');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openDrawer() {
  if (!sideDrawer) return;
  drawerName.textContent = userNameInput.value || 'lpzovendas vacaria rs';
  sideDrawer.classList.remove('hidden');
}

function closeSideDrawer() {
  if (sideDrawer) sideDrawer.classList.add('hidden');
}

function setLauncherDark(enabled) {
  appScreen.classList.toggle('launcher-dark', enabled);
  localStorage.setItem('launcherDark', enabled ? 'true' : 'false');
  if (launcherDarkToggle) launcherDarkToggle.checked = enabled;
  if (drawerDarkToggle) drawerDarkToggle.checked = enabled;
}

function logout() {
  localStorage.removeItem('launcherAdminPassword');
  password = '';
  passwordInput.value = '';
  appScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  closeSideDrawer();
  generateCaptcha();
}

menuButton?.addEventListener('click', openDrawer);
closeDrawer?.addEventListener('click', closeSideDrawer);
sideDrawer?.addEventListener('click', (event) => {
  if (event.target === sideDrawer) closeSideDrawer();
});

document.querySelectorAll('.drawer-list button').forEach((button) => {
  button.addEventListener('click', () => {
    closeSideDrawer();
    if (button.dataset.action === 'launcher') {
      showLauncherPage();
      return;
    }
    if (button.dataset.action === 'devices') {
      showDevicesPage();
      return;
    }
    const panel = document.querySelector(`#${button.dataset.panel}`);
    if (panel) {
      showDashboard();
      setTimeout(() => panel.scrollIntoView({ behavior: 'smooth', block: 'start' }), 120);
    }
  });
});

drawerDarkToggle?.addEventListener('change', () => {
  setLauncherDark(drawerDarkToggle.checked);
});

logoutButton?.addEventListener('click', logout);
drawerLogoutBottom?.addEventListener('click', logout);

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

document.querySelectorAll('[data-action="devices"]').forEach((item) => {
  item.addEventListener('click', (event) => {
    event.preventDefault();
    showDevicesPage();
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
    document.querySelectorAll('.launcher-subpanel').forEach((item) => item.classList.add('hidden'));
    if (panel) {
      panel.classList.remove('hidden');
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

if (launcherDarkToggle) {
  launcherDarkToggle.addEventListener('change', () => {
    setLauncherDark(launcherDarkToggle.checked);
  });
}

function openModal(modal) {
  if (modal) modal.classList.remove('hidden');
}

function closeModals() {
  document.querySelectorAll('.modal-layer').forEach((modal) => modal.classList.add('hidden'));
}

document.querySelector('#showDisplayModal')?.addEventListener('click', () => openModal(displayModal));
document.querySelector('#showSearchModal')?.addEventListener('click', () => {
  openModal(searchModal);
  setTimeout(() => layoutSearchInput?.focus(), 50);
});
document.querySelector('#showDeviceDisplayModal')?.addEventListener('click', () => openModal(deviceDisplayModal));
document.querySelector('#showDeviceSearchModal')?.addEventListener('click', () => {
  openModal(deviceSearchModal);
  setTimeout(() => deviceClientSearchInput?.focus(), 50);
});

document.querySelectorAll('[data-close-modal]').forEach((button) => {
  button.addEventListener('click', closeModals);
});

document.querySelectorAll('.modal-layer').forEach((modal) => {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModals();
  });
});

document.querySelectorAll('[data-sort]').forEach((button) => {
  button.addEventListener('click', () => {
    const list = document.querySelector('.layout-list');
    const items = Array.from(list.querySelectorAll('button'));
    if (button.dataset.sort === 'az') {
      items.sort((a, b) => a.innerText.localeCompare(b.innerText));
    }
    if (button.dataset.sort === 'new') {
      items.reverse();
    }
    if (button.dataset.sort === 'old') {
      items.sort((a, b) => a.innerText.localeCompare(b.innerText));
    }
    items.forEach((item) => list.appendChild(item));
    closeModals();
  });
});

document.querySelector('.search-modal')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const term = (layoutSearchInput.value || '').trim().toLowerCase();
  document.querySelectorAll('.layout-list button').forEach((item) => {
    item.style.display = !term || item.innerText.toLowerCase().includes(term) ? '' : 'none';
  });
  closeModals();
});

document.querySelectorAll('[data-client-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const detail = document.querySelector(`#${button.dataset.clientToggle}`);
    if (!detail) return;
    detail.classList.toggle('hidden');
    button.classList.toggle('expanded', !detail.classList.contains('hidden'));
    button.querySelector('em').textContent = detail.classList.contains('hidden') ? 'v' : '^';
  });
});

document.querySelectorAll('[data-device-sort]').forEach((button) => {
  button.addEventListener('click', () => {
    const list = document.querySelector('.client-list');
    const items = Array.from(list.querySelectorAll('.client-row'));
    if (button.dataset.deviceSort === 'az') {
      items.sort((a, b) => a.innerText.localeCompare(b.innerText));
    } else if (button.dataset.deviceSort === 'old') {
      items.reverse();
    } else if (button.dataset.deviceSort === 'valid-long') {
      items.sort((a, b) => b.innerText.localeCompare(a.innerText));
    } else {
      items.sort((a, b) => a.innerText.localeCompare(b.innerText));
    }
    items.forEach((item) => list.appendChild(item));
    closeModals();
  });
});

document.querySelector('.device-search-modal')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const nameTerm = (deviceClientSearchInput.value || '').trim().toLowerCase();
  const codeTerm = (deviceCodeSearchInput.value || '').trim().toLowerCase();
  const layoutTerm = (deviceLayoutSearchInput.value || '').trim().toLowerCase();
  document.querySelectorAll('.client-row').forEach((item) => {
    const detail = document.querySelector(`#${item.dataset.clientToggle}`);
    const text = `${item.innerText} ${detail?.innerText || ''}`.toLowerCase();
    const matchesName = !nameTerm || text.includes(nameTerm);
    const matchesCode = !codeTerm || text.includes(codeTerm);
    const matchesLayout = !layoutTerm || layoutTerm === 'qualquer layout' || text.includes(layoutTerm);
    item.style.display = matchesName && matchesCode && matchesLayout ? '' : 'none';
    if (detail && item.style.display === 'none') detail.classList.add('hidden');
  });
  closeModals();
});

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
