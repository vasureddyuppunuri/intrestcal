

const App = (() => {
  'use strict';

  let currentPage = 'dashboard';
  let currentFilter = 'all';
  let currentLoanId = null;
  let allLoans = [];
  let userName = '';

  // ─── Init ─────────────────────────────────────────────────

  async function init() {
    await Store.open();

    // Remove legacy mock user if found in localStorage
    if (localStorage.getItem('interestmate_username') === 'Vanessa') {
      localStorage.removeItem('interestmate_username');
    }

    // Load active local account from device storage
    try {
      const activeAcc = await Store.getActiveAccount();
      if (activeAcc && activeAcc.name) {
        userName = activeAcc.name;
      } else {
        userName = '';
      }
    } catch (e) {
      userName = '';
    }

    await updateGreeting();
    setDefaultDates();
    setupMethodToggle();

    // Initialize multi-language engine
    I18n.applyTranslations();
    I18n.onLanguageChange(() => {
      updateGreeting();
      I18n.applyTranslations();
      refreshDashboard();
      if (currentPage === 'loans') refreshLoans();
    });

    await refreshDashboard();

    // Trigger initial live calculation preview
    onLiveCalculate();

    // Service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    }
  }

  async function updateGreeting() {
    try {
      const activeAcc = await Store.getActiveAccount();
      if (activeAcc && activeAcc.name) {
        userName = activeAcc.name;
      } else {
        userName = '';
      }
    } catch (e) {
      userName = '';
    }

    const greetingTitle = document.getElementById('greeting-title');
    const greetingSub = document.getElementById('greeting-sub');
    const currentLang = (typeof I18n !== 'undefined' && I18n.getLanguage) ? I18n.getLanguage() : 'en';

    if (userName) {
      // Respectful, natural greetings across languages
      let greetingPrefix = 'Hello';
      if (currentLang === 'te') greetingPrefix = 'నమస్కారం';
      else if (currentLang === 'hi') greetingPrefix = 'नमस्ते';
      else if (currentLang === 'ta') greetingPrefix = 'வணக்கம்';
      else if (currentLang === 'kn') greetingPrefix = 'ನಮಸ್ಕಾರ';
      else if (currentLang === 'mr') greetingPrefix = 'नमस्कार';

      if (greetingTitle) greetingTitle.textContent = `${greetingPrefix}, ${userName}`;
      if (greetingSub) greetingSub.textContent = I18n.t('welcome');
    } else {
      if (greetingTitle) greetingTitle.textContent = I18n.t('welcome');
      if (greetingSub) {
        if (currentLang === 'te') greetingSub.textContent = 'ఖాతా సృష్టించడానికి ఇక్కడ తాకండి ›';
        else if (currentLang === 'hi') greetingSub.textContent = 'अपना खाता सेट करने के लिए यहां टैप करें ›';
        else greetingSub.textContent = 'Tap here to set up your account ›';
      }
    }

    // Language code indicator in top header pill
    const langCodeEl = document.getElementById('header-lang-code');
    if (langCodeEl) {
      langCodeEl.textContent = currentLang.toUpperCase();
    }

    // Circular avatar with initials and custom account color
    const avatarEl = document.getElementById('header-avatar');
    if (avatarEl) {
      if (userName) {
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'IM';
        avatarEl.innerHTML = `<span class="avatar-initials">${initials}</span>`;
        try {
          const activeAcc = await Store.getActiveAccount();
          if (activeAcc && activeAcc.color) {
            avatarEl.style.background = activeAcc.color;
          }
        } catch (e) {}
      } else {
        avatarEl.innerHTML = `<span class="material-symbols-outlined" style="font-size:22px; color:#FFFFFF;">person</span>`;
        avatarEl.style.background = 'var(--text-dark)';
      }
    }

    // Update settings account name indicator
    const settingsAccEl = document.getElementById('settings-account-name');
    if (settingsAccEl) {
      settingsAccEl.textContent = userName ? `${userName} (Active Profile)` : 'Set Up Your Account';
    }
  }

  function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    const threeMonths = new Date();
    threeMonths.setMonth(threeMonths.getMonth() + 3);
    const startInput = document.getElementById('calc-start');
    const endInput = document.getElementById('calc-end');
    if (startInput) startInput.value = today;
    if (endInput) endInput.value = threeMonths.toISOString().split('T')[0];
  }

  function setupMethodToggle() {
    const methodSelect = document.getElementById('calc-method');
    if (!methodSelect) return;
    methodSelect.addEventListener('change', () => {
      const compoundGroup = document.getElementById('calc-compound-group');
      if (compoundGroup) {
        compoundGroup.style.display = methodSelect.value === 'compound' ? 'block' : 'none';
      }
      onLiveCalculate();
    });
  }

  function onMethodChanged() {
    setupMethodToggle();
  }

  // ─── Navigation ───────────────────────────────────────────

  function navigate(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.capsule-nav-item').forEach(n => n.classList.remove('active'));

    const pageEl = document.getElementById('page-' + page);
    if (pageEl) {
      pageEl.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const navBtn = document.querySelector(`.capsule-nav-item[data-page="${page}"]`);
    if (navBtn) navBtn.classList.add('active');

    currentPage = page;

    // Refresh data per page
    switch (page) {
      case 'dashboard': refreshDashboard(); break;
      case 'loans': refreshLoans(); break;
      case 'bonds': refreshBonds(); break;
      case 'transactions': refreshTransactions(); break;
      case 'audit': refreshAudit(); break;
    }

    // Keep center dock FAB visible across all pages
    const fab = document.getElementById('main-fab');
    if (fab) {
      fab.style.display = 'grid';
    }
  }

  // ─── Dashboard ────────────────────────────────────────────

  async function refreshDashboard() {
    try {
      const stats = await Store.getDashboardStats();
      const allLoansList = await Store.getLoansForActiveAccount();

      // 1. Swipeable Green Cards (Generated strictly per user/counterparty)
      const activeAcc = await Store.getActiveAccount();
      const cardName = (activeAcc && activeAcc.name) ? activeAcc.name.toUpperCase() : (userName ? userName.toUpperCase() : 'PERSONAL ACCOUNT');
      await renderNeonCards(stats, allLoansList, cardName);

      // 2. Category Accounts Stack (Image 2 style)
      const lentAmountEl = document.getElementById('stat-lent-amount');
      const lentCountEl = document.getElementById('stat-lent-count');
      const lentInterestSubEl = document.getElementById('stat-lent-interest-sub');
      if (lentAmountEl) lentAmountEl.textContent = CalcEngine.formatINR(stats.moneyLentPaise);
      if (lentCountEl) {
        lentCountEl.textContent = `${stats.activeLentCount || 0} ${I18n.t('filterActive').toLowerCase()}`;
      }
      if (lentInterestSubEl) {
        lentInterestSubEl.textContent = `+${CalcEngine.formatINR(stats.lentInterestPaise)} came`;
      }

      const borrowedAmountEl = document.getElementById('stat-borrowed-amount');
      const borrowedCountEl = document.getElementById('stat-borrowed-count');
      const borrowedInterestSubEl = document.getElementById('stat-borrowed-interest-sub');
      if (borrowedAmountEl) borrowedAmountEl.textContent = CalcEngine.formatINR(stats.moneyBorrowedPaise);
      if (borrowedCountEl) {
        borrowedCountEl.textContent = `${stats.activeBorrowedCount || 0} ${I18n.t('filterActive').toLowerCase()}`;
      }
      if (borrowedInterestSubEl) {
        borrowedInterestSubEl.textContent = `-${CalcEngine.formatINR(stats.borrowedInterestPaise)} to pay`;
      }

      // Interest Came (Earned from money lent)
      const interestCameEl = document.getElementById('stat-interest-came');
      if (interestCameEl) {
        interestCameEl.textContent = `+${CalcEngine.formatINR(stats.lentInterestPaise)}`;
      }

      // Interest to Pay (Owed on money borrowed)
      const interestToPayEl = document.getElementById('stat-interest-to-pay');
      if (interestToPayEl) {
        interestToPayEl.textContent = `-${CalcEngine.formatINR(stats.borrowedInterestPaise)}`;
      }

      const settledAmountEl = document.getElementById('stat-settled-amount');
      const settledCountEl = document.getElementById('stat-settled-count');
      if (settledAmountEl) settledAmountEl.textContent = stats.settledCount;
      if (settledCountEl) settledCountEl.textContent = `${stats.settledCount} ${I18n.t('filterSettled').toLowerCase()}`;

      // 3. Recent Loans List
      renderRecentLoans(stats.recentLoans);

      // 4. Recent Activity
      await renderRecentActivity();

      I18n.applyTranslations();
    } catch (e) {
      console.error('Dashboard refresh error:', e);
    }
  }

  // Active cards state for real-time sync with top hero balance
  let currentCardsData = [];

  function updateActiveCardDisplay(index) {
    const megaBalanceEl = document.getElementById('dash-mega-balance');
    const labelEl = document.getElementById('hero-balance-label');
    if (!currentCardsData || currentCardsData.length === 0) {
      if (megaBalanceEl) megaBalanceEl.textContent = '₹0.00';
      if (labelEl) labelEl.textContent = I18n.t('myBalance') || 'Balance';
      return;
    }
    const safeIndex = Math.max(0, Math.min(index, currentCardsData.length - 1));
    const card = currentCardsData[safeIndex];
    if (megaBalanceEl && card) {
      megaBalanceEl.textContent = card.displayAmount;
    }
    if (labelEl && card) {
      labelEl.textContent = card.displayLabel;
    }
  }

  // Dynamically adds green cards ONLY when data is added by the user
  // Cards are created strictly according to the number of users (counterparties)
  async function renderNeonCards(stats, loans, cardName) {
    const track = document.getElementById('neon-cards-track');
    const dotsRow = document.getElementById('neon-carousel-dots');
    const stackBack = document.getElementById('card-stack-back');
    const stackMid = document.getElementById('card-stack-mid');
    if (!track) return;

    const activeLoans = (loans || []).filter(l => l.status === 'active' || l.status === 'closed-outstanding');

    // When NO data added by user: show clean empty placeholder card (no green cards)
    if (activeLoans.length === 0) {
      currentCardsData = [];
      updateActiveCardDisplay(0);

      if (stackBack) stackBack.style.display = 'none';
      if (stackMid) stackMid.style.display = 'none';
      if (dotsRow) {
        dotsRow.style.display = 'none';
        dotsRow.innerHTML = '';
      }

      track.innerHTML = `
        <div class="empty-neon-card">
          <div class="empty-card-icon">
            <span class="material-symbols-outlined" style="font-size:26px;">add_card</span>
          </div>
          <div class="empty-card-title">No Green Cards Added Yet</div>
          <div class="empty-card-sub">Green dues cards with live interest will automatically appear here once you add your loan records.</div>
          <button class="empty-card-add-btn" onclick="App.openCreateLoan()">
            <span class="material-symbols-outlined" style="font-size:18px;">add</span>
            <span>Add Loan</span>
          </button>
        </div>
      `;
      return;
    }

    // Group active loans by user/counterparty so cards are according to number of users
    const today = new Date().toISOString().split('T')[0];
    const userGroups = new Map();

    for (const loan of activeLoans) {
      const rawName = (loan.counterparty || '').trim() || 'Personal';
      const key = rawName.toLowerCase();
      if (!userGroups.has(key)) {
        userGroups.set(key, {
          name: rawName,
          loans: []
        });
      }
      userGroups.get(key).loans.push(loan);
    }

    currentCardsData = [];
    const cards = [];

    for (const [key, group] of userGroups.entries()) {
      let totalDues = 0;
      let totalPrincipal = 0;
      let totalInterestCame = 0;
      let totalInterestToPay = 0;
      let lentCount = 0;
      let borrowedCount = 0;
      let primaryLoanId = group.loans[0].id;
      let refSubtitle = '';

      for (const loan of group.loans) {
        if (!loan.payments) {
          try {
            loan.payments = await Store.getLoanPayments(loan.id);
          } catch (err) {
            loan.payments = [];
          }
        }
        const pos = CalcEngine.calculateLoanPosition(loan, today);
        totalDues += pos.totalOutstandingPaise;
        totalPrincipal += pos.outstandingPrincipalPaise;

        if (loan.counterpartyType === 'lender') {
          totalInterestToPay += pos.unpaidInterestPaise;
          borrowedCount++;
        } else {
          totalInterestCame += pos.unpaidInterestPaise;
          lentCount++;
        }
      }

      const isLenderOnly = borrowedCount > 0 && lentCount === 0;
      const isLentOnly = lentCount > 0 && borrowedCount === 0;
      const roleTag = isLenderOnly ? 'BORROWED' : (isLentOnly ? 'LENT' : 'ACTIVE USER');
      const duesLabel = isLenderOnly ? 'Total to Pay' : (isLentOnly ? 'Total to Collect' : 'Net Dues');
      const formattedAmount = CalcEngine.formatINR(totalDues);
      const formattedPrincipal = CalcEngine.formatINR(totalPrincipal);

      let breakdownText = '';
      if (isLenderOnly) {
        breakdownText = `Principal: ${formattedPrincipal} • <span class="text-red-pay">Interest to pay: -${CalcEngine.formatINR(totalInterestToPay)}</span>`;
      } else if (isLentOnly) {
        breakdownText = `Principal: ${formattedPrincipal} • <span class="text-green-came">Interest came: +${CalcEngine.formatINR(totalInterestCame)}</span>`;
      } else {
        breakdownText = `<span class="text-green-came">Came: +${CalcEngine.formatINR(totalInterestCame)}</span> • <span class="text-red-pay">To pay: -${CalcEngine.formatINR(totalInterestToPay)}</span>`;
      }

      if (group.loans.length === 1) {
        const l0 = group.loans[0];
        refSubtitle = `${l0.ref} • ${l0.rate}% ${l0.ratePeriod}`;
      } else {
        refSubtitle = `${group.loans.length} Active Loans`;
      }

      // Store in currentCardsData for real-time hero balance synchronization on scroll/swipe
      currentCardsData.push({
        displayAmount: formattedAmount,
        displayLabel: `${group.name.toUpperCase()} • ${duesLabel}`
      });

      cards.push(`
        <div class="neon-gradient-card" onclick="App.openLoanDetail('${primaryLoanId}')" style="cursor:pointer;" title="Tap to view loan details">
          <div class="card-top-row">
            <div class="card-chip-brand">
              <span class="contactless-waves material-symbols-outlined" style="font-size:20px;">contactless</span>
              <span class="card-chip-tag">${roleTag}</span>
            </div>
            <div class="card-holder-name neon-card-user-name">${escapeHtml(group.name.toUpperCase())}</div>
          </div>
          <div class="card-middle-row">
            <div class="masked-card-id">${refSubtitle}</div>
          </div>
          <div class="card-bottom-row">
            <div class="card-due-col">
              <div class="card-due-label">${duesLabel}</div>
              <div class="card-due-value">${formattedAmount}</div>
              <div class="card-breakdown-row">${breakdownText}</div>
            </div>
            <span class="card-brand-logo">CARD</span>
          </div>
        </div>
      `);
    }

    // Stack depth backdrop layers visible only when multiple cards exist
    if (stackBack) stackBack.style.display = cards.length > 1 ? 'block' : 'none';
    if (stackMid) stackMid.style.display = cards.length > 1 ? 'block' : 'none';

    track.innerHTML = cards.join('');

    // Update pagination dots
    if (dotsRow) {
      if (cards.length > 1) {
        dotsRow.style.display = 'flex';
        dotsRow.innerHTML = cards.map((_, i) =>
          `<span class="carousel-dot ${i === 0 ? 'active' : ''}" onclick="App.scrollToNeonSlide(${i})"></span>`
        ).join('');
      } else {
        dotsRow.style.display = 'none';
        dotsRow.innerHTML = '';
      }
    }

    // Immediately display active card 0's amount and label in top hero
    updateActiveCardDisplay(0);
  }

  function onNeonScroll(trackEl) {
    if (!trackEl) return;
    const cardWidth = trackEl.offsetWidth;
    if (cardWidth > 0) {
      const scrollIndex = Math.round(trackEl.scrollLeft / cardWidth);
      updateNeonDots(scrollIndex);
    }
  }

  function scrollToNeonSlide(index) {
    const track = document.getElementById('neon-cards-track');
    if (!track) return;
    const cardWidth = track.offsetWidth;
    track.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
    updateNeonDots(index);
  }

  function updateNeonDots(activeIndex) {
    const dots = document.querySelectorAll('#neon-carousel-dots .carousel-dot');
    dots.forEach((dot, idx) => {
      dot.classList.toggle('active', idx === activeIndex);
    });
    updateActiveCardDisplay(activeIndex);
  }

  function renderRecentLoans(loans) {
    const container = document.getElementById('dashboard-recent-loans');
    if (!container) return;

    if (!loans || loans.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <h3 class="empty-title" data-i18n="noLoansYet">${I18n.t('noLoansYet')}</h3>
          <p class="empty-sub" data-i18n="noLoansDesc">${I18n.t('noLoansDesc')}</p>
          <button class="pill-primary-btn" onclick="App.openCreateLoan()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span data-i18n="createLoan">${I18n.t('createLoan')}</span>
          </button>
        </div>`;
      return;
    }

    container.innerHTML = loans.map(loan => renderTransactionLoanRow(loan)).join('');
  }

  // Modern transaction item row matching attached reference image
  function renderTransactionLoanRow(loan) {
    const isLent = loan.counterpartyType !== 'lender';
    const today = new Date().toISOString().split('T')[0];
    const pos = CalcEngine.calculateLoanPosition(loan, today);
    const amountStr = CalcEngine.formatINR(pos.totalOutstandingPaise);

    return `
      <div class="transaction-item-row" onclick="App.openLoanDetail('${loan.id}')">
        <div class="transaction-icon-box ${isLent ? 'lent' : 'borrowed'}">
          <span class="material-symbols-outlined" style="font-size:22px;">
            ${isLent ? 'arrow_upward' : 'arrow_downward'}
          </span>
        </div>
        <div class="transaction-item-info">
          <div class="transaction-item-title">${escapeHtml(loan.counterparty || 'Unnamed')}</div>
          <div class="transaction-item-sub">
            ${isLent ? I18n.t('moneyLent') : I18n.t('moneyBorrowed')} • ${pos.duration.totalDays}d • ${loan.rate}% ${loan.ratePeriod}
          </div>
        </div>
        <div class="transaction-item-amount-col">
          <div class="transaction-item-amount ${isLent ? 'text-green-came' : 'text-red-pay'}">
            ${isLent ? '+' : '-'}${amountStr}
          </div>
          <div class="transaction-item-rate">
            ${isLent ? '+' : '-'}${CalcEngine.formatINR(pos.accruedInterestPaise)} interest
          </div>
        </div>
      </div>
    `;
  }

  // Feature Card styled after Image 1 (Travel card aesthetic) with Smart Days Running tracking
  function renderFeatureLoanCard(loan) {
    const statusMap = {
      draft: { label: I18n.t('filterDraft'), class: 'badge-draft' },
      active: { label: I18n.t('filterActive'), class: 'badge-active' },
      'closed-settled': { label: I18n.t('filterSettled'), class: 'badge-settled' },
      'closed-outstanding': { label: I18n.t('filterOutstanding'), class: 'badge-outstanding' }
    };
    const status = statusMap[loan.status] || statusMap.draft;
    const isLender = loan.counterpartyType !== 'lender';
    const typeLabel = isLender ? I18n.t('borrower') : I18n.t('lender');

    const today = new Date().toISOString().split('T')[0];
    const pos = CalcEngine.calculateLoanPosition(loan, today);

    return `
      <div class="feature-loan-card" onclick="App.openLoanDetail('${loan.id}')">
        <div class="card-header-line">
          <span class="loan-category-tag">${typeLabel} • ${loan.ref}</span>
          <span class="badge ${status.class}">${status.label}</span>
        </div>

        <div class="feature-loan-title">${escapeHtml(loan.counterparty || 'Unnamed')}</div>

        <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:14px;">
          <!-- Smart Days Running Badge -->
          <div class="days-running-pill">
            <span>⏱️</span>
            <span>${pos.duration.totalDays} Days (${pos.duration.breakdownText})</span>
          </div>

          <!-- Interest Pill -->
          <div class="rating-info-pill" style="margin-bottom:0;">
            <span class="star-icon">⚡</span>
            <span>${loan.rate}% ${loan.ratePeriod}</span>
            <span style="opacity:0.4;">|</span>
            <span>${CalcEngine.formatINR(pos.dailyAccrualPaise)}/day</span>
          </div>

          <!-- Due status badge if applicable -->
          ${pos.dueInfo ? `
            <span class="due-status-badge ${pos.dueInfo.status}">
              ${pos.dueInfo.badge}
            </span>
          ` : ''}
        </div>

        <div class="card-footer-action-row">
          <div class="loan-card-amount-block">
            <span class="card-amount-label">${I18n.t('outstandingPrincipal')}</span>
            <span class="card-amount-val">${CalcEngine.formatINR(pos.totalOutstandingPaise)}</span>
          </div>

          <button class="see-more-pill-btn" onclick="event.stopPropagation(); App.openLoanDetail('${loan.id}')">
            <span>${I18n.t('seeMore')}</span>
            <span class="circle-arrow-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
          </button>
        </div>
      </div>`;
  }

  async function renderRecentActivity() {
    const events = await Store.getAllAudit();
    const recent = events.slice(0, 5);
    const header = document.getElementById('activity-header');
    const container = document.getElementById('dashboard-activity');

    if (!header || !container) return;

    if (recent.length === 0) {
      header.style.display = 'none';
      container.style.display = 'none';
      return;
    }

    header.style.display = 'flex';
    container.style.display = 'block';

    container.innerHTML = recent.map(ev => {
      const timeAgo = getTimeAgo(ev.timestamp);
      return `
        <div class="account-card" style="margin-bottom:8px; padding:12px 14px;">
          <div class="account-icon-box blue-box" style="width:36px; height:36px; border-radius:10px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="account-details">
            <div class="account-name" style="font-size:13.5px;">${escapeHtml(ev.description)}</div>
            <div class="account-subtitle">${timeAgo}</div>
          </div>
        </div>`;
    }).join('');
  }

  // ─── Filter Pills & Search ────────────────────────────────

  function setCategoryFilter(filter, btn) {
    document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');

    if (filter === 'lent' || filter === 'borrowed' || filter === 'settled') {
      filterAndNavigateLoans(filter);
    } else {
      currentFilter = filter;
      refreshDashboard();
    }
  }

  function filterAndNavigateLoans(category) {
    navigate('loans');
    let targetFilter = 'all';
    if (category === 'settled') targetFilter = 'closed-settled';
    setLoanFilter(targetFilter);
  }

  function onDashboardSearch(query) {
    if (!query || query.trim() === '') {
      refreshDashboard();
      return;
    }
    const q = query.toLowerCase().trim();
    Store.getAll('loans').then(loans => {
      const filtered = loans.filter(l =>
        (l.counterparty && l.counterparty.toLowerCase().includes(q)) ||
        (l.ref && l.ref.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q))
      );
      renderRecentLoans(filtered);
    });
  }

  // ─── Elder-Friendly 1-Tap Preset Helpers ──────────────────

  function addCalcAmount(delta) {
    const el = document.getElementById('calc-principal');
    if (!el) return;
    const cur = parseFloat(el.value) || 0;
    el.value = cur + delta;
    onLiveCalculate();
  }

  function setCalcAmount(val) {
    const el = document.getElementById('calc-principal');
    if (!el) return;
    el.value = val > 0 ? val : '';
    onLiveCalculate();
  }

  function setCalcRate(rate) {
    const el = document.getElementById('calc-rate');
    if (!el) return;
    el.value = rate;
    onLiveCalculate();
  }

  function setCalcDurationMonths(months) {
    const startEl = document.getElementById('calc-start');
    const endEl = document.getElementById('calc-end');
    if (!startEl || !endEl) return;
    const sDate = startEl.value ? new Date(startEl.value) : new Date();
    const eDate = new Date(sDate);
    eDate.setMonth(eDate.getMonth() + months);
    endEl.value = eDate.toISOString().split('T')[0];
    onLiveCalculate();
  }

  // ─── Live Interest Calculator ─────────────────────────────

  function onLiveCalculate() {
    const principalInput = document.getElementById('calc-principal');
    const rateInput = document.getElementById('calc-rate');
    const startInput = document.getElementById('calc-start');
    const endInput = document.getElementById('calc-end');
    const ratePeriodInput = document.getElementById('calc-rate-period');
    const methodInput = document.getElementById('calc-method');
    const dayCountInput = document.getElementById('calc-daycount');
    const compoundFreqInput = document.getElementById('calc-compound-freq');

    if (!principalInput || !rateInput || !startInput || !endInput) return;

    const principal = parseFloat(principalInput.value);
    const rate = parseFloat(rateInput.value);
    const startDate = startInput.value;
    const endDate = endInput.value;

    const resultArea = document.getElementById('calc-result-area');
    if (!resultArea) return;

    if (!principal || principal <= 0 || isNaN(rate) || rate < 0 || !startDate || !endDate) {
      resultArea.innerHTML = '';
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      resultArea.innerHTML = `
        <div class="calc-result-card" style="border-color: var(--red-primary); padding: 16px;">
          <p style="color: var(--red-primary); font-weight:700; font-size:13px;">${I18n.t('invalidDates')}</p>
        </div>`;
      return;
    }

    const principalPaise = CalcEngine.toPaise(principal);
    const ratePeriod = ratePeriodInput.value;
    const method = methodInput.value;
    const dayCount = dayCountInput.value;
    const compoundFreq = compoundFreqInput ? compoundFreqInput.value : 'monthly';

    let result;
    if (method === 'compound') {
      result = CalcEngine.compoundInterest(principalPaise, rate, ratePeriod, startDate, endDate, compoundFreq, dayCount);
    } else {
      result = CalcEngine.simpleInterest(principalPaise, rate, ratePeriod, startDate, endDate, dayCount);
    }

    const totalPaise = principalPaise + result.interestPaise;
    const duration = CalcEngine.getHumanDuration(startDate, endDate);
    const dailyAccrual = CalcEngine.getDailyAccrualPaise(principalPaise, rate, ratePeriod);
    const elder = CalcEngine.getElderExplanation(principalPaise, rate, ratePeriod);

    // Pick translation matching current language
    const currentLang = I18n.getLanguage();
    let explanationText = elder.explanationEn;
    if (currentLang === 'te') explanationText = elder.explanationTe;
    else if (currentLang === 'hi') explanationText = elder.explanationHi;
    else if (currentLang === 'ta') explanationText = elder.explanationTa;
    else if (currentLang === 'kn') explanationText = elder.explanationKn;
    else if (currentLang === 'mr') explanationText = elder.explanationMr;

    resultArea.innerHTML = `
      <div class="calc-result-card">
        <!-- Smart Days Going On Banner -->
        <div class="days-running-pill-lg">
          <div>
            <div class="main-duration"><span class="material-symbols-outlined" style="font-size:16px; vertical-align:-2px; margin-right:4px;">schedule</span>${duration.totalDays} Days (${duration.breakdownText})</div>
            <div class="sub-accrual">From ${CalcEngine.formatDate(startDate)} to ${CalcEngine.formatDate(endDate)}</div>
          </div>
          <div style="text-align:right;">
            <div class="sub-accrual" style="font-size:14px; color:#1E1B4B; font-weight:800;">${CalcEngine.formatINR(dailyAccrual)}</div>
            <div style="font-size:11px; color:#4338CA;">Daily Interest</div>
          </div>
        </div>

        <!-- Elder Plain-Language Explanation -->
        <div class="elder-explanation-box">
          <div class="elder-explanation-header">
            <span class="material-symbols-outlined" style="font-size:18px; color:#D97706;">lightbulb</span>
            <span>Simple Plain Meaning:</span>
          </div>
          <div class="elder-explanation-text">
            ${explanationText}
          </div>
        </div>

        <div class="result-hero-box">
          <div class="result-hero-label">${I18n.t('totalMaturity')}</div>
          <div class="result-hero-value">${CalcEngine.formatINR(totalPaise)}</div>
        </div>

        <div class="result-grid-metrics">
          <div class="metric-tile">
            <div class="metric-tile-label">${I18n.t('principalAmount')}</div>
            <div class="metric-tile-val">${CalcEngine.formatINR(principalPaise)}</div>
          </div>
          <div class="metric-tile">
            <div class="metric-tile-label">${I18n.t('totalInterest')}</div>
            <div class="metric-tile-val" style="color:var(--blue-primary);">${CalcEngine.formatINR(result.interestPaise)}</div>
          </div>
          <div class="metric-tile">
            <div class="metric-tile-label">${I18n.t('elapsedTime')}</div>
            <div class="metric-tile-val">${duration.totalDays} ${I18n.t('days')}</div>
          </div>
          <div class="metric-tile">
            <div class="metric-tile-label">${I18n.t('ratePeriod')}</div>
            <div class="metric-tile-val">${rate}% ${ratePeriod}</div>
          </div>
        </div>

        <div class="audit-steps-box">
          <div class="audit-steps-title">${I18n.t('calcBreakdown')}</div>
          ${result.steps.map(s => `<div class="audit-step-item">• ${escapeHtml(s)}</div>`).join('')}
        </div>

        <button class="pill-primary-btn btn-full" onclick="App.saveCalcAsLoan(${principal}, ${rate}, '${ratePeriod}', '${method}', '${dayCount}', '${startDate}', '${endDate}')">
          <span class="material-symbols-outlined" style="font-size:18px;">bookmark</span>
          <span>${I18n.t('saveAsDraft')}</span>
        </button>
      </div>`;
  }

  function calculate() {
    onLiveCalculate();
    const resultArea = document.getElementById('calc-result-area');
    if (resultArea && resultArea.firstElementChild) {
      resultArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    showToast('Calculation updated', 'success');
  }

  function saveCalcAsLoan(principal, rate, ratePeriod, method, dayCount, startDate, dueDate) {
    openModal(I18n.t('saveAsDraft'), `
      <div class="form-group">
        <label class="form-label">${I18n.t('counterparty')}</label>
        <input type="text" class="form-input" id="draft-counterparty" placeholder="Name of borrower or lender">
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('counterpartyType')}</label>
        <select class="form-select" id="draft-role">
          <option value="borrower" selected>${I18n.t('borrower')}</option>
          <option value="lender">${I18n.t('lender')}</option>
        </select>
      </div>
      <button class="btn btn-primary btn-full mt-lg" onclick="App.submitCalcAsDraft(${principal}, ${rate}, '${ratePeriod}', '${method}', '${dayCount}', '${startDate}', '${dueDate}')">
        ${I18n.t('confirm')}
      </button>
    `);
  }

  async function submitCalcAsDraft(principal, rate, ratePeriod, method, dayCount, startDate, dueDate) {
    const cp = document.getElementById('draft-counterparty').value.trim();
    if (!cp) return showToast('Please enter a name', 'error');
    const role = document.getElementById('draft-role').value;

    const loan = await Store.createLoan({
      counterparty: cp,
      counterpartyType: role,
      principal,
      rate,
      ratePeriod,
      interestMethod: method,
      dayCountConvention: dayCount,
      startDate,
      dueDate,
      notes: `Calculated on ${new Date().toLocaleDateString()}`
    });

    closeModal();
    showToast(I18n.t('loanCreatedSuccess'), 'success');
    navigate('loans');
  }

  // ─── Multi-Language Modal ─────────────────────────────────

  function openLanguageModal() {
    const langs = I18n.getLanguages();
    const current = I18n.getLanguage();

    const bodyHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:13.5px; color:var(--text-secondary); margin-bottom:14px;">
          Choose your preferred language for calculations, numbers, and navigation.
        </p>
        ${langs.map(l => `
          <div class="language-option-card ${l.code === current ? 'selected' : ''}" onclick="App.selectLanguage('${l.code}')">
            <div class="lang-left">
              <span class="lang-flag">${l.flag}</span>
              <div>
                <div class="lang-name-native">${l.native}</div>
                <div class="lang-name-en">${l.name}</div>
              </div>
            </div>
            <div class="lang-check-circle">
              ${l.code === current ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg>' : ''}
            </div>
          </div>
        `).join('')}
      </div>`;

    openModal(I18n.t('languageOption'), bodyHtml);
  }

  function selectLanguage(langCode) {
    I18n.setLanguage(langCode);
    closeModal();
    showToast(I18n.t('languageChanged'), 'success');
  }

  // ─── Local Accounts Management (100% On-Device) ───────────

  let selectedAccountColor = '#1A6FE8';

  async function openAccountModal() {
    const accounts = await Store.getAccounts();
    if (!accounts || accounts.length === 0) {
      openCreateAccount(true);
      return;
    }

    const active = await Store.getActiveAccount();
    const allLoans = await Store.getAll('loans');

    const bodyHtml = `
      <div style="margin-bottom:16px;">
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:12px; font-weight:600;">
          Select an account or add separate profiles (e.g. Personal, Shop, Farm):
        </p>

        <!-- Accounts List -->
        <div style="display:flex; flex-direction:column; gap:8px;">
          ${accounts.map(acc => {
            const isCurrent = active && acc.id === active.id;
            const initials = acc.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'IM';
            const accLoansCount = allLoans.filter(l => !l.accountId ? (acc.id === accounts[0].id) : l.accountId === acc.id).length;
            const color = acc.color || '#1A6FE8';

            return `
              <div class="account-option-card ${isCurrent ? 'selected' : ''}" onclick="App.switchAccount('${acc.id}')">
                <div class="account-left">
                  <div class="account-avatar-circle" style="background:${color};">
                    ${initials}
                  </div>
                  <div>
                    <div class="account-name-title">
                      ${escapeHtml(acc.name)}
                      ${isCurrent ? '<span class="badge badge-active" style="margin-left:6px; font-size:10px; padding:2px 8px;">Active</span>' : ''}
                    </div>
                    <div class="account-name-sub">
                      ${accLoansCount} ${I18n.t('navLoans').toLowerCase()} • Device Local
                    </div>
                  </div>
                </div>

                <div class="account-actions-box">
                  <button class="account-icon-btn" onclick="event.stopPropagation(); App.openEditAccount('${acc.id}')" title="Edit Account">
                    <span class="material-symbols-outlined" style="font-size:16px;">edit</span>
                  </button>
                  <div class="account-check-circle">
                    ${isCurrent ? '<span class="material-symbols-outlined" style="font-size:16px;">check</span>' : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Add New Account Action -->
        <button class="btn btn-outline btn-full mt-lg" onclick="App.openCreateAccount(false)" style="display:flex; align-items:center; justify-content:center; gap:8px;">
          <span class="material-symbols-outlined" style="font-size:18px;">add</span>
          <span data-i18n="createAccount">${I18n.t('createAccount')}</span>
        </button>
      </div>
    `;

    openModal(I18n.t('accountOption'), bodyHtml);
  }

  async function switchAccount(id) {
    try {
      const acc = await Store.setActiveAccount(id);
      userName = acc.name;
      await updateGreeting();

      await refreshDashboard();
      if (currentPage === 'loans') await refreshLoans();
      if (currentPage === 'transactions') await refreshTransactions();
      if (currentPage === 'audit') await refreshAudit();

      closeModal();
      showToast(`${I18n.t('accountSwitched')}: ${acc.name}`, 'success');
    } catch (e) {
      showToast('Error switching account: ' + e.message, 'error');
    }
  }

  function openCreateAccount(isFirstTime = false) {
    selectedAccountColor = '#1A6FE8';
    const title = isFirstTime ? 'Set Up Your Account' : 'Create Local Account';
    const bodyHtml = `
      <div style="margin-bottom:14px;">
        <p style="font-size:13px; color:var(--text-secondary); margin-bottom:14px; line-height:1.4;">
          ${isFirstTime ? 'Enter your details to log into your personal offline account on this device.' : 'Create a separate profile to isolate your personal, shop, or agricultural loan records on this phone.'}
        </p>

        <!-- Quick 1-tap presets -->
        <label class="form-label">Quick Account Presets</label>
        <div class="preset-pills-row">
          <button type="button" class="preset-pill-chip" onclick="App.setAccountNamePreset('Personal')">Personal</button>
          <button type="button" class="preset-pill-chip" onclick="App.setAccountNamePreset('Shop / Business')">Shop / Business</button>
          <button type="button" class="preset-pill-chip" onclick="App.setAccountNamePreset('Farm & Crop')">Farm & Crop</button>
          <button type="button" class="preset-pill-chip" onclick="App.setAccountNamePreset('Family')">Family</button>
        </div>

        <div class="form-group">
          <label class="form-label">Your Name / Account Name *</label>
          <input type="text" class="form-input" id="new-account-name" placeholder="Enter your actual name" required>
        </div>

        <div class="form-group">
          <label class="form-label">Phone / Mobile (Optional)</label>
          <input type="tel" class="form-input" id="new-account-phone" placeholder="e.g. 9876543210">
        </div>

        <div class="form-group">
          <label class="form-label">Account Color Theme</label>
          <div class="color-picker-palette" id="color-palette-box">
            <div class="color-swatch-circle selected" style="background:#1A6FE8;" onclick="App.selectAccountColor('#1A6FE8', this)"></div>
            <div class="color-swatch-circle" style="background:#12874A;" onclick="App.selectAccountColor('#12874A', this)"></div>
            <div class="color-swatch-circle" style="background:#84CC16;" onclick="App.selectAccountColor('#84CC16', this)"></div>
            <div class="color-swatch-circle" style="background:#8B5CF6;" onclick="App.selectAccountColor('#8B5CF6', this)"></div>
            <div class="color-swatch-circle" style="background:#F97316;" onclick="App.selectAccountColor('#F97316', this)"></div>
            <div class="color-swatch-circle" style="background:#111827;" onclick="App.selectAccountColor('#111827', this)"></div>
          </div>
        </div>

        <div style="font-size:12px; color:var(--green-primary); background:#F0FDF4; padding:8px 12px; border-radius:12px; margin-bottom:16px; display:flex; align-items:center; gap:6px;">
          <span class="material-symbols-outlined" style="font-size:16px;">lock</span>
          Saved 100% inside this phone only. No cloud sync.
        </div>

        <button class="btn btn-primary btn-full" onclick="App.submitCreateAccount(${isFirstTime})">
          ${isFirstTime ? 'Save & Log In to Account' : 'Save & Switch to Account'}
        </button>
      </div>
    `;

    openModal(title, bodyHtml);
  }

  function setAccountNamePreset(name) {
    const input = document.getElementById('new-account-name') || document.getElementById('edit-account-name');
    if (input) input.value = name;
  }

  function selectAccountColor(hex, el) {
    selectedAccountColor = hex;
    document.querySelectorAll('.color-swatch-circle').forEach(s => s.classList.remove('selected'));
    if (el) el.classList.add('selected');
  }

  async function submitCreateAccount(isFirstTime = false) {
    const nameInput = document.getElementById('new-account-name');
    const phoneInput = document.getElementById('new-account-phone');
    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (!name) {
      showToast('Please enter your name', 'error');
      return;
    }

    try {
      const newAcc = await Store.createAccount({
        name,
        phone,
        color: selectedAccountColor
      });
      await switchAccount(newAcc.id);
      showToast(isFirstTime ? `Welcome, ${name}! Logged into your account.` : `Account "${name}" created on device!`, 'success');
    } catch (e) {
      showToast('Error creating account: ' + e.message, 'error');
    }
  }

  async function openEditAccount(id) {
    const accounts = await Store.getAccounts();
    const acc = accounts.find(a => a.id === id);
    if (!acc) return;

    selectedAccountColor = acc.color || '#1A6FE8';
    const canDelete = accounts.length > 1;

    const bodyHtml = `
      <div style="margin-bottom:14px;">
        <div class="form-group">
          <label class="form-label">Account Name</label>
          <input type="text" class="form-input" id="edit-account-name" value="${escapeHtml(acc.name)}" required>
        </div>

        <div class="form-group">
          <label class="form-label">Phone / Mobile (Optional)</label>
          <input type="tel" class="form-input" id="edit-account-phone" value="${escapeHtml(acc.phone || '')}">
        </div>

        <div class="form-group">
          <label class="form-label">Color Theme</label>
          <div class="color-picker-palette">
            ${['#12874A', '#1A6FE8', '#84CC16', '#8B5CF6', '#F97316', '#111827'].map(c => `
              <div class="color-swatch-circle ${c === selectedAccountColor ? 'selected' : ''}" style="background:${c};" onclick="App.selectAccountColor('${c}', this)"></div>
            `).join('')}
          </div>
        </div>

        <button class="btn btn-primary btn-full mt-md" onclick="App.submitEditAccount('${acc.id}')">
          Save Changes
        </button>

        ${canDelete ? `
          <button class="btn btn-outline btn-full mt-sm" style="color:var(--red-primary); border-color:#FCA5A5;" onclick="App.confirmDeleteAccount('${acc.id}', '${escapeHtml(acc.name)}')">
            Delete Account from Phone
          </button>
        ` : `
          <p style="font-size:11.5px; color:var(--text-muted); text-align:center; margin-top:10px;">
            Primary account cannot be deleted.
          </p>
        `}
      </div>
    `;

    openModal('Edit Account Profile', bodyHtml);
  }

  async function submitEditAccount(id) {
    const nameInput = document.getElementById('edit-account-name');
    const phoneInput = document.getElementById('edit-account-phone');
    const name = nameInput ? nameInput.value.trim() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';

    if (!name) {
      showToast('Please enter an account name', 'error');
      return;
    }

    try {
      await Store.updateAccount(id, {
        name,
        phone,
        color: selectedAccountColor
      });

      const active = await Store.getActiveAccount();
      if (active.id === id) {
        userName = name;
        await updateGreeting();
      }

      await openAccountModal();
      showToast('Account updated', 'success');
    } catch (e) {
      showToast('Error updating account: ' + e.message, 'error');
    }
  }

  function confirmDeleteAccount(id, name) {
    showConfirm(
      'Delete Account?',
      `Are you sure you want to delete "${name}" from this device? All loans and repayments belonging to this account will be permanently removed from device storage.`,
      async () => {
        try {
          await Store.deleteAccount(id);
          const active = await Store.getActiveAccount();
          userName = active.name;
          await updateGreeting();
          await refreshDashboard();
          if (currentPage === 'loans') await refreshLoans();
          closeModal();
          showToast(`Account "${name}" deleted`, 'success');
        } catch (e) {
          showToast('Cannot delete: ' + e.message, 'error');
        }
      }
    );
  }

  // ─── User Profile Settings (Compatibility) ────────────────

  function openProfileSettings() {
    openAccountModal();
  }

  function saveProfileName() {
    const input = document.getElementById('profile-name-input');
    if (!input || !input.value.trim()) return;
    userName = input.value.trim();
    localStorage.setItem('interestmate_username', userName);
    updateGreeting();
    closeModal();
    showToast('Profile updated', 'success');
  }

  function openFilterModal() {
    openModal('Filter Records', `
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button class="btn btn-outline btn-full" onclick="App.setCategoryFilter('all'); App.closeModal();">${I18n.t('filterAll')}</button>
        <button class="btn btn-outline btn-full" onclick="App.setCategoryFilter('active'); App.closeModal();">${I18n.t('filterActive')}</button>
        <button class="btn btn-outline btn-full" onclick="App.setCategoryFilter('lent'); App.closeModal();">${I18n.t('moneyLent')}</button>
        <button class="btn btn-outline btn-full" onclick="App.setCategoryFilter('borrowed'); App.closeModal();">${I18n.t('moneyBorrowed')}</button>
        <button class="btn btn-outline btn-full" onclick="App.setCategoryFilter('settled'); App.closeModal();">${I18n.t('settledLoans')}</button>
        <button class="btn btn-outline btn-full" onclick="App.setCategoryFilter('draft'); App.closeModal();">${I18n.t('filterDraft')}</button>
      </div>
    `);
  }

  // ─── Loans List & Filtering ───────────────────────────────

  async function refreshLoans() {
    allLoans = await Store.getLoansForActiveAccount();
    filterLoans();
  }

  function setLoanFilter(filter, btn) {
    document.querySelectorAll('#loan-filters .category-pill').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    else {
      const target = document.querySelector(`#loan-filters .category-pill[data-filter="${filter}"]`);
      if (target) target.classList.add('active');
    }
    currentFilter = filter;
    filterLoans();
  }

  function filterLoans() {
    const searchInput = document.getElementById('loan-search');
    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

    let filtered = allLoans;

    if (currentFilter !== 'all') {
      filtered = filtered.filter(l => l.status === currentFilter);
    }

    if (query) {
      filtered = filtered.filter(l =>
        (l.counterparty && l.counterparty.toLowerCase().includes(query)) ||
        (l.ref && l.ref.toLowerCase().includes(query)) ||
        (l.notes && l.notes.toLowerCase().includes(query))
      );
    }

    const container = document.getElementById('loans-list');
    if (!container) return;

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card mt-lg">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="9" y1="21" x2="9" y2="9"/>
            </svg>
          </div>
          <h3 class="empty-title">${I18n.t('noLoansYet')}</h3>
          <p class="empty-sub">${I18n.t('noLoansDesc')}</p>
          <button class="pill-primary-btn" onclick="App.openCreateLoan()">
            + ${I18n.t('newLoan')}
          </button>
        </div>`;
      return;
    }

    container.innerHTML = filtered.map(l => renderFeatureLoanCard(l)).join('');
  }

  // ─── Loan Details & Settlement ────────────────────────────

  async function openLoanDetail(loanId) {
    currentLoanId = loanId;
    const loan = await Store.getById('loans', loanId);
    if (!loan) return showToast('Loan not found', 'error');

    loan.payments = await Store.getLoanPayments(loanId);
    loan.documents = await Store.getLoanDocuments(loanId);
    loan.audit = await Store.getLoanAudit(loanId);

    const position = CalcEngine.calculateLoanPosition(loan, new Date().toISOString().split('T')[0]);

    navigate('loan-detail');

    const container = document.getElementById('loan-detail-content');
    const isLender = loan.counterpartyType !== 'lender';

    container.innerHTML = `
      <div class="card" style="margin-bottom:16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
          <div>
            <span class="loan-category-tag">${isLender ? I18n.t('borrower') : I18n.t('lender')} • ${loan.ref}</span>
            <h2 style="font-size:22px; font-weight:800; margin-top:4px;">${escapeHtml(loan.counterparty)}</h2>
          </div>
          <span class="badge badge-${loan.status}">${loan.status.toUpperCase()}</span>
        </div>

        <!-- Smart Running Days Banner -->
        <div class="days-running-pill-lg">
          <div>
            <div class="main-duration">⏱️ ${position.duration.totalDays} Days Running (${position.duration.breakdownText})</div>
            <div class="sub-accrual">Started: ${CalcEngine.formatDate(loan.startDate)}</div>
          </div>
          <div style="text-align:right;">
            <div class="sub-accrual" style="font-size:14px; color:#1E1B4B; font-weight:800;">${CalcEngine.formatINR(position.dailyAccrualPaise)}</div>
            <div style="font-size:11px; color:#4338CA;">Daily Interest</div>
          </div>
        </div>

        ${position.dueInfo ? `
          <div style="margin-bottom:12px;">
            <span class="due-status-badge ${position.dueInfo.status}" style="font-size:13px; padding:6px 14px;">
              ${position.dueInfo.badge}
            </span>
          </div>
        ` : ''}

        <div class="result-hero-box" style="margin-bottom:14px;">
          <div class="result-hero-label">${I18n.t('outstandingPrincipal')}</div>
          <div class="result-hero-value">${CalcEngine.formatINR(position.totalOutstandingPaise)}</div>
        </div>

        <div class="result-grid-metrics">
          <div class="metric-tile">
            <div class="metric-tile-label">${I18n.t('principalAmount')}</div>
            <div class="metric-tile-val">${CalcEngine.formatINR(position.principalPaise)}</div>
          </div>
          <div class="metric-tile">
            <div class="metric-tile-label">${I18n.t('accruedInterest')}</div>
            <div class="metric-tile-val" style="color:var(--blue-primary);">${CalcEngine.formatINR(position.unpaidInterestPaise)}</div>
          </div>
          <div class="metric-tile">
            <div class="metric-tile-label">${I18n.t('interestRate')}</div>
            <div class="metric-tile-val">${loan.rate}% ${loan.ratePeriod}</div>
          </div>
          <div class="metric-tile">
            <div class="metric-tile-label">${I18n.t('startDate')}</div>
            <div class="metric-tile-val">${CalcEngine.formatDate(loan.startDate)}</div>
          </div>
        </div>

        <!-- Action Buttons depending on Status -->
        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:8px;">
          ${loan.status === 'draft' ? `
            <button class="btn btn-primary btn-full" onclick="App.startLoanPrompt('${loan.id}')">
              ▶ ${I18n.t('startLoan')}
            </button>
          ` : ''}

          ${loan.status === 'active' ? `
            <button class="btn btn-primary" style="flex:1;" onclick="App.openRecordPayment('${loan.id}')">
              + ${I18n.t('addRepayment')}
            </button>
            <button class="btn btn-outline" style="flex:1;" onclick="App.openCloseLoan('${loan.id}')">
              ✓ ${I18n.t('closeLoan')}
            </button>
          ` : ''}

          <button class="btn btn-outline btn-full" onclick="App.openUploadDoc('${loan.id}')">
            📎 ${I18n.t('uploadBond')} (${loan.documents.length})
          </button>
        </div>
      </div>

      <!-- Repayments History Section -->
      <div class="section-heading-row" style="margin-top:20px;">
        <h3 class="section-title-text">${I18n.t('paymentHistory')}</h3>
      </div>
      <div class="accounts-cards-stack">
        ${loan.payments.length === 0 ? `
          <div class="empty-state-card" style="padding:20px;">
            <p style="font-size:13px; color:var(--text-secondary);">${I18n.t('noPaymentsRecorded')}</p>
          </div>
        ` : loan.payments.map(p => `
          <div class="account-card" style="padding:12px 16px;">
            <div class="account-icon-box green-box" style="width:36px; height:36px; border-radius:10px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div class="account-details">
              <div class="account-name">${CalcEngine.formatDate(p.date)}</div>
              <div class="account-subtitle">${escapeHtml(p.reference || p.notes || 'Payment')}</div>
            </div>
            <div class="account-amount" style="color:var(--green-primary);">${CalcEngine.formatINR(CalcEngine.toPaise(p.amount))}</div>
          </div>
        `).join('')}
      </div>

      <!-- Promise Bonds Section -->
      <div class="section-heading-row" style="margin-top:24px;">
        <h3 class="section-title-text">${I18n.t('linkedDocs')}</h3>
      </div>
      <div class="accounts-cards-stack">
        ${loan.documents.length === 0 ? `
          <div class="empty-state-card" style="padding:20px;">
            <p style="font-size:13px; color:var(--text-secondary);">${I18n.t('noDocsUploaded')}</p>
          </div>
        ` : loan.documents.map(d => `
          <div class="account-card" style="padding:12px 16px;" onclick="App.previewDocument('${d.id}')">
            <div class="account-icon-box amber-box" style="width:36px; height:36px; border-radius:10px;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              </svg>
            </div>
            <div class="account-details">
              <div class="account-name">${escapeHtml(d.title)}</div>
              <div class="account-subtitle">${CalcEngine.formatDate(d.uploadedAt)}</div>
            </div>
            <span class="badge badge-active">View</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ─── Loan Actions (Create, Start, Record Payment, Close) ──

  function openCreateLoan() {
    openModal(I18n.t('newLoan'), `
      <div class="form-group">
        <label class="form-label">${I18n.t('counterparty')}</label>
        <input type="text" class="form-input" id="new-counterparty" placeholder="Name of borrower or lender">
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('counterpartyType')}</label>
        <select class="form-select" id="new-role">
          <option value="borrower" selected>${I18n.t('borrower')}</option>
          <option value="lender">${I18n.t('lender')}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('principalAmount')}</label>
        <div class="input-prefix">
          <span class="prefix">₹</span>
          <input type="number" class="form-input" id="new-principal" placeholder="Enter principal amount (₹)" inputmode="numeric">
        </div>
        <!-- 1-Tap Quick Amount Buttons -->
        <div class="preset-buttons-row mt-sm">
          <button type="button" class="preset-chip-btn" onclick="document.getElementById('new-principal').value=10000">+ ₹10K</button>
          <button type="button" class="preset-chip-btn" onclick="document.getElementById('new-principal').value=50000">+ ₹50K</button>
          <button type="button" class="preset-chip-btn" onclick="document.getElementById('new-principal').value=100000">+ ₹1 Lakh</button>
          <button type="button" class="preset-chip-btn" onclick="document.getElementById('new-principal').value=500000">+ ₹5 Lakh</button>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18n.t('interestRate')}</label>
          <div class="input-suffix">
            <input type="number" class="form-input" id="new-rate" placeholder="e.g. 2" step="0.01" inputmode="decimal">
            <span class="suffix">%</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('ratePeriod')}</label>
          <select class="form-select" id="new-rate-period">
            <option value="monthly" selected>${I18n.t('monthly')}</option>
            <option value="annual">${I18n.t('annual')}</option>
            <option value="daily">${I18n.t('daily')}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('interestMethod')}</label>
        <select class="form-select" id="new-method">
          <option value="simple" selected>${I18n.t('simpleInterest')}</option>
          <option value="compound">${I18n.t('compoundInterest')}</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">${I18n.t('dayCount')}</label>
        <select class="form-select" id="new-daycount">
          <option value="actual/365" selected>Actual / 365</option>
          <option value="30/360">30 / 360 (Indian Monthly Standard)</option>
          <option value="actual/360">Actual / 360</option>
          <option value="actual/actual">Actual / Actual</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">${I18n.t('startDate')}</label>
          <input type="date" class="form-input" id="new-start" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">${I18n.t('dueDate')}</label>
          <input type="date" class="form-input" id="new-due">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-input" id="new-notes" rows="2" placeholder="Optional reference notes"></textarea>
      </div>
      <button class="btn btn-primary btn-full mt-md" onclick="App.submitCreateLoan()">
        ${I18n.t('createLoan')}
      </button>
    `);
  }

  async function submitCreateLoan() {
    const cp = document.getElementById('new-counterparty').value.trim();
    const principal = parseFloat(document.getElementById('new-principal').value);
    const rate = parseFloat(document.getElementById('new-rate').value);

    if (!cp) return showToast('Please enter counterparty name', 'error');
    if (!principal || principal <= 0) return showToast(I18n.t('enterValidPrincipal'), 'error');
    if (isNaN(rate) || rate < 0) return showToast(I18n.t('enterValidRate'), 'error');

    const loan = await Store.createLoan({
      counterparty: cp,
      counterpartyType: document.getElementById('new-role').value,
      principal,
      rate,
      ratePeriod: document.getElementById('new-rate-period').value,
      interestMethod: document.getElementById('new-method').value,
      dayCountConvention: document.getElementById('new-daycount').value,
      startDate: document.getElementById('new-start').value || null,
      dueDate: document.getElementById('new-due').value || null,
      notes: document.getElementById('new-notes').value
    });

    closeModal();
    showToast(I18n.t('loanCreatedSuccess'), 'success');
    await refreshDashboard();
    navigate('dashboard');
  }

  function startLoanPrompt(loanId) {
    showConfirm(
      I18n.t('startLoan'),
      'Starting this loan will lock agreed financial terms and begin interest accrual from today. Proceed?',
      async () => {
        await Store.startLoan(loanId);
        showToast(I18n.t('loanStartedSuccess'), 'success');
        await refreshDashboard();
        openLoanDetail(loanId);
      }
    );
  }

  function openRecordPayment(loanId) {
    openModal(I18n.t('recordPayment'), `
      <div class="form-group">
        <label class="form-label">Amount (₹)</label>
        <div class="input-prefix">
          <span class="prefix">₹</span>
          <input type="number" class="form-input" id="pay-amount" placeholder="5000" inputmode="numeric">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Payment Date</label>
        <input type="date" class="form-input" id="pay-date" value="${new Date().toISOString().split('T')[0]}">
      </div>
      <div class="form-group">
        <label class="form-label">Allocation Method</label>
        <select class="form-select" id="pay-allocation">
          <option value="interest-first" selected>Interest first, remainder to principal</option>
          <option value="principal-first">Principal first</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Reference / Receipt Number</label>
        <input type="text" class="form-input" id="pay-ref" placeholder="UPI / Bank reference">
      </div>
      <button class="btn btn-primary btn-full mt-md" onclick="App.submitPayment('${loanId}')">
        Save Payment
      </button>
    `);
  }

  async function submitPayment(loanId) {
    const amount = parseFloat(document.getElementById('pay-amount').value);
    const date = document.getElementById('pay-date').value;
    const allocation = document.getElementById('pay-allocation').value;
    const ref = document.getElementById('pay-ref').value.trim();

    if (!amount || amount <= 0) return showToast('Enter a valid payment amount', 'error');
    if (!date) return showToast('Select a payment date', 'error');

    try {
      await Store.recordPayment({ loanId, amount, date, allocation, reference: ref });
      closeModal();
      showToast(I18n.t('paymentSavedSuccess'), 'success');
      await refreshDashboard();
      openLoanDetail(loanId);
    } catch (e) {
      showToast(e.message || 'Error recording payment', 'error');
    }
  }

  async function openCloseLoan(loanId) {
    const loan = await Store.getById('loans', loanId);
    loan.payments = await Store.getLoanPayments(loanId);
    const today = new Date().toISOString().split('T')[0];
    const settlement = CalcEngine.calculateSettlement(loan, today);

    openModal(I18n.t('settleLoanTitle'), `
      <div style="margin-bottom:16px;">
        <p style="font-size:13.5px; color:var(--text-secondary); margin-bottom:12px;">
          ${I18n.t('settleConfirmMsg')}
        </p>

        <div class="result-hero-box" style="margin-bottom:14px;">
          <div class="result-hero-label">Net Settlement Balance</div>
          <div class="result-hero-value">${CalcEngine.formatINR(settlement.settlementAmountPaise)}</div>
        </div>

        <div class="result-grid-metrics">
          <div class="metric-tile">
            <div class="metric-tile-label">Principal Due</div>
            <div class="metric-tile-val">${CalcEngine.formatINR(settlement.outstandingPrincipalPaise)}</div>
          </div>
          <div class="metric-tile">
            <div class="metric-tile-label">Unpaid Interest</div>
            <div class="metric-tile-val">${CalcEngine.formatINR(settlement.unpaidInterestPaise)}</div>
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:10px; margin-top:16px;">
          <button class="btn btn-primary btn-full" onclick="App.confirmCloseLoan('${loanId}', 'settled')">
            ${I18n.t('confirmSettlement')}
          </button>
          <button class="btn btn-outline btn-full" onclick="App.confirmCloseLoan('${loanId}', 'outstanding')">
            ${I18n.t('closeOutstanding')}
          </button>
        </div>
      </div>
    `);
  }

  async function confirmCloseLoan(loanId, closureType) {
    const today = new Date().toISOString().split('T')[0];
    await Store.closeLoan(loanId, today, closureType, 'Closed by user');
    closeModal();
    showToast(I18n.t('loanClosedSuccess'), 'success');
    await refreshDashboard();
    openLoanDetail(loanId);
  }

  // ─── Promise Bonds ────────────────────────────────────────

  function openUploadDoc(loanId) {
    openModal(I18n.t('uploadBond'), `
      <div class="form-group">
        <label class="form-label">Document Title</label>
        <input type="text" class="form-input" id="doc-title" placeholder="Promissory Note / Agreement">
      </div>
      <div class="form-group">
        <label class="form-label">Select File (PDF or Image)</label>
        <input type="file" class="form-input" id="doc-file" accept=".pdf,image/*">
      </div>
      <div class="form-group">
        <label class="form-label">Document Reference Number (optional)</label>
        <input type="text" class="form-input" id="doc-ref" placeholder="Bond No / Stamp No">
      </div>
      <button class="btn btn-primary btn-full mt-md" onclick="App.submitDocument('${loanId}')">
        Attach Document
      </button>
    `);
  }

  async function submitDocument(loanId) {
    const title = document.getElementById('doc-title').value.trim();
    const fileInput = document.getElementById('doc-file');
    const ref = document.getElementById('doc-ref').value.trim();

    if (!title) return showToast('Enter document title', 'error');
    if (!fileInput.files || fileInput.files.length === 0) return showToast('Please select a file', 'error');

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async () => {
      await Store.saveDocument({
        loanId,
        title,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        fileData: reader.result,
        referenceNumber: ref
      });
      closeModal();
      showToast(I18n.t('docSavedSuccess'), 'success');
      openLoanDetail(loanId);
    };

    reader.readAsDataURL(file);
  }

  async function refreshBonds() {
    const docs = await Store.getAll('documents');
    const container = document.getElementById('bonds-list');
    if (!container) return;

    if (docs.length === 0) {
      container.innerHTML = `
        <div class="empty-state-card mt-lg">
          <div class="empty-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
            </svg>
          </div>
          <h3 class="empty-title">No Promise Bonds</h3>
          <p class="empty-sub">Attach promissory notes, signed bonds, or receipts to any loan.</p>
        </div>`;
      return;
    }

    container.innerHTML = docs.map(d => `
      <div class="account-card" onclick="App.previewDocument('${d.id}')">
        <div class="account-icon-box amber-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          </svg>
        </div>
        <div class="account-details">
          <div class="account-name">${escapeHtml(d.title)}</div>
          <div class="account-subtitle">${CalcEngine.formatDate(d.uploadedAt)} • ${escapeHtml(d.referenceNumber || 'Bond')}</div>
        </div>
        <span class="badge badge-draft">View</span>
      </div>
    `).join('');
  }

  function filterBonds() {
    const q = document.getElementById('bond-search').value.toLowerCase().trim();
    Store.getAll('documents').then(docs => {
      const filtered = docs.filter(d =>
        d.title.toLowerCase().includes(q) ||
        (d.referenceNumber && d.referenceNumber.toLowerCase().includes(q))
      );
      const container = document.getElementById('bonds-list');
      if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state-card mt-lg"><p class="empty-sub">No matching documents</p></div>`;
      } else {
        container.innerHTML = filtered.map(d => `
          <div class="account-card" onclick="App.previewDocument('${d.id}')">
            <div class="account-icon-box amber-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              </svg>
            </div>
            <div class="account-details">
              <div class="account-name">${escapeHtml(d.title)}</div>
              <div class="account-subtitle">${CalcEngine.formatDate(d.uploadedAt)}</div>
            </div>
          </div>
        `).join('');
      }
    });
  }

  async function previewDocument(docId) {
    const doc = await Store.getById('documents', docId);
    if (!doc) return;

    let previewHtml = '';
    if (doc.fileType.startsWith('image/')) {
      previewHtml = `<img src="${doc.fileData}" style="max-width:100%; border-radius:14px; margin-top:10px;">`;
    } else {
      previewHtml = `<p style="padding:16px; background:var(--bg-app); border-radius:12px; margin-top:10px;">File: ${escapeHtml(doc.fileName)} (${Math.round(doc.fileSize/1024)} KB)</p>`;
    }

    openModal(escapeHtml(doc.title), `
      <div style="text-align:center;">
        <p style="font-size:13px; color:var(--text-secondary);">Uploaded ${CalcEngine.formatDate(doc.uploadedAt)}</p>
        ${previewHtml}
        <a href="${doc.fileData}" download="${escapeHtml(doc.fileName)}" class="btn btn-primary btn-full mt-lg">Download File</a>
      </div>
    `);
  }

  // ─── Transactions & Audit Trail ───────────────────────────

  async function refreshTransactions() {
    const payments = await Store.getAll('payments');
    const container = document.getElementById('transactions-list');
    if (!container) return;

    if (payments.length === 0) {
      container.innerHTML = `<div class="empty-state-card mt-lg"><p class="empty-sub">No transactions recorded yet</p></div>`;
      return;
    }

    container.innerHTML = payments.map(p => `
      <div class="account-card" style="margin-bottom:8px;">
        <div class="account-icon-box green-box" style="width:38px; height:38px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div class="account-details">
          <div class="account-name">${CalcEngine.formatDate(p.date)}</div>
          <div class="account-subtitle">${escapeHtml(p.reference || p.notes || 'Payment')}</div>
        </div>
        <div class="account-amount" style="color:var(--green-primary);">${CalcEngine.formatINR(CalcEngine.toPaise(p.amount))}</div>
      </div>
    `).join('');
  }

  async function refreshAudit() {
    const events = await Store.getAllAudit();
    const container = document.getElementById('audit-list');
    if (!container) return;

    container.innerHTML = events.map(e => `
      <div class="account-card" style="margin-bottom:8px; padding:12px 14px;">
        <div class="account-details">
          <div class="account-name" style="font-size:13.5px;">${escapeHtml(e.description)}</div>
          <div class="account-subtitle">${CalcEngine.formatDate(e.timestamp)} • ${e.action}</div>
        </div>
      </div>
    `).join('');
  }

  // ─── Export, Restore & About ───────────────────────────────

  async function exportData() {
    const accounts = await Store.getAccounts();
    const loans = await Store.getAll('loans');
    const payments = await Store.getAll('payments');
    const documents = await Store.getAll('documents');
    const audit = await Store.getAll('audit');

    const backup = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      accounts,
      loans,
      payments,
      documents,
      audit
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InterestMate_PhoneBackup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup saved to your phone storage!', 'success');
  }

  function importDataFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result);
        await Store.importBackup(json);
        showToast('Backup successfully restored to phone storage!', 'success');
        refreshDashboard();
        if (currentPage === 'loans') refreshLoans();
      } catch (err) {
        showToast('Restore error: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  }

  function showAbout() {
    openModal(I18n.t('aboutApp'), `
      <div style="text-align:center; padding:10px 0;">
        <div style="width:60px; height:60px; border-radius:18px; background:var(--text-dark); color:white; display:grid; place-items:center; font-size:28px; font-weight:800; margin:0 auto 14px;">₹</div>
        <h3 style="font-size:18px; font-weight:800;">${I18n.t('appName')}</h3>
        <p style="font-size:13px; color:var(--text-secondary); margin-top:4px;">${I18n.t('versionInfo')}</p>
        <p style="font-size:13px; color:var(--text-secondary); margin-top:16px; line-height:1.5;">
          ${I18n.t('legalNotice')}
        </p>
      </div>
    `);
  }

  function showNotifications() {
    showToast('All notifications are up to date', 'success');
  }

  // ─── Modal & Dialog Helpers ───────────────────────────────

  function openModal(title, htmlContent) {
    const titleEl = document.getElementById('modal-title');
    const bodyEl = document.getElementById('modal-body');
    const sheet = document.getElementById('modal-sheet');
    const overlay = document.getElementById('modal-overlay');

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.innerHTML = htmlContent;
    if (sheet) sheet.style.display = 'block';
    if (overlay) overlay.style.display = 'block';
  }

  function closeModal() {
    const sheet = document.getElementById('modal-sheet');
    const overlay = document.getElementById('modal-overlay');
    if (sheet) sheet.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
  }

  function showConfirm(title, message, onOk, icon = 'warning_amber') {
    const dialog = document.getElementById('confirm-dialog');
    const overlay = document.getElementById('confirm-overlay');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = message;

    const iconEl = document.getElementById('confirm-icon');
    if (iconEl) iconEl.textContent = icon;

    const okBtn = document.getElementById('confirm-ok');
    okBtn.onclick = () => {
      closeConfirm();
      if (onOk) onOk();
    };

    dialog.style.display = 'block';
    overlay.style.display = 'block';
  }

  function closeConfirm() {
    document.getElementById('confirm-dialog').style.display = 'none';
    document.getElementById('confirm-overlay').style.display = 'none';
  }

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.2s ease';
      setTimeout(() => toast.remove(), 200);
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getTimeAgo(isoString) {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  }

  // Auto-init on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    init,
    navigate,
    refreshDashboard,
    refreshLoans,
    refreshBonds,
    refreshTransactions,
    refreshAudit,
    setCategoryFilter,
    setLoanFilter,
    filterLoans,
    filterBonds,
    filterAndNavigateLoans,
    onDashboardSearch,
    addCalcAmount,
    setCalcAmount,
    setCalcRate,
    setCalcDurationMonths,
    onLiveCalculate,
    calculate,
    onMethodChanged,
    saveCalcAsLoan,
    submitCalcAsDraft,
    openProfileSettings,
    saveProfileName,
    openAccountModal,
    switchAccount,
    openCreateAccount,
    setAccountNamePreset,
    selectAccountColor,
    submitCreateAccount,
    openEditAccount,
    submitEditAccount,
    confirmDeleteAccount,
    openLanguageModal,
    selectLanguage,
    openFilterModal,
    openCreateLoan,
    submitCreateLoan,
    startLoanPrompt,
    openLoanDetail,
    openRecordPayment,
    submitPayment,
    openCloseLoan,
    confirmCloseLoan,
    openUploadDoc,
    submitDocument,
    previewDocument,
    exportData,
    importDataFile,
    showAbout,
    showNotifications,
    closeModal,
    closeConfirm,
    showToast,
    onNeonScroll,
    scrollToNeonSlide
  };
})();
