/**
 * Trippovention Native Header Search System
 * Positioned natively inside the global header/navigation bar
 * Opens an attached search dropdown/overlay directly below the header
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.TrippoventionSearchInitialized) return;
  window.TrippoventionSearchInitialized = true;

  // Configuration & Constants
  const SEARCH_INDEX_URL = 'assets/search-index.json';
  const DEBOUNCE_DELAY = 120;
  const MAX_LIVE_RESULTS = 12;
  const RECENT_SEARCHES_KEY = 'trippovention_recent_searches';
  const MAX_RECENT_SEARCHES = 6;

  // Typo & Misspelling Dictionary
  const TYPO_MAP = {
    'bangkokk': 'bangkok',
    'phukett': 'phuket',
    'singapor': 'singapore',
    'veitnam': 'vietnam',
    'viet nam': 'vietnam',
    'pataya': 'pattaya',
    'pattayah': 'pattaya',
    'schengan': 'schengen',
    'swizerland': 'switzerland',
    'malasia': 'malaysia',
    'dubay': 'dubai',
    'abudhabi': 'abu dhabi',
    'balii': 'bali',
    'austrailia': 'australia',
    'phillippines': 'philippines',
    'indonasia': 'indonesia',
    'mauritus': 'mauritius',
    'seychels': 'seychelles',
    'transfr': 'transfer',
    'sightseing': 'sightseeing',
    'pakage': 'package',
    'pakages': 'packages',
    'viza': 'visa'
  };

  // State
  let searchIndex = null;
  let isIndexLoading = false;
  let activeFilter = 'All';
  let currentResults = [];
  let selectedResultIndex = -1;
  let debounceTimer = null;
  let rootPrefix = null;
  let isOpen = false;

  /**
   * Determine relative path prefix to site root
   */
  function getRootPrefix() {
    if (rootPrefix !== null) return rootPrefix;

    const script = document.querySelector('script[src*="app.js"], script[src*="search.js"]');
    if (script) {
      const src = script.getAttribute('src') || '';
      const idx = src.indexOf('assets/');
      if (idx !== -1) {
        rootPrefix = src.substring(0, idx);
        return rootPrefix;
      }
    }

    const link = document.querySelector('link[rel="stylesheet"][href*="styles.css"]');
    if (link) {
      const href = link.getAttribute('href') || '';
      const idx = href.indexOf('assets/');
      if (idx !== -1) {
        rootPrefix = href.substring(0, idx);
        return rootPrefix;
      }
    }

    rootPrefix = '';
    return rootPrefix;
  }

  /**
   * Normalize URLs relative to current page location
   */
  function resolveUrl(url) {
    if (!url) return '#';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
      return url;
    }
    const prefix = getRootPrefix();
    return prefix + url;
  }

  /**
   * Lazy load the search index (Supports both fetch and script fallback for file:// protocol)
   */
  async function loadSearchIndex() {
    if (searchIndex && searchIndex.length > 0) return searchIndex;
    if (window.__TRIPPOVENTION_SEARCH_DATA__ && window.__TRIPPOVENTION_SEARCH_DATA__.length > 0) {
      searchIndex = window.__TRIPPOVENTION_SEARCH_DATA__;
      return searchIndex;
    }
    if (window.__TRIPPOVENTION_SEARCH_INDEX__ && window.__TRIPPOVENTION_SEARCH_INDEX__.length > 0) {
      searchIndex = window.__TRIPPOVENTION_SEARCH_INDEX__;
      return searchIndex;
    }

    // Check sessionStorage cache (http/https only)
    if (window.location.protocol !== 'file:') {
      try {
        const cached = sessionStorage.getItem('trippovention_search_index_cache');
        if (cached) {
          searchIndex = JSON.parse(cached);
          window.__TRIPPOVENTION_SEARCH_INDEX__ = searchIndex;
          return searchIndex;
        }
      } catch (e) {}
    }

    // If file:// protocol, immediately load via script tag to prevent CORS block
    if (window.location.protocol === 'file:') {
      return loadIndexViaScript();
    }

    if (isIndexLoading) {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          if (searchIndex && searchIndex.length > 0) {
            clearInterval(interval);
            resolve(searchIndex);
          }
        }, 50);
      });
    }

    isIndexLoading = true;
    try {
      const fetchUrl = resolveUrl(SEARCH_INDEX_URL);
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      searchIndex = data;
      window.__TRIPPOVENTION_SEARCH_INDEX__ = searchIndex;

      try {
        sessionStorage.setItem('trippovention_search_index_cache', JSON.stringify(data));
      } catch (e) {}

      isIndexLoading = false;
      return searchIndex;
    } catch (error) {
      console.warn('Fetch failed, falling back to script injection:', error);
      isIndexLoading = false;
      return loadIndexViaScript();
    }
  }

  function loadIndexViaScript() {
    return new Promise((resolve) => {
      if (window.__TRIPPOVENTION_SEARCH_DATA__ && window.__TRIPPOVENTION_SEARCH_DATA__.length > 0) {
        searchIndex = window.__TRIPPOVENTION_SEARCH_DATA__;
        return resolve(searchIndex);
      }

      const scriptId = 'trippovention-search-data-script';
      let script = document.getElementById(scriptId);
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = resolveUrl('assets/search-data.js');
        script.onload = () => {
          searchIndex = window.__TRIPPOVENTION_SEARCH_DATA__ || [];
          resolve(searchIndex);
        };
        script.onerror = () => {
          console.error('Failed to load search data script');
          resolve([]);
        };
        (document.head || document.body).appendChild(script);
      } else {
        let attempts = 0;
        const interval = setInterval(() => {
          attempts++;
          if (window.__TRIPPOVENTION_SEARCH_DATA__ || attempts > 50) {
            clearInterval(interval);
            searchIndex = window.__TRIPPOVENTION_SEARCH_DATA__ || [];
            resolve(searchIndex);
          }
        }, 50);
      }
    });
  }

  /**
   * Simple Levenshtein distance for fuzzy typo matching
   */
  function levenshtein(a, b) {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Search Query Normalizer & Typo Fixer
   */
  function normalizeQuery(rawQuery) {
    let clean = rawQuery.toLowerCase().trim();
    for (const [typo, fixed] of Object.entries(TYPO_MAP)) {
      if (clean === typo || clean.includes(typo)) {
        clean = clean.replace(new RegExp('\\b' + typo + '\\b', 'g'), fixed);
      }
    }
    return clean;
  }

  /**
   * Search Engine Scoring Function
   */
  function executeSearch(query, filter = 'All', limit = MAX_LIVE_RESULTS) {
    if (!searchIndex || !query) return [];

    const normalizedQ = normalizeQuery(query);
    const tokens = normalizedQ.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) return [];

    const scored = [];

    for (let i = 0; i < searchIndex.length; i++) {
      const item = searchIndex[i];

      // Check category filter
      if (filter !== 'All') {
        if (!item.filters || !item.filters.includes(filter)) {
          continue;
        }
      }

      let score = 0;
      const titleLower = (item.title || '').toLowerCase();
      const destLower = (item.destination || '').toLowerCase();
      const catLower = (item.category || '').toLowerCase();
      const descLower = (item.description || '').toLowerCase();
      const cities = (item.cities || []).map(c => c.toLowerCase());
      const keywords = (item.keywords || []).map(k => k.toLowerCase());
      const activities = (item.activities || []).map(a => a.toLowerCase());

      // 1. Exact phrase match in title
      if (titleLower === normalizedQ) {
        score += 2500;
      } else if (titleLower.includes(normalizedQ)) {
        score += 1200;
      }

      // 2. Exact destination match
      if (destLower === normalizedQ) {
        score += 1500;
        if (item.url.endsWith('index.html') || item.url.includes('destinations')) {
          score += 1800;
        }
      } else if (destLower && destLower.includes(normalizedQ)) {
        score += 700;
      }

      // 3. Exact city match
      for (let j = 0; j < cities.length; j++) {
        if (cities[j] === normalizedQ) {
          score += 1000;
          break;
        } else if (cities[j].includes(normalizedQ)) {
          score += 500;
          break;
        }
      }

      // 4. Token-by-token evaluation
      let matchedTokens = 0;

      for (let t = 0; t < tokens.length; t++) {
        const token = tokens[t];
        let tokenMatched = false;

        const stems = [token];
        if (token.endsWith('s') && token.length > 3) stems.push(token.slice(0, -1));
        if (token.endsWith('es') && token.length > 4) stems.push(token.slice(0, -2));
        if (!token.endsWith('s')) stems.push(token + 's');

        for (let s = 0; s < stems.length; s++) {
          const stem = stems[s];

          if (titleLower.includes(stem)) {
            score += 400;
            tokenMatched = true;
          }
          if (destLower.includes(stem)) {
            score += 350;
            tokenMatched = true;
          }
          if (cities.some(c => c.includes(stem))) {
            score += 300;
            tokenMatched = true;
          }
          if (activities.some(a => a.includes(stem))) {
            score += 280;
            tokenMatched = true;
          }
          if (keywords.includes(stem)) {
            score += 220;
            tokenMatched = true;
          } else if (keywords.some(k => k.includes(stem))) {
            score += 140;
            tokenMatched = true;
          }
          if (descLower.includes(stem)) {
            score += 80;
            tokenMatched = true;
          }
        }

        // Fuzzy match for tokens >= 4 chars
        if (!tokenMatched && token.length >= 4) {
          if (destLower && levenshtein(token, destLower) <= 1) {
            score += 450;
            tokenMatched = true;
          }
          for (let j = 0; j < cities.length; j++) {
            if (levenshtein(token, cities[j]) <= 1) {
              score += 380;
              tokenMatched = true;
              break;
            }
          }
        }

        if (tokenMatched) matchedTokens++;
      }

      // Multi-word combination bonus
      if (tokens.length > 1 && matchedTokens === tokens.length) {
        score += 850;
      }

      // Domain query boosts
      if (tokens.includes('show') && (activities.some(a => a.includes('show') || a.includes('alcazar')) || titleLower.includes('show'))) {
        score += 650;
      }
      if (tokens.includes('transfer') && (item.filters || []).includes('Transfers')) {
        score += 550;
      }
      if (tokens.includes('visa') && catLower.includes('visa')) {
        score += 650;
      }
      if ((tokens.includes('package') || tokens.includes('holiday')) && catLower.includes('package')) {
        score += 450;
      }
      if (tokens.includes('sightseeing') && (item.filters || []).includes('Activities')) {
        score += 400;
      }

      // Prefix match for autocomplete typing (e.g. 'pat' -> 'pattaya')
      if (normalizedQ.length >= 3) {
        if (destLower.startsWith(normalizedQ)) score += 350;
        if (cities.some(c => c.startsWith(normalizedQ))) score += 300;
        if (titleLower.split(/\s+/).some(w => w.startsWith(normalizedQ))) score += 250;
      }

      if (score > 60) {
        scored.push({ score, item });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map(s => s.item);
  }

  /**
   * Generate autocomplete suggestion queries
   */
  function generateAutocompleteSuggestions(query) {
    if (!query || query.length < 2) return [];

    const norm = normalizeQuery(query);
    const suggestions = [];

    const topDestinations = ['Pattaya', 'Thailand', 'Bangkok', 'Phuket', 'Singapore', 'Vietnam', 'Japan', 'Bali', 'Dubai', 'India', 'Europe', 'Switzerland', 'Malaysia'];

    const matchingDest = topDestinations.find(d => d.toLowerCase().startsWith(norm) || d.toLowerCase().includes(norm));

    if (matchingDest) {
      suggestions.push(matchingDest);
      suggestions.push(`${matchingDest} Packages`);
      suggestions.push(`${matchingDest} Sightseeing`);
      suggestions.push(`${matchingDest} Transfers`);
      suggestions.push(`${matchingDest} Activities`);
      if (matchingDest.toLowerCase() === 'japan' || matchingDest.toLowerCase() === 'vietnam' || matchingDest.toLowerCase() === 'thailand') {
        suggestions.push(`${matchingDest} Visa`);
      }
    } else if (norm.startsWith('vis') || norm.startsWith('e-vi')) {
      suggestions.push('Visa Services');
      suggestions.push('Schengen Visa');
      suggestions.push('Japan Visa');
      suggestions.push('Thailand Visa');
      suggestions.push('USA Visa');
      suggestions.push('Singapore Visa');
    } else if (norm.startsWith('trans') || norm.startsWith('airp')) {
      suggestions.push('Airport Transfers');
      suggestions.push('Thailand Transfers');
      suggestions.push('Phuket Transfers');
      suggestions.push('Private Transfers');
    } else if (norm.startsWith('sight') || norm.startsWith('act') || norm.startsWith('tour')) {
      suggestions.push('Pattaya Sightseeing');
      suggestions.push('Bangkok Tour');
      suggestions.push('Thailand Activities');
      suggestions.push('Singapore Attractions');
    } else if (norm.startsWith('cruis')) {
      suggestions.push('Cruises');
      suggestions.push('Singapore Thailand Cruise');
      suggestions.push('Dhow Cruise Dubai');
    }

    return suggestions.slice(0, 5);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlightMatches(text, query) {
    if (!text || !query) return escapeHtml(text);
    const tokens = normalizeQuery(query).split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) return escapeHtml(text);

    let escaped = escapeHtml(text);
    tokens.sort((a, b) => b.length - a.length);

    tokens.forEach(tok => {
      const reg = new RegExp('(' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      escaped = escaped.replace(reg, '<mark>$1</mark>');
    });

    return escaped;
  }

  function trackSearch(term, category) {
    if (!term) return;

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'search', {
        search_term: term,
        search_category: category || 'All'
      });
    } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'search',
        searchTerm: term,
        searchCategory: category || 'All'
      });
    }

    try {
      let recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      recent = recent.filter(r => r.toLowerCase() !== term.toLowerCase());
      recent.unshift(term);
      if (recent.length > MAX_RECENT_SEARCHES) recent = recent.slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
    } catch (e) {}
  }

  function trackResultClick(item) {
    if (!item) return;

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'select_content', {
        content_type: 'search_result',
        item_id: item.url,
        item_name: item.title,
        item_category: item.category
      });
    } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'search_result_click',
        resultUrl: item.url,
        resultTitle: item.title
      });
    }
  }

  function trackNoResults(term) {
    if (!term) return;

    if (typeof window.gtag === 'function') {
      window.gtag('event', 'search_no_results', {
        search_term: term
      });
    } else if (window.dataLayer && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: 'search_no_results',
        searchTerm: term
      });
    }
  }

  /**
   * Mount Search Component Natively inside the Global Header
   * Conceptually: [LOGO] [NAVIGATION LINKS] [SEARCH ICON / FIELD] [EXISTING HEADER ITEMS]
   */
  function mountHeaderSearch() {
    const navRight = document.querySelector('.nav-right');
    const navActions = document.querySelector('.nav-right .actions, .nav .actions');
    if (!navRight || !navActions) return;

    if (document.getElementById('headerSearchWrap')) return;

    // Create .header-search-wrap
    const wrap = document.createElement('div');
    wrap.className = 'header-search-wrap';
    wrap.id = 'headerSearchWrap';

    wrap.innerHTML = `
      <!-- Resting: Compact search icon button in header -->
      <button class="header-search-toggle" id="headerSearchToggle" type="button" aria-label="Search destinations, packages, visas" title="Search Trippovention (Press / or Ctrl+K)">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>

      <!-- Desktop expanded in-header search field -->
      <div class="header-search-bar" id="headerSearchBar" aria-hidden="true">
        <div class="header-search-input-box">
          <svg class="header-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="search"
            class="header-search-input"
            id="headerSearchInput"
            placeholder="Search destinations, activities, packages, visas & more..."
            autocomplete="off"
            spellcheck="false"
            aria-label="Search destinations, activities, packages, visas"
          />
          <button type="button" class="header-search-clear" id="headerSearchClear" aria-label="Clear search">✕</button>
        </div>
        <button type="button" class="header-search-close" id="headerSearchClose" aria-label="Close search">✕</button>
      </div>
    `;

    // Insert into navRight immediately BEFORE .actions
    // Resulting order: [BRAND LOGO] [MENU] [HEADER SEARCH] [ACTIONS: 📞, 💬, 🌙] [HAMBURGER: ☰]
    navRight.insertBefore(wrap, navActions);

    // Create the Dropdown Overlay anchored directly beneath the header
    createDropdownOverlayDOM();

    // Attach Header Toggle Events
    const toggleBtn = document.getElementById('headerSearchToggle');
    toggleBtn.addEventListener('mouseenter', () => loadSearchIndex());
    toggleBtn.addEventListener('focus', () => loadSearchIndex());
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (isOpen) {
        closeSearch();
      } else {
        openSearch();
      }
    });

    const closeBtn = document.getElementById('headerSearchClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSearch);
    }

    // Mutual exclusion with hamburger menu
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        if (isOpen) closeSearch();
      });
    }

    // Add mobile drawer actions (Call, WhatsApp, Theme) inside mobileMenu drawer
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu && !mobileMenu.querySelector('.mobile-drawer-actions')) {
      const drawerActions = document.createElement('div');
      drawerActions.className = 'mobile-drawer-actions';
      drawerActions.innerHTML = `
        <a href="tel:+918750888875" class="mobile-drawer-action-btn" title="Call Us">
          📞 <span>Call Us</span>
        </a>
        <a href="https://wa.me/+918750888875" class="mobile-drawer-action-btn" target="_blank" rel="noopener noreferrer" title="WhatsApp">
          💬 <span>WhatsApp</span>
        </a>
        <button type="button" class="mobile-drawer-action-btn" id="mobileDrawerThemeToggle" title="Toggle Theme">
          🌙 <span>Theme</span>
        </button>
      `;
      mobileMenu.appendChild(drawerActions);

      const drawerThemeBtn = drawerActions.querySelector('#mobileDrawerThemeToggle');
      const mainThemeBtn = document.getElementById('themeToggle');
      if (drawerThemeBtn && mainThemeBtn) {
        drawerThemeBtn.addEventListener('click', (e) => {
          e.preventDefault();
          mainThemeBtn.click();
        });
      }
    }

    const clearBtn = document.getElementById('headerSearchClear');
    const input = document.getElementById('headerSearchInput');
    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        syncSearchQuery('');
      });
    }

    if (input) {
      input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          syncSearchQuery(e.target.value);
        }, DEBOUNCE_DELAY);
      });

      input.addEventListener('keydown', handleKeyNavigation);
    }
  }

  /**
   * Create the Dropdown Overlay anchored directly below the navbar (at top: 64px)
   */
  function createDropdownOverlayDOM() {
    if (document.getElementById('headerSearchDropdownOverlay')) return;

    const overlay = document.createElement('div');
    overlay.className = 'header-search-dropdown-overlay';
    overlay.id = 'headerSearchDropdownOverlay';
    overlay.setAttribute('aria-hidden', 'true');

    overlay.innerHTML = `
      <div class="header-search-backdrop" id="headerSearchBackdrop"></div>
      <div class="header-search-dropdown" id="headerSearchDropdown" role="dialog" aria-modal="true" aria-label="Search Trippovention">
        <!-- Mobile Search Field (only shown on mobile screens) -->
        <div class="header-search-mobile-bar" id="headerSearchMobileBar">
          <div class="header-search-input-box">
            <svg class="header-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="search"
              class="header-search-input"
              id="headerSearchMobileInput"
              placeholder="Search destinations, activities, packages & more..."
              autocomplete="off"
              spellcheck="false"
              aria-label="Search destinations, activities, packages, visas"
            />
            <button type="button" class="header-search-clear" id="headerSearchMobileClear" aria-label="Clear search">✕</button>
          </div>
          <button type="button" class="header-search-mobile-close" id="headerSearchMobileClose" aria-label="Close search">✕</button>
        </div>

        <!-- Category Filter Pills Bar -->
        <div class="header-search-filters" id="headerSearchFilters" role="tablist" aria-label="Category Filters">
          <button type="button" class="search-filter-pill is-active" data-filter="All" role="tab" aria-selected="true">All</button>
          <button type="button" class="search-filter-pill" data-filter="Destinations" role="tab" aria-selected="false">Destinations</button>
          <button type="button" class="search-filter-pill" data-filter="Packages" role="tab" aria-selected="false">Packages</button>
          <button type="button" class="search-filter-pill" data-filter="Activities" role="tab" aria-selected="false">Activities</button>
          <button type="button" class="search-filter-pill" data-filter="Transfers" role="tab" aria-selected="false">Transfers</button>
          <button type="button" class="search-filter-pill" data-filter="Visa" role="tab" aria-selected="false">Visa</button>
          <button type="button" class="search-filter-pill" data-filter="Hotels" role="tab" aria-selected="false">Hotels</button>
          <button type="button" class="search-filter-pill" data-filter="Services" role="tab" aria-selected="false">Services</button>
        </div>

        <!-- Autocomplete Suggestions Bar -->
        <div class="header-search-chips" id="headerSearchChips" style="display: none;"></div>

        <!-- Dropdown Body -->
        <div class="header-search-body" id="headerSearchBody">
          <!-- Empty State (Popular Destinations & Searches) -->
          <div class="header-search-empty" id="headerSearchEmpty">
            <div class="search-suggestions-section" id="headerSearchRecentSection" style="display: none;">
              <div class="search-suggestions-title">
                <span>🕒 Recent Searches</span>
              </div>
              <div class="search-tags-grid" id="headerSearchRecentGrid"></div>
            </div>

            <div class="search-suggestions-section">
              <div class="search-suggestions-title">
                <span>🌍 Popular Destinations</span>
              </div>
              <div class="search-tags-grid">
                <button type="button" class="search-quick-tag" data-query="Thailand">🇹🇭 Thailand</button>
                <button type="button" class="search-quick-tag" data-query="India">🇮🇳 India</button>
                <button type="button" class="search-quick-tag" data-query="Vietnam">🇻🇳 Vietnam</button>
                <button type="button" class="search-quick-tag" data-query="Singapore">🇸🇬 Singapore</button>
                <button type="button" class="search-quick-tag" data-query="Malaysia">🇲🇾 Malaysia</button>
                <button type="button" class="search-quick-tag" data-query="Bali">🇮🇩 Bali</button>
                <button type="button" class="search-quick-tag" data-query="Japan">🇯🇵 Japan</button>
                <button type="button" class="search-quick-tag" data-query="Dubai">🇦🇪 Dubai</button>
                <button type="button" class="search-quick-tag" data-query="Europe">🇪🇺 Europe</button>
              </div>
            </div>

            <div class="search-suggestions-section">
              <div class="search-suggestions-title">
                <span>🔥 Popular Searches</span>
              </div>
              <div class="search-tags-grid">
                <button type="button" class="search-quick-tag" data-query="Holiday Packages">✈️ Holiday Packages</button>
                <button type="button" class="search-quick-tag" data-query="Thailand Activities">🌴 Thailand Activities</button>
                <button type="button" class="search-quick-tag" data-query="Visa Services">🛂 Visa Services</button>
                <button type="button" class="search-quick-tag" data-query="Airport Transfers">🚐 Airport Transfers</button>
                <button type="button" class="search-quick-tag" data-query="Cruises">🚢 Cruises</button>
                <button type="button" class="search-quick-tag" data-query="Pattaya Sightseeing">🏖️ Pattaya Sightseeing</button>
                <button type="button" class="search-quick-tag" data-query="Schengen Visa">🇪🇺 Schengen Visa</button>
              </div>
            </div>
          </div>

          <!-- Live Results List -->
          <div class="header-search-results" id="headerSearchResults" role="listbox" style="display: none;"></div>

          <!-- No Results State -->
          <div class="header-search-no-results" id="headerSearchNoResults" style="display: none;">
            <div class="search-no-results-icon">🔍</div>
            <div class="search-no-results-title" id="headerSearchNoResultsTitle">No results found</div>
            <div class="search-no-results-sub">
              Try searching for destinations, activities, packages, or visa services.
            </div>
            <div class="search-suggestions-section">
              <div class="search-suggestions-title" style="justify-content: center;">
                <span>Explore Existing Destinations:</span>
              </div>
              <div class="search-tags-grid" style="justify-content: center;">
                <button type="button" class="search-quick-tag" data-query="Thailand">Thailand</button>
                <button type="button" class="search-quick-tag" data-query="Singapore">Singapore</button>
                <button type="button" class="search-quick-tag" data-query="Vietnam">Vietnam</button>
                <button type="button" class="search-quick-tag" data-query="Japan">Japan</button>
                <button type="button" class="search-quick-tag" data-query="India">India</button>
                <button type="button" class="search-quick-tag" data-query="Visa">Visa Services</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Dropdown Footer -->
        <div class="header-search-footer">
          <div class="search-footer-shortcuts">
            <span><kbd class="search-footer-kbd">↑</kbd> <kbd class="search-footer-kbd">↓</kbd> navigate</span>
            <span><kbd class="search-footer-kbd">↵</kbd> select or full results</span>
            <span><kbd class="search-footer-kbd">esc</kbd> close</span>
          </div>
          <a href="#" class="search-view-all-link" id="headerSearchViewAllLink" style="display: none;">
            View all results on search page →
          </a>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Attach Dropdown Events
    const backdrop = document.getElementById('headerSearchBackdrop');
    backdrop.addEventListener('click', closeSearch);

    const mobileClose = document.getElementById('headerSearchMobileClose');
    if (mobileClose) {
      mobileClose.addEventListener('click', closeSearch);
    }

    const mobileInput = document.getElementById('headerSearchMobileInput');
    const mobileClear = document.getElementById('headerSearchMobileClear');

    if (mobileClear && mobileInput) {
      mobileClear.addEventListener('click', () => {
        mobileInput.value = '';
        mobileInput.focus();
        syncSearchQuery('');
      });
    }

    if (mobileInput) {
      mobileInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          syncSearchQuery(e.target.value);
        }, DEBOUNCE_DELAY);
      });
      mobileInput.addEventListener('keydown', handleKeyNavigation);
    }

    // Filter pills
    const filterPills = overlay.querySelectorAll('.search-filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => {
          p.classList.remove('is-active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('is-active');
        pill.setAttribute('aria-selected', 'true');
        activeFilter = pill.getAttribute('data-filter') || 'All';

        const activeInput = getActiveSearchInput();
        if (activeInput && activeInput.value.trim()) {
          syncSearchQuery(activeInput.value);
        }
      });
    });

    // Quick tag buttons
    const quickTags = overlay.querySelectorAll('.search-quick-tag');
    quickTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const query = tag.getAttribute('data-query');
        if (query) {
          const activeInput = getActiveSearchInput();
          if (activeInput) activeInput.value = query;
          syncSearchQuery(query);
        }
      });
    });
  }

  function getActiveSearchInput() {
    const desktopInput = document.getElementById('headerSearchInput');
    const mobileInput = document.getElementById('headerSearchMobileInput');
    if (window.innerWidth >= 992 && desktopInput) {
      return desktopInput;
    }
    return mobileInput || desktopInput;
  }

  /**
   * Open Search
   */
  async function openSearch(initialQuery = '') {
    isOpen = true;

    // Close mobile menu if currently open
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.getElementById('hamburger');
    if (mobileMenu && mobileMenu.classList.contains('active')) {
      mobileMenu.classList.remove('active');
      if (hamburger) hamburger.classList.remove('active');
    }

    const wrap = document.getElementById('headerSearchWrap');
    const overlay = document.getElementById('headerSearchDropdownOverlay');

    if (wrap) wrap.classList.add('is-expanded');
    if (overlay) {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
    }

    // Load search index immediately
    loadSearchIndex();

    renderRecentSearches();

    const desktopInput = document.getElementById('headerSearchInput');
    const mobileInput = document.getElementById('headerSearchMobileInput');

    if (initialQuery) {
      if (desktopInput) desktopInput.value = initialQuery;
      if (mobileInput) mobileInput.value = initialQuery;
      syncSearchQuery(initialQuery);
    }

    setTimeout(() => {
      const activeInput = getActiveSearchInput();
      if (activeInput) {
        activeInput.focus();
        activeInput.select();
      }
    }, 50);
  }

  /**
   * Close Search
   */
  function closeSearch() {
    isOpen = false;
    const wrap = document.getElementById('headerSearchWrap');
    const overlay = document.getElementById('headerSearchDropdownOverlay');

    if (wrap) wrap.classList.remove('is-expanded');
    if (overlay) {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
    }

    const toggleBtn = document.getElementById('headerSearchToggle');
    if (toggleBtn) toggleBtn.focus();
  }

  /**
   * Render Recent Searches
   */
  function renderRecentSearches() {
    const recentSec = document.getElementById('headerSearchRecentSection');
    const recentGrid = document.getElementById('headerSearchRecentGrid');
    if (!recentSec || !recentGrid) return;

    try {
      const recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
      if (recent.length > 0) {
        recentGrid.innerHTML = recent
          .map(term => `<button type="button" class="search-quick-tag" data-query="${escapeHtml(term)}">${escapeHtml(term)}</button>`)
          .join('');
        recentSec.style.display = 'block';

        recentGrid.querySelectorAll('.search-quick-tag').forEach(tag => {
          tag.addEventListener('click', () => {
            const query = tag.getAttribute('data-query');
            const activeInput = getActiveSearchInput();
            if (activeInput) activeInput.value = query;
            syncSearchQuery(query);
          });
        });
      } else {
        recentSec.style.display = 'none';
      }
    } catch (e) {
      recentSec.style.display = 'none';
    }
  }

  /**
   * Sync and execute search from either desktop or mobile input
   */
  async function syncSearchQuery(query) {
    const desktopInput = document.getElementById('headerSearchInput');
    const mobileInput = document.getElementById('headerSearchMobileInput');
    const desktopClear = document.getElementById('headerSearchClear');
    const mobileClear = document.getElementById('headerSearchMobileClear');

    const emptyState = document.getElementById('headerSearchEmpty');
    const resultsList = document.getElementById('headerSearchResults');
    const noResults = document.getElementById('headerSearchNoResults');
    const chipsBar = document.getElementById('headerSearchChips');
    const viewAllLink = document.getElementById('headerSearchViewAllLink');

    // Sync input values
    if (desktopInput && desktopInput.value !== query) desktopInput.value = query;
    if (mobileInput && mobileInput.value !== query) mobileInput.value = query;

    const trimmed = (query || '').trim();

    // Toggle clear buttons
    if (desktopClear) {
      trimmed.length > 0 ? desktopClear.classList.add('is-visible') : desktopClear.classList.remove('is-visible');
    }
    if (mobileClear) {
      trimmed.length > 0 ? mobileClear.classList.add('is-visible') : mobileClear.classList.remove('is-visible');
    }

    if (!trimmed) {
      if (emptyState) emptyState.style.display = 'block';
      if (resultsList) resultsList.style.display = 'none';
      if (noResults) noResults.style.display = 'none';
      if (chipsBar) chipsBar.style.display = 'none';
      if (viewAllLink) viewAllLink.style.display = 'none';
      currentResults = [];
      selectedResultIndex = -1;
      return;
    }

    await loadSearchIndex();

    // Autocomplete chips
    const suggestions = generateAutocompleteSuggestions(trimmed);
    if (chipsBar) {
      if (suggestions.length > 0) {
        chipsBar.innerHTML = `
          <span class="search-chip-label">Suggestions:</span>
          ${suggestions.map(s => `<button type="button" class="search-suggestion-chip" data-query="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')}
        `;
        chipsBar.style.display = 'flex';

        chipsBar.querySelectorAll('.search-suggestion-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const chipQuery = chip.getAttribute('data-query');
            const activeInput = getActiveSearchInput();
            if (activeInput) activeInput.value = chipQuery;
            syncSearchQuery(chipQuery);
          });
        });
      } else {
        chipsBar.style.display = 'none';
      }
    }

    currentResults = executeSearch(trimmed, activeFilter, MAX_LIVE_RESULTS);
    selectedResultIndex = -1;

    // View all link
    if (viewAllLink) {
      const pageUrl = resolveUrl(`search.html?q=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(activeFilter)}`);
      viewAllLink.href = pageUrl;
      viewAllLink.style.display = 'inline-flex';
    }

    if (currentResults.length > 0) {
      if (emptyState) emptyState.style.display = 'none';
      if (noResults) noResults.style.display = 'none';
      if (resultsList) {
        resultsList.innerHTML = renderResultCards(currentResults, trimmed);
        resultsList.style.display = 'flex';
        attachResultCardEvents(resultsList);
      }
      trackSearch(trimmed, activeFilter);
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (resultsList) resultsList.style.display = 'none';
      if (noResults) {
        const titleEl = document.getElementById('headerSearchNoResultsTitle');
        if (titleEl) titleEl.textContent = `No results found for "${trimmed}"`;
        noResults.style.display = 'block';
      }
      trackNoResults(trimmed);
    }
  }

  function renderResultCards(results, query) {
    return results.map((item, index) => {
      const itemUrl = resolveUrl(item.url);
      const imgUrl = resolveUrl(item.image || 'assets/images/logo.webp');
      const titleHighlighted = highlightMatches(item.title, query);
      const descHighlighted = highlightMatches(item.description, query);
      const destName = item.destination || (item.cities && item.cities[0]) || '';
      const actionText = item.actionText || 'View Details';

      const activitiesHTML = (item.activities && item.activities.length > 0)
        ? `<div class="search-card-activities">
             ${item.activities.slice(0, 3).map(act => `<span class="search-activity-tag">${escapeHtml(act)}</span>`).join('')}
           </div>`
        : '';

      return `
        <a href="${itemUrl}" class="search-result-card" data-index="${index}" role="option" aria-selected="false">
          <div class="search-card-thumb-wrap">
            <img src="${imgUrl}" alt="${escapeHtml(item.title)}" class="search-card-thumb" loading="lazy" onerror="this.src='${resolveUrl('assets/images/logo.webp')}'; this.style.objectFit='contain';" />
          </div>
          <div class="search-card-content">
            <div class="search-card-meta">
              <span class="search-badge-category">${escapeHtml(item.category)}</span>
              ${destName ? `<span class="search-badge-dest">📍 ${escapeHtml(destName)}</span>` : ''}
            </div>
            <h3 class="search-card-title">${titleHighlighted}</h3>
            <p class="search-card-desc">${descHighlighted}</p>
            ${activitiesHTML}
            <span class="search-card-cta">
              ${escapeHtml(actionText)} →
            </span>
          </div>
        </a>
      `;
    }).join('');
  }

  function attachResultCardEvents(container) {
    const cards = container.querySelectorAll('.search-result-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.getAttribute('data-index'), 10);
        if (currentResults[idx]) {
          trackResultClick(currentResults[idx]);
        }
      });

      card.addEventListener('mouseenter', () => {
        cards.forEach(c => c.classList.remove('is-selected'));
        card.classList.add('is-selected');
        selectedResultIndex = parseInt(card.getAttribute('data-index'), 10);
      });
    });
  }

  function handleKeyNavigation(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      navigateResults(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      navigateResults(-1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const activeInput = getActiveSearchInput();
      handleEnterPress(activeInput ? activeInput.value : '');
    }
  }

  function navigateResults(direction) {
    const cards = document.querySelectorAll('.search-result-card');
    if (cards.length === 0) return;

    selectedResultIndex += direction;
    if (selectedResultIndex < 0) selectedResultIndex = 0;
    if (selectedResultIndex >= cards.length) selectedResultIndex = cards.length - 1;

    cards.forEach((card, idx) => {
      if (idx === selectedResultIndex) {
        card.classList.add('is-selected');
        card.setAttribute('aria-selected', 'true');
        card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      } else {
        card.classList.remove('is-selected');
        card.setAttribute('aria-selected', 'false');
      }
    });
  }

  function handleEnterPress(query) {
    if (selectedResultIndex >= 0 && selectedResultIndex < currentResults.length) {
      const selectedItem = currentResults[selectedResultIndex];
      trackResultClick(selectedItem);
      window.location.href = resolveUrl(selectedItem.url);
      return;
    }

    if (query && query.trim()) {
      trackSearch(query.trim(), activeFilter);
      const searchUrl = resolveUrl(`search.html?q=${encodeURIComponent(query.trim())}&category=${encodeURIComponent(activeFilter)}`);
      window.location.href = searchUrl;
    }
  }

  // Global Keyboard Shortcuts (Ctrl+K, Cmd+K, '/')
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen ? closeSearch() : openSearch();
    } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape' && isOpen) {
      closeSearch();
    }
  });

  // Public API
  window.TrippoventionSearch = {
    open: openSearch,
    close: closeSearch,
    search: executeSearch,
    loadIndex: loadSearchIndex,
    resolveUrl: resolveUrl
  };

  function init() {
    mountHeaderSearch();

    // Auto-open search if URL has ?search= on a non-search.html page
    if (!window.location.pathname.endsWith('search.html')) {
      const searchParam = new URLSearchParams(window.location.search).get('search');
      if (searchParam) {
        setTimeout(() => openSearch(searchParam), 150);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
