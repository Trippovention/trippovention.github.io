/**
 * Contact Form Functionality
 * Handles form validation, conditional fields, spam protection, and submission
 * Enhanced with scroll-to-form functionality
 */

// Form visibility enhancement - ensure form is visible on page load
function ensureFormVisibility() {
	const form = document.querySelector('form[action*="formsubmit.co"]');
	if (form) {
		// Add a slight delay to ensure all styles are loaded
		setTimeout(() => {
			const formRect = form.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			
			// If form is not fully visible, scroll to it smoothly
			if (formRect.top > windowHeight * 0.8) {
				form.scrollIntoView({ 
					behavior: 'smooth', 
					block: 'start',
					inline: 'nearest'
				});
			}
		}, 500);
	}
}

// Enhanced form functionality with conditional fields
function toggleConditionalFields() {
	const inquiryType = document.getElementById('inquiryType').value;
	const travelDetails = document.getElementById('travelDetails');
	const visaDetails = document.getElementById('visaDetails');
	
	// Hide all conditional sections first
	travelDetails.style.display = 'none';
	visaDetails.style.display = 'none';
	
	// Remove all conditional required attributes
	document.querySelectorAll('#travelDetails input, #travelDetails select, #visaDetails input, #visaDetails select').forEach(input => {
		input.removeAttribute('required');
	});
	
	// Show relevant section and set required fields
	if (inquiryType === 'Custom Trip Planning') {
		travelDetails.style.display = 'block';
		// Make key travel fields required
		const requiredTravelFields = ['destination', 'travelers', 'budget'];
		requiredTravelFields.forEach(name => {
			const field = document.querySelector(`[name="${name}"]`);
			if (field) field.setAttribute('required', 'required');
		});
	} else if (inquiryType === 'Visa Assistance') {
		visaDetails.style.display = 'block';
		// Make key visa fields required
		const requiredVisaFields = ['visa_country', 'visa_type'];
		requiredVisaFields.forEach(name => {
			const field = document.querySelector(`[name="${name}"]`);
			if (field) field.setAttribute('required', 'required');
		});
	}
	
	validateForm();
}

// Enhanced form validation with visual feedback
function validateForm() {
	const form = document.querySelector('form[action*="formsubmit.co"]');
	const submitBtn = document.getElementById('submitBtn');
	
	if (!form || !submitBtn) return;
	
	const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
	let allValid = true;
	const validationErrors = []; // Track all errors for summary

	// Remove all existing tooltips
	document.querySelectorAll('.form-tooltip').forEach(tooltip => tooltip.remove());
	
	// Check all required fields with visual feedback
	for (let field of requiredFields) {
		const fieldLabel = field.closest('.body')?.querySelector('label[for="' + field.id + '"]')?.textContent || field.name;
		
		if (!field.value.trim()) {
			allValid = false;
			field.style.borderColor = 'rgba(255,100,100,0.8)';
			field.style.boxShadow = '0 0 0 2px rgba(255,100,100,0.2)';
			showFieldTooltip(field, 'This field is required');
			validationErrors.push({ field: field, message: fieldLabel + ' is required' });
		} else {
			// Show green border for valid required fields
			field.style.borderColor = 'rgba(40,167,69,0.8)';
			field.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
		}
	}
	
	// Email validation with better pattern and user feedback
	const emailField = form.querySelector('input[name="email"]');
	const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
	if (emailField && emailField.value) {
		if (!emailRegex.test(emailField.value)) {
			allValid = false;
			emailField.style.borderColor = 'rgba(255,100,100,0.8)';
			emailField.style.boxShadow = '0 0 0 2px rgba(255,100,100,0.2)';
			showFieldTooltip(emailField, 'Please enter a valid email address (e.g., user@example.com)');
			validationErrors.push({ field: emailField, message: 'Email Address is invalid' });
		} else {
			emailField.style.borderColor = 'rgba(40,167,69,0.8)';
			emailField.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
		}
	}
	
	// Enhanced phone validation with international support
	const phoneField = form.querySelector('input[name="phone"]');
	const phoneRegex = /^[\+]?[1-9]\d{1,14}$/; // More strict international format
	if (phoneField && phoneField.value) {
		const cleanPhone = phoneField.value.replace(/[\s\-\(\)]/g, '');
		if (cleanPhone.length < 10 || !phoneRegex.test(cleanPhone)) {
			allValid = false;
			phoneField.style.borderColor = 'rgba(255,100,100,0.8)';
			phoneField.style.boxShadow = '0 0 0 2px rgba(255,100,100,0.2)';
			showFieldTooltip(phoneField, 'Please enter a valid phone number (min 10 digits, format: +91 98765 43210)');
			validationErrors.push({ field: phoneField, message: 'Phone Number is invalid' });
		} else {
			phoneField.style.borderColor = 'rgba(40,167,69,0.8)';
			phoneField.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
		}
	}
	
	// Visa country validation for text input
	const visaCountryField = form.querySelector('input[name="visa_country"]');
	if (visaCountryField && visaCountryField.value) {
		if (visaCountryField.value.length < 2) {
			allValid = false;
			visaCountryField.style.borderColor = 'rgba(255,100,100,0.8)';
			visaCountryField.style.boxShadow = '0 0 0 2px rgba(255,100,100,0.2)';
			showFieldTooltip(visaCountryField, 'Please enter a valid country name (min 2 characters)');
		} else {
			visaCountryField.style.borderColor = 'rgba(40,167,69,0.8)';
			visaCountryField.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
		}
	}
	
	// Enhanced date validation for travel planning
	const startDate = form.querySelector('input[name="travel_start_date"]');
	const endDate = form.querySelector('input[name="travel_end_date"]');
	
	if (startDate && endDate && startDate.value && endDate.value) {
		const start = new Date(startDate.value);
		const end = new Date(endDate.value);
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		// Check start date validity
		if (start < today) {
			allValid = false;
			startDate.style.borderColor = 'rgba(255,100,100,0.8)';
			startDate.style.boxShadow = '0 0 0 2px rgba(255,100,100,0.2)';
			showFieldTooltip(startDate, 'Start date cannot be in the past');
		} else {
			startDate.style.borderColor = 'rgba(40,167,69,0.8)';
			startDate.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
		}
		
		// Check end date validity
		if (start >= end) {
			allValid = false;
			endDate.style.borderColor = 'rgba(255,100,100,0.8)';
			endDate.style.boxShadow = '0 0 0 2px rgba(255,100,100,0.2)';
			showFieldTooltip(endDate, 'End date must be after start date');
		} else {
			endDate.style.borderColor = 'rgba(40,167,69,0.8)';
			endDate.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
		}
		
		// Check trip duration (minimum 1 day)
		const diffTime = end.getTime() - start.getTime();
		const diffDays = diffTime / (1000 * 60 * 60 * 24);
		if (diffDays > 365) {
			allValid = false;
			endDate.style.borderColor = 'rgba(255,193,7,0.8)';
			endDate.style.boxShadow = '0 0 0 2px rgba(255,193,7,0.2)';
			showFieldTooltip(endDate, 'Trip duration seems quite long. Please verify dates or contact us for extended trips.');
		}
	} else if (startDate && startDate.value && !endDate.value) {
		startDate.style.borderColor = 'rgba(255,193,7,0.8)';
		startDate.style.boxShadow = '0 0 0 2px rgba(255,193,7,0.2)';
		showFieldTooltip(startDate, 'Please also select an end date for your trip');
	}
	
	// Message length validation
	const messageField = form.querySelector('textarea[name="message"]');
	if (messageField && messageField.value) {
		if (messageField.value.length < 10) {
			allValid = false;
			messageField.style.borderColor = 'rgba(255,100,100,0.8)';
			messageField.style.boxShadow = '0 0 0 2px rgba(255,100,100,0.2)';
			showFieldTooltip(messageField, 'Please provide more details (minimum 10 characters)');
		} else if (messageField.value.length > 1000) {
			allValid = false;
			messageField.style.borderColor = 'rgba(255,193,7,0.8)';
			messageField.style.boxShadow = '0 0 0 2px rgba(255,193,7,0.2)';
			showFieldTooltip(messageField, 'Message is too long (maximum 1000 characters)');
		} else {
			messageField.style.borderColor = 'rgba(40,167,69,0.8)';
			messageField.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
		}
	}
	
	// Name validation (no numbers, minimum length)
	const nameField = form.querySelector('input[name="name"]');
	if (nameField && nameField.value) {
		const namePattern = /^[a-zA-Z\s\-\.]+$/;
		if (!namePattern.test(nameField.value) || nameField.value.length < 2) {
			allValid = false;
			nameField.style.borderColor = 'rgba(255,100,100,0.8)';
			nameField.style.boxShadow = '0 0 0 2px rgba(255,100,100,0.2)';
			showFieldTooltip(nameField, 'Please enter a valid name (letters only, min 2 characters)');
		} else {
			nameField.style.borderColor = 'rgba(40,167,69,0.8)';
			nameField.style.boxShadow = '0 0 0 2px rgba(40,167,69,0.2)';
		}
	}
	
	// Update submit button state
	submitBtn.disabled = !allValid;
	
	// Show/hide validation summary
	updateValidationSummary(validationErrors);
}

// Validation Summary Display
function updateValidationSummary(errors) {
	let summary = document.querySelector('.validation-summary');
	
	// Create summary if it doesn't exist
	if (!summary) {
		const submitContainer = document.querySelector('.submit-button-container');
		if (!submitContainer) return;
		
		summary = document.createElement('div');
		summary.className = 'validation-summary';
		summary.innerHTML = `
			<div class="validation-summary-title">⚠️ Please fix the following errors:</div>
			<ul class="validation-summary-list"></ul>
		`;
		submitContainer.insertBefore(summary, submitContainer.firstChild);
	}
	
	const list = summary.querySelector('.validation-summary-list');
	
	// Clear existing errors
	list.innerHTML = '';
	
	if (errors.length > 0) {
		// Populate error list
		errors.forEach(error => {
			const li = document.createElement('li');
			li.textContent = error.message;
			li.addEventListener('click', () => {
				// Scroll to the field with error
				error.field.scrollIntoView({ behavior: 'smooth', block: 'center' });
				error.field.focus();
			});
			list.appendChild(li);
		});
		
		summary.classList.add('show');
	} else {
		summary.classList.remove('show');
	}
}

function showFieldTooltip(field, message) {
	// Remove any existing tooltip for this field first
	const existingTooltip = field.parentNode.querySelector('.form-tooltip');
	if (existingTooltip) {
		existingTooltip.remove();
	}
	
	const tooltip = document.createElement('div');
	tooltip.className = 'form-tooltip';
	tooltip.textContent = message;
	
	// Position the tooltip relative to the field's container
	const container = field.parentNode;
	container.style.position = 'relative';
	container.appendChild(tooltip);
	
	// Ensure tooltip is visible above everything
	tooltip.style.zIndex = '10000';
	
	// Show tooltip with slight delay for better UX
	setTimeout(() => {
		tooltip.classList.add('show');
	}, 100);
	
	// Tooltips now stay visible until the validation error is fixed
	// No auto-hide - they will be removed when validation passes or field is corrected
}

// Success message display
function showSuccessMessage() {
	const successDiv = document.createElement('div');
	successDiv.innerHTML = `
		<div class="success-toast">
			✅ Message sent successfully! We'll get back to you soon.
			<button onclick="this.parentElement.parentElement.remove()" class="success-toast-close" aria-label="Close notification">×</button>
		</div>
	`;
	document.body.appendChild(successDiv);
	
	// Auto-hide after 5 seconds
	setTimeout(() => {
		if (successDiv.parentElement) {
			successDiv.remove();
		}
	}, 5000);
	
	// Clean URL
	window.history.replaceState({}, document.title, window.location.pathname);
}

// Pre-fill form from URL parameters - Smart Auto-Population
function prefillDestinationFromURL() {
	const urlParams = new URLSearchParams(window.location.search);
	const destination = urlParams.get('destination');
	const service = urlParams.get('service');
	const packageParam = urlParams.get('package');
	const from = urlParams.get('from');
	
	// Get form fields
	const inquiryTypeField = document.getElementById('inquiryType');
	const destinationField = document.querySelector('input[name="destination"]');
	const visaCountryField = document.querySelector('input[name="visa_country"]');
	
	// Helper function to format names (kebab-case to Title Case)
	const formatName = (str) => {
		return str
			.split('-')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	};
	
	// PRIORITY 1: Handle Visa Service Queries (?service=xxx-visa)
	if (service && visaCountryField && inquiryTypeField) {
		// Extract country name from service (e.g., "singapore-visa" → "Singapore")
		const countryName = service.replace(/-visa$/i, '');
		const formattedCountry = formatName(countryName);
		
		visaCountryField.value = formattedCountry;
		inquiryTypeField.value = 'Visa Assistance';
		toggleConditionalFields();
		
		setTimeout(() => {
			visaCountryField.scrollIntoView({ behavior: 'smooth', block: 'center' });
			visaCountryField.focus();
		}, 500);
		return; // Exit after handling visa
	}
	
	// PRIORITY 2: Handle Destination Queries (?destination=xxx)
	// → Opens "Custom Trip Planning" with destination pre-filled
	if (destination && destinationField && inquiryTypeField) {
		const formattedDestination = formatName(destination);
		
		destinationField.value = formattedDestination;
		inquiryTypeField.value = 'Custom Trip Planning';
		toggleConditionalFields();
		
		// Make destination required for custom trip planning
		destinationField.setAttribute('required', 'required');
		
		setTimeout(() => {
			destinationField.scrollIntoView({ behavior: 'smooth', block: 'center' });
			destinationField.focus();
		}, 500);
		return; // Exit after handling destination
	}
	
	// PRIORITY 3: Handle Category/Page Context (?from=xxx)
	if (from && inquiryTypeField) {
		const formattedFrom = formatName(from);
		
		// Special handling for visa page - open visa assistance form
		if (from.toLowerCase() === 'visa' && visaCountryField) {
			inquiryTypeField.value = 'Visa Assistance';
			toggleConditionalFields();
			
			setTimeout(() => {
				visaCountryField.scrollIntoView({ behavior: 'smooth', block: 'center' });
				visaCountryField.focus();
			}, 500);
			return; // Exit after handling visa
		}
		
		// For other pages → Opens "Custom Trip Planning" with category context
		if (destinationField) {
			destinationField.value = formattedFrom;
			inquiryTypeField.value = 'Custom Trip Planning';
			toggleConditionalFields();
			
			setTimeout(() => {
				destinationField.scrollIntoView({ behavior: 'smooth', block: 'center' });
				destinationField.focus();
			}, 500);
			return; // Exit after handling from
		}
	}
	
	// PRIORITY 4: Handle Specific Package Queries (?package=xxx)
	// → Opens "Tour Package Question" with package name
	if (packageParam && destinationField && inquiryTypeField) {
		const formattedPackage = formatName(packageParam);
		
		destinationField.value = formattedPackage;
		inquiryTypeField.value = 'Tour Package Question';
		toggleConditionalFields();
		
		setTimeout(() => {
			destinationField.scrollIntoView({ behavior: 'smooth', block: 'center' });
			destinationField.focus();
		}, 500);
	}
}

// Initialize form functionality when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
	const form = document.querySelector('form[action*="formsubmit.co"]');
	if (!form) return;

	// Ensure form visibility on page load
	ensureFormVisibility();
	
	// Pre-fill destination from URL parameters
	prefillDestinationFromURL();

	// CRITICAL FIX: Setup event listeners BEFORE initial validation

	// Character counter for message field
	const messageField = form.querySelector('textarea[name="message"]');
	const messageCounter = document.getElementById('messageCounter');
	if (messageField && messageCounter) {
		messageField.addEventListener('input', function() {
			const length = this.value.length;
			const maxLength = 1000;
			messageCounter.textContent = `${length}/${maxLength} characters`;
			
			if (length > maxLength * 0.9) {
				messageCounter.parentElement.classList.add('warning');
			} else {
				messageCounter.parentElement.classList.remove('warning');
			}
		});
	}

	// Add timestamp for form submission timing check
	const timestampField = document.createElement('input');
	timestampField.type = 'hidden';
	timestampField.name = '_form_loaded';
	timestampField.value = Date.now();
	form.appendChild(timestampField);
	
	// Additional honeypot protection with JavaScript
	const jsHoneypot = document.createElement('input');
	jsHoneypot.type = 'text';
	jsHoneypot.name = 'website';
	jsHoneypot.style.cssText = 'position: absolute; left: -9999px; opacity: 0; pointer-events: none;';
	jsHoneypot.setAttribute('aria-hidden', 'true');
	jsHoneypot.setAttribute('tabindex', '-1');
	form.appendChild(jsHoneypot);
	
	// Update _replyto field with customer email for better reply handling
	const emailField = form.querySelector('input[name="email"]');
	const replytoField = document.getElementById('_replyto');
	if (emailField && replytoField) {
		emailField.addEventListener('input', function() {
			replytoField.value = this.value;
		});
		emailField.addEventListener('change', function() {
			replytoField.value = this.value;
		});
	}

	// Add event listeners for real-time validation
	const inputs = form.querySelectorAll('input, select, textarea');
	inputs.forEach(input => {
		input.addEventListener('input', validateForm);
		input.addEventListener('change', validateForm);
		input.addEventListener('blur', validateForm);
		input.addEventListener('focus', function() {
			// Hide any existing tooltip for this field when user starts typing
			const tooltip = this.parentNode.querySelector('.form-tooltip');
			if (tooltip) {
				tooltip.classList.remove('show');
				setTimeout(() => {
					if (tooltip.parentNode) tooltip.remove();
				}, 300);
			}
		});
	});
	
	// CRITICAL FIX: Validate AFTER listeners are attached with slight delay
	setTimeout(() => validateForm(), 100);
	
	// Rate limiting protection
	let submitAttempts = 0;
	const maxAttempts = 3;
	const cooldownTime = 300000; // 5 minutes
	
	// Form submission validation
	form.addEventListener('submit', function(e) {
		console.log('Form submission triggered');
		
		// Rate limiting check
		if (submitAttempts >= maxAttempts) {
			e.preventDefault();
			alert('Too many submission attempts. Please wait 5 minutes before trying again.');
			return false;
		}
		
		// Check if honeypot fields are filled (spam detection)
		const honeyFields = form.querySelectorAll('input[name="_honey"], input[name="website"]');
		for (let field of honeyFields) {
			if (field.value !== '') {
				e.preventDefault();
				return false;
			}
		}
		
		// Check form submission timing (too fast = likely bot)
		// REDUCED from 5 seconds to 2 seconds to be more user-friendly
		const loadTime = parseInt(timestampField.value);
		const submitTime = Date.now();
		const timeDiff = submitTime - loadTime;
		
		if (timeDiff < 2000) { // Less than 2 seconds
			e.preventDefault();
			alert('Please take a moment to review your message before submitting.');
			return false;
		}
		
		// Final validation check
		const requiredFields = form.querySelectorAll('input[required], select[required], textarea[required]');
		for (let field of requiredFields) {
			if (!field.value.trim()) {
				field.focus();
				e.preventDefault();
				return false;
			}
		}
		
		// Increment submit attempts
		submitAttempts++;
		
		// Reset attempts after cooldown
		setTimeout(() => {
			submitAttempts = 0;
		}, cooldownTime);
		
		// Show loading state
		const submitBtn = form.querySelector('button[type="submit"]');
		if (submitBtn) {
			submitBtn.textContent = '⏳ Sending...';
			submitBtn.disabled = true;
			submitBtn.style.opacity = '0.8';
		}
		
		// Allow form to submit naturally to FormSubmit
		return true;
	});
	
	// Check for success parameter in URL or hash
	const urlParams = new URLSearchParams(window.location.search);
	const hashSuccess = window.location.hash === '#success';
	if (urlParams.get('success') === 'true' || hashSuccess) {
		showSuccessMessage();
	}
});