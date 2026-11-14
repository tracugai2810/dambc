(() => {
  const state = {
    profile: {},
    feedbacks: [],
    articles: [],
    filteredFeedbacks: [],
    fbFilter: 'all',
    fbQuery: '',
    artFilter: 'all',
    lightboxIndex: -1,
    lightboxSubIndex: 0,
    zoom: 1
  };

  const els = {
    themeToggle: document.getElementById('themeToggle'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),
    headerSeal: document.getElementById('headerSeal'),
    headerName: document.getElementById('headerName'),
    headerTagline: document.getElementById('headerTagline'),
    heroName: document.getElementById('heroName'),
    heroSeal: document.getElementById('heroSeal'),
    heroBio: document.getElementById('heroBio'),
    heroPhilosophy: document.getElementById('heroPhilosophy'),
    footerSeal: document.getElementById('footerSeal'),
    footerName: document.getElementById('footerName'),
    contactNote: document.getElementById('contactNote'),
    contactLinks: document.getElementById('contactLinks'),
    statTotalFeedbacks: document.getElementById('statTotalFeedbacks'),
    statLucHao: document.getElementById('statLucHao'),
    statTuVi: document.getElementById('statTuVi'),
    feedbackGrid: document.getElementById('feedbackGrid'),
    feedbackEmpty: document.getElementById('feedbackEmpty'),
    feedbackSearch: document.getElementById('feedbackSearch'),
    articleGrid: document.getElementById('articleGrid'),
    articleEmpty: document.getElementById('articleEmpty'),
    lightboxModal: document.getElementById('lightboxModal'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxBadges: document.getElementById('lightboxBadges'),
    lightboxTitle: document.getElementById('lightboxTitle'),
    lightboxNote: document.getElementById('lightboxNote'),
    lightboxThumbs: document.getElementById('lightboxThumbs'),
    lightboxImageCounter: document.getElementById('lightboxImageCounter'),
    lightboxSource: document.getElementById('lightboxSource'),
    lightboxDate: document.getElementById('lightboxDate'),
    lbZoomLabel: document.getElementById('lbZoomLabel'),
    articleModal: document.getElementById('articleModal'),
    articleModalBadges: document.getElementById('articleModalBadges'),
    articleModalTitle: document.getElementById('articleModalTitle'),
    articleModalBody: document.getElementById('articleModalBody')
  };

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function initTheme() {
    const saved = localStorage.getItem('bcd_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = saved || (prefersDark ? 'dark' : 'light');
    applyTheme(theme);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bcd_theme', theme);
    if (theme === 'dark') {
      els.themeIconSun.classList.add('hidden');
      els.themeIconMoon.classList.remove('hidden');
    } else {
      els.themeIconSun.classList.remove('hidden');
      els.themeIconMoon.classList.add('hidden');
    }
  }

  function renderProfile() {
    const p = state.profile || {};
    const name = p.name || 'Bùi Công Đam';
    const seal = p.sealText || 'CÔNG ĐAM';
    const tagline = p.tagline || 'Nghiệm Lý Lục Hào & Tử Vi';

    els.headerName.textContent = name;
    els.heroName.textContent = name;
    els.footerName.textContent = name;
    els.headerSeal.textContent = seal;
    els.heroSeal.textContent = seal;
    els.footerSeal.textContent = seal;
    els.headerTagline.textContent = tagline;
    els.heroBio.textContent = p.bio || '';
    els.heroPhilosophy.textContent = p.philosophy || '';
    els.heroPhilosophy.classList.toggle('hidden', !p.philosophy);

    const contact = p.contact || {};
    els.contactNote.textContent = contact.note || 'Liên hệ trao đổi học thuật Lục Hào & Tử Vi.';
    const pills = [];
    if (contact.facebook) {
      pills.push(`<a href="${escapeHtml(contact.facebook)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Facebook</a>`);
    }
    if (contact.zalo) {
      const zaloHref = contact.zalo.startsWith('http') ? contact.zalo : `https://zalo.me/${contact.zalo.replace(/\s+/g, '')}`;
      pills.push(`<a href="${escapeHtml(zaloHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Zalo: ${escapeHtml(contact.zalo)}</a>`);
    }
    if (contact.email) {
      pills.push(`<a href="mailto:${escapeHtml(contact.email)}" class="btn btn-secondary btn-sm">${escapeHtml(contact.email)}</a>`);
    }
    els.contactLinks.innerHTML = pills.join('');

    const total = state.feedbacks.length;
    const lucHaoCount = state.feedbacks.filter((f) => f.category === 'Lục Hào').length;
    const tuViCount = state.feedbacks.filter((f) => f.category === 'Tử Vi').length;
    els.statTotalFeedbacks.textContent = String(total);
    els.statLucHao.textContent = String(lucHaoCount);
    els.statTuVi.textContent = String(tuViCount);
  }

  function categoryBadge(category) {
    const cls = category === 'Tử Vi' ? 'badge-tuvi' : 'badge-luchao';
    return `<span class="badge ${cls}">${escapeHtml(category)}</span>`;
  }

  function getFeedbackImages(item) {
    if (Array.isArray(item?.imageUrls) && item.imageUrls.length > 0) {
      return item.imageUrls;
    }
    return item?.imageUrl ? [item.imageUrl] : [];
  }

  function renderFeedbacks() {
    const q = state.fbQuery.trim().toLowerCase();
    const list = state.feedbacks.filter((item) => {
      if (state.fbFilter === 'featured' && !item.featured) return false;
      if (state.fbFilter === 'Lục Hào' && item.category !== 'Lục Hào') return false;
      if (state.fbFilter === 'Tử Vi' && item.category !== 'Tử Vi') return false;
      if (!q) return true;
      const haystack = `${item.title || ''} ${item.note || ''} ${item.topic || ''} ${item.source || ''} ${item.category || ''}`.toLowerCase();
      return haystack.includes(q);
    });

    state.filteredFeedbacks = list;
    els.feedbackEmpty.classList.toggle('hidden', list.length > 0);
    els.feedbackGrid.innerHTML = list
      .map((item, idx) => {
        const imgs = getFeedbackImages(item);
        const mainImg = imgs[0] || '';
        const thumbsHtml = imgs.length > 1
          ? `<div class="feedback-thumbs">${imgs.map((url, subIdx) => `
              <button type="button" class="feedback-thumb-btn" data-open-lightbox="${idx}" data-img-index="${subIdx}" aria-label="Xem ảnh ${subIdx + 1} của ${escapeHtml(item.title)}">
                <img src="${escapeHtml(url)}" alt="" loading="lazy" />
              </button>
            `).join('')}</div>`
          : '';

        return `
        <article class="feedback-card">
          <div class="feedback-card-head">
            <div class="badge-group">
              ${categoryBadge(item.category)}
              ${item.topic ? `<span class="badge badge-topic">${escapeHtml(item.topic)}</span>` : ''}
            </div>
            <span class="feedback-date">${escapeHtml(formatDate(item.date))}</span>
          </div>
          <button type="button" class="feedback-media-btn" data-open-lightbox="${idx}" data-img-index="0" aria-label="Phóng to ảnh feedback: ${escapeHtml(item.title)}">
            <img src="${escapeHtml(mainImg)}" alt="${escapeHtml(item.title)}" loading="lazy" />
            ${imgs.length > 1 ? `<span class="feedback-count-badge">${imgs.length} ảnh</span>` : ''}
            <span class="zoom-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Phóng to
            </span>
          </button>
          ${thumbsHtml}
          <div class="feedback-body">
            <h3 class="feedback-title">${escapeHtml(item.title)}</h3>
            ${item.note ? `<p class="feedback-note">${escapeHtml(item.note)}</p>` : ''}
            ${item.source ? `<div class="feedback-source">Nguồn: ${escapeHtml(item.source)}</div>` : ''}
          </div>
        </article>
      `;
      })
      .join('');
  }

  function renderArticles() {
    const list = state.articles.filter((item) => {
      if (state.artFilter === 'all') return true;
      return item.category === state.artFilter;
    });

    els.articleEmpty.classList.toggle('hidden', list.length > 0);
    els.articleGrid.innerHTML = list
      .map((item) => `
        <article class="article-card">
          <div>
            <div class="article-meta">
              ${categoryBadge(item.category)}
              <span class="feedback-date">${escapeHtml(formatDate(item.date))}</span>
            </div>
            <h3 class="article-title">${escapeHtml(item.title)}</h3>
            <p class="article-summary">${escapeHtml(item.summary || item.content.slice(0, 140) + '...')}</p>
          </div>
          <div class="article-footer">
            <span style="font-family: var(--font-mono); font-size: 0.78rem; color: var(--text-tertiary);">${escapeHtml(item.readTime || 'Ghi chép')}</span>
            <button type="button" class="btn btn-secondary btn-sm" data-open-article="${escapeHtml(item.id)}">Đọc chi tiết</button>
          </div>
        </article>
      `)
      .join('');
  }

  function openLightbox(index, imgIndex = 0) {
    if (index < 0 || index >= state.filteredFeedbacks.length) return;
    state.lightboxIndex = index;
    const imgs = getFeedbackImages(state.filteredFeedbacks[index]);
    state.lightboxSubIndex = Math.max(0, Math.min(imgIndex, imgs.length - 1));
    state.zoom = 1;
    updateLightboxContent();
    els.lightboxModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateLightboxContent() {
    const item = state.filteredFeedbacks[state.lightboxIndex];
    if (!item) return;
    const imgs = getFeedbackImages(item);
    const subIdx = Math.max(0, Math.min(state.lightboxSubIndex, imgs.length - 1));
    state.lightboxSubIndex = subIdx;

    els.lightboxImg.src = imgs[subIdx] || '';
    els.lightboxImg.alt = item.title || 'Ảnh feedback';
    els.lightboxImg.style.transform = `scale(${state.zoom})`;
    els.lbZoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    els.lightboxBadges.innerHTML = `${categoryBadge(item.category)}${item.topic ? `<span class="badge badge-topic">${escapeHtml(item.topic)}</span>` : ''}`;
    els.lightboxTitle.textContent = item.title || '';
    els.lightboxNote.textContent = item.note || 'Không có ghi chú thêm.';
    els.lightboxImageCounter.textContent = imgs.length > 1 ? `Ảnh ${subIdx + 1} / ${imgs.length} trong bài này` : '';

    if (imgs.length > 1) {
      els.lightboxThumbs.classList.remove('hidden');
      els.lightboxThumbs.innerHTML = imgs
        .map((url, idx) => `
          <button type="button" class="lightbox-thumb-btn ${idx === subIdx ? 'active' : ''}" data-lb-sub="${idx}" aria-label="Xem ảnh ${idx + 1}">
            <img src="${escapeHtml(url)}" alt="" />
          </button>
        `)
        .join('');
    } else {
      els.lightboxThumbs.classList.add('hidden');
      els.lightboxThumbs.innerHTML = '';
    }

    els.lightboxSource.textContent = item.source ? `Nguồn: ${item.source}` : '';
    els.lightboxDate.textContent = item.date ? `Ngày lưu: ${formatDate(item.date)}` : '';
  }

  function closeLightbox() {
    els.lightboxModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function openArticleModal(articleId) {
    const article = state.articles.find((a) => a.id === articleId);
    if (!article) return;
    els.articleModalBadges.innerHTML = `${categoryBadge(article.category)}<span class="badge badge-topic">${escapeHtml(formatDate(article.date))}</span>`;
    els.articleModalTitle.textContent = article.title;
    els.articleModalBody.textContent = article.content;
    els.articleModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeArticleModal() {
    els.articleModal.classList.remove('open');
    document.body.style.overflow = '';
  }

  function bindEvents() {
    els.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    document.querySelectorAll('[data-fb-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-fb-filter]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.fbFilter = btn.getAttribute('data-fb-filter');
        renderFeedbacks();
      });
    });

    els.feedbackSearch.addEventListener('input', (e) => {
      state.fbQuery = e.target.value;
      renderFeedbacks();
    });

    document.querySelectorAll('[data-art-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-art-filter]').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.artFilter = btn.getAttribute('data-art-filter');
        renderArticles();
      });
    });

    els.feedbackGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open-lightbox]');
      if (!btn) return;
      const fbIdx = Number(btn.getAttribute('data-open-lightbox'));
      const imgIdx = Number(btn.getAttribute('data-img-index') || 0);
      openLightbox(fbIdx, imgIdx);
    });

    els.lightboxThumbs.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-lb-sub]');
      if (!btn) return;
      state.lightboxSubIndex = Number(btn.getAttribute('data-lb-sub'));
      state.zoom = 1;
      updateLightboxContent();
    });

    els.articleGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-open-article]');
      if (!btn) return;
      openArticleModal(btn.getAttribute('data-open-article'));
    });

    document.getElementById('lbCloseBtn').addEventListener('click', closeLightbox);
    document.getElementById('articleModalClose').addEventListener('click', closeArticleModal);

    els.lightboxModal.addEventListener('click', (e) => {
      if (e.target === els.lightboxModal) closeLightbox();
    });
    els.articleModal.addEventListener('click', (e) => {
      if (e.target === els.articleModal) closeArticleModal();
    });

    document.getElementById('lbPrevBtn').addEventListener('click', () => {
      if (state.filteredFeedbacks.length === 0) return;
      if (state.lightboxSubIndex > 0) {
        state.lightboxSubIndex -= 1;
      } else {
        state.lightboxIndex = (state.lightboxIndex - 1 + state.filteredFeedbacks.length) % state.filteredFeedbacks.length;
        const prevImgs = getFeedbackImages(state.filteredFeedbacks[state.lightboxIndex]);
        state.lightboxSubIndex = Math.max(0, prevImgs.length - 1);
      }
      state.zoom = 1;
      updateLightboxContent();
    });

    document.getElementById('lbNextBtn').addEventListener('click', () => {
      if (state.filteredFeedbacks.length === 0) return;
      const currentImgs = getFeedbackImages(state.filteredFeedbacks[state.lightboxIndex]);
      if (state.lightboxSubIndex < currentImgs.length - 1) {
        state.lightboxSubIndex += 1;
      } else {
        state.lightboxIndex = (state.lightboxIndex + 1) % state.filteredFeedbacks.length;
        state.lightboxSubIndex = 0;
      }
      state.zoom = 1;
      updateLightboxContent();
    });

    document.getElementById('lbZoomInBtn').addEventListener('click', () => {
      state.zoom = Math.min(2.5, Number((state.zoom + 0.25).toFixed(2)));
      els.lightboxImg.style.transform = `scale(${state.zoom})`;
      els.lbZoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    });

    document.getElementById('lbZoomOutBtn').addEventListener('click', () => {
      state.zoom = Math.max(1, Number((state.zoom - 0.25).toFixed(2)));
      els.lightboxImg.style.transform = `scale(${state.zoom})`;
      els.lbZoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        closeArticleModal();
      } else if (els.lightboxModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') document.getElementById('lbPrevBtn').click();
        if (e.key === 'ArrowRight') document.getElementById('lbNextBtn').click();
      }
    });
  }

  async function init() {
    document.getElementById('currentYear').textContent = String(new Date().getFullYear());
    initTheme();
    bindEvents();
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      state.profile = data.profile || {};
      state.feedbacks = Array.isArray(data.feedbacks) ? data.feedbacks : [];
      state.articles = Array.isArray(data.articles) ? data.articles : [];
      renderProfile();
      renderFeedbacks();
      renderArticles();
    } catch (err) {
      els.heroBio.textContent = 'Không thể tải dữ liệu từ máy chủ. Vui lòng thử tải lại trang.';
      console.error(err);
    }
  }

  init();
})();
