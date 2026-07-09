let password = localStorage.getItem('launcherAdminPassword') || '';

const content = document.querySelector('#content');
const loginForm = document.querySelector('#loginForm');
const passwordInput = document.querySelector('#password');
const wallpaperPreview = document.querySelector('#wallpaperPreview');
const devicesEl = document.querySelector('#devices');
const bannersEl = document.querySelector('#banners');

passwordInput.value = password;

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

async function refresh() {
  const data = await api('/api/admin/overview');
  content.classList.remove('hidden');
  wallpaperPreview.src = data.wallpaper || '';
  wallpaperPreview.style.display = data.wallpaper ? 'block' : 'none';

  devicesEl.innerHTML = data.devices.map((item) => `
    <div class="row">
      <strong>${item.code}</strong>
      <span>${item.label || 'Sem nome'}</span>
      <span class="badge ${item.active ? 'active' : ''}">${item.active ? 'Ativo' : 'Aguardando'}</span>
      <button data-deactivate="${item.id}" class="danger">Desativar</button>
    </div>
  `).join('') || '<p class="muted">Nenhum aparelho abriu o launcher ainda.</p>';

  bannersEl.innerHTML = data.banners.map((item) => `
    <article class="card">
      <img src="${item.imageUrl}" alt="">
      <footer>
        <div>
          <strong>${item.title}</strong>
          <div class="muted">Ordem ${item.position}</div>
        </div>
        <button class="danger" data-banner="${item.id}">Apagar</button>
      </footer>
    </article>
  `).join('') || '<p class="muted">Nenhum banner enviado.</p>';
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  password = passwordInput.value;
  localStorage.setItem('launcherAdminPassword', password);
  await refresh().catch((error) => alert(error.message));
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

if (password) refresh().catch(() => content.classList.add('hidden'));
