// Enhanced UX helpers: lazy loading, smooth scroll, mobile nav, and PERFECT dark theme
document.addEventListener('DOMContentLoaded', function() {
    // Enhanced lazy loading for images with error handling
    document.querySelectorAll('img[data-src]').forEach(img => {
        // Fallback for browsers without IntersectionObserver
        if (!('IntersectionObserver' in window)) {
            img.src = img.dataset.src;
            return;
        }
        
        try {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        try {
                            img.src = img.dataset.src;
                            img.onerror = () => {
                                // Only log in development
                                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                                    console.error('Failed to load image:', img.dataset.src);
                                }
                                // Set a fallback placeholder if image fails
                                img.style.backgroundColor = 'var(--bg-tertiary)';
                                img.alt = 'Image unavailable';
                            };
                        } catch (error) {
                            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                                console.error('Error setting image src:', error);
                            }
                        } finally {
                            obs.unobserve(img);
                        }
                    }
                });
            }, { rootMargin: '50px' }); // Preload images 50px before viewport
            observer.observe(img);
        } catch (error) {
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.error('IntersectionObserver error:', error);
            }
            img.src = img.dataset.src; // Fallback
        }
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

    // Intersection observer for animations with memory leak fix
    const animateElements = document.querySelectorAll('.card, .feature-icon, .stats');
    
    if ('IntersectionObserver' in window && animateElements.length > 0) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    // CRITICAL FIX: Unobserve after animation completes to prevent memory leaks
                    animationObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animateElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            animationObserver.observe(el);
        });
    }

    // Mobile Hamburger Menu
    const hamburgerBtn = document.getElementById('hamburger');
    const navMenu = document.getElementById('mobileMenu');
    
    if (hamburgerBtn && navMenu) {
        hamburgerBtn.addEventListener('click', function() {
            const isActive = hamburgerBtn.classList.contains('active');
            
            if (isActive) {
                // Close menu
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            } else {
                // Open menu
                hamburgerBtn.classList.add('active');
                navMenu.classList.add('active');
            }
        });
        
        // Close menu when clicking on a link
        navMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'A') {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerBtn.contains(e.target) && !navMenu.contains(e.target)) {
                hamburgerBtn.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }
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

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
	window.addEventListener('load', () => {
		navigator.serviceWorker.register('./sw.js')
			.then(registration => {
				// Only log in development
				if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
					console.log('✓ Service Worker registered:', registration.scope);
				}
			})
			.catch(error => {
				// Always log errors
				console.error('✗ Service Worker registration failed:', error);
			});
	});
}
