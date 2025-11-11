// Enhanced UX helpers: lazy loading, smooth scroll, mobile nav, and PERFECT dark theme
document.addEventListener("DOMContentLoaded", function () {
  // Accessible dropdown: toggle aria-expanded on nav destination trigger
  document.querySelectorAll('.has-dropdown > a[aria-haspopup="true"]').forEach(trigger => {
    const menu = trigger.nextElementSibling;
    if (!menu) return;

    const focusableItems = () => Array.from(menu.querySelectorAll('a')); // cache on demand

    function openMenu() {
      trigger.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
      const first = focusableItems()[0];
      if (first) first.focus();
    }

    function closeMenu(focusTrigger = false) {
      trigger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      if (focusTrigger) trigger.focus();
    }

    trigger.addEventListener('click', (e) => {
      // Prevent navigation when toggling
      e.preventDefault();
      // Stop propagation to prevent hamburger menu from closing on mobile
      e.stopPropagation();
      const expanded = trigger.getAttribute('aria-expanded') === 'true';
      expanded ? closeMenu(true) : openMenu();
    });

    // Keyboard handling when trigger has focus
    trigger.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowDown' && trigger.getAttribute('aria-expanded') === 'false') {
        ev.preventDefault();
        openMenu();
      } else if (ev.key === 'Escape') {
        closeMenu(true);
      }
    });

    // Menu keyboard navigation
    menu.addEventListener('keydown', (ev) => {
      const items = focusableItems();
      const currentIndex = items.indexOf(document.activeElement);
      if (ev.key === 'Escape') {
        ev.preventDefault();
        closeMenu(true);
      } else if (ev.key === 'ArrowDown') {
        ev.preventDefault();
        const next = items[(currentIndex + 1) % items.length];
        if (next) next.focus();
      } else if (ev.key === 'ArrowUp') {
        ev.preventDefault();
        const prev = items[(currentIndex - 1 + items.length) % items.length];
        if (prev) prev.focus();
      } else if (ev.key === 'Home') {
        ev.preventDefault();
        if (items[0]) items[0].focus();
      } else if (ev.key === 'End') {
        ev.preventDefault();
        if (items[items.length - 1]) items[items.length - 1].focus();
      } else if (ev.key === 'Tab') {
        // Close if tabbing out of menu (forward or backward)
        if (ev.shiftKey && currentIndex === 0) {
          closeMenu(true);
        } else if (!ev.shiftKey && currentIndex === items.length - 1) {
          closeMenu(false);
        }
      }
    });

    // Close on outside click (but not when clicking dropdown items)
    document.addEventListener('click', (ev) => {
      if (!trigger.parentElement.contains(ev.target)) {
        closeMenu();
      }
    });

    // Prevent dropdown menu links from closing hamburger menu on mobile
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', (e) => {
        // Stop propagation so hamburger menu doesn't close
        e.stopPropagation();
      });
    });
  });
  // Enhanced lazy loading for images with error handling
  document.querySelectorAll("img[data-src]").forEach((img) => {
    // Fallback for browsers without IntersectionObserver
    if (!("IntersectionObserver" in window)) {
      img.src = img.dataset.src;
      return;
    }

    try {
      const observer = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              try {
                img.src = img.dataset.src;
                img.onerror = () => {
                  // Only log in development
                  if (
                    window.location.hostname === "localhost" ||
                    window.location.hostname === "127.0.0.1"
                  ) {
                    console.error("Failed to load image:", img.dataset.src);
                  }
                  // Set a fallback placeholder if image fails
                  img.style.backgroundColor = "var(--bg-tertiary)";
                  img.alt = "Image unavailable";
                };
              } catch (error) {
                if (
                  window.location.hostname === "localhost" ||
                  window.location.hostname === "127.0.0.1"
                ) {
                  console.error("Error setting image src:", error);
                }
              } finally {
                obs.unobserve(img);
              }
            }
          });
        },
        {
          rootMargin: "50px",
        }
      ); // Preload images 50px before viewport
      observer.observe(img);
    } catch (error) {
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        console.error("IntersectionObserver error:", error);
      }
      img.src = img.dataset.src; // Fallback
    }
  });

  // Perfect Dark Theme Toggle
  const themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    const THEME_KEY = "trippovention_theme";

    // Initialize theme on page load
    function initializeTheme() {
      const savedTheme = localStorage.getItem(THEME_KEY) || "light";
      applyTheme(savedTheme);
      updateToggleIcon(savedTheme);
    }

    // Apply theme to document
    function applyTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      document.body.className =
        document.body.className.replace(/theme-\w+/g, "") + ` theme-${theme}`;

      // Dispatch custom event for any components that need to react
      window.dispatchEvent(
        new CustomEvent("themeChanged", {
          detail: {
            theme,
          },
        })
      );
    }

    // Update toggle icon
    function updateToggleIcon(theme) {
      themeToggle.innerHTML = theme === "dark" ? "☀️" : "🌓";
      themeToggle.setAttribute(
        "title",
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      );
    }

    // Toggle theme
    function toggleTheme() {
      const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
      const newTheme = currentTheme === "light" ? "dark" : "light";

      applyTheme(newTheme);
      localStorage.setItem(THEME_KEY, newTheme);
      updateToggleIcon(newTheme);

      // Add smooth transition effect
      document.documentElement.style.transition = "all 0.3s ease";
      setTimeout(() => {
        document.documentElement.style.transition = "";
      }, 300);
    }

    // Initialize theme
    initializeTheme();

    // Add click listener
    themeToggle.addEventListener("click", function (e) {
      e.preventDefault();
      toggleTheme();
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    });
  });

  // Form enhancements
  document.querySelectorAll("input, textarea, select").forEach((field) => {
    // Add focus/blur effects
    field.addEventListener("focus", function () {
      this.parentElement.classList.add("field-focused");
    });

    field.addEventListener("blur", function () {
      this.parentElement.classList.remove("field-focused");
      if (this.value) {
        this.parentElement.classList.add("field-has-value");
      } else {
        this.parentElement.classList.remove("field-has-value");
      }
    });
  });

  // Intersection observer for animations with memory leak fix
  const animateElements = document.querySelectorAll(".card, .feature-icon, .stats");

  if ("IntersectionObserver" in window && animateElements.length > 0) {
    const animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
            // CRITICAL FIX: Unobserve after animation completes to prevent memory leaks
            animationObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
      }
    );

    animateElements.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
      animationObserver.observe(el);
    });
  }

  // Mobile Hamburger Menu
  const hamburgerBtn = document.getElementById("hamburger");
  const navMenu = document.getElementById("mobileMenu");

  if (hamburgerBtn && navMenu) {
    hamburgerBtn.addEventListener("click", function () {
      const isActive = hamburgerBtn.classList.contains("active");

      if (isActive) {
        // Close menu
        hamburgerBtn.classList.remove("active");
        navMenu.classList.remove("active");
      } else {
        // Open menu
        hamburgerBtn.classList.add("active");
        navMenu.classList.add("active");
      }
    });

    // Close menu when clicking on a link
    navMenu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        hamburgerBtn.classList.remove("active");
        navMenu.classList.remove("active");
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
      if (!hamburgerBtn.contains(e.target) && !navMenu.contains(e.target)) {
        hamburgerBtn.classList.remove("active");
        navMenu.classList.remove("active");
      }
    });
  }
});

// Global theme utilities
window.ThemeManager = {
  getCurrentTheme: function () {
    return document.documentElement.getAttribute("data-theme") || "light";
  },

  setTheme: function (theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("trippovention_theme", theme);

    const themeToggle = document.getElementById("themeToggle");
    if (themeToggle) {
      themeToggle.innerHTML = theme === "dark" ? "☀️" : "🌓";
    }
  },

  isDarkMode: function () {
    return this.getCurrentTheme() === "dark";
  },
};

// Service Worker Registration for PWA with Update Notification
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Only log in development
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          console.log("✓ Service Worker registered:", registration.scope);
        }

        // Check for updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available!
              showUpdateNotification();
            }
          });
        });

        // Check for updates periodically (every hour)
        setInterval(
          () => {
            registration.update();
          },
          60 * 60 * 1000
        );
      })
      .catch((error) => {
        // Always log errors
        console.error("✗ Service Worker registration failed:", error);
      });
  });
}

/**
 * Show update notification banner when new version is available
 */
function showUpdateNotification() {
  // Don't show if banner already exists
  if (document.getElementById("update-banner")) return;

  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className = "update-banner";
  banner.setAttribute("role", "alert");
  banner.setAttribute("aria-live", "polite");
  banner.innerHTML = `
    <div class="update-content">
      <span class="update-icon">🎉</span>
      <span class="update-text">New version available!</span>
      <button onclick="window.location.reload()" class="update-btn" aria-label="Update now">
        Update Now
      </button>
      <button onclick="document.getElementById('update-banner').remove()" class="update-close" aria-label="Dismiss update notification">
        ✕
      </button>
    </div>
  `;

  // Add styles
  const style = document.createElement("style");
  style.textContent = `
    .update-banner {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(135deg, #d6804e 0%, #e67e22 100%);
      color: white;
      padding: 12px 16px;
      z-index: 10001;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      animation: slideDown 0.3s ease-out;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .update-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .update-icon {
      font-size: 20px;
    }

    .update-text {
      font-weight: 600;
      font-size: 14px;
    }

    .update-btn {
      background: white;
      color: var(--orange, #d6804e);
      border: none;
      padding: 8px 20px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .update-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .update-close {
      background: transparent;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 4px 8px;
      opacity: 0.8;
      transition: opacity 0.2s ease;
    }

    .update-close:hover {
      opacity: 1;
    }

    @media (max-width: 640px) {
      .update-content {
        flex-direction: column;
        text-align: center;
      }
      .update-btn {
        width: 100%;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(banner);

  // Auto-dismiss after 30 seconds if user doesn't interact
  setTimeout(() => {
    const existingBanner = document.getElementById("update-banner");
    if (existingBanner) {
      existingBanner.remove();
    }
  }, 30000);
}
