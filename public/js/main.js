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
    zoom: 1,
    panX: 0,
    panY: 0,
    isDragging: false,
    dragStartX: 0,
    dragStartY: 0,
    swipeStartX: 0,
    swipeStartY: 0,
    lastTapTime: 0,
    lastFocusedEl: null
  };

  const els = {
    themeToggle: document.getElementById('themeToggle'),
    themeIconSun: document.getElementById('themeIconSun'),
    themeIconMoon: document.getElementById('themeIconMoon'),
    headerName: document.getElementById('headerName'),
    headerTagline: document.getElementById('headerTagline'),
    heroName: document.getElementById('heroName'),
    heroBio: document.getElementById('heroBio'),
    heroPhilosophy: document.getElementById('heroPhilosophy'),
    bookingCards: document.getElementById('bookingCards'),
    bookingNote: document.getElementById('bookingNote'),
    mobileZaloBtn: document.getElementById('mobileZaloBtn'),
    footerName: document.getElementById('footerName'),
    contactNote: document.getElementById('contactNote'),
    contactLinks: document.getElementById('contactLinks'),
    feedbackGrid: document.getElementById('feedbackGrid'),
    feedbackEmpty: document.getElementById('feedbackEmpty'),
    feedbackSearch: document.getElementById('feedbackSearch'),
    feedbackSearchClear: document.getElementById('feedbackSearchClear'),
    resetFbFilterBtn: document.getElementById('resetFbFilterBtn'),
    articleGrid: document.getElementById('articleGrid'),
    articleEmpty: document.getElementById('articleEmpty'),
    lightboxModal: document.getElementById('lightboxModal'),
    lightboxStage: document.getElementById('lightboxStage'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxBadges: document.getElementById('lightboxBadges'),
    lightboxTitle: document.getElementById('lightboxTitle'),
    lightboxNote: document.getElementById('lightboxNote'),
    lightboxThumbs: document.getElementById('lightboxThumbs'),
    lightboxImageCounter: document.getElementById('lightboxImageCounter'),
    lightboxSource: document.getElementById('lightboxSource'),
    lightboxDate: document.getElementById('lightboxDate'),
    lbZoomLabel: document.getElementById('lbZoomLabel'),
    lbZoomResetBtn: document.getElementById('lbZoomResetBtn'),
    lbStageCloseBtn: document.getElementById('lbStageCloseBtn'),
    lbCloseBtn: document.getElementById('lbCloseBtn'),
    lbBookingCta: document.getElementById('lbBookingCta'),
    articleModal: document.getElementById('articleModal'),
    articleModalBadges: document.getElementById('articleModalBadges'),
    articleModalTitle: document.getElementById('articleModalTitle'),
    articleModalBody: document.getElementById('articleModalBody'),
    articleModalClose: document.getElementById('articleModalClose'),
    artBookingCta: document.getElementById('artBookingCta'),
    homeToast: document.getElementById('homeToast')
  };

  function showToast(msg) {
    if (!els.homeToast) return;
    els.homeToast.textContent = msg;
    els.homeToast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => els.homeToast.classList.remove('show'), 2800);
  }

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

  function buildZaloHref(zaloRaw) {
    if (!zaloRaw) return '';
    return zaloRaw.startsWith('http') ? zaloRaw : `https://zalo.me/${zaloRaw.replace(/\s+/g, '')}`;
  }

  function formatPhoneDisplay(phone) {
    const raw = String(phone || '').trim();
    const digits = raw.replace(/\D/g, '');
    if (digits.length === 10) {
      return digits.replace(/^(\d{4})(\d{3})(\d{3})$/, '$1 $2 $3');
    }
    if (digits.length === 11) {
      return digits.replace(/^(\d{4})(\d{3})(\d{4})$/, '$1 $2 $3');
    }
    return raw;
  }

  function renderProfile() {
    const p = state.profile || {};
    const name = p.name || 'Bùi Công Đam';
    const tagline = p.tagline || 'Nghiệm Lý Tử Vi & Lục Hào';

    els.headerName.textContent = name;
    els.heroName.textContent = name;
    els.footerName.textContent = name;
    els.headerTagline.textContent = tagline;
    if (p.bio) {
      els.heroBio.textContent = p.bio;
    }
    els.heroPhilosophy.textContent = p.philosophy || '';
    els.heroPhilosophy.classList.toggle('hidden', !p.philosophy);

    const contact = p.contact || {};
    const zaloHref = buildZaloHref(contact.zalo);

    if (els.mobileZaloBtn) {
      if (zaloHref) {
        els.mobileZaloBtn.href = zaloHref;
      } else if (contact.facebook) {
        els.mobileZaloBtn.href = contact.facebook;
        els.mobileZaloBtn.textContent = 'Nhắn Facebook';
      }
    }

    if (els.bookingCards) {
      const cards = [];
      if (contact.zalo) {
        const displayZalo = formatPhoneDisplay(contact.zalo);
        cards.push(`
          <div class="booking-card booking-card--zalo">
            <div class="booking-card-top">
              <span class="booking-card-label">Zalo đặt lịch trực tiếp</span>
              <button type="button" class="btn btn-secondary btn-sm booking-copy-btn" data-copy-text="${escapeHtml(contact.zalo)}">Sao chép số</button>
            </div>
            <div class="booking-card-val">${escapeHtml(displayZalo)}</div>
            <a href="${escapeHtml(zaloHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary booking-cta-full">
              Nhắn Zalo đặt lịch ngay
            </a>
          </div>
        `);
      }
      if (contact.facebook) {
        cards.push(`
          <div class="booking-card">
            <div class="booking-card-info">
              <div class="booking-card-label">Facebook cá nhân</div>
              <div class="booking-card-sub">Theo dõi bài nghiệm lý &amp; nhắn tin trao đổi trực tiếp</div>
            </div>
            <a href="${escapeHtml(contact.facebook)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary booking-cta-full">
              Mở trang Facebook
            </a>
          </div>
        `);
      }
      els.bookingCards.innerHTML = cards.join('');
    }

    if (els.bookingNote) {
      els.bookingNote.textContent =
        contact.note ||
        'Khi nhắn đặt lịch xem Tử Vi, bạn vui lòng gửi trước Ngày tháng năm sinh Dương lịch, Giờ sinh (nếu nhớ) và Giới tính để sắp xếp khung giờ trao đổi thuận tiện.';
    }

    els.contactNote.textContent = contact.note || 'Liên hệ trao đổi học thuật & đặt lịch luận giải Tử Vi, Lục Hào.';
    const pills = [];
    if (contact.facebook) {
      pills.push(`<a href="${escapeHtml(contact.facebook)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Facebook</a>`);
    }
    if (contact.zalo) {
      pills.push(`<a href="${escapeHtml(zaloHref)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">Zalo: ${escapeHtml(formatPhoneDisplay(contact.zalo))}</a>`);
    }
    pills.push(`<a href="https://luchao.io.vn/" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">luchao.io.vn</a>`);
    pills.push(`<a href="https://gieoque.id.vn/" target="_blank" rel="noopener" class="btn btn-secondary btn-sm">gieoque.id.vn</a>`);
    els.contactLinks.innerHTML = pills.join('');
  }

  function updateFilterTabCounts() {
    const fbCounts = {
      all: state.feedbacks.length,
      'Tử Vi': state.feedbacks.filter((item) => item.category === 'Tử Vi').length,
      'Lục Hào': state.feedbacks.filter((item) => item.category === 'Lục Hào').length
    };
    document.querySelectorAll('[data-fb-filter]').forEach((btn) => {
      const key = btn.getAttribute('data-fb-filter');
      const base = btn.getAttribute('data-base-label') || btn.textContent;
      const count = fbCounts[key] ?? 0;
      btn.textContent = count > 0 ? `${base} (${count})` : base;
    });

    const artCounts = {
      all: state.articles.length,
      'Tử Vi': state.articles.filter((item) => item.category === 'Tử Vi').length,
      'Lục Hào': state.articles.filter((item) => item.category === 'Lục Hào').length
    };
    document.querySelectorAll('[data-art-filter]').forEach((btn) => {
      const key = btn.getAttribute('data-art-filter');
      const base = btn.getAttribute('data-base-label') || btn.textContent;
      const count = artCounts[key] ?? 0;
      btn.textContent = count > 0 ? `${base} (${count})` : base;
    });
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

  function buildFeedbackAlt(item) {
    const cat = (item?.category || 'Tử Vi').trim();
    const topic = (item?.topic || item?.title || '').trim();
    if (!topic) return `Luận giải ${cat}`;
    if (topic.toLowerCase().includes(cat.toLowerCase())) return topic;
    return `${topic} — ${cat}`;
  }

  function renderFeedbacks() {
    const q = state.fbQuery.trim().toLowerCase();
    if (els.feedbackSearchClear) {
      els.feedbackSearchClear.classList.toggle('hidden', q.length === 0);
    }

    const list = state.feedbacks.filter((item) => {
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
        const topicText = item.topic || item.title || 'Nghiệm lý thực tế';
        const extraNote = item.note && item.note.trim().toLowerCase() !== topicText.trim().toLowerCase() ? item.note.trim() : '';
        const seoAlt = buildFeedbackAlt(item);

        const thumbsHtml = imgs.length > 1
          ? `<div class="feedback-thumbs">${imgs.map((url, subIdx) => `
              <button type="button" class="feedback-thumb-btn" data-open-lightbox="${idx}" data-img-index="${subIdx}" aria-label="Xem ảnh ${subIdx + 1} của ${escapeHtml(topicText)}">
                <img src="${escapeHtml(url)}" alt="Xem hình ${subIdx + 1} - ${escapeHtml(topicText)}" loading="lazy" decoding="async" />
              </button>
            `).join('')}</div>`
          : '';

        return `
        <article class="feedback-card">
          <div class="feedback-card-head">
            <div class="badge-group">
              ${categoryBadge(item.category)}
              ${item.topic ? `<span class="badge badge-topic">${escapeHtml(item.topic)}</span>` : (item.title ? `<span class="badge badge-topic">${escapeHtml(item.title)}</span>` : '')}
            </div>
            <span class="feedback-date">${escapeHtml(formatDate(item.date))}</span>
          </div>
          <button type="button" class="feedback-media-btn" data-open-lightbox="${idx}" data-img-index="0" aria-label="Phóng to ảnh feedback: ${escapeHtml(topicText)}">
            <img src="${escapeHtml(mainImg)}" alt="${escapeHtml(seoAlt)}" loading="lazy" decoding="async" />
            ${imgs.length > 1 ? `<span class="feedback-count-badge">${imgs.length} ảnh</span>` : ''}
            <span class="zoom-hint">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Phóng to
            </span>
          </button>
          ${thumbsHtml}
          <div class="sr-only">${escapeHtml(topicText)} ${escapeHtml(extraNote)}</div>
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
        <article class="article-card" data-open-article="${escapeHtml(item.id)}" tabindex="0" role="button" aria-label="Đọc bài viết: ${escapeHtml(item.title)}">
          <div>
            <div class="article-meta">
              ${categoryBadge(item.category)}
              <span class="feedback-date">${escapeHtml(formatDate(item.date))}</span>
            </div>
            <h3 class="article-title">${escapeHtml(item.title)}</h3>
            <p class="article-summary">${escapeHtml(item.summary || item.content.slice(0, 140) + '...')}</p>
          </div>
          <div class="article-footer">
            <span style="font-size: 0.78rem; color: var(--text-tertiary);">${escapeHtml(item.readTime || 'Ghi chép')}</span>
            <span class="btn btn-secondary btn-sm">Đọc chi tiết</span>
          </div>
        </article>
      `)
      .join('');
  }

  function applyLightboxTransform() {
    if (state.zoom <= 1) {
      state.zoom = 1;
      state.panX = 0;
      state.panY = 0;
    }
    els.lightboxImg.style.transform = `translate3d(${state.panX}px, ${state.panY}px, 0) scale(${state.zoom})`;
    els.lbZoomLabel.textContent = `${Math.round(state.zoom * 100)}%`;
    if (els.lightboxStage) {
      els.lightboxStage.classList.toggle('is-zoomed', state.zoom > 1);
    }
  }

  function setLightboxZoom(nextZoom) {
    state.zoom = Math.max(1, Math.min(3, Number(nextZoom.toFixed(2))));
    applyLightboxTransform();
  }

  function openLightbox(index, imgIndex = 0) {
    if (index < 0 || index >= state.filteredFeedbacks.length) return;
    state.lastFocusedEl = document.activeElement;
    state.lightboxIndex = index;
    const imgs = getFeedbackImages(state.filteredFeedbacks[index]);
    state.lightboxSubIndex = Math.max(0, Math.min(imgIndex, imgs.length - 1));
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    updateLightboxContent();
    els.lightboxModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (els.lbCloseBtn) els.lbCloseBtn.focus();
  }

  function updateLightboxContent() {
    const item = state.filteredFeedbacks[state.lightboxIndex];
    if (!item) return;
    const imgs = getFeedbackImages(item);
    const subIdx = Math.max(0, Math.min(state.lightboxSubIndex, imgs.length - 1));
    state.lightboxSubIndex = subIdx;

    const displayTitle = item.topic || item.title || 'Feedback thực chứng';
    const cleanNote = (item.note || '').trim();
    const hasDistinctNote = Boolean(cleanNote) && cleanNote.toLowerCase() !== displayTitle.trim().toLowerCase();

    els.lightboxImg.src = imgs[subIdx] || '';
    els.lightboxImg.alt = buildFeedbackAlt(item);
    applyLightboxTransform();
    els.lightboxBadges.innerHTML = `${categoryBadge(item.category)}${item.topic ? `<span class="badge badge-topic">${escapeHtml(item.topic)}</span>` : ''}`;
    els.lightboxTitle.textContent = displayTitle;
    if (hasDistinctNote) {
      els.lightboxNote.textContent = cleanNote;
      els.lightboxNote.classList.remove('hidden');
    } else {
      els.lightboxNote.textContent = '';
      els.lightboxNote.classList.add('hidden');
    }
    els.lightboxImageCounter.textContent = imgs.length > 1 ? `Ảnh ${subIdx + 1} / ${imgs.length} trong bài này` : '';

    if (imgs.length > 1) {
      els.lightboxThumbs.classList.remove('hidden');
      els.lightboxThumbs.innerHTML = imgs
        .map((url, idx) => `
          <button type="button" class="lightbox-thumb-btn ${idx === subIdx ? 'active' : ''}" data-lb-sub="${idx}" aria-label="Xem ảnh ${idx + 1}">
            <img src="${escapeHtml(url)}" alt="Xem hình ${idx + 1} - ${escapeHtml(displayTitle)}" />
          </button>
        `)
        .join('');
    } else {
      els.lightboxThumbs.classList.add('hidden');
      els.lightboxThumbs.innerHTML = '';
    }

    els.lightboxSource.textContent = '';
    els.lightboxDate.textContent = item.date ? `Ngày lưu: ${formatDate(item.date)}` : '';
  }

  function closeLightbox() {
    if (!els.lightboxModal.classList.contains('open')) return;
    els.lightboxModal.classList.remove('open');
    document.body.style.overflow = '';
    if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === 'function') {
      state.lastFocusedEl.focus();
      state.lastFocusedEl = null;
    }
  }

  function openArticleModal(articleId) {
    const article = state.articles.find((a) => a.id === articleId);
    if (!article) return;
    state.lastFocusedEl = document.activeElement;
    els.articleModalBadges.innerHTML = `${categoryBadge(article.category)}<span class="badge badge-topic">${escapeHtml(formatDate(article.date))}</span>`;
    els.articleModalTitle.textContent = article.title;
    els.articleModalBody.textContent = article.content;
    els.articleModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (els.articleModalClose) els.articleModalClose.focus();
  }

  function closeArticleModal() {
    if (!els.articleModal.classList.contains('open')) return;
    els.articleModal.classList.remove('open');
    document.body.style.overflow = '';
    if (state.lastFocusedEl && typeof state.lastFocusedEl.focus === 'function') {
      state.lastFocusedEl.focus();
      state.lastFocusedEl = null;
    }
  }

  function stepLightboxPrev() {
    if (state.filteredFeedbacks.length === 0) return;
    if (state.lightboxSubIndex > 0) {
      state.lightboxSubIndex -= 1;
    } else {
      state.lightboxIndex = (state.lightboxIndex - 1 + state.filteredFeedbacks.length) % state.filteredFeedbacks.length;
      const prevImgs = getFeedbackImages(state.filteredFeedbacks[state.lightboxIndex]);
      state.lightboxSubIndex = Math.max(0, prevImgs.length - 1);
    }
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    updateLightboxContent();
  }

  function stepLightboxNext() {
    if (state.filteredFeedbacks.length === 0) return;
    const currentImgs = getFeedbackImages(state.filteredFeedbacks[state.lightboxIndex]);
    if (state.lightboxSubIndex < currentImgs.length - 1) {
      state.lightboxSubIndex += 1;
    } else {
      state.lightboxIndex = (state.lightboxIndex + 1) % state.filteredFeedbacks.length;
      state.lightboxSubIndex = 0;
    }
    state.zoom = 1;
    state.panX = 0;
    state.panY = 0;
    updateLightboxContent();
  }

  function bindLightboxGestures() {
    if (!els.lightboxStage) return;

    // Lăn chuột để zoom trên PC
    els.lightboxStage.addEventListener('wheel', (e) => {
      if (!els.lightboxModal.classList.contains('open')) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.25 : -0.25;
      setLightboxZoom(state.zoom + delta);
    }, { passive: false });

    // Nhấp đúp để bật/tắt zoom 200%
    els.lightboxImg.addEventListener('dblclick', (e) => {
      e.preventDefault();
      setLightboxZoom(state.zoom > 1 ? 1 : 2);
    });

    // Kéo chuột khi đang phóng to > 100%
    els.lightboxStage.addEventListener('mousedown', (e) => {
      if (state.zoom <= 1 || e.target.closest('button')) return;
      e.preventDefault();
      state.isDragging = true;
      state.dragStartX = e.clientX - state.panX;
      state.dragStartY = e.clientY - state.panY;
      els.lightboxStage.classList.add('is-dragging');
    });

    window.addEventListener('mousemove', (e) => {
      if (!state.isDragging) return;
      state.panX = e.clientX - state.dragStartX;
      state.panY = e.clientY - state.dragStartY;
      applyLightboxTransform();
    });

    window.addEventListener('mouseup', () => {
      if (!state.isDragging) return;
      state.isDragging = false;
      els.lightboxStage.classList.remove('is-dragging');
    });

    // Cử chỉ chạm trên điện thoại: Vuốt ngang chuyển ảnh (khi zoom = 1) hoặc kéo ảnh (khi zoom > 1) + chạm đúp
    els.lightboxStage.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const now = Date.now();
        if (now - state.lastTapTime < 280) {
          e.preventDefault();
          setLightboxZoom(state.zoom > 1 ? 1 : 2);
          state.lastTapTime = 0;
          return;
        }
        state.lastTapTime = now;

        if (state.zoom > 1) {
          state.isDragging = true;
          state.dragStartX = touch.clientX - state.panX;
          state.dragStartY = touch.clientY - state.panY;
          els.lightboxStage.classList.add('is-dragging');
        } else {
          state.swipeStartX = touch.clientX;
          state.swipeStartY = touch.clientY;
        }
      }
    }, { passive: false });

    els.lightboxStage.addEventListener('touchmove', (e) => {
      if (!state.isDragging || state.zoom <= 1 || e.touches.length !== 1) return;
      e.preventDefault();
      const touch = e.touches[0];
      state.panX = touch.clientX - state.dragStartX;
      state.panY = touch.clientY - state.dragStartY;
      applyLightboxTransform();
    }, { passive: false });

    els.lightboxStage.addEventListener('touchend', (e) => {
      if (state.isDragging) {
        state.isDragging = false;
        els.lightboxStage.classList.remove('is-dragging');
        return;
      }
      if (state.zoom === 1 && state.swipeStartX && e.changedTouches.length === 1) {
        const dx = e.changedTouches[0].clientX - state.swipeStartX;
        const dy = e.changedTouches[0].clientY - state.swipeStartY;
        state.swipeStartX = 0;
        state.swipeStartY = 0;
        if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.35) {
          if (dx < 0) {
            stepLightboxNext();
          } else {
            stepLightboxPrev();
          }
        }
      }
    });
  }

  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;
    const sections = ['about', 'feedbacks', 'articles', 'tools', 'booking']
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    const setActiveNav = (activeId) => {
      document.querySelectorAll('.nav-link[data-nav-section], .mobile-nav-pill[data-nav-section]').forEach((link) => {
        const isMatch = link.getAttribute('data-nav-section') === activeId;
        link.classList.toggle('active', isMatch);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveNav(visible[0].target.id);
        }
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0.1, 0.35] }
    );

    sections.forEach((sec) => observer.observe(sec));
  }

  function bindEvents() {
    els.themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });

    if (els.bookingCards) {
      els.bookingCards.addEventListener('click', async (e) => {
        const copyBtn = e.target.closest('[data-copy-text]');
        if (!copyBtn) return;
        const txt = copyBtn.getAttribute('data-copy-text');
        if (!txt) return;
        try {
          await navigator.clipboard.writeText(txt);
          showToast(`Đã sao chép số Zalo: ${txt}`);
        } catch {
          showToast(`Số Zalo: ${txt}`);
        }
      });
    }

    document.querySelectorAll('[data-fb-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-fb-filter]').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        state.fbFilter = btn.getAttribute('data-fb-filter');
        renderFeedbacks();
      });
    });

    els.feedbackSearch.addEventListener('input', (e) => {
      state.fbQuery = e.target.value;
      renderFeedbacks();
    });

    if (els.feedbackSearchClear) {
      els.feedbackSearchClear.addEventListener('click', () => {
        els.feedbackSearch.value = '';
        state.fbQuery = '';
        renderFeedbacks();
        els.feedbackSearch.focus();
      });
    }

    if (els.resetFbFilterBtn) {
      els.resetFbFilterBtn.addEventListener('click', () => {
        state.fbFilter = 'all';
        state.fbQuery = '';
        els.feedbackSearch.value = '';
        document.querySelectorAll('[data-fb-filter]').forEach((b) => {
          const isAll = b.getAttribute('data-fb-filter') === 'all';
          b.classList.toggle('active', isAll);
          b.setAttribute('aria-selected', isAll ? 'true' : 'false');
        });
        renderFeedbacks();
      });
    }

    document.querySelectorAll('[data-art-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-art-filter]').forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
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
      state.panX = 0;
      state.panY = 0;
      updateLightboxContent();
    });

    els.articleGrid.addEventListener('click', (e) => {
      const card = e.target.closest('[data-open-article]');
      if (!card) return;
      openArticleModal(card.getAttribute('data-open-article'));
    });

    els.articleGrid.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('[data-open-article]');
      if (!card) return;
      e.preventDefault();
      openArticleModal(card.getAttribute('data-open-article'));
    });

    if (els.lbCloseBtn) els.lbCloseBtn.addEventListener('click', closeLightbox);
    if (els.lbStageCloseBtn) els.lbStageCloseBtn.addEventListener('click', closeLightbox);
    if (els.articleModalClose) els.articleModalClose.addEventListener('click', closeArticleModal);

    if (els.lbBookingCta) {
      els.lbBookingCta.addEventListener('click', () => {
        closeLightbox();
      });
    }
    if (els.artBookingCta) {
      els.artBookingCta.addEventListener('click', () => {
        closeArticleModal();
      });
    }

    els.lightboxModal.addEventListener('click', (e) => {
      if (e.target === els.lightboxModal) closeLightbox();
    });
    els.articleModal.addEventListener('click', (e) => {
      if (e.target === els.articleModal) closeArticleModal();
    });

    document.getElementById('lbPrevBtn').addEventListener('click', stepLightboxPrev);
    document.getElementById('lbNextBtn').addEventListener('click', stepLightboxNext);

    document.getElementById('lbZoomInBtn').addEventListener('click', () => {
      setLightboxZoom(state.zoom + 0.25);
    });

    document.getElementById('lbZoomOutBtn').addEventListener('click', () => {
      setLightboxZoom(state.zoom - 0.25);
    });

    if (els.lbZoomResetBtn) {
      els.lbZoomResetBtn.addEventListener('click', () => {
        setLightboxZoom(1);
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLightbox();
        closeArticleModal();
      } else if (els.lightboxModal.classList.contains('open')) {
        if (e.key === 'ArrowLeft') stepLightboxPrev();
        if (e.key === 'ArrowRight') stepLightboxNext();
        if (e.key === '+' || e.key === '=') setLightboxZoom(state.zoom + 0.25);
        if (e.key === '-') setLightboxZoom(state.zoom - 0.25);
        if (e.key === '0') setLightboxZoom(1);
      }
    });

    bindLightboxGestures();
    initScrollSpy();
  }

  function applyLoadedData(data) {
    state.profile = data.profile || {};
    state.feedbacks = Array.isArray(data.feedbacks) ? data.feedbacks : [];
    state.articles = Array.isArray(data.articles) ? data.articles : [];
    renderProfile();
    updateFilterTabCounts();
    renderFeedbacks();
    renderArticles();
  }

  async function init() {
    document.getElementById('currentYear').textContent = String(new Date().getFullYear());
    initTheme();
    bindEvents();

    if (window.__INITIAL_DATA__ && typeof window.__INITIAL_DATA__ === 'object') {
      applyLoadedData(window.__INITIAL_DATA__);
      return;
    }

    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      applyLoadedData(data);
    } catch (err) {
      console.error(err);
    }
  }

  init();
})();
