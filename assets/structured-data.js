/**
 * Trippovention - Centralized Structured Data Manager
 *
 * This module generates and injects schema.org structured data dynamically
 * adhering strictly to Google Search and Schema.org guidelines.
 *
 * Usage: Call StructuredData.init(config) with page-specific parameters
 */

const StructuredData = (() => {
  // Master configuration - single source of truth for Trippovention business entity
  const COMPANY_INFO = {
    name: "Trippovention",
    legalName: "Trippovention",
    url: "https://trippovention.com",
    logo: "https://trippovention.com/assets/images/logo.webp",
    image: "https://trippovention.com/assets/images/logo.webp",
    telephone: "+91-87508-88875",
    email: "query@trippovention.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "337 A, 3rd Floor, Spaze IT Park, Tower A, Sector 49, Sohna Road",
      addressLocality: "Gurugram",
      addressRegion: "Haryana",
      postalCode: "122018",
      addressCountry: "IN"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "28.4089",
      longitude: "77.0342"
    },
    openingHours: "Mo-Sa 09:30-18:30",
    priceRange: "₹₹-₹₹₹",
    socialMedia: [
      "https://facebook.com/trippovention",
      "https://instagram.com/trippovention",
      "https://youtube.com/@trippovention?si=cvr_Sf36pb1Oh6lY",
      "https://www.linkedin.com/company/trippovention/"
    ],
    // Locations for India HQ and Thailand Ground Operations
    locations: [
      {
        "@type": "Place",
        name: "Trippovention India Head Office",
        address: {
          "@type": "PostalAddress",
          streetAddress: "337 A, 3rd Floor, Spaze IT Park, Tower A, Sector 49, Sohna Road",
          addressLocality: "Gurugram",
          addressRegion: "Haryana",
          postalCode: "122018",
          addressCountry: "IN"
        },
        telephone: "+91-87508-88875"
      },
      {
        "@type": "Place",
        name: "Trippovention Thailand Inbound Ground Operations",
        address: {
          "@type": "PostalAddress",
          streetAddress: "23/13 M, 12 Nong Pure Subdistrict, Bang Lamung District",
          addressLocality: "Pattaya",
          addressRegion: "Chonburi",
          postalCode: "20150",
          addressCountry: "TH"
        },
        telephone: "+66-90-917-7601"
      }
    ],
    // Global coverage
    areaServed: [
      "IN", "SG", "TH", "MY", "AE", "VN", "LK", "ID", "MV", "PH",
      "KH", "MM", "LA", "BN", "NP", "BT", "BD", "PK", "JP", "KR",
      "CN", "HK", "TW", "MO", "AU", "NZ", "FJ", "GB", "FR", "ES",
      "IT", "CH", "AT", "NL", "GR", "TR", "DE", "BE", "SE", "NO",
      "FI", "DK", "IS", "PT", "IE", "PL", "CZ", "HU", "RO", "HR",
      "SI", "MT", "CY", "US", "CA", "MX", "BR", "AR", "CL", "PE",
      "CO", "SA", "QA", "KW", "OM", "BH", "JO", "IL", "MU", "ZA",
      "KE", "EG", "TN", "MA"
    ]
  };

  // Contact points template (reusable)
  const getContactPoints = () => [
    {
      "@type": "ContactPoint",
      telephone: COMPANY_INFO.telephone,
      contactType: "Customer Service",
      areaServed: ["IN", "Worldwide"],
      availableLanguage: ["English", "Hindi"],
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:30",
        closes: "18:30"
      }
    },
    {
      "@type": "ContactPoint",
      telephone: "+91-73030-10446",
      contactType: "Sales & Customized Holidays",
      areaServed: ["IN", "SG", "TH", "MY", "AE"],
      availableLanguage: ["English", "Hindi"]
    },
    {
      "@type": "ContactPoint",
      telephone: "+66-90-917-7601",
      contactType: "Thailand Inbound Operations",
      areaServed: "TH",
      availableLanguage: ["English", "Thai"]
    }
  ];

  // Full TravelAgency provider template
  const getTravelAgencyProvider = () => ({
    "@type": "TravelAgency",
    name: COMPANY_INFO.name,
    legalName: COMPANY_INFO.legalName,
    url: COMPANY_INFO.url,
    logo: COMPANY_INFO.logo,
    image: COMPANY_INFO.image,
    telephone: COMPANY_INFO.telephone,
    email: COMPANY_INFO.email,
    address: COMPANY_INFO.address,
    geo: COMPANY_INFO.geo,
    location: COMPANY_INFO.locations,
    openingHours: COMPANY_INFO.openingHours,
    sameAs: COMPANY_INFO.socialMedia,
    contactPoint: getContactPoints()
  });

  // Schema generators
  const schemas = {
    // 1. TravelAgency Schema (Homepage, Worldwide)
    travelAgency: config => ({
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: COMPANY_INFO.name,
      legalName: COMPANY_INFO.legalName,
      description:
        config.description ||
        "Licensed destination management company (DMC) and travel agency specializing in international tour packages, Thailand ground operations, India tourism, Buddha tourism pilgrimage circuits, and global visa assistance.",
      url: config.url || COMPANY_INFO.url,
      logo: COMPANY_INFO.logo,
      image: COMPANY_INFO.image,
      telephone: COMPANY_INFO.telephone,
      email: COMPANY_INFO.email,
      address: COMPANY_INFO.address,
      geo: COMPANY_INFO.geo,
      location: COMPANY_INFO.locations,
      openingHours: COMPANY_INFO.openingHours,
      priceRange: COMPANY_INFO.priceRange,
      sameAs: COMPANY_INFO.socialMedia,
      contactPoint: getContactPoints()
    }),

    // 2. Organization Schema (Knowledge Graph)
    organization: () => ({
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: COMPANY_INFO.name,
      legalName: COMPANY_INFO.legalName,
      url: COMPANY_INFO.url,
      logo: COMPANY_INFO.logo,
      description:
        "Licensed destination management company (DMC) and travel agency specializing in international tour packages, Thailand ground operations, India tourism, Buddha tourism pilgrimage circuits, and global visa assistance.",
      foundingDate: "2010",
      slogan: "Your Trusted Travel Partner",
      address: COMPANY_INFO.address,
      location: COMPANY_INFO.locations,
      contactPoint: getContactPoints(),
      sameAs: COMPANY_INFO.socialMedia
    }),

    // 3. WebSite with SearchAction (Sitelinks Search Box)
    website: config => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: COMPANY_INFO.name,
      url: COMPANY_INFO.url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${COMPANY_INFO.url}/${config.searchPath || "destinations.html"}?search={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    }),

    // 4. Service Schema (Services, Visa)
    service: config => ({
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: config.serviceType,
      ...(config.name && {
        name: config.name
      }),
      ...(config.description && {
        description: config.description
      }),
      provider: getTravelAgencyProvider(),
      areaServed: COMPANY_INFO.areaServed,
      ...(config.offers && {
        offers: config.offers
      }),
      ...(config.serviceOutput && {
        serviceOutput: config.serviceOutput
      }),
      ...(config.hasOfferCatalog && {
        hasOfferCatalog: config.hasOfferCatalog
      })
    }),

    // 5. TouristTrip Schema (Package pages)
    touristTrip: config => ({
      "@context": "https://schema.org",
      "@type": config.schemaType || "TouristTrip",
      name: config.name,
      description: config.description,
      url: config.url,
      ...(config.image && {
        image: config.image
      }),
      provider: getTravelAgencyProvider(),
      ...(config.duration && {
        duration: config.duration
      }),
      touristType: config.touristType || ["Family", "Couples", "Solo Travelers", "Groups"],
      ...(config.itinerary && {
        itinerary: config.itinerary
      }),
      ...(config.offers && {
        offers: config.offers
      })
    }),

    // 6. ContactPage Schema
    contactPage: config => ({
      "@context": "https://schema.org",
      "@type": "ContactPage",
      mainEntity: {
        "@type": "TravelAgency",
        name: COMPANY_INFO.name,
        url: COMPANY_INFO.url,
        logo: COMPANY_INFO.logo,
        telephone: config.multiplePhones || [COMPANY_INFO.telephone, "+91-124-418-2575"],
        email: COMPANY_INFO.email,
        address: COMPANY_INFO.address,
        geo: COMPANY_INFO.geo,
        location: COMPANY_INFO.locations,
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "09:30",
          closes: "18:30"
        },
        contactPoint: config.contactPoints || getContactPoints(),
        sameAs: COMPANY_INFO.socialMedia
      }
    }),

    // 7. BreadcrumbList Schema
    breadcrumb: items => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    })
  };

  // Inject schema into page
  const injectSchema = (schema, comment = null) => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);

    // Add comment before script if provided
    if (comment) {
      const commentNode = document.createComment(` ${comment} `);
      document.body.appendChild(commentNode);
    }

    document.body.appendChild(script);
  };

  // Main initialization function
  const init = config => {
    // Always add breadcrumb if provided
    if (config.breadcrumb) {
      injectSchema(schemas.breadcrumb(config.breadcrumb), "Structured Data: BreadcrumbList");
    }

    // Add page-specific schemas
    switch (config.pageType) {
      case "homepage":
        injectSchema(
          schemas.travelAgency({
            description:
              config.description ||
              "Your trusted travel partner for international tour packages, Thailand ground operations, India tourism, Buddha tourism pilgrimage circuits, and visa assistance.",
            url: COMPANY_INFO.url
          }),
          "Structured Data: TravelAgency (Primary Business Entity)"
        );

        injectSchema(schemas.organization(), "Structured Data: Organization (Knowledge Graph)");
        injectSchema(schemas.website({}), "Structured Data: WebSite (Sitelinks Search Box)");
        break;

      case "worldwide":
        injectSchema(
          schemas.travelAgency({
            description:
              config.description ||
              "International travel packages for Singapore, Thailand, Malaysia, UAE, Vietnam, Europe and more",
            url: config.url
          }),
          "Structured Data: TravelAgency"
        );
        break;

      case "services":
        injectSchema(
          schemas.service({
            serviceType: "Travel Services & Ground Operations",
            hasOfferCatalog: config.offerCatalog
          }),
          "Structured Data: Service with OfferCatalog"
        );
        break;

      case "visa":
        injectSchema(
          schemas.service({
            serviceType: "Visa Assistance Services",
            name: "Visa Assistance Services by Trippovention",
            description: config.description,
            offers: config.offers,
            serviceOutput: config.serviceOutput
          }),
          "Structured Data: Service (Visa Assistance)"
        );
        break;

      case "contact":
        injectSchema(
          schemas.contactPage({
            multiplePhones: config.phones,
            contactPoints: config.contactPoints
          }),
          "Structured Data: ContactPage"
        );
        break;

      case "package":
        injectSchema(
          schemas.touristTrip({
            schemaType: config.schemaType || "TouristTrip",
            name: config.name,
            description: config.description,
            url: config.url,
            duration: config.duration,
            touristType: config.touristType,
            itinerary: config.itinerary,
            offers: config.offers
          }),
          `Structured Data: ${config.schemaType || "TouristTrip"}`
        );
        break;

      default:
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          console.warn("StructuredData: Unknown page type:", config.pageType);
        }
    }
  };

  // Public API
  return {
    init,
    COMPANY_INFO,
    schemas
  };
})();

// Auto-initialize if config exists in window
if (typeof window !== "undefined" && window.structuredDataConfig) {
  document.addEventListener("DOMContentLoaded", () => {
    StructuredData.init(window.structuredDataConfig);
  });
}
