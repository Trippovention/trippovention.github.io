/**
 * Trippovention Global Search System
 * Modern, accessible, typo-tolerant, instant search engine and UI
 */

(function () {
  'use strict';

  // Prevent multiple initializations
  if (window.TrippoventionSearchInitialized) return;
  window.TrippoventionSearchInitialized = true;

  // Configuration & Constants
  const SEARCH_INDEX_URL = 'assets/search-index.json';
  const DEBOUNCE_DELAY = 120;
  const MAX_LIVE_RESULTS = 15;
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

  /**
   * Determine relative path prefix to site root
   */
  function getRootPrefix() {
    if (rootPrefix !== null) return rootPrefix;

    // Check script or stylesheet tags
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
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
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
    // Replace known typos
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
        // Massive boost for destination hub pages (e.g. packages/thailand/index.html when searching "thailand")
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

        // Stem variations (singular/plural)
        const stems = [token];
        if (token.endsWith('s') && token.length > 3) stems.push(token.slice(0, -1));
        if (token.endsWith('es') && token.length > 4) stems.push(token.slice(0, -2));
        if (!token.endsWith('s')) stems.push(token + 's');

        for (let s = 0; s < stems.length; s++) {
          const stem = stems[s];

          // Title match
          if (titleLower.includes(stem)) {
            score += 400;
            tokenMatched = true;
          }

          // Destination match
          if (destLower.includes(stem)) {
            score += 350;
            tokenMatched = true;
          }

          // Cities match
          if (cities.some(c => c.includes(stem))) {
            score += 300;
            tokenMatched = true;
          }

          // Activities match
          if (activities.some(a => a.includes(stem))) {
            score += 280;
            tokenMatched = true;
          }

          // Keywords match
          if (keywords.includes(stem)) {
            score += 220;
            tokenMatched = true;
          } else if (keywords.some(k => k.includes(stem))) {
            score += 140;
            tokenMatched = true;
          }

          // Description match
          if (descLower.includes(stem)) {
            score += 80;
            tokenMatched = true;
          }
        }

        // Fuzzy match for tokens >= 4 chars if no exact match
        if (!tokenMatched && token.length >= 4) {
          // Check destination
          if (destLower && levenshtein(token, destLower) <= 1) {
            score += 450;
            tokenMatched = true;
          }
          // Check cities
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

      // Multi-word combination bonus (all tokens matched)
      if (tokens.length > 1 && matchedTokens === tokens.length) {
        score += 850;
      }

      // Travel domain query boosts
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

    // Find destination prefix match
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

  /**
   * Escape HTML to prevent injection
   */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * Highlight matching terms in search results
   */
  function highlightMatches(text, query) {
    if (!text || !query) return escapeHtml(text);
    const tokens = normalizeQuery(query).split(/\s+/).filter(t => t.length > 1);
    if (tokens.length === 0) return escapeHtml(text);

    let escaped = escapeHtml(text);
    // Sort tokens by length descending
    tokens.sort((a, b) => b.length - a.length);

    tokens.forEach(tok => {
      const reg = new RegExp('(' + tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
      escaped = escaped.replace(reg, '<mark>$1</mark>');
    });

    return escaped;
  }

  /**
   * Analytics integration
   */
  function trackSearch(term, category) {
    if (!term) return;

    // Google Tag Manager / GA4
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

    // Save recent searches locally
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
   * Build & Inject the Accessible Search Modal UI
   */
  function createSearchModalDOM() {
    if (document.getElementById('siteSearchModalBackdrop')) return;

    const modalHTML = `
      <div class="search-modal-backdrop" id="siteSearchModalBackdrop" role="dialog" aria-modal="true" aria-labelledby="siteSearchInput" aria-hidden="true">
        <div class="search-modal-dialog" id="siteSearchModalDialog">
          <!-- Header -->
          <div class="search-modal-header">
            <div class="search-input-wrapper">
              <div class="search-input-icon" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </div>
              <input
                type="search"
                class="search-input-field"
                id="siteSearchInput"
                placeholder="Search destinations, activities, packages, visas & more..."
                autocomplete="off"
                spellcheck="false"
                aria-autocomplete="list"
                aria-controls="searchResultsList"
                aria-expanded="false"
              />
              <button type="button" class="search-input-clear-btn" id="siteSearchClearBtn" aria-label="Clear search input">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              <button type="button" class="search-modal-close-btn" id="siteSearchCloseBtn" aria-label="Close search (Esc)">
                ESC
              </button>
            </div>
          </div>

          <!-- Category Filters Bar -->
          <div class="search-filters-bar" role="tablist" aria-label="Search category filters">
            <button type="button" class="search-filter-pill is-active" data-filter="All" role="tab" aria-selected="true">All</button>
            <button type="button" class="search-filter-pill" data-filter="Destinations" role="tab" aria-selected="false">Destinations</button>
            <button type="button" class="search-filter-pill" data-filter="Packages" role="tab" aria-selected="false">Packages</button>
            <button type="button" class="search-filter-pill" data-filter="Activities" role="tab" aria-selected="false">Activities</button>
            <button type="button" class="search-filter-pill" data-filter="Transfers" role="tab" aria-selected="false">Transfers</button>
            <button type="button" class="search-filter-pill" data-filter="Visa" role="tab" aria-selected="false">Visa</button>
            <button type="button" class="search-filter-pill" data-filter="Hotels" role="tab" aria-selected="false">Hotels</button>
            <button type="button" class="search-filter-pill" data-filter="Services" role="tab" aria-selected="false">Services</button>
          </div>

          <!-- Dynamic Autocomplete Suggestions Bar -->
          <div class="search-suggestions-chips" id="searchSuggestionChips" style="display: none;"></div>

          <!-- Modal Body -->
          <div class="search-modal-body" id="siteSearchModalBody">
            <!-- Default / Empty State -->
            <div class="search-empty-state" id="searchEmptyState">
              <!-- Recent Searches Section (dynamic) -->
              <div class="search-suggestions-section" id="searchRecentSection" style="display: none;">
                <div class="search-suggestions-title">
                  <span>🕒 Recent Searches</span>
                </div>
                <div class="search-tags-grid" id="searchRecentGrid"></div>
              </div>

              <!-- Popular Destinations -->
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

              <!-- Popular Searches -->
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

            <!-- Live Results Container -->
            <div class="search-results-list" id="searchResultsList" role="listbox" style="display: none;"></div>

            <!-- No Results Container -->
            <div class="search-no-results" id="searchNoResultsState" style="display: none;">
              <div class="search-no-results-icon">🔍</div>
              <div class="search-no-results-title" id="searchNoResultsTitle">No results found</div>
              <div class="search-no-results-sub">
                Try searching for destinations, activities, packages, or visa services.
              </div>
              <div class="search-suggestions-section">
                <div class="search-suggestions-title">
                  <span>Explore Existing Destinations:</span>
                </div>
                <div class="search-tags-grid" style="justify-content: center;">
                  <button type="button" class="search-quick-tag" data-query="Thailand">Thailand</button>
                  <button type="button" class="search-quick-tag" data-query="Singapore">Singapore</button>
                  <button type="button" class="search-quick-tag" data-query="Vietnam">Vietnam</button>
                  <button type="button" class="search-quick-tag" data-query="Japan">Japan</button>
                  <button type="button" class="search-quick-tag" data-query="India">India</button>
                  <button type="button" class="search-quick-tag" data-query="Europe">Europe</button>
                  <button type="button" class="search-quick-tag" data-query="Visa">Visa Services</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="search-modal-footer">
            <div class="search-footer-shortcuts">
              <span class="search-footer-shortcut-item">
                <kbd class="search-footer-kbd">↑</kbd> <kbd class="search-footer-kbd">↓</kbd> navigate
              </span>
              <span class="search-footer-shortcut-item">
                <kbd class="search-footer-kbd">↵</kbd> select or full results
              </span>
              <span class="search-footer-shortcut-item">
                <kbd class="search-footer-kbd">esc</kbd> close
              </span>
            </div>
            <a href="#" class="search-view-all-link" id="searchViewAllLink" style="display: none;">
              View all results on search page →
            </a>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    attachModalEvents();
  }

  /**
   * Inject Header Search Trigger Button into existing nav
   */
  function injectNavTriggers() {
    const navActions = document.querySelector('.nav-right .actions, .nav .actions');
    if (!navActions) return;

    // Check if trigger button already exists
    if (!document.getElementById('siteSearchTrigger')) {
      const triggerBtn = document.createElement('button');
      triggerBtn.className = 'icon search-trigger-btn';
      triggerBtn.id = 'siteSearchTrigger';
      triggerBtn.type = 'button';
      triggerBtn.setAttribute('aria-label', 'Search Trippovention');
      triggerBtn.setAttribute('title', 'Search destinations, packages, visas (Ctrl+K)');
      triggerBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      `;

      // Insert as first action icon in header
      navActions.insertBefore(triggerBtn, navActions.firstChild);

      // Pre-fetch search index on hover/focus
      triggerBtn.addEventListener('mouseenter', () => loadSearchIndex());
      triggerBtn.addEventListener('focus', () => loadSearchIndex());
      triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSearchModal();
      });
    }

    // Desktop Search Pill Trigger
    const navRight = document.querySelector('.nav-right');
    if (navRight && !document.getElementById('navSearchPill')) {
      const pillBtn = document.createElement('button');
      pillBtn.className = 'nav-search-pill';
      pillBtn.id = 'navSearchPill';
      pillBtn.type = 'button';
      pillBtn.setAttribute('aria-label', 'Search Trippovention');
      pillBtn.setAttribute('title', 'Quick Search (Press Ctrl+K)');
      pillBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <span class="nav-search-pill-text">Search destinations, activities, packages, visas...</span>
        <kbd class="nav-search-kbd">⌘K</kbd>
      `;

      // Place before .actions in navRight
      navRight.insertBefore(pillBtn, navActions);

      pillBtn.addEventListener('mouseenter', () => loadSearchIndex());
      pillBtn.addEventListener('focus', () => loadSearchIndex());
      pillBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openSearchModal();
      });
    }
  }

  /**
   * Modal Open / Close Logic
   */
  function openSearchModal(initialQuery = '') {
    const backdrop = document.getElementById('siteSearchModalBackdrop');
    if (!backdrop) return;

    // Load search index immediately
    loadSearchIndex();

    backdrop.classList.add('is-open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Render recent searches if available
    renderRecentSearches();

    const input = document.getElementById('siteSearchInput');
    if (input) {
      if (initialQuery) {
        input.value = initialQuery;
        triggerSearch(initialQuery);
      }
      setTimeout(() => {
        input.focus();
        input.select();
      }, 50);
    }
  }

  function closeSearchModal() {
    const backdrop = document.getElementById('siteSearchModalBackdrop');
    if (!backdrop) return;

    backdrop.classList.remove('is-open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';

    // Restore focus to trigger
    const trigger = document.getElementById('siteSearchTrigger') || document.getElementById('navSearchPill');
    if (trigger) trigger.focus();
  }

  /**
   * Render Recent Searches
   */
  function renderRecentSearches() {
    const recentSec = document.getElementById('searchRecentSection');
    const recentGrid = document.getElementById('searchRecentGrid');
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
            const input = document.getElementById('siteSearchInput');
            if (input) input.value = query;
            triggerSearch(query);
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
   * Trigger Search Execution
   */
  async function triggerSearch(query) {
    const clearBtn = document.getElementById('siteSearchClearBtn');
    const emptyState = document.getElementById('searchEmptyState');
    const resultsList = document.getElementById('searchResultsList');
    const noResultsState = document.getElementById('searchNoResultsState');
    const suggestionsChips = document.getElementById('searchSuggestionChips');
    const viewAllLink = document.getElementById('searchViewAllLink');
    const input = document.getElementById('siteSearchInput');

    const trimmed = (query || '').trim();

    if (clearBtn) {
      trimmed.length > 0 ? clearBtn.classList.add('is-visible') : clearBtn.classList.remove('is-visible');
    }

    if (!trimmed) {
      if (emptyState) emptyState.style.display = 'block';
      if (resultsList) resultsList.style.display = 'none';
      if (noResultsState) noResultsState.style.display = 'none';
      if (suggestionsChips) suggestionsChips.style.display = 'none';
      if (viewAllLink) viewAllLink.style.display = 'none';
      if (input) input.setAttribute('aria-expanded', 'false');
      currentResults = [];
      selectedResultIndex = -1;
      return;
    }

    // Ensure search index loaded
    await loadSearchIndex();

    // Generate autocomplete chips
    const autocompletes = generateAutocompleteSuggestions(trimmed);
    if (suggestionsChips) {
      if (autocompletes.length > 0) {
        suggestionsChips.innerHTML = `
          <span class="search-chip-label">Suggestions:</span>
          ${autocompletes.map(item => `<button type="button" class="search-suggestion-chip" data-query="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('')}
        `;
        suggestionsChips.style.display = 'flex';

        suggestionsChips.querySelectorAll('.search-suggestion-chip').forEach(chip => {
          chip.addEventListener('click', () => {
            const chipQuery = chip.getAttribute('data-query');
            if (input) input.value = chipQuery;
            triggerSearch(chipQuery);
          });
        });
      } else {
        suggestionsChips.style.display = 'none';
      }
    }

    // Perform Search
    currentResults = executeSearch(trimmed, activeFilter, MAX_LIVE_RESULTS);
    selectedResultIndex = -1;

    // Update View All link to search page
    if (viewAllLink) {
      const searchPageUrl = resolveUrl(`search.html?q=${encodeURIComponent(trimmed)}&category=${encodeURIComponent(activeFilter)}`);
      viewAllLink.href = searchPageUrl;
      viewAllLink.style.display = 'inline-flex';
    }

    if (currentResults.length > 0) {
      if (emptyState) emptyState.style.display = 'none';
      if (noResultsState) noResultsState.style.display = 'none';
      if (resultsList) {
        resultsList.innerHTML = renderResultCards(currentResults, trimmed);
        resultsList.style.display = 'flex';
        attachResultCardEvents(resultsList);
      }
      if (input) input.setAttribute('aria-expanded', 'true');
      trackSearch(trimmed, activeFilter);
    } else {
      if (emptyState) emptyState.style.display = 'none';
      if (resultsList) resultsList.style.display = 'none';
      if (noResultsState) {
        const titleEl = document.getElementById('searchNoResultsTitle');
        if (titleEl) titleEl.textContent = `No results found for "${trimmed}"`;
        noResultsState.style.display = 'block';
      }
      if (input) input.setAttribute('aria-expanded', 'false');
      trackNoResults(trimmed);
    }
  }

  /**
   * Render Result Cards HTML
   */
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

  /**
   * Attach Events to Result Cards
   */
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

  /**
   * Attach Events to Search Modal Components
   */
  function attachModalEvents() {
    const backdrop = document.getElementById('siteSearchModalBackdrop');
    const dialog = document.getElementById('siteSearchModalDialog');
    const input = document.getElementById('siteSearchInput');
    const clearBtn = document.getElementById('siteSearchClearBtn');
    const closeBtn = document.getElementById('siteSearchCloseBtn');
    const filterPills = document.querySelectorAll('.search-filter-pill');
    const quickTags = document.querySelectorAll('.search-quick-tag');

    // Close on backdrop click (outside dialog)
    if (backdrop) {
      backdrop.addEventListener('click', (e) => {
        if (!dialog.contains(e.target)) {
          closeSearchModal();
        }
      });
    }

    // Close on close button
    if (closeBtn) {
      closeBtn.addEventListener('click', closeSearchModal);
    }

    // Clear input
    if (clearBtn && input) {
      clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        triggerSearch('');
      });
    }

    // Filter pills
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => {
          p.classList.remove('is-active');
          p.setAttribute('aria-selected', 'false');
        });
        pill.classList.add('is-active');
        pill.setAttribute('aria-selected', 'true');
        activeFilter = pill.getAttribute('data-filter') || 'All';

        if (input && input.value.trim()) {
          triggerSearch(input.value);
        }
      });
    });

    // Quick tags (destinations / popular searches)
    quickTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const query = tag.getAttribute('data-query');
        if (input && query) {
          input.value = query;
          triggerSearch(query);
        }
      });
    });

    // Input live typing (debounced)
    if (input) {
      input.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          triggerSearch(e.target.value);
        }, DEBOUNCE_DELAY);
      });

      // Keyboard navigation
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeSearchModal();
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          navigateResults(1);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          navigateResults(-1);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          handleEnterPress(input.value);
        }
      });
    }

    // Global keyboard shortcut (Ctrl+K, Cmd+K, '/')
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const bd = document.getElementById('siteSearchModalBackdrop');
        if (bd && bd.classList.contains('is-open')) {
          closeSearchModal();
        } else {
          openSearchModal();
        }
      } else if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        openSearchModal();
      } else if (e.key === 'Escape') {
        const bd = document.getElementById('siteSearchModalBackdrop');
        if (bd && bd.classList.contains('is-open')) {
          closeSearchModal();
        }
      }
    });
  }

  /**
   * Handle Arrow Up/Down Navigation
   */
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

  /**
   * Handle Enter Key
   */
  function handleEnterPress(query) {
    const cards = document.querySelectorAll('.search-result-card');

    // If an item is selected via arrows, open that item
    if (selectedResultIndex >= 0 && selectedResultIndex < currentResults.length) {
      const selectedItem = currentResults[selectedResultIndex];
      trackResultClick(selectedItem);
      window.location.href = resolveUrl(selectedItem.url);
      return;
    }

    // Otherwise, navigate to the dedicated search results page!
    if (query && query.trim()) {
      trackSearch(query.trim(), activeFilter);
      const searchUrl = resolveUrl(`search.html?q=${encodeURIComponent(query.trim())}&category=${encodeURIComponent(activeFilter)}`);
      window.location.href = searchUrl;
    }
  }

  /**
   * Public API
   */
  window.TrippoventionSearch = {
    open: openSearchModal,
    close: closeSearchModal,
    search: executeSearch,
    loadIndex: loadSearchIndex,
    resolveUrl: resolveUrl
  };

  // Initialize on DOMContentLoaded or immediately if DOM is ready
  function init() {
    createSearchModalDOM();
    injectNavTriggers();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
