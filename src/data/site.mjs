// All content for keithvilani.co.za. Facts come from the live sites and repositories of each brand;
// client case studies come from the Digitalx portfolio (work.json). Do not invent results or quotes.
import { readFileSync } from 'node:fs';

export const SITE = {
  url: 'https://keithvilani.co.za',
  name: 'Keith Vilani',
  role: 'Founder and CEO of Digitalx',
  email: 'hello@digitalxagency.io',
  phone: '021 879 3035',
  phoneIntl: '+27218793035',
  foundationEmail: 'info@keithvilani.co.za',
  city: 'Cape Town, South Africa',
};

export const NAV = [
  { href: '/about/', label: 'About' },
  { href: '/ventures/', label: 'Ventures' },
  { href: '/work/', label: 'Work' },
  { href: '/notes/', label: 'Notes' },
  { href: '/contact/', label: 'Contact' },
];

const PORTFOLIO = JSON.parse(readFileSync(new URL('./work.json', import.meta.url)));
const sectionsOf = (slug) => PORTFOLIO.find((w) => w.slug === slug).sections;

export const VENTURES = [
  {
    slug: 'digitalx', name: 'Digitalx', split: ['Digi', 'talx'], role: 'Founder & CEO', scene: 'digitalx',
    url: 'https://www.digitalxagency.io/', urlLabel: 'digitalxagency.io',
    tagline: 'Building Brands. Driving Digital Growth.',
    short: 'The hub at the centre of the sky. A digital agency in Kuils River, Cape Town, building the systems businesses need to launch, operate and grow.',
    lead: 'Digitalx is the agency Keith founded and leads. It builds the digital systems businesses need to launch, operate and grow: from registering the company to the website, the software that runs it and the payments that keep it moving.',
    tags: ['Websites', 'Custom software', 'Hosting', 'Company registration', 'SEO'],
    metric: { value: '6', label: 'Client brands built' },
    sections: [
      { h: 'Four pillars', paras: ['Every Digitalx engagement sits on one or more of four pillars, each sold with published prices and looked after month by month.'],
        cards: [
          ['Web Development', 'Fast, mobile-first websites that look professional, show up on Google and bring in enquiries.'],
          ['Domains & Hosting', 'Your domain, hosting, SSL and business email in one place, looked after every month.'],
          ['Custom Software', 'Web apps, client portals and dashboards built around the way your business works.'],
          ['Company Registration', 'Your Pty Ltd registered with CIPC, with help opening a business bank account, and kept compliant.'],
        ] },
      { h: 'How Digitalx works', items: [
        'Plain language: every service explained without jargon',
        'Prices published up front, not hidden behind a sales call',
        'No invented results: case studies describe only what is visible or was delivered',
        'Mobile-first, and booking or enquiries as easy as a WhatsApp message',
        'Sites are hosted and maintained after launch, so information stays current',
      ] },
      { h: 'Digitalx’s own products', paras: ['Alongside client work, Digitalx builds and runs its own initiatives: SANA for road safety, GetClient for verified businesses and Advera for AI-assisted advertising.'] },
    ],
    facts: [['Base', 'Kuils River, Cape Town'], ['Email', 'hello@digitalxagency.io'], ['Phone', '021 879 3035']],
  },
  {
    slug: 'keith-vilani-foundation', name: 'Keith Vilani Foundation', split: ['The ', 'Foundation'], role: 'Founder', scene: 'heart',
    url: 'mailto:info@keithvilani.co.za?subject=Keith%20Vilani%20Foundation', urlLabel: 'Support the work',
    tagline: 'Empower Lives. Build Futures. Create Legacies.',
    short: 'Unlocking human potential and creating sustainable pathways for development in underserved communities.',
    lead: 'The Keith Vilani Foundation dedicates itself to unlocking human potential and creating sustainable pathways for development in underserved communities across the region.',
    tags: ['Education', 'Economic empowerment', 'Healthcare access'],
    metric: { value: '10,000+', count: 10000, suffix: '+', label: 'Lives transformed' },
    stats: [['10000', '+', 'Lives transformed'], ['50', '+', 'Active programs'], ['15', '+', 'Years of service'], ['100', '%', 'Transparent impact']],
    sections: [
      { h: 'Three programs', cards: [
        ['Education & Scholarship', 'Bursaries, school support and mentorship. 2,500+ students supported.'],
        ['Economic Empowerment', 'Skills training, entrepreneurship and microfinance. 3,000+ people trained.'],
        ['Healthcare Access', 'Primary healthcare and awareness campaigns. 5,000+ beneficiaries.'],
      ] },
      { h: 'Champions', paras: ['The people whose journeys define what the Foundation stands for.'],
        cards: [['Amara Okonkwo', 'Education Champion'], ['Thabo Moloi', 'Skills Graduate'], ['Naledi Khubone', 'Health Advocate'], ['Sipho Dlamini', 'Youth Leader']] },
      { h: 'Get involved', items: ['Donate: fund a bursary, a business or a clinic visit', 'Volunteer: give your time as a mentor, trainer or campaign hand', 'Partner: align your organisation with transparent community impact', 'Events: join fundraisers and community days'] },
    ],
    facts: [['Email', 'info@keithvilani.co.za'], ['Focus', 'Underserved communities'], ['Model', '100% transparent impact']],
  },
  {
    slug: 'sana', name: 'SANA', split: ['SA', 'NA'], role: 'Initiative', scene: 'shield',
    url: 'https://sana.digitalxagency.io', urlLabel: 'sana.digitalxagency.io',
    tagline: 'Safe and Noble Actions. Every trip. Every driver. Every time.',
    short: 'A road-safety awareness initiative for South African roads, with tips, campaigns and free resources anyone can share.',
    lead: 'SANA (Safe and Noble Actions) is a road-safety awareness initiative for South African roads, started by Keith through Digitalx as a community initiative.',
    tags: ['Road safety', 'Campaigns', 'Schools', 'Free resources'],
    metric: { value: '8', label: 'Road-safety topics' },
    sections: sectionsOf('sana'),
    facts: [['Type', 'Community initiative'], ['Reach', 'South Africa'], ['By', 'Digitalx']],
  },
  {
    slug: 'getclient', name: 'GetClient', split: ['Get', 'Client'], role: 'Product', scene: 'badge',
    url: 'https://www.getclient.co.za', urlLabel: 'getclient.co.za',
    tagline: 'Hire local. Hire checked.',
    short: 'South Africa’s verified business directory. Every listed business shows the identity and CIPC checks it passed.',
    lead: 'GetClient is South Africa’s verified business directory, built by Digitalx. People find checked businesses and request quotes; good businesses get a way to prove they are trustworthy.',
    tags: ['Directory', 'Verification', 'Reviews', 'Quotes'],
    metric: { value: '5', label: 'Checks per profile' },
    sections: [
      ...sectionsOf('getclient').filter((s) => s.h !== 'Technology'),
      { h: 'Tiers', cards: [['Basic', 'Free. Description and contact details.'], ['Blue Verified', 'R499 a year. Photos, services, quote requests and a showcase spot.'], ['Gold Verified', 'R1,299 a year. More photos and services, and featured placement on every page.']] },
    ],
    facts: [['Type', 'Digitalx product'], ['Cities', 'Cape Town and Pretoria'], ['Badges', 'Re-checked every 12 months']],
  },
  {
    slug: 'go-ads', name: 'Go Ads', split: ['Go ', 'Ads'], role: 'Founder', scene: 'billboard',
    url: 'https://www.goads.co.za', urlLabel: 'goads.co.za',
    tagline: 'Your brand, on the move.',
    short: 'South Africa’s moving-billboard network: delivery bikes, vehicles and whole fleets carrying brands through the streets where customers live and work.',
    lead: 'Go Ads turns delivery bikes, vehicles and entire fleets into moving billboards in the suburbs, CBDs and commercial districts where customers live, work and commute. Start with one bike or go nationwide.',
    tags: ['Bike advertising', 'Vehicle wraps', 'Fleet branding', 'Geo-targeting'],
    metric: { value: 'R2,000', label: 'Per bike, per month' },
    sections: [
      { h: 'Three ways to take a brand to the street', cards: [
        ['Bike advertising', 'From R2,000 per bike per month. Courier and food-delivery bikes become rolling billboards in your target suburbs.'],
        ['Vehicle branding', 'Full or partial premium vinyl wraps for sedans, SUVs, bakkies and vans.'],
        ['Fleet branding', 'Consistent branding across 5 vehicles or 500, with volume pricing and nationwide deployment.'],
      ] },
      { h: 'The Go Ads difference', items: [
        'Pricing published up front: from R2,000 per bike per month',
        'Book from a single bike, where others ask for 10 to 25',
        '12-month or month-to-month contracts',
        'Bikes, vehicle wraps and full fleets in one campaign',
        'An interactive campaign planner to see reach and budget before calling anyone',
        'Artwork guidance, deployment and a performance report every month',
      ] },
      { h: 'Live on the road in four steps', items: ['Choose a package, or build your own in the planner', 'Submit your artwork, with guidance on sizing and production', 'The team wraps the bikes or vehicles and deploys them in your zones', 'Track results monthly, then scale up, switch zones or renew'] },
    ],
    facts: [['Cities', '9+ and growing'], ['Smallest campaign', 'One bike'], ['Reporting', 'Monthly']],
  },
  {
    slug: 'advera', name: 'Advera', split: ['Adv', 'era'], role: 'In the lab', scene: 'spark',
    url: '', urlLabel: 'Coming soon',
    tagline: 'Tell us about your business. Let AI build your campaign. Approve it. Launch it.',
    short: 'An AI-powered advertising platform for small businesses and agencies, starting in South Africa.',
    lead: 'Advera is an AI-powered advertising platform for small and medium businesses and agencies, starting in South Africa. Businesses describe what they sell, the AI drafts a strategy and platform-specific ads, a person approves the exact version, and Advera publishes it and brings the results back into one dashboard.',
    tags: ['AI', 'SaaS', 'Ad automation', 'Google · Meta · TikTok · X'],
    metric: { value: '4', label: 'Ad platforms planned' },
    sections: [
      { h: 'How it works', items: ['Describe your business and what you sell', 'The AI drafts a strategy and ads for each platform', 'A person approves the exact version: budget, schedule, accounts and copy', 'Advera publishes through each platform’s official API', 'Results come back into one dashboard'] },
      { h: 'Safety built into the database, not just the screen', items: [
        'Nothing is published without approval of the exact current version',
        'Any change creates a new version and withdraws earlier approvals',
        'Every campaign has an end date, so every approval has a bounded maximum spend',
        'Budgets are never raised automatically',
        'Advertising account tokens are encrypted and never reach the browser',
      ] },
    ],
    facts: [['Status', 'In development'], ['Parent brand', 'Digitalx'], ['Platforms', 'Google Ads, Meta, TikTok, X']],
  },
];

// Client brands built with Digitalx. `mark` is what the lights spell on hover.
const CLIENTS = [
  { slug: 'mbeki-healthcare', src: 'mbeki-healthcare', mark: 'MH', short: 'Website', name: 'Mbeki Healthcare' },
  { slug: 'mbeki-healthcare-clinic-system', src: 'mbeki-healthcare-clinic-system', mark: 'MH', short: 'Clinic system', name: 'Mbeki Healthcare Clinic System' },
  { slug: 'techstep-academy', src: 'techstep', mark: 'TS', short: 'Education', name: 'TechStep Academy' },
  { slug: 'unique-holistic', src: 'unique-holistic', mark: 'UH', short: 'Wellness', name: 'Unique Holistic Spa' },
  { slug: 'delight-aluminum', src: 'delight-aluminum', mark: 'DA', short: 'Glass & steel', name: 'Delight Aluminum' },
  { slug: 'visaease', src: 'visaease', mark: 'VE', short: 'Travel services', name: 'VisaEase' },
  { slug: 'kelvin-tadiwanashe', src: 'kelvin-tadiwanashe', mark: 'KT', short: 'Author', name: 'Kelvin Tadiwanashe' },
];

export const WORK = CLIENTS.map((c) => {
  const p = PORTFOLIO.find((w) => w.slug === c.src);
  return { ...c, fullName: p.name, sector: p.sector, live: p.live, scope: p.scope, tagline: p.tagline, summary: p.summary, location: p.location, sections: p.sections };
});

export const PRINCIPLES = [
  ['Publish the price', 'Go Ads, Digitalx and GetClient all show their prices up front. Trust starts before the first call.'],
  ['Prove it in the open', 'GetClient shows every check a business passed. Digitalx case studies describe only what was delivered.'],
  ['Say it plainly', 'Road safety, healthcare or visas: every page is written so anyone can act on it.'],
  ['Meet people where they are', 'Mobile-first, and booking as easy as a WhatsApp message.'],
  ['Build for purpose too', 'The same hands that build businesses build the Foundation and SANA.'],
];
