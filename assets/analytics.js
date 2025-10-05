/**
 * Trippovention - Centralized Google Analytics 4
 * Single configuration file for all analytics tracking
 * Update GA_MEASUREMENT_ID to your actual tracking ID
 */

// Configuration
const GA_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // 👈 UPDATE THIS WITH YOUR REAL GA4 ID

// Load Google Analytics script
(function() {
    const gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(gaScript);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    
    // Configure GA4
    gaScript.onload = function() {
        gtag('js', new Date());
        gtag('config', GA_MEASUREMENT_ID, {
            'page_title': document.title,
            'page_path': window.location.pathname,
            'page_location': window.location.href
        });
    };

    // Expose gtag globally
    window.gtag = gtag;
})();

// Event Tracking - Auto-track user interactions
document.addEventListener('DOMContentLoaded', function() {
    
    // Track phone call clicks
    document.querySelectorAll('a[href^="tel:"]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            const phoneNumber = this.getAttribute('href').replace('tel:', '');
            gtag('event', 'phone_call_click', {
                'event_category': 'contact',
                'event_label': phoneNumber,
                'page_path': window.location.pathname
            });
        });
    });

    // Track WhatsApp clicks
    document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            gtag('event', 'whatsapp_click', {
                'event_category': 'contact',
                'event_label': 'WhatsApp Inquiry',
                'page_path': window.location.pathname
            });
        });
    });

    // Track email clicks
    document.querySelectorAll('a[href^="mailto:"]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            const email = this.getAttribute('href').replace('mailto:', '');
            gtag('event', 'email_click', {
                'event_category': 'contact',
                'event_label': email,
                'page_path': window.location.pathname
            });
        });
    });

    // Track package enquiry buttons
    document.querySelectorAll('.btn[href*="contact"], a[href*="contact"]').forEach(function(link) {
        link.addEventListener('click', function(e) {
            const packageName = document.title || 'Unknown Package';
            gtag('event', 'enquiry_click', {
                'event_category': 'lead_generation',
                'event_label': packageName,
                'page_path': window.location.pathname
            });
        });
    });

    // Track booking form submissions
    const bookingForms = document.querySelectorAll('form[id*="booking"], form[id*="contact"]');
    bookingForms.forEach(function(form) {
        form.addEventListener('submit', function(e) {
            const formType = form.getAttribute('id') || 'contact_form';
            gtag('event', 'form_submission', {
                'event_category': 'lead_generation',
                'event_label': formType,
                'page_path': window.location.pathname
            });
        });
    });

    // Track outbound links
    document.querySelectorAll('a[href^="http"]').forEach(function(link) {
        if (!link.href.includes(window.location.hostname)) {
            link.addEventListener('click', function(e) {
                gtag('event', 'outbound_link_click', {
                    'event_category': 'engagement',
                    'event_label': this.href,
                    'page_path': window.location.pathname
                });
            });
        }
    });

    console.log('✅ Google Analytics tracking initialized');
});

