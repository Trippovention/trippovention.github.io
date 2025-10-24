/**
 * Trippovention - Centralized Structured Data Manager
 *
 * This module generates and injects schema.org structured data dynamically
 * to reduce code duplication and improve maintainability.
 *
 * Usage: Call StructuredData.init(config) with page-specific parameters
 */

const StructuredData = (() => {
  // Master configuration - single source of truth
  const COMPANY_INFO = {
    name: "Trippovention",
    url: "https://trippovention.com",
    logo: "https://trippovention.com/assets/images/logo.webp",
    image: "https://trippovention.com/assets/images/logo.webp",
    telephone: "+91-87508-88875",
    email: "query@trippovention.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Unit No. - 337 A, 3rd Floor, Spaze IT Park, Tower A, Sector 49, Sohna Road",
      addressLocality: "Gurgaon",
      addressRegion: "Haryana",
      postalCode: "122018",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "28.4089",
      longitude: "77.0342",
    },
    openingHours: "Mo-Sa 10:00-19:00",
    priceRange: "₹₹-₹₹₹",
    socialMedia: [
      "https://facebook.com/trippovention",
      "https://instagram.com/trippovention",
      "https://twitter.com/trippovention",
    ],
    // 74+ countries - global coverage
    areaServed: [
      "IN",
      "SG",
      "TH",
      "MY",
      "AE",
      "VN",
      "LK",
      "ID",
      "MV",
      "PH",
      "KH",
      "MM",
      "LA",
      "BN",
      "NP",
      "BT",
      "BD",
      "PK",
      "JP",
      "KR",
      "CN",
      "HK",
      "TW",
      "MO",
      "AU",
      "NZ",
      "FJ",
      "GB",
      "FR",
      "ES",
      "IT",
      "CH",
      "AT",
      "NL",
      "GR",
      "TR",
      "DE",
      "BE",
      "SE",
      "NO",
      "FI",
      "DK",
      "IS",
      "PT",
      "IE",
      "PL",
      "CZ",
      "HU",
      "RO",
      "HR",
      "SI",
      "MT",
      "CY",
      "US",
      "CA",
      "MX",
      "BR",
      "AR",
      "CL",
      "PE",
      "CO",
      "SA",
      "QA",
      "KW",
      "OM",
      "BH",
      "JO",
      "IL",
      "MU",
      "ZA",
      "KE",
      "EG",
      "TN",
      "MA",
    ],
  };

  // Contact point template (reusable)
  const getContactPoint = (areaServed = COMPANY_INFO.areaServed) => ({
    "@type": "ContactPoint",
    telephone: COMPANY_INFO.telephone,
    contactType: "Customer Service",
    areaServed: areaServed,
    availableLanguage: ["English", "Hindi"],
    hoursAvailable: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "19:00",
    },
  });

  // Full TravelAgency provider template
  const getTravelAgencyProvider = () => ({
    "@type": "TravelAgency",
    name: COMPANY_INFO.name,
    url: COMPANY_INFO.url,
    logo: COMPANY_INFO.logo,
    image: COMPANY_INFO.image,
    telephone: COMPANY_INFO.telephone,
    email: COMPANY_INFO.email,
    address: COMPANY_INFO.address,
    geo: COMPANY_INFO.geo,
    openingHours: COMPANY_INFO.openingHours,
    sameAs: COMPANY_INFO.socialMedia,
    contactPoint: getContactPoint(),
  });

  // Schema generators
  const schemas = {
    // 1. TravelAgency Schema (Homepage, Worldwide)
    travelAgency: (config) => ({
      "@context": "https://schema.org",
      "@type": "TravelAgency",
      name: COMPANY_INFO.name,
      description: config.description,
      url: config.url,
      logo: COMPANY_INFO.logo,
      image: COMPANY_INFO.image,
      telephone: COMPANY_INFO.telephone,
      email: COMPANY_INFO.email,
      address: COMPANY_INFO.address,
      geo: COMPANY_INFO.geo,
      openingHours: COMPANY_INFO.openingHours,
      priceRange: COMPANY_INFO.priceRange,
      sameAs: COMPANY_INFO.socialMedia,
      ...(config.aggregateRating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: config.aggregateRating.value,
          reviewCount: config.aggregateRating.count,
          bestRating: "5",
          worstRating: "1",
        },
      }),
      contactPoint: getContactPoint(),
    }),

    // 2. Organization Schema (Knowledge Graph)
    organization: () => ({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: COMPANY_INFO.name,
      alternateName: "Trippovention Travel Agency",
      url: COMPANY_INFO.url,
      logo: COMPANY_INFO.logo,
      description:
        "Leading travel agency specializing in India and worldwide tours with 15+ years of experience",
      foundingDate: "2010",
      slogan: "Your Trusted Travel Partner",
      address: COMPANY_INFO.address,
      contactPoint: {
        "@type": "ContactPoint",
        telephone: COMPANY_INFO.telephone,
        contactType: "Customer Service",
        email: COMPANY_INFO.email,
      },
      sameAs: COMPANY_INFO.socialMedia,
    }),

    // 3. WebSite with SearchAction (Sitelinks Search Box)
    website: (config) => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: COMPANY_INFO.name,
      url: COMPANY_INFO.url,
      potentialAction: {
        "@type": "SearchAction",
        target: `${COMPANY_INFO.url}/${config.searchPath || "search.html"}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }),

    // 4. Service Schema (Services, Visa)
    service: (config) => ({
      "@context": "https://schema.org",
      "@type": "Service",
      serviceType: config.serviceType,
      ...(config.name && {
        name: config.name,
      }),
      ...(config.description && {
        description: config.description,
      }),
      provider: getTravelAgencyProvider(),
      areaServed: COMPANY_INFO.areaServed,
      ...(config.aggregateRating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: config.aggregateRating.value,
          reviewCount: config.aggregateRating.count,
          bestRating: "5",
        },
      }),
      ...(config.offers && {
        offers: config.offers,
      }),
      ...(config.serviceOutput && {
        serviceOutput: config.serviceOutput,
      }),
      ...(config.hasOfferCatalog && {
        hasOfferCatalog: config.hasOfferCatalog,
      }),
    }),

    // 5. TouristTrip Schema (Package pages)
    touristTrip: (config) => ({
      "@context": "https://schema.org",
      "@type": config.schemaType || "TouristTrip",
      name: config.name,
      description: config.description,
      url: config.url,
      provider: getTravelAgencyProvider(),
      ...(config.aggregateRating && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: config.aggregateRating.value,
          reviewCount: config.aggregateRating.count,
          bestRating: "5",
        },
      }),
      ...(config.duration && {
        duration: config.duration,
      }),
      touristType: config.touristType || ["Family", "Couples", "Solo Travelers", "Groups"],
      ...(config.itinerary && {
        itinerary: config.itinerary,
      }),
      ...(config.offers && {
        offers: config.offers,
      }),
    }),

    // 6. ContactPage Schema
    contactPage: (config) => ({
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
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          opens: "10:00",
          closes: "19:00",
        },
        contactPoint: config.contactPoints || [
          {
            "@type": "ContactPoint",
            telephone: COMPANY_INFO.telephone,
            contactType: "Customer Service",
            areaServed: COMPANY_INFO.areaServed,
            availableLanguage: ["English", "Hindi"],
          },
          {
            "@type": "ContactPoint",
            telephone: "+91-73030-10446",
            contactType: "Sales",
            areaServed: ["IN", "SG", "TH", "MY", "AE"],
            availableLanguage: ["English", "Hindi"],
          },
          {
            "@type": "ContactPoint",
            telephone: "+66-94-931-9572",
            contactType: "International Support",
            areaServed: "TH",
            availableLanguage: "English",
          },
        ],
        sameAs: COMPANY_INFO.socialMedia,
      },
    }),

    // 7. BreadcrumbList Schema
    breadcrumb: (items) => ({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: item.url,
      })),
    }),
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
  const init = (config) => {
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
              "Your trusted travel partner for unforgettable journeys across India and the world",
            url: COMPANY_INFO.url,
            aggregateRating: {
              value: "4.8",
              count: "500",
            },
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
            url: config.url,
          }),
          "Structured Data: TravelAgency"
        );
        break;

      case "services":
        injectSchema(
          schemas.service({
            serviceType: "Travel Services",
            aggregateRating: {
              value: "4.8",
              count: "500",
            },
            hasOfferCatalog: config.offerCatalog,
          }),
          "Structured Data: Service with OfferCatalog"
        );
        break;

      case "visa":
        injectSchema(
          schemas.service({
            serviceType: "Visa Assistance Services",
            name: "Visa Services by Trippovention",
            description: config.description,
            offers: config.offers,
            serviceOutput: config.serviceOutput,
          }),
          "Structured Data: Service (Visa Assistance)"
        );
        break;

      case "contact":
        injectSchema(
          schemas.contactPage({
            multiplePhones: config.phones,
            contactPoints: config.contactPoints,
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
            aggregateRating: config.aggregateRating,
            duration: config.duration,
            touristType: config.touristType,
            itinerary: config.itinerary,
            offers: config.offers,
          }),
          `Structured Data: ${config.schemaType || "TouristTrip"}`
        );
        break;

      default:
        // Only warn in development
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          console.warn("StructuredData: Unknown page type:", config.pageType);
        }
    }
  };

  // Public API
  return {
    init,
    COMPANY_INFO, // Export for reference
    schemas, // Export for advanced usage
  };
})();

// Auto-initialize if config exists in window
if (typeof window !== "undefined" && window.structuredDataConfig) {
  document.addEventListener("DOMContentLoaded", () => {
    StructuredData.init(window.structuredDataConfig);
  });
}
