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
const appDisplayModal = document.querySelector('#appDisplayModal');
const appSearchModal = document.querySelector('#appSearchModal');
const appSearchInput = document.querySelector('#appSearchInput');
const appsSubpanel = document.querySelector('#appsSubpanel');
const addAppPage = document.querySelector('#addAppPage');
const apkUploadInput = document.querySelector('#apkUploadInput');
const apkDropButton = document.querySelector('#apkDropButton');
const apkDropIcon = document.querySelector('#apkDropIcon');
const apkDropText = document.querySelector('#apkDropText');
const apkFileName = document.querySelector('#apkFileName');
const uploadProgress = document.querySelector('#uploadProgress');
const uploadPercentText = document.querySelector('#uploadPercentText');
const uploadBar = document.querySelector('#uploadBar');
const uploadFileInfo = document.querySelector('#uploadFileInfo');
const processingChecklist = document.querySelector('#processingChecklist');
const appStepOne = document.querySelector('#appStepOne');
const appStepTwo = document.querySelector('#appStepTwo');
const appStepThree = document.querySelector('#appStepThree');
const flowAppName = document.querySelector('#flowAppName');
const flowAppVersion = document.querySelector('#flowAppVersion');
const confirmAppName = document.querySelector('#confirmAppName');
const iconChoice = document.querySelector('#iconChoice');
const manualIconBlock = document.querySelector('#manualIconBlock');
const manualIconInput = document.querySelector('#manualIconInput');
const manualIconButton = document.querySelector('#manualIconButton');
const manualIconName = document.querySelector('#manualIconName');
const emptyAppsMessage = document.querySelector('#emptyAppsMessage');
let appFlowStep = 1;
let selectedApkName = 'NewPipe_v0.28.8.apk';
let uploadedApkFile = null;
let uploadedApps = [];

const appCatalog = {};

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
  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    const message = data.error || data.message || raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    throw new Error(message || 'Erro no painel');
  }
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
  uploadedApps = data.apps || [];
  renderUploadedApps(uploadedApps);
  initializeAppDetails();
  const appLimitPill = document.querySelector('#appLimitPill');
  if (appLimitPill) appLimitPill.textContent = uploadedApps.length || 0;

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
document.querySelector('#showAppDisplayModal')?.addEventListener('click', () => openModal(appDisplayModal));
document.querySelector('#showAppSearchModal')?.addEventListener('click', () => {
  openModal(appSearchModal);
  setTimeout(() => appSearchInput?.focus(), 50);
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

function appRows() {
  return Array.from(document.querySelectorAll('#appsList > .app-row'));
}

function safeId(value) {
  return String(value || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'app';
}

function appMetaFromRow(row) {
  const key = row.dataset.appName || safeId(row.innerText);
  const catalog = appCatalog[key] || {};
  const title = row.querySelector('strong')?.textContent?.replace(/^-+\s*/, '').trim() || 'APP';
  return {
    name: title,
    packageName: row.dataset.package || catalog.packageName || `com.launcher.${safeId(title)}`,
    version: row.dataset.version || catalog.version || '1.0.0',
    apkUrl: row.dataset.apkUrl || '',
    active: row.dataset.active !== 'false'
  };
}

function createAppDetail(row) {
  const meta = appMetaFromRow(row);
  const id = row.dataset.appToggle || `app-detail-${safeId(row.dataset.appName || meta.name)}`;
  row.dataset.appToggle = id;
  const detail = document.createElement('div');
  detail.id = id;
  detail.className = 'app-detail hidden';
  detail.innerHTML = `
    <button type="button"><span class="status-icon blue">T</span><strong><small>Pacote</small>${meta.packageName}</strong><em>&gt;</em></button>
    ${meta.apkUrl ? `<a class="app-download-row" href="${meta.apkUrl}" target="_blank" rel="noopener"><span class="status-icon blue">APK</span><strong><small>Download do APK</small>Arquivo valido para baixar na TV Box</strong><em>&gt;</em></a>` : ''}
    <button type="button"><span class="status-icon gray">C</span><strong>Editar aplicativo</strong><em>&gt;</em></button>
    <button type="button"><span class="status-icon purple">E</span><strong>Alterar nome do app</strong><em>&gt;</em></button>
    <button type="button"><span class="status-icon red">L</span><strong>Excluir</strong><em>&gt;</em></button>
    <button type="button"><span class="status-icon orange">o</span><strong>${meta.active ? 'Desativar' : 'Ativar'}</strong><em>&gt;</em></button>
    <h3>DADOS DO APLICATIVO:</h3>
    <div class="app-status-bar">${meta.active ? 'ATIVO' : 'DESATIVADO'}</div>
    <div class="app-data-grid">
      <div><strong>Nome</strong><span>${meta.name}</span></div>
      <div><strong>Versao</strong><span>${meta.version}</span></div>
      <div class="wide"><strong>APK</strong><span>${meta.apkUrl || 'Sem arquivo APK anexado'}</span></div>
    </div>
  `;
  row.insertAdjacentElement('afterend', detail);
  return detail;
}

function ensureAppDetail(row) {
  const next = row.nextElementSibling;
  if (next?.classList.contains('app-detail')) return next;
  return createAppDetail(row);
}

function initializeAppDetails() {
  appRows().forEach((row) => ensureAppDetail(row));
}

function renderUploadedApps(apps) {
  const list = document.querySelector('#appsList');
  if (!list) return;
  list.querySelectorAll('[data-server-app-id]').forEach((row) => {
    const detail = row.nextElementSibling;
    if (detail?.classList.contains('app-detail')) detail.remove();
    row.remove();
  });
  const realApps = Array.isArray(apps) ? apps : [];
  emptyAppsMessage?.classList.toggle('hidden', realApps.length > 0);
  realApps.forEach((item) => {
    const key = `server-${item.id}`;
    const displayName = `- ${String(item.name || 'APP').toUpperCase()}`;
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'app-row';
    row.dataset.serverAppId = item.id;
    row.dataset.appName = key;
    row.innerHTML = `<span class="app-icon newpipe">APK</span><strong>${displayName}</strong><i>v</i>`;
    list.appendChild(row);
    row.dataset.package = item.packageName || `com.launcher.${safeId(item.name)}`;
    row.dataset.version = item.version || '1.0.0';
    row.dataset.apkUrl = item.apkUrl || '';
    row.dataset.active = item.active === false ? 'false' : 'true';
    ensureAppDetail(row);
  });
}

function inferAppNameFromFile(fileName) {
  const base = String(fileName || 'NewPipe_v0.28.8.apk').replace(/\.apk$/i, '');
  if (/newpipe/i.test(base)) return 'NEWPIPE';
  return base.replace(/[_-]+/g, ' ').trim().toUpperCase() || 'APP';
}

function packageFromAppName(name) {
  if (/newpipe/i.test(name)) return 'org.schabi.newpipe';
  return `com.launcher.${safeId(name).replace(/-/g, '.')}`;
}

function versionFromFile(fileName) {
  const match = String(fileName || '').match(/v?(\d+(?:\.\d+){1,3})/i);
  return match ? match[1] : '1.0.0';
}

function setAppFlowStep(step) {
  appFlowStep = step;
  [appStepOne, appStepTwo, appStepThree].forEach((section, index) => {
    section?.classList.toggle('hidden', index + 1 !== step);
  });
  document.querySelectorAll('[data-step-dot]').forEach((dot) => {
    dot.classList.toggle('active', Number(dot.dataset.stepDot) === step);
    dot.classList.toggle('done', Number(dot.dataset.stepDot) < step);
  });
  if (confirmAppName && flowAppName) confirmAppName.textContent = flowAppName.value || 'NEWPIPE';
}

function showAppsPage() {
  document.querySelectorAll('.launcher-subpanel').forEach((item) => item.classList.add('hidden'));
  appsSubpanel?.classList.remove('hidden');
  appsSubpanel?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showAddAppFlow() {
  document.querySelectorAll('.launcher-subpanel').forEach((item) => item.classList.add('hidden'));
  addAppPage?.classList.remove('hidden');
  resetAppUploadVisual();
  setAppFlowStep(1);
  addAppPage?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetAppUploadVisual() {
  selectedApkName = 'NewPipe_v0.28.8.apk';
  uploadedApkFile = null;
  if (apkUploadInput) apkUploadInput.value = '';
  if (apkDropIcon) apkDropIcon.textContent = 'APK';
  if (apkDropText) apkDropText.textContent = 'Clique para escolher o apk';
  if (apkFileName) apkFileName.textContent = '';
  uploadProgress?.classList.add('hidden');
  processingChecklist?.classList.add('hidden');
  if (uploadBar) {
    uploadBar.style.width = '58%';
    uploadBar.textContent = '58%';
  }
  if (uploadPercentText) uploadPercentText.textContent = 'Enviando: 58% (2/4 partes)';
  if (uploadFileInfo) uploadFileInfo.textContent = `Arquivo: ${selectedApkName}`;
}

function showUploadProcessing() {
  if (apkDropIcon) apkDropIcon.textContent = 'OK';
  if (apkDropText) apkDropText.textContent = selectedApkName;
  if (apkFileName) apkFileName.textContent = selectedApkName;
  if (uploadFileInfo) uploadFileInfo.textContent = `Arquivo: ${selectedApkName}`;
  uploadProgress?.classList.remove('hidden');
  setTimeout(() => {
    if (uploadBar) {
      uploadBar.style.width = '100%';
      uploadBar.textContent = '100%';
    }
    if (uploadPercentText) uploadPercentText.textContent = 'Enviando: 100% (4/4 partes)';
    processingChecklist?.classList.remove('hidden');
  }, 350);
  setTimeout(() => setAppFlowStep(2), 1050);
}

async function saveUploadedApp() {
  if (!uploadedApkFile) {
    alert('Escolha um APK real primeiro.');
    setAppFlowStep(1);
    return;
  }
  const name = flowAppName?.value?.trim() || inferAppNameFromFile(selectedApkName);
  const body = new FormData();
  body.append('apk', uploadedApkFile);
  body.append('name', name);
  body.append('packageName', packageFromAppName(name));
  body.append('version', versionFromFile(selectedApkName));
  body.append('icon', iconChoice?.value === 'manual' ? 'manual' : 'extracted');
  await api('/api/admin/apps', { method: 'POST', body });
  await refresh();
  showAppsPage();
}

document.querySelector('#startAutoApk')?.addEventListener('click', showAddAppFlow);

document.querySelector('#appFlowBack')?.addEventListener('click', () => {
  if (appFlowStep > 1) {
    setAppFlowStep(appFlowStep - 1);
    return;
  }
  showAppsPage();
});

apkDropButton?.addEventListener('click', () => apkUploadInput?.click());
apkUploadInput?.addEventListener('change', () => {
  uploadedApkFile = apkUploadInput.files?.[0] || null;
  selectedApkName = uploadedApkFile?.name || 'NewPipe_v0.28.8.apk';
  if (flowAppName) flowAppName.value = inferAppNameFromFile(selectedApkName);
  if (flowAppVersion) flowAppVersion.textContent = versionFromFile(selectedApkName);
  if (apkDropIcon) apkDropIcon.textContent = 'OK';
  if (apkDropText) apkDropText.textContent = selectedApkName;
  if (apkFileName) apkFileName.textContent = selectedApkName;
});

document.querySelector('#appFlowNextOne')?.addEventListener('click', showUploadProcessing);
document.querySelector('#appFlowNextTwo')?.addEventListener('click', () => setAppFlowStep(3));
document.querySelector('#confirmAddApp')?.addEventListener('click', async () => {
  try {
    await saveUploadedApp();
  } catch (error) {
    alert(error.message);
  }
});
document.querySelector('#cancelAddApp')?.addEventListener('click', () => setAppFlowStep(2));

iconChoice?.addEventListener('change', () => {
  manualIconBlock?.classList.toggle('hidden', iconChoice.value !== 'manual');
});

manualIconButton?.addEventListener('click', () => manualIconInput?.click());
manualIconInput?.addEventListener('change', () => {
  manualIconName.textContent = manualIconInput.files?.[0]?.name || 'Nenhum icone escolhido';
});

document.querySelector('#appsList')?.addEventListener('click', (event) => {
  const button = event.target.closest('.app-row');
  if (!button) return;
  const detail = ensureAppDetail(button);
  detail.classList.toggle('hidden');
  button.querySelector('i').textContent = detail.classList.contains('hidden') ? 'v' : '^';
});

document.querySelectorAll('[data-app-sort]').forEach((button) => {
  button.addEventListener('click', () => {
    const list = document.querySelector('#appsList');
    const rows = appRows();
    if (button.dataset.appSort === 'az') rows.sort((a, b) => a.innerText.localeCompare(b.innerText));
    if (button.dataset.appSort === 'new') rows.reverse();
    if (button.dataset.appSort === 'old') rows.sort((a, b) => a.dataset.appName.localeCompare(b.dataset.appName));
    rows.forEach((row) => {
      const detail = row.nextElementSibling?.classList.contains('app-detail') ? row.nextElementSibling : null;
      list.appendChild(row);
      if (detail) list.appendChild(detail);
    });
    closeModals();
  });
});

document.querySelector('.app-search-modal')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const term = (appSearchInput.value || '').trim().toLowerCase();
  appRows().forEach((row) => {
    const detail = row.nextElementSibling?.classList.contains('app-detail') ? row.nextElementSibling : null;
    const match = !term || row.innerText.toLowerCase().includes(term);
    row.style.display = match ? '' : 'none';
    if (detail) {
      detail.classList.add('hidden');
      detail.style.display = match ? '' : 'none';
    }
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

initializeAppDetails();
generateCaptcha();
if (password) refresh().catch(() => appScreen.classList.add('hidden'));
