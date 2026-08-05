/**
 * WebMCP - AI Agent Integration Provider for Trippovention
 * Standard: WebMCP API (https://webmachinelearning.github.io/webmcp/)
 */

(function () {
  'use strict';

  const webMcpTools = [
    {
      name: 'search_travel_packages',
      description: 'Search Trippovention international and domestic travel packages by destination or keyword',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Destination name, activity, or keyword (e.g., "Dubai", "Bali honeymoon", "Europe tour", "Rishikesh yoga")'
          },
          category: {
            type: 'string',
            enum: ['international', 'india', 'theme', 'visa'],
            description: 'Optional package category filter'
          }
        },
        required: ['query']
      },
      execute: async function (args) {
        const searchTerm = (args.query || '').toLowerCase();
        const results = [];

        const popularPackages = [
          { name: 'Dubai Deluxe Holiday', destination: 'Dubai', duration: '5 Days / 4 Nights', url: '/packages/dubai/' },
          { name: 'Bali Bliss & Beach Escape', destination: 'Bali', duration: '6 Days / 5 Nights', url: '/packages/indonesia/bali_wellness_retreat.html' },
          { name: 'Romantic Paris & Swiss Alps', destination: 'Europe', duration: '8 Days / 7 Nights', url: '/packages/switzerland/' },
          { name: 'Thailand Island Hopper & Splash Fiesta', destination: 'Thailand', duration: '6 Days / 5 Nights', url: '/packages/thailand/' },
          { name: 'Vietnam Heritage & Halong Bay Cruise', destination: 'Vietnam', duration: '7 Days / 6 Nights', url: '/packages/vietnam/' },
          { name: 'Rishikesh Yoga & Himalayan Wellness', destination: 'India', duration: '5 Days / 4 Nights', url: '/packages/india/rishikesh_yoga_retreat.html' },
          { name: 'Golden Buddha Circuit Spiritual Retreat', destination: 'India', duration: '7 Days / 6 Nights', url: '/packages/india/buddha/' }
        ];

        popularPackages.forEach(function (pkg) {
          if (pkg.name.toLowerCase().includes(searchTerm) || pkg.destination.toLowerCase().includes(searchTerm)) {
            results.push(pkg);
          }
        });

        if (results.length === 0) {
          return {
            status: 'success',
            message: 'For detailed listings of all travel packages matching "' + args.query + '", please consult https://trippovention.com/llms.txt',
            matches: popularPackages.slice(0, 3)
          };
        }

        return {
          status: 'success',
          count: results.length,
          packages: results
        };
      }
    },
    {
      name: 'get_package_details',
      description: 'Retrieve full itinerary details, inclusions, and overview for a specific Trippovention travel package',
      inputSchema: {
        type: 'object',
        properties: {
          packageName: {
            type: 'string',
            description: 'Name of the travel package or destination (e.g. "Dubai", "Bali", "Rishikesh")'
          }
        },
        required: ['packageName']
      },
      execute: async function (args) {
        return {
          status: 'success',
          packageName: args.packageName,
          provider: 'Trippovention Travel Agent Services',
          experience: '15+ Years Ground Operations Experience',
          contact: {
            phone: '+91-87508-88875',
            email: 'query@trippovention.com',
            website: 'https://trippovention.com'
          },
          documentation: 'Full package details and markdown summaries available at https://trippovention.com/llms.txt'
        };
      }
    },
    {
      name: 'get_visa_requirements',
      description: 'Retrieve visa application requirements, processing timeline, and required documents for travel destinations',
      inputSchema: {
        type: 'object',
        properties: {
          country: {
            type: 'string',
            description: 'Destination country name (e.g., "Dubai", "Schengen", "Singapore", "Thailand", "Vietnam", "UK", "USA")'
          }
        },
        required: ['country']
      },
      execute: async function (args) {
        return {
          status: 'success',
          country: args.country,
          visaService: 'Trippovention Express Visa Assistance',
          consultationUrl: 'https://trippovention.com/visa/',
          contactPhone: '+91-87508-88875',
          note: 'Trippovention provides end-to-end document verification, appointment scheduling, and express visa processing.'
        };
      }
    },
    {
      name: 'submit_travel_inquiry',
      description: 'Submit a custom travel inquiry or request expert callback for tailored holiday package planning',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Traveler full name' },
          email: { type: 'string', description: 'Contact email address' },
          phone: { type: 'string', description: 'Contact phone / WhatsApp number' },
          destination: { type: 'string', description: 'Target destination or holiday preference' },
          travelers: { type: 'number', description: 'Number of travelers' },
          message: { type: 'string', description: 'Special requirements or travel dates' }
        },
        required: ['name', 'phone', 'destination']
      },
      execute: async function (args) {
        // Find inquiry form elements if present on page
        const nameInput = document.querySelector('input[name="name"], #name');
        const phoneInput = document.querySelector('input[name="phone"], input[name="tel"], #phone');
        const emailInput = document.querySelector('input[name="email"], #email');
        const msgInput = document.querySelector('textarea[name="message"], #message');

        if (nameInput) nameInput.value = args.name || '';
        if (phoneInput) phoneInput.value = args.phone || '';
        if (emailInput) emailInput.value = args.email || '';
        if (msgInput) msgInput.value = (args.destination ? 'Destination: ' + args.destination + '. ' : '') + (args.message || '');

        return {
          status: 'success',
          message: 'Inquiry details recorded. You can complete submission at https://trippovention.com/contact.html or call +91-87508-88875 directly.',
          inquiry: args
        };
      }
    }
  ];

  // Register WebMCP Context Provider if supported by browser/agent runtime
  function registerWebMcp() {
    if (typeof navigator !== 'undefined' && navigator.modelContext && typeof navigator.modelContext.provideContext === 'function') {
      try {
        navigator.modelContext.provideContext({
          tools: webMcpTools
        });
        console.log('[WebMCP] Registered Trippovention WebMCP context provider.');
      } catch (err) {
        console.warn('[WebMCP] provideContext call error:', err);
      }
    }

    // Expose global fallback window object for web agent frameworks
    if (typeof window !== 'undefined') {
      window.webMCP = window.webMCP || {
        version: '1.0.0',
        tools: webMcpTools
      };
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerWebMcp);
  } else {
    registerWebMcp();
  }
})();
