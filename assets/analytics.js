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
      anonymize_ip: true, // GDPR requirement
    });
    window.gaLoaded = true;
  };
}

// Listen for cookie consent decision
window.addEventListener("cookieConsentUpdated", function (event) {
  if (event.detail.accepted) {
    loadGoogleAnalytics();
  } else {
    // User rejected analytics - don't load GA
    // Optional: Clear any existing GA cookies
    document.cookie = "_ga=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "_gid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "_gat=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  }
});

// Event Tracking - Auto-track user interactions
document.addEventListener("DOMContentLoaded", function () {
  // Track phone call clicks
  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      const phoneNumber = this.getAttribute("href").replace("tel:", "");
      gtag("event", "phone_call_click", {
        event_category: "contact",
        event_label: phoneNumber,
        page_path: window.location.pathname,
      });
    });
  });

  // Track WhatsApp clicks
  document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(function (link) {
    link.addEventListener("click", function (e) {
      gtag("event", "whatsapp_click", {
        event_category: "contact",
        event_label: "WhatsApp Inquiry",
        page_path: window.location.pathname,
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
        page_path: window.location.pathname,
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
        page_path: window.location.pathname,
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
        page_path: window.location.pathname,
      });
    });
  });

  // Track outbound links
  document.querySelectorAll('a[href^="http"]').forEach(function (link) {
    if (!link.href.includes(window.location.hostname)) {
      link.addEventListener("click", function (e) {
        gtag("event", "outbound_link_click", {
          event_category: "engagement",
          event_label: this.href,
          page_path: window.location.pathname,
        });
      });
    }
  });
});
