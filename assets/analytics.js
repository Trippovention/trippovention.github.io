/**
 * Trippovention - Centralized Google Analytics 4
 * GDPR Compliant - Only loads if user consents to analytics cookies
 * Single configuration file for all analytics tracking
 */

// Configuration
const GA_MEASUREMENT_ID = "G-M2NE7YXF3H"; // Trippovention Google Analytics 4 ID

// Initialize dataLayer (needed even before consent)
window.dataLayer = window.dataLayer || [];

function gtag() {
  dataLayer.push(arguments);
}

// Expose gtag globally
window.gtag = gtag;

// Load Google Analytics script (GDPR compliant)
function loadGoogleAnalytics() {
  // Check if already loaded
  if (window.gaLoaded) return;

  const gaScript = document.createElement("script");
  gaScript.async = true;
  gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(gaScript);

  // Configure GA4
  gaScript.onload = function () {
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_path: window.location.pathname,
      page_location: window.location.href,
      anonymize_ip: true // GDPR requirement
    });
    window.gaLoaded = true;
  };
}

// Load Bing Universal Event Tracking (UET) (GDPR compliant)
function loadBingUET() {
  if (window.bingUetLoaded) return;

  (function(w, d, t, u, o) {
    w[u] = w[u] || [], o.ts = (new Date).getTime();
    var n = d.createElement(t);
    n.src = "https://bat.bing.net/bat.js?ti=" + o.ti + ("uetq" != u ? "&q=" + u : ""),
    n.async = 1, n.onload = n.onreadystatechange = function() {
      var s = this.readyState;
      s && "loaded" !== s && "complete" !== s || (o.q = w[u], w[u] = new UET(o), w[u].push("pageLoad"), n.onload = n.onreadystatechange = null)
    };
    var i = d.getElementsByTagName(t)[0];
    i.parentNode.insertBefore(n, i);
    window.bingUetLoaded = true;
  })(window, document, "script", "uetq", { ti: "343249345", enableAutoSpaTracking: true });
}

/**
 * Set Bing UET enhanced matching identifiers.
 * Call this when user provides email/phone (e.g. on form submission).
 * @param {string} [email] - User's email address
 * @param {string} [phone] - User's phone number
 */
function setUetEnhancedMatch(email, phone) {
  if (!window.uetq) return;
  const pid = {};
  if (email && typeof email === "string") {
    pid.em = email.trim().toLowerCase();
  }
  if (phone && typeof phone === "string") {
    // Keep only digits and leading plus sign
    pid.ph = phone.trim().replace(/[^\d+]/g, "");
  }
  if (Object.keys(pid).length) {
    window.uetq.push('set', { pid });
  }
}
window.setUetEnhancedMatch = setUetEnhancedMatch;

// Check for and push pending visitor contact info from sessionStorage (cross-redirect)
function checkPendingUetMatching() {
  if (!window.uetq) return;
  try {
    const email = sessionStorage.getItem("uet_pending_email");
    const phone = sessionStorage.getItem("uet_pending_phone");
    if (email || phone) {
      setUetEnhancedMatch(email, phone);
      // Clear after pushing to avoid double submissions on subsequent page loads
      sessionStorage.removeItem("uet_pending_email");
      sessionStorage.removeItem("uet_pending_phone");
    }
  } catch (e) {
    console.warn("Unable to access sessionStorage for UET matching:", e);
  }
}

// Listen for cookie consent decision
window.addEventListener("cookieConsentUpdated", function (event) {
  if (event.detail.accepted) {
    loadGoogleAnalytics();
    loadBingUET();
    // Check for pending contact matching after a short delay to ensure UET is initialized
    setTimeout(checkPendingUetMatching, 500);
  } else {
    // User rejected analytics - don't load GA or Bing UET
    // Clear any existing GA & Bing cookies
    document.cookie = "_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    document.cookie = "_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    document.cookie = "_gat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    document.cookie = "_uetmsclkid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
    document.cookie = "_uetvid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname;
  }
});

// Check if consent was already accepted in a previous session (solves race conditions on refresh)
if (localStorage.getItem("trippovention_cookie_consent") === "true") {
  loadGoogleAnalytics();
  loadBingUET();
  // Check for pending contact matching after a short delay to ensure UET is initialized
  setTimeout(checkPendingUetMatching, 500);
}

// Event Tracking - Auto-track user interactions
document.addEventListener("DOMContentLoaded", function () {
  // Track phone call clicks
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const phoneNumber = this.getAttribute("href").replace("tel:", "");
      gtag("event", "phone_call_click", {
        event_category: "contact",
        event_label: phoneNumber,
        page_path: window.location.pathname
      });
    });
  });

  // Track WhatsApp clicks
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      gtag("event", "whatsapp_click", {
        event_category: "contact",
        event_label: "WhatsApp Inquiry",
        page_path: window.location.pathname
      });
    });
  });

  // Track email clicks
  document.querySelectorAll('a[href^="mailto:"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const email = this.getAttribute("href").replace("mailto:", "");
      gtag("event", "email_click", {
        event_category: "contact",
        event_label: email,
        page_path: window.location.pathname
      });
    });
  });

  // Track package enquiry buttons
  document.querySelectorAll('.btn[href*="contact"], a[href*="contact"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const packageName = document.title || "Unknown Package";
      gtag("event", "enquiry_click", {
        event_category: "lead_generation",
        event_label: packageName,
        page_path: window.location.pathname
      });
    });
  });

  // Track booking form submissions
  const bookingForms = document.querySelectorAll('form[id*="booking"], form[id*="contact"]');
  bookingForms.forEach(function (form) {
    form.addEventListener("submit", function (e) {
      const formType = form.getAttribute("id") || "contact_form";
      gtag("event", "form_submission", {
        event_category: "lead_generation",
        event_label: formType,
        page_path: window.location.pathname
      });

      // Track lead submission conversion in Bing UET
      if (window.uetq) {
        window.uetq.push("event", "form_submission", {
          event_category: "lead_generation",
          event_label: formType
        });
      }

      // Capture email & phone for Bing UET Enhanced Matching
      let email = "";
      let phone = "";
      form.querySelectorAll("input").forEach(function (input) {
        const name = (input.name || "").toLowerCase();
        const type = (input.type || "").toLowerCase();
        if (type === "email" || name.indexOf("email") !== -1) {
          email = input.value;
        } else if (type === "tel" || name.indexOf("phone") !== -1 || name.indexOf("tel") !== -1) {
          phone = input.value;
        }
      });

      if (email || phone) {
        try {
          if (email) sessionStorage.setItem("uet_pending_email", email);
          if (phone) sessionStorage.setItem("uet_pending_phone", phone);
        } catch (err) {
          // If sessionStorage is disabled/blocked, push matching parameters immediately as fallback
          setUetEnhancedMatch(email, phone);
        }
      }
    });
  });

  // Track outbound links
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    if (!link.href.includes(window.location.hostname)) {
      link.addEventListener("click", function (e) {
        gtag("event", "outbound_link_click", {
          event_category: "engagement",
          event_label: this.href,
          page_path: window.location.pathname
        });
      });
    }
  });
});
