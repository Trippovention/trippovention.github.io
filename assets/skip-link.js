/**
 * Skip Link Functionality
 * Handles keyboard navigation skip to main content
 */

(function () {
  "use strict";

  // Wait for DOM to be ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSkipLink);
  } else {
    initSkipLink();
  }

  function initSkipLink() {
    const skipLink = document.getElementById("skip-link");
    const mainContent = document.getElementById("main");

    if (!skipLink || !mainContent) {
      return; // Skip link not present on this page
    }

    skipLink.addEventListener("click", function (e) {
      e.preventDefault();

      // Transfer focus to main content
      mainContent.focus();

      // Smooth scroll to main content
      mainContent.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
})();


