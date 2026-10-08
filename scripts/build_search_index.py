#!/usr/bin/env python3
"""
Trippovention Search Index Builder
Crawls all valid HTML content pages and builds an optimized search-index.json
"""

import os
import re
import json
from html.parser import HTMLParser

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX_OUTPUT = os.path.join(ROOT_DIR, 'assets', 'search-index.json')

COUNTRY_DISPLAY_NAMES = {
    'usa': 'USA',
    'uk': 'United Kingdom',
    'uae': 'UAE',
    'srilanka': 'Sri Lanka',
    'south-africa': 'South Africa',
    'new-zealand': 'New Zealand',
    'czech-republic': 'Czech Republic',
    'costa-rica': 'Costa Rica',
    'bora-bora': 'Bora Bora',
    'hong-kong': 'Hong Kong'
}

CITIES_MAP = {
    'bangkok': ('Bangkok', 'Thailand'),
    'pattaya': ('Pattaya', 'Thailand'),
    'phuket': ('Phuket', 'Thailand'),
    'krabi': ('Krabi', 'Thailand'),
    'chiang mai': ('Chiang Mai', 'Thailand'),
    'chiang rai': ('Chiang Rai', 'Thailand'),
    'koh samui': ('Koh Samui', 'Thailand'),
    'koh samet': ('Koh Samet', 'Thailand'),
    'dubai': ('Dubai', 'UAE'),
    'abu dhabi': ('Abu Dhabi', 'UAE'),
    'paris': ('Paris', 'France'),
    'rome': ('Rome', 'Italy'),
    'venice': ('Venice', 'Italy'),
    'florence': ('Florence', 'Italy'),
    'milan': ('Milan', 'Italy'),
    'zurich': ('Zurich', 'Switzerland'),
    'lucerne': ('Lucerne', 'Switzerland'),
    'interlaken': ('Interlaken', 'Switzerland'),
    'geneva': ('Geneva', 'Switzerland'),
    'tokyo': ('Tokyo', 'Japan'),
    'kyoto': ('Kyoto', 'Japan'),
    'osaka': ('Osaka', 'Japan'),
    'mount fuji': ('Mount Fuji', 'Japan'),
    'hanoi': ('Hanoi', 'Vietnam'),
    'da nang': ('Da Nang', 'Vietnam'),
    'ha long': ('Ha Long Bay', 'Vietnam'),
    'ho chi minh': ('Ho Chi Minh City', 'Vietnam'),
    'phu quoc': ('Phu Quoc', 'Vietnam'),
    'hoi an': ('Hoi An', 'Vietnam'),
    'bali': ('Bali', 'Indonesia'),
    'ubud': ('Ubud', 'Indonesia'),
    'kuta': ('Kuta', 'Indonesia'),
    'singapore': ('Singapore', 'Singapore'),
    'sentosa': ('Sentosa', 'Singapore'),
    'kuala lumpur': ('Kuala Lumpur', 'Malaysia'),
    'langkawi': ('Langkawi', 'Malaysia'),
    'penang': ('Penang', 'Malaysia'),
    'sydney': ('Sydney', 'Australia'),
    'melbourne': ('Melbourne', 'Australia'),
    'delhi': ('Delhi', 'India'),
    'agra': ('Agra', 'India'),
    'jaipur': ('Jaipur', 'India'),
    'kerala': ('Kerala', 'India'),
    'goa': ('Goa', 'India'),
    'kashmir': ('Kashmir', 'India'),
    'ladakh': ('Ladakh', 'India'),
    'bodh gaya': ('Bodh Gaya', 'India'),
    'varanasi': ('Varanasi', 'India'),
    'andaman': ('Andaman', 'India'),
    'barcelona': ('Barcelona', 'Spain'),
    'madrid': ('Madrid', 'Spain'),
    'seville': ('Seville', 'Spain')
}

KNOWN_ACTIVITIES = [
    'coral island', 'nong nooch', 'safari world', 'marine park', 'evening shows',
    'alcazar', 'tiffany', 'colosseum show', 'angthong marine park', 'phi phi',
    'james bond island', 'songkran', 'ayutthaya', 'burj khalifa', 'desert safari',
    'dhow cruise', 'ferrari world', 'sheikh zayed', 'marina bay', 'universal studios',
    'night safari', 'gardens by the bay', 'sentosa', 'eiffel tower', 'louvre',
    'seine cruise', 'disneyland', 'versailles', 'mount fuji', 'bullet train',
    'taj mahal', 'amber fort', 'houseboat', 'ganga aarti', 'mahabodhi', 'buddha circuit'
]

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.in_title = False
        self.meta_desc = ''
        self.og_image = ''
        self.h1 = ''
        self.in_h1 = False
        self.h2_h3 = []
        self.in_hx = False
        self.current_hx = ''
        self.paragraphs = []
        self.in_p = False
        self.current_p = ''
        self.scripts = []
        self.in_script = False
        self.current_script = ''
        self.is_redirect = False

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == 'title':
            self.in_title = True
        elif tag == 'meta':
            name = attrs_dict.get('name', '').lower()
            prop = attrs_dict.get('property', '').lower()
            content = attrs_dict.get('content', '')
            if attrs_dict.get('http-equiv', '').lower() == 'refresh':
                self.is_redirect = True
            if name == 'description':
                self.meta_desc = content
            elif prop == 'og:image':
                self.og_image = content
        elif tag == 'h1':
            self.in_h1 = True
        elif tag in ('h2', 'h3'):
            self.in_hx = True
            self.current_hx = ''
        elif tag in ('p', 'li'):
            self.in_p = True
            self.current_p = ''
        elif tag == 'script':
            stype = attrs_dict.get('type', '')
            if 'ld+json' in stype:
                self.in_script = True
                self.current_script = ''

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False
        elif tag == 'h1':
            self.in_h1 = False
        elif tag in ('h2', 'h3'):
            self.in_hx = False
            t = self.current_hx.strip()
            if t and len(t) < 80:
                self.h2_h3.append(t)
        elif tag in ('p', 'li'):
            self.in_p = False
            t = self.current_p.strip()
            if len(t) > 25 and len(self.paragraphs) < 15:
                self.paragraphs.append(t)
        elif tag == 'script' and self.in_script:
            self.in_script = False
            if self.current_script.strip():
                try:
                    data = json.loads(self.current_script)
                    self.scripts.append(data)
                except Exception:
                    pass

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        elif self.in_h1:
            self.h1 += data
        elif self.in_hx:
            self.current_hx += data
        elif self.in_p:
            self.current_p += ' ' + data
        elif self.in_script:
            self.current_script += data


def clean_text(text):
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    text = re.sub(r'[\u2000-\u206f\u2700-\u27bf\ufe00-\ufe0f]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def normalize_image_url(img_url):
    if not img_url:
        return 'assets/images/logo.webp'
    img_url = img_url.replace('https://trippovention.com/', '')
    img_url = img_url.replace('../../', '')
    img_url = img_url.replace('../', '')
    if img_url.startswith('/'):
        img_url = img_url[1:]
    return img_url


def determine_category_and_filters(rel_path, title, h1, full_text):
    filters = set()
    category = "Holiday Packages"
    action_text = "View Details"

    lower_text = full_text.lower()
    lower_path = rel_path.lower()

    if lower_path.startswith('visa/'):
        category = "Visa Assistance"
        action_text = "Apply Visa"
        filters.add("Visa")
    elif 'services.html' in lower_path:
        category = "Services"
        action_text = "Explore Services"
        filters.add("Services")
        filters.add("Transfers")
        filters.add("Hotels")
        filters.add("Activities")
        filters.add("Visa")
    elif 'destinations' in lower_path or (lower_path.endswith('/index.html') and lower_path.startswith('packages/')):
        category = "Destinations"
        action_text = "Explore Destination"
        filters.add("Destinations")
        filters.add("Packages")
    elif lower_path.startswith('packages/'):
        category = "Holiday Packages"
        action_text = "View Package"
        filters.add("Packages")
    elif lower_path in ('index.html', 'contact.html'):
        category = "Destinations" if 'index.html' in lower_path else "Services"
        action_text = "Explore"
        filters.add("Destinations" if 'index.html' in lower_path else "Services")

    # Detect Activities
    if any(k in lower_text for k in ['sightseeing', 'tour', 'activities', 'activity', 'show', 'cruise', 'excursion', 'safari', 'adventure', 'island', 'water sports', 'theme park', 'attraction']):
        filters.add("Activities")

    # Detect Transfers
    if any(k in lower_text for k in ['airport transfer', 'transfers', 'transfer', 'private transfer', 'pickup', 'speedboat transfer', 'ground transportation', 'private fleet']):
        filters.add("Transfers")

    # Detect Hotels
    if any(k in lower_text for k in ['hotel', 'resort', 'stay', 'night stay', 'boutique hotel', 'luxury accommodation']):
        filters.add("Hotels")

    # Detect Visa
    if any(k in lower_text for k in ['visa', 'e-visa', 'evisa', 'arrival card', 'tdac', 'mdac', 'schengen']):
        filters.add("Visa")

    return category, sorted(list(filters)), action_text


def extract_destination(rel_path, title, full_text):
    parts = rel_path.split(os.sep)
    dest_name = ""
    cities = []

    # Check for global / root pages
    if rel_path in ('index.html', 'destinations.html', 'destinations-themes.html', 'destinations-travelers.html', 'services.html', 'contact.html', 'visa/index.html'):
        return "Global / Worldwide", []

    # Check path parts for package/visa countries
    if len(parts) > 1 and parts[0] in ('packages', 'visa'):
        slug = parts[1].replace('.html', '')
        if slug in COUNTRY_DISPLAY_NAMES:
            dest_name = COUNTRY_DISPLAY_NAMES[slug]
        elif slug not in ('index', 'asia', 'europe', 'africa', 'north-america', 'south-america', 'oceania', 'terms-and-conditions'):
            dest_name = slug.replace('-', ' ').title()

    lower_text = full_text.lower()
    for city_key, (city_val, country_fallback) in CITIES_MAP.items():
        if re.search(r'\b' + re.escape(city_key) + r'\b', lower_text):
            if city_val not in cities:
                cities.append(city_val)
            if not dest_name and country_fallback:
                dest_name = country_fallback

    if not dest_name and cities:
        dest_name = cities[0]

    return dest_name, cities


def build_index():
    print(f"Scanning directory: {ROOT_DIR}")
    index = []
    item_id = 0

    valid_files = []
    for root, dirs, files in os.walk(ROOT_DIR):
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for f in files:
            if f.endswith('.html'):
                rel = os.path.relpath(os.path.join(root, f), ROOT_DIR)
                if rel in ('offline.html', '404.html'):
                    continue
                valid_files.append((os.path.join(root, f), rel))

    print(f"Found {len(valid_files)} candidate HTML files.")

    for file_path, rel_path in sorted(valid_files, key=lambda x: x[1]):
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as fp:
            content = fp.read()

        parser = PageParser()
        parser.feed(content)

        if parser.is_redirect:
            continue

        raw_title = clean_text(parser.title)
        # Clean title
        title = re.sub(r'\s*\|\s*Trippovention.*$', '', raw_title, flags=re.I)
        title = re.sub(r'\s*-\s*Trippovention.*$', '', title, flags=re.I)
        title = title.strip()
        if not title:
            title = clean_text(parser.h1) or rel_path

        h1 = clean_text(parser.h1)
        desc = clean_text(parser.meta_desc)
        if not desc and parser.paragraphs:
            desc = clean_text(parser.paragraphs[0])
        if len(desc) > 180:
            desc = desc[:177] + '...'

        img = normalize_image_url(parser.og_image)

        # Extract activities / itinerary
        activities = []
        for s in parser.scripts:
            if isinstance(s, dict):
                itin = s.get('itinerary', [])
                if isinstance(itin, list):
                    for act in itin:
                        if isinstance(act, dict) and 'name' in act:
                            name = re.sub(r'Day\s+\d+:\s*', '', act['name'])
                            name = clean_text(name)
                            if name and name not in activities:
                                activities.append(name)

        # Pull clean subheadings
        clean_headings = []
        skip_h = ['overview', 'faqs', 'frequently asked questions', 'contact us', 'why choose us', 'quick inquiry', 'details', 'pricing', 'reviews', 'related packages', 'terms and conditions']
        for h in parser.h2_h3:
            h_clean = clean_text(h)
            if h_clean and h_clean.lower() not in skip_h and len(h_clean) < 60:
                if h_clean not in clean_headings:
                    clean_headings.append(h_clean)

        full_searchable = f"{title} {h1} {' '.join(clean_headings)} {' '.join(activities)} {desc} {' '.join(parser.paragraphs[:4])}"

        dest_name, cities = extract_destination(rel_path, title, full_searchable)
        category, filters, action_text = determine_category_and_filters(rel_path, title, h1, full_searchable)

        # Detect specific highlighted activities
        matched_acts = []
        lower_searchable = full_searchable.lower()
        for act in KNOWN_ACTIVITIES:
            if act in lower_searchable:
                matched_acts.append(act.title())

        # Generate keywords
        keywords = set()
        if dest_name and dest_name != "Global / Worldwide":
            keywords.add(dest_name.lower())
        for c in cities:
            keywords.add(c.lower())
        for f in filters:
            keywords.add(f.lower())

        # Common travel terms
        for term in [
            'package', 'packages', 'tour', 'tours', 'sightseeing', 'transfer', 'transfers',
            'airport', 'visa', 'visas', 'hotel', 'hotels', 'resort', 'flight', 'flights',
            'cruise', 'cruises', 'mice', 'honeymoon', 'family', 'families', 'adventure',
            'beach', 'beaches', 'buddha', 'show', 'shows', 'day trip', 'excursion',
            'tdac', 'mdac', 'schengen', 'evisa', 'e-visa'
        ]:
            if term in lower_searchable:
                keywords.add(term)

        for ma in matched_acts:
            keywords.add(ma.lower())

        # Specific boosts for hubs
        if 'asia.html' in rel_path and 'visa' in rel_path:
            for extra in ['thailand visa', 'thailand tdac', 'malaysia mdac', 'malaysia visa', 'maldives visa', 'sri lanka eta', 'hong kong visa']:
                keywords.add(extra)
        if 'europe.html' in rel_path and 'visa' in rel_path:
            for extra in ['schengen', 'schengen visa', 'europe visa', 'france visa', 'switzerland visa', 'italy visa', 'germany visa']:
                keywords.add(extra)
        if 'thailand' in rel_path and 'packages' in rel_path:
            keywords.add('thailand package')
            keywords.add('thailand tour')
            if 'pattaya' in lower_searchable:
                keywords.add('pattaya show')
                keywords.add('pattaya activities')
                keywords.add('pattaya tour')
            if 'phuket' in lower_searchable:
                keywords.add('phuket transfer')
                keywords.add('phuket airport')

        item_id += 1
        item = {
            'id': item_id,
            'url': rel_path,
            'title': title,
            'category': category,
            'destination': dest_name,
            'cities': cities[:4],
            'description': desc,
            'image': img,
            'filters': filters,
            'actionText': action_text,
            'activities': (activities[:4] if activities else matched_acts[:4]),
            'keywords': sorted(list(keywords))
        }
        index.append(item)

    print(f"Indexed {len(index)} total pages.")
    os.makedirs(os.path.dirname(INDEX_OUTPUT), exist_ok=True)
    with open(INDEX_OUTPUT, 'w', encoding='utf-8') as out:
        json.dump(index, out, separators=(',', ':'), ensure_ascii=False)

    size_kb = os.path.getsize(INDEX_OUTPUT) / 1024
    print(f"Wrote {INDEX_OUTPUT} ({size_kb:.1f} KB)")

    # Also write assets/search-data.js for CORS-free file:// protocol loading
    data_js_path = os.path.join(ROOT_DIR, 'assets', 'search-data.js')
    with open(data_js_path, 'w', encoding='utf-8') as out:
        out.write('window.__TRIPPOVENTION_SEARCH_DATA__ = ')
        json.dump(index, out, separators=(',', ':'), ensure_ascii=False)
        out.write(';')
    data_js_kb = os.path.getsize(data_js_path) / 1024
    print(f"Wrote {data_js_path} ({data_js_kb:.1f} KB)")


if __name__ == '__main__':
    build_index()
