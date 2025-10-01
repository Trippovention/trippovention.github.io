// Enhanced UX helpers: lazy loading, smooth scroll, mobile nav, and PERFECT dark theme
document.addEventListener('DOMContentLoaded', function() {
    // Lazy loading for images
    document.querySelectorAll('img[data-src]').forEach(img => {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    img.src = img.dataset.src;
                    obs.unobserve(img);
                }
            });
        });
        observer.observe(img);
    });

    // Perfect Dark Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const THEME_KEY = 'trippovention_theme';
        
        // Initialize theme on page load
        function initializeTheme() {
            const savedTheme = localStorage.getItem(THEME_KEY) || 'light';
            applyTheme(savedTheme);
            updateToggleIcon(savedTheme);
        }
        
        // Apply theme to document
        function applyTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            document.body.className = document.body.className.replace(/theme-\w+/g, '') + ` theme-${theme}`;
            
            // Dispatch custom event for any components that need to react
            window.dispatchEvent(new CustomEvent('themeChanged', { 
                detail: { theme } 
            }));
        }
        
        // Update toggle icon
        function updateToggleIcon(theme) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌓';
            themeToggle.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        }
        
        // Toggle theme
        function toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            applyTheme(newTheme);
            localStorage.setItem(THEME_KEY, newTheme);
            updateToggleIcon(newTheme);
            
            // Add smooth transition effect
            document.documentElement.style.transition = 'all 0.3s ease';
            setTimeout(() => {
                document.documentElement.style.transition = '';
            }, 300);
        }
        
        // Initialize theme
        initializeTheme();
        
        // Add click listener
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleTheme();
        });
    }

    // Mobile navigation toggle (if needed)
    const mobileToggle = document.querySelector('.mobile-toggle');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    if (mobileToggle && mobileMenu) {
        mobileToggle.addEventListener('click', function() {
            mobileMenu.classList.toggle('active');
        });
    }

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Form enhancements
    document.querySelectorAll('input, textarea, select').forEach(field => {
        // Add focus/blur effects
        field.addEventListener('focus', function() {
            this.parentElement.classList.add('field-focused');
        });
        
        field.addEventListener('blur', function() {
            this.parentElement.classList.remove('field-focused');
            if (this.value) {
                this.parentElement.classList.add('field-has-value');
            } else {
                this.parentElement.classList.remove('field-has-value');
            }
        });
    });

    // Add loading states to buttons
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', function() {
            if (!this.classList.contains('loading')) {
                this.classList.add('loading');
                // Remove loading state after 2 seconds (adjust as needed)
                setTimeout(() => {
                    this.classList.remove('loading');
                }, 2000);
            }
        });
    });

    // Intersection observer for animations
    const animateElements = document.querySelectorAll('.card, .feature-icon, .stats');
    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        animationObserver.observe(el);
    });
});

// Global theme utilities
window.ThemeManager = {
    getCurrentTheme: function() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    },
    
    setTheme: function(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('trippovention_theme', theme);
        
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.innerHTML = theme === 'dark' ? '☀️' : '🌓';
        }
    },
    
    isDarkMode: function() {
        return this.getCurrentTheme() === 'dark';
    }
};