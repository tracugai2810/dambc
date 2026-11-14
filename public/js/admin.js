(() => {
  const TOKEN_KEY = 'bcd_admin_token';

  const state = {
    token: localStorage.getItem(TOKEN_KEY) || '',
    data: { profile: {}, feedbacks: [], articles: [], storageStats: {} },
    blurMode: false,
    isDrawing: false,
    undoStack: [],
    hasImage: false,
    compressedWebpDataUrl: '',
    originalBytes: 0,
    compressedBytes: 0
  };

  const els = {
    loginSection: document.getElementById('loginSection'),
    adminApp: document.getElementById('adminApp'),
    logoutBtn: document.getElementById('logoutBtn'),
    loginForm: document.getElementById('loginForm'),
    loginError: document.getElementById('loginError'),
    storageBadge: document.getElementById('storageBadge'),
    dropzone: document.getElementById('dropzone'),
    fbFileInput: document.getElementById('fbFileInput'),
    pickFileBtn: document.getElementById('pickFileBtn'),
    canvasEditorWrap: document.getElementById('canvasEditorWrap'),
    blurCanvas: document.getElementById('blurCanvas'),
    toggleBlurBtn: document.getElementById('toggleBlurBtn'),
    brushSizeSelect: document.getElementById('brushSizeSelect'),
    undoBlurBtn: document.getElementById('undoBlurBtn'),
    blurHint: document.getElementById('blurHint'),
    compressionInfo: document.getElementById('compressionInfo'),
    fbCreateForm: document.getElementById('fbCreateForm'),
    fbSubmitBtn: document.getElementById('fbSubmitBtn'),
    adminFbList: document.getElementById('adminFbList'),
    articleForm: document.getElementById('articleForm'),
    adminArtList: document.getElementById('adminArtList'),
    profileForm: document.getElementById('profileForm'),
    toast: document.getElementById('toast')
  };

  const ctx = els.blurCanvas.getContext('2d', { willReadFrequently: true });

  function showToast(msg) {
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.toast.classList.remove('show'), 3200);
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatKB(bytes) {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  }

  async function apiFetch(url, options = {}) {
    const headers = { ...(options.headers || {}) };
    if (state.token) {
      headers.Authorization = `Bearer ${state.token}`;
    }
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    const res = await fetch(url, { ...options, headers });
    if (res.status === 401) {
      logout();
      throw new Error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Có lỗi xảy ra.');
    }
    return data;
  }

  function logout() {
    state.token = '';
    localStorage.removeItem(TOKEN_KEY);
    els.loginSection.classList.remove('hidden');
    els.adminApp.classList.add('hidden');
    els.logoutBtn.classList.add('hidden');
  }

  function showApp() {
    els.loginSection.classList.add('hidden');
    els.adminApp.classList.remove('hidden');
    els.logoutBtn.classList.remove('hidden');
  }

  async function loadAllData() {
    const data = await apiFetch('/api/data');
    state.data = data;
    renderStats();
    renderFeedbackList();
    renderArticleList();
    fillProfileForm();
  }

  function renderStats() {
    const st = state.data.storageStats || {};
    let modeLabel = 'Ổ cứng cục bộ';
    if (st.mode === 'github') {
      modeLabel = `GitHub (${st.repo || 'đã kết nối'})`;
    } else if (st.mode === 'vercel-readonly') {
      modeLabel = 'Chưa gắn GITHUB_TOKEN trên Vercel';
    }
    els.storageBadge.textContent = `Kho ảnh: ${st.imageCount || 0} ảnh (${st.totalMB || 0} MB) • Lưu tại: ${modeLabel}`;
  }

  function renderFeedbackList() {
    const items = state.data.feedbacks || [];
    if (items.length === 0) {
      els.adminFbList.innerHTML = '<div class="empty-state">Chưa có feedback nào.</div>';
      return;
    }
    els.adminFbList.innerHTML = items
      .map((item) => `
        <div class="admin-list-item">
          <div style="display: flex; gap: 14px; align-items: flex-start; min-width: 0;">
            <img src="${escapeHtml(item.imageUrl)}" alt="" class="admin-thumb" />
            <div style="min-width: 0;">
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px;">
                <span class="badge ${item.category === 'Tử Vi' ? 'badge-tuvi' : 'badge-luchao'}">${escapeHtml(item.category)}</span>
                ${item.topic ? `<span class="badge badge-topic">${escapeHtml(item.topic)}</span>` : ''}
                ${item.featured ? '<span class="badge badge-luchao">Nổi bật</span>' : ''}
                <span class="feedback-date">${escapeHtml(item.date || '')}</span>
              </div>
              <div style="font-weight: 600; font-size: 0.95rem;">${escapeHtml(item.title)}</div>
              <div style="font-size: 0.84rem; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(item.note || '')}</div>
            </div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button type="button" class="btn btn-secondary btn-sm" data-toggle-featured="${escapeHtml(item.id)}">${item.featured ? 'Bỏ ghim' : 'Ghim'}</button>
            <button type="button" class="btn btn-danger btn-sm" data-delete-fb="${escapeHtml(item.id)}">Xóa</button>
          </div>
        </div>
      `)
      .join('');
  }

  function renderArticleList() {
    const items = state.data.articles || [];
    if (items.length === 0) {
      els.adminArtList.innerHTML = '<div class="empty-state">Chưa có bài viết nào.</div>';
      return;
    }
    els.adminArtList.innerHTML = items
      .map((art) => `
        <div class="admin-list-item">
          <div style="min-width: 0;">
            <div style="display: flex; gap: 6px; align-items: center; margin-bottom: 4px;">
              <span class="badge ${art.category === 'Tử Vi' ? 'badge-tuvi' : 'badge-luchao'}">${escapeHtml(art.category)}</span>
              <span class="feedback-date">${escapeHtml(art.date || '')}</span>
            </div>
            <div style="font-weight: 600;">${escapeHtml(art.title)}</div>
            <div style="font-size: 0.84rem; color: var(--text-secondary);">${escapeHtml(art.summary || '')}</div>
          </div>
          <div style="display: flex; gap: 6px; flex-shrink: 0;">
            <button type="button" class="btn btn-secondary btn-sm" data-edit-art="${escapeHtml(art.id)}">Sửa</button>
            <button type="button" class="btn btn-danger btn-sm" data-delete-art="${escapeHtml(art.id)}">Xóa</button>
          </div>
        </div>
      `)
      .join('');
  }

  function fillProfileForm() {
    const p = state.data.profile || {};
    const c = p.contact || {};
    document.getElementById('profName').value = p.name || 'Bùi Công Đam';
    document.getElementById('profSeal').value = p.sealText || 'CÔNG ĐAM';
    document.getElementById('profTagline').value = p.tagline || '';
    document.getElementById('profBio').value = p.bio || '';
    document.getElementById('profPhilosophy').value = p.philosophy || '';
    document.getElementById('profFb').value = c.facebook || '';
    document.getElementById('profZalo').value = c.zalo || '';
    document.getElementById('profEmail').value = c.email || '';
  }

  function updateCompressedWebp() {
    if (!state.hasImage) return;
    let dataUrl = els.blurCanvas.toDataURL('image/webp', 0.82);
    if (!dataUrl.startsWith('data:image/webp')) {
      dataUrl = els.blurCanvas.toDataURL('image/jpeg', 0.84);
    }
    state.compressedWebpDataUrl = dataUrl;
    const base64Len = dataUrl.split(',')[1]?.length || 0;
    state.compressedBytes = Math.round((base64Len * 3) / 4);
    els.compressionInfo.textContent = `Gốc ${formatKB(state.originalBytes)} → Nén WebP: ${formatKB(state.compressedBytes)}`;
  }

  function loadImageToCanvas(fileOrBlob) {
    state.originalBytes = fileOrBlob.size || 0;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 1200;
        const scale = img.width > maxW ? maxW / img.width : 1;
        els.blurCanvas.width = Math.round(img.width * scale);
        els.blurCanvas.height = Math.round(img.height * scale);
        ctx.clearRect(0, 0, els.blurCanvas.width, els.blurCanvas.height);
        ctx.drawImage(img, 0, 0, els.blurCanvas.width, els.blurCanvas.height);

        state.hasImage = true;
        state.undoStack = [];
        els.undoBlurBtn.disabled = true;
        els.canvasEditorWrap.classList.remove('hidden');
        updateCompressedWebp();
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(fileOrBlob);
  }

  function getCanvasCoords(evt) {
    const rect = els.blurCanvas.getBoundingClientRect();
    const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
    const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
    return {
      x: ((clientX - rect.left) / rect.width) * els.blurCanvas.width,
      y: ((clientY - rect.top) / rect.height) * els.blurCanvas.height
    };
  }

  function applyPixelateAt(cx, cy) {
    const radius = Number(els.brushSizeSelect.value) || 28;
    const size = radius * 2;
    const sx = Math.max(0, Math.floor(cx - radius));
    const sy = Math.max(0, Math.floor(cy - radius));
    const w = Math.min(els.blurCanvas.width - sx, size);
    const h = Math.min(els.blurCanvas.height - sy, size);
    if (w <= 0 || h <= 0) return;

    const blockSize = Math.max(8, Math.floor(radius / 2.2));
    const imgData = ctx.getImageData(sx, sy, w, h);
    const data = imgData.data;

    for (let y = 0; y < h; y += blockSize) {
      for (let x = 0; x < w; x += blockSize) {
        const dx = x + blockSize / 2 - (cx - sx);
        const dy = y + blockSize / 2 - (cy - sy);
        if (dx * dx + dy * dy > radius * radius) continue;

        const sampleIdx = (y * w + x) * 4;
        const r = data[sampleIdx];
        const g = data[sampleIdx + 1];
        const b = data[sampleIdx + 2];

        for (let by = y; by < Math.min(y + blockSize, h); by++) {
          for (let bx = x; bx < Math.min(x + blockSize, w); bx++) {
            const idx = (by * w + bx) * 4;
            data[idx] = r;
            data[idx + 1] = g;
            data[idx + 2] = b;
          }
        }
      }
    }
    ctx.putImageData(imgData, sx, sy);
  }

  function pushUndoSnapshot() {
    if (!state.hasImage) return;
    if (state.undoStack.length >= 12) state.undoStack.shift();
    state.undoStack.push(ctx.getImageData(0, 0, els.blurCanvas.width, els.blurCanvas.height));
    els.undoBlurBtn.disabled = false;
  }

  function bindCanvasBlurEvents() {
    els.toggleBlurBtn.addEventListener('click', () => {
      state.blurMode = !state.blurMode;
      els.toggleBlurBtn.textContent = state.blurMode ? 'Tắt cọ che tên' : 'Bật cọ che tên khách';
      els.toggleBlurBtn.classList.toggle('btn-primary', state.blurMode);
      els.toggleBlurBtn.classList.toggle('btn-secondary', !state.blurMode);
      els.blurHint.classList.toggle('hidden', !state.blurMode);
      els.blurCanvas.style.cursor = state.blurMode ? 'crosshair' : 'default';
    });

    els.undoBlurBtn.addEventListener('click', () => {
      if (state.undoStack.length === 0) return;
      const prev = state.undoStack.pop();
      ctx.putImageData(prev, 0, 0);
      els.undoBlurBtn.disabled = state.undoStack.length === 0;
      updateCompressedWebp();
    });

    const startDraw = (e) => {
      if (!state.blurMode || !state.hasImage) return;
      e.preventDefault();
      pushUndoSnapshot();
      state.isDrawing = true;
      const pt = getCanvasCoords(e);
      applyPixelateAt(pt.x, pt.y);
    };

    const moveDraw = (e) => {
      if (!state.isDrawing || !state.blurMode) return;
      e.preventDefault();
      const pt = getCanvasCoords(e);
      applyPixelateAt(pt.x, pt.y);
    };

    const endDraw = () => {
      if (!state.isDrawing) return;
      state.isDrawing = false;
      updateCompressedWebp();
    };

    els.blurCanvas.addEventListener('mousedown', startDraw);
    window.addEventListener('mousemove', moveDraw);
    window.addEventListener('mouseup', endDraw);
    els.blurCanvas.addEventListener('touchstart', startDraw, { passive: false });
    els.blurCanvas.addEventListener('touchmove', moveDraw, { passive: false });
    els.blurCanvas.addEventListener('touchend', endDraw);
  }

  function bindEvents() {
    document.getElementById('fbDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('artDate').value = new Date().toISOString().slice(0, 10);

    els.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      els.loginError.classList.add('hidden');
      try {
        const pw = document.getElementById('adminPassword').value;
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: pw })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại.');
        state.token = data.token;
        localStorage.setItem(TOKEN_KEY, data.token);
        showApp();
        await loadAllData();
      } catch (err) {
        els.loginError.textContent = err.message;
        els.loginError.classList.remove('hidden');
      }
    });

    els.logoutBtn.addEventListener('click', logout);

    document.querySelectorAll('[data-admin-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-admin-tab]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-admin-tab');
        document.querySelectorAll('.admin-tab-pane').forEach((pane) => {
          pane.classList.toggle('hidden', pane.id !== targetId);
        });
      });
    });

    els.pickFileBtn.addEventListener('click', () => els.fbFileInput.click());
    els.fbFileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) loadImageToCanvas(file);
    });

    els.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      els.dropzone.classList.add('dragover');
    });
    els.dropzone.addEventListener('dragleave', () => els.dropzone.classList.remove('dragover'));
    els.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      els.dropzone.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) loadImageToCanvas(file);
    });

    document.addEventListener('paste', (e) => {
      if (els.adminApp.classList.contains('hidden')) return;
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            loadImageToCanvas(blob);
            showToast('Đã dán ảnh từ Clipboard và nén sang WebP.');
          }
          break;
        }
      }
    });

    els.fbCreateForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!state.compressedWebpDataUrl) {
        showToast('Vui lòng chọn hoặc dán (Ctrl+V) ảnh feedback trước.');
        return;
      }
      els.fbSubmitBtn.disabled = true;
      els.fbSubmitBtn.textContent = 'Đang lưu...';
      try {
        await apiFetch('/api/feedbacks', {
          method: 'POST',
          body: JSON.stringify({
            category: document.getElementById('fbCategory').value,
            date: document.getElementById('fbDate').value,
            topic: document.getElementById('fbTopic').value,
            source: document.getElementById('fbSource').value,
            title: document.getElementById('fbTitle').value,
            note: document.getElementById('fbNote').value,
            featured: document.getElementById('fbFeatured').checked,
            imageData: state.compressedWebpDataUrl
          })
        });
        els.fbCreateForm.reset();
        document.getElementById('fbDate').value = new Date().toISOString().slice(0, 10);
        state.hasImage = false;
        state.compressedWebpDataUrl = '';
        els.canvasEditorWrap.classList.add('hidden');
        await loadAllData();
        showToast('Đã lưu feedback mới lên website!');
      } catch (err) {
        showToast(err.message);
      } finally {
        els.fbSubmitBtn.disabled = false;
        els.fbSubmitBtn.textContent = 'Lưu Feedback lên Website';
      }
    });

    els.adminFbList.addEventListener('click', async (e) => {
      const delBtn = e.target.closest('[data-delete-fb]');
      if (delBtn) {
        const id = delBtn.getAttribute('data-delete-fb');
        if (!confirm('Xóa feedback này và ảnh đi kèm?')) return;
        try {
          await apiFetch(`/api/feedbacks/${id}`, { method: 'DELETE' });
          await loadAllData();
          showToast('Đã xóa feedback.');
        } catch (err) {
          showToast(err.message);
        }
        return;
      }

      const featBtn = e.target.closest('[data-toggle-featured]');
      if (featBtn) {
        const id = featBtn.getAttribute('data-toggle-featured');
        const current = state.data.feedbacks.find((f) => f.id === id);
        if (!current) return;
        try {
          await apiFetch(`/api/feedbacks/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ featured: !current.featured })
          });
          await loadAllData();
          showToast('Đã cập nhật trạng thái nổi bật.');
        } catch (err) {
          showToast(err.message);
        }
      }
    });

    document.getElementById('syncFolderBtn').addEventListener('click', async () => {
      try {
        const res = await apiFetch('/api/sync-folder', { method: 'POST' });
        await loadAllData();
        showToast(`Đã quét thư mục: phát hiện thêm ${res.addedCount} ảnh mới.`);
      } catch (err) {
        showToast(err.message);
      }
    });

    els.articleForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('artEditId').value;
      const payload = {
        category: document.getElementById('artCategory').value,
        date: document.getElementById('artDate').value,
        title: document.getElementById('artTitle').value,
        summary: document.getElementById('artSummary').value,
        content: document.getElementById('artContent').value
      };
      try {
        if (editId) {
          await apiFetch(`/api/articles/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
          showToast('Đã cập nhật bài viết.');
        } else {
          await apiFetch('/api/articles', { method: 'POST', body: JSON.stringify(payload) });
          showToast('Đã đăng bài viết nghiệm lý mới.');
        }
        resetArticleForm();
        await loadAllData();
      } catch (err) {
        showToast(err.message);
      }
    });

    document.getElementById('artResetBtn').addEventListener('click', resetArticleForm);

    els.adminArtList.addEventListener('click', async (e) => {
      const editBtn = e.target.closest('[data-edit-art]');
      if (editBtn) {
        const art = state.data.articles.find((a) => a.id === editBtn.getAttribute('data-edit-art'));
        if (!art) return;
        document.getElementById('artEditId').value = art.id;
        document.getElementById('artCategory').value = art.category || 'Lục Hào';
        document.getElementById('artDate').value = art.date || '';
        document.getElementById('artTitle').value = art.title || '';
        document.getElementById('artSummary').value = art.summary || '';
        document.getElementById('artContent').value = art.content || '';
        document.getElementById('artFormHeading').textContent = 'Chỉnh Sửa Bài Viết';
        return;
      }

      const delBtn = e.target.closest('[data-delete-art]');
      if (delBtn) {
        if (!confirm('Xóa bài viết này?')) return;
        try {
          await apiFetch(`/api/articles/${delBtn.getAttribute('data-delete-art')}`, { method: 'DELETE' });
          await loadAllData();
          showToast('Đã xóa bài viết.');
        } catch (err) {
          showToast(err.message);
        }
      }
    });

    els.profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        await apiFetch('/api/profile', {
          method: 'PUT',
          body: JSON.stringify({
            name: document.getElementById('profName').value,
            sealText: document.getElementById('profSeal').value,
            tagline: document.getElementById('profTagline').value,
            bio: document.getElementById('profBio').value,
            philosophy: document.getElementById('profPhilosophy').value,
            contact: {
              facebook: document.getElementById('profFb').value,
              zalo: document.getElementById('profZalo').value,
              email: document.getElementById('profEmail').value
            }
          })
        });
        await loadAllData();
        showToast('Đã lưu thông tin hồ sơ cá nhân.');
      } catch (err) {
        showToast(err.message);
      }
    });

    document.getElementById('downloadBackupBtn').addEventListener('click', async () => {
      try {
        const res = await fetch('/api/backup', {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        if (!res.ok) throw new Error('Không thể tạo bản sao lưu.');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bui-cong-dam-backup-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Đã tải file sao lưu toàn bộ dữ liệu.');
      } catch (err) {
        showToast(err.message);
      }
    });

    document.getElementById('restoreBtn').addEventListener('click', async () => {
      const file = document.getElementById('restoreFileInput').files[0];
      if (!file) {
        showToast('Vui lòng chọn file .json sao lưu trước.');
        return;
      }
      if (!confirm('Khôi phục sẽ ghi đè dữ liệu hiện tại bằng file sao lưu. Tiếp tục?')) return;
      try {
        const text = await file.text();
        const res = await apiFetch('/api/restore', { method: 'POST', body: text });
        await loadAllData();
        showToast(`Khôi phục thành công: ${res.restoredFiles} ảnh, ${res.feedbackCount} feedback.`);
      } catch (err) {
        showToast(err.message);
      }
    });

    bindCanvasBlurEvents();
  }

  function resetArticleForm() {
    els.articleForm.reset();
    document.getElementById('artEditId').value = '';
    document.getElementById('artDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('artFormHeading').textContent = 'Viết Bài Nghiệm Lý Mới';
  }

  async function init() {
    bindEvents();
    if (state.token) {
      try {
        const res = await fetch('/api/verify-auth', {
          headers: { Authorization: `Bearer ${state.token}` }
        });
        if (res.ok) {
          showApp();
          await loadAllData();
          return;
        }
      } catch {
        // Bỏ qua nếu token cũ không hợp lệ
      }
      logout();
    }
  }

  init();
})();
