/**
 * GDPR Cookie Consent Banner
 * Lightweight implementation (no external dependencies)
 * Manages user consent for Google Analytics tracking
 */

(function () {
  "use strict";

  const CONSENT_KEY = "trippovention_cookie_consent";
  const CONSENT_TIMESTAMP_KEY = "trippovention_consent_timestamp";
  const CONSENT_EXPIRY_DAYS = 365;

  // Check if consent was already given
  function hasConsent() {
    const consent = localStorage.getItem(CONSENT_KEY);
    const timestamp = localStorage.getItem(CONSENT_TIMESTAMP_KEY);

    if (!consent || !timestamp) return null;

    // Check if consent is expired (1 year)
    const consentDate = new Date(parseInt(timestamp));
    const expiryDate = new Date(consentDate);
    expiryDate.setDate(expiryDate.getDate() + CONSENT_EXPIRY_DAYS);

    if (new Date() > expiryDate) {
      // Consent expired, clear it
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
      return null;
    }

    return consent === "true";
  }

  // Save user consent
  function saveConsent(accepted) {
    localStorage.setItem(CONSENT_KEY, accepted.toString());
    localStorage.setItem(CONSENT_TIMESTAMP_KEY, Date.now().toString());

    // Dispatch event for analytics.js to listen
    window.dispatchEvent(
      new CustomEvent("cookieConsentUpdated", {
        detail: { accepted },
      })
    );
  }

  // Create and show consent banner
  function showConsentBanner() {
    const banner = document.createElement("div");
    banner.id = "cookieConsentBanner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie Consent");
    banner.setAttribute("aria-describedby", "cookieConsentText");

    banner.innerHTML = `
            <div class="cookie-consent-container">
                <div class="cookie-consent-content">
                    <p id="cookieConsentText">
                        <strong>🍪 We use cookies</strong><br>
                        We use essential cookies to ensure our site works properly, and analytics cookies to understand how you use our site. 
                        Analytics cookies help us improve your experience.
                    </p>
                    <div class="cookie-consent-actions">
                        <button id="cookieAccept" class="cookie-btn cookie-btn-accept" aria-label="Accept all cookies">
                            Accept All
                        </button>
                        <button id="cookieReject" class="cookie-btn cookie-btn-reject" aria-label="Reject analytics cookies">
                            Reject Analytics
                        </button>
                        <a href="privacy-policy.html" class="cookie-link" target="_blank" rel="noopener">Privacy Policy</a>
                    </div>
                </div>
            </div>
        `;

    document.body.appendChild(banner);

    // Add styles
    const style = document.createElement("style");
    style.textContent = `
            #cookieConsentBanner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--bg-primary, #ffffff);
                border-top: 2px solid var(--border-color, #e2e8f0);
                box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                animation: slideUp 0.4s ease-out;
            }
            
            @keyframes slideUp {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .cookie-consent-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px 24px;
            }
            
            .cookie-consent-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 20px;
                flex-wrap: wrap;
            }
            
            .cookie-consent-content p {
                margin: 0;
                flex: 1;
                min-width: 280px;
                color: var(--text-primary, #0f172a);
                font-size: 14px;
                line-height: 1.5;
            }
            
            .cookie-consent-content strong {
                font-size: 16px;
                color: var(--text-primary, #0f172a);
            }
            
            .cookie-consent-actions {
                display: flex;
                align-items: center;
                gap: 12px;
                flex-wrap: wrap;
            }
            
            .cookie-btn {
                padding: 10px 24px;
                border: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            
            .cookie-btn-accept {
                background: linear-gradient(135deg, #d6804e 0%, #e67e22 100%);
                color: white;
                box-shadow: 0 2px 8px rgba(214, 128, 78, 0.3);
            }
            
            .cookie-btn-accept:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(214, 128, 78, 0.4);
            }
            
            .cookie-btn-reject {
                background: var(--bg-tertiary, #f1f5f9);
                color: var(--text-primary, #0f172a);
                border: 1px solid var(--border-color, #e2e8f0);
            }
            
            .cookie-btn-reject:hover {
                background: var(--bg-secondary, #f8fafc);
            }
            
            .cookie-link {
                color: var(--text-muted, #64748b);
                text-decoration: underline;
                font-size: 13px;
                white-space: nowrap;
            }
            
            .cookie-link:hover {
                color: var(--orange, #d6804e);
            }
            
            /* Dark theme support */
            [data-theme="dark"] #cookieConsentBanner {
                background: var(--bg-primary, #1e293b);
                border-top-color: var(--border-color, #475569);
            }
            
            [data-theme="dark"] .cookie-consent-content p,
            [data-theme="dark"] .cookie-consent-content strong {
                color: var(--text-primary, #f8fafc);
            }
            
            [data-theme="dark"] .cookie-btn-reject {
                background: var(--bg-tertiary, #334155);
                color: var(--text-primary, #f8fafc);
                border-color: var(--border-color, #475569);
            }
            
            /* Mobile responsive */
            @media (max-width: 768px) {
                .cookie-consent-content {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .cookie-consent-actions {
                    flex-direction: column;
                    width: 100%;
                }
                
                .cookie-btn {
                    width: 100%;
                }
            }
        `;
    document.head.appendChild(style);

    // Event listeners
    document.getElementById("cookieAccept").addEventListener("click", function () {
      saveConsent(true);
      banner.style.animation = "slideUp 0.3s ease-out reverse";
      setTimeout(() => banner.remove(), 300);
    });

    document.getElementById("cookieReject").addEventListener("click", function () {
      saveConsent(false);
      banner.style.animation = "slideUp 0.3s ease-out reverse";
      setTimeout(() => banner.remove(), 300);
    });
  }

  // Initialize on DOM ready
  function init() {
    const consent = hasConsent();

    if (consent === null) {
      // No consent decision yet, show banner after a short delay
      setTimeout(showConsentBanner, 1000);
    } else {
      // Consent already given, notify analytics
      window.dispatchEvent(
        new CustomEvent("cookieConsentUpdated", {
          detail: { accepted: consent },
        })
      );
    }
  }

  // Run initialization
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Expose API for manual consent management
  window.CookieConsent = {
    hasConsent: hasConsent,
    accept: function () {
      saveConsent(true);
    },
    reject: function () {
      saveConsent(false);
    },
    reset: function () {
      localStorage.removeItem(CONSENT_KEY);
      localStorage.removeItem(CONSENT_TIMESTAMP_KEY);
      showConsentBanner();
    },
  };
})();


