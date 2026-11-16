// Shared profile-completion rules for the company / business / user panels.
// Percentage = sum(stepWeight * completedItemsRatio).

const isFilled = (value) => {
  if (value === null || value === undefined) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return String(value).trim() !== '';
};

// Rich-text fields (e.g. About Company) are stored as HTML, so count the real
// text length after stripping tags/entities.
const textLength = (value) =>
  String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;

// Bank step is always the last one and is required for everyone.
const BANK_STEP = {
  key: 'bank',
  label: 'Bank Details',
  weight: 30,
  required: true,
  link: '/company/bank-details',
  hint: 'Add your main bank account — companies without it cannot receive payments.',
  items: [
    { key: 'bank_account', label: 'Main bank account added' },
  ],
};

export const ROLE_CHECKLISTS = {
  company: {
    title: 'Complete Your Company Profile',
    subtitle: 'A complete profile gets you more quote requests and more customers.',
    // The company mandate is intentionally narrow: only phone number, category,
    // logo, location, about company and bank details lock the quotes page.
    steps: [
      {
        key: 'personal',
        label: 'Personal Information',
        weight: 30,
        required: false,
        link: '/company/edit-Profile',
        hint: 'Add your owner & incharge contact so users trust your business.',
        items: [
          { key: 'name', label: 'Company name' },
          { key: 'email', label: 'Email address' },
          { key: 'phone', label: 'Phone number', required: true },
          { key: 'owner_name', label: 'Owner name' },
          { key: 'owner_phone', label: 'Owner phone' },
          { key: 'incharge_name', label: 'Incharge name' },
          { key: 'incharge_phone', label: 'Incharge phone' },
        ],
      },
      {
        key: 'business',
        label: 'Company Information',
        weight: 40,
        required: false,
        link: '/company/edit-Profile',
        hint: 'A filled company profile ranks higher in the member directory.',
        items: [
          { key: 'category', label: 'Category', required: true },
          { key: 'country', label: 'Country' },
          { key: 'state', label: 'State' },
          { key: 'city', label: 'City' },
          { key: 'company_address', label: 'Company address' },
          { key: 'about_company', label: 'About company (min 50 characters)', required: true, minLength: 50 },
          { key: 'services', label: 'Services offered' },
          // Required: users judge a company by its logo, so a missing logo blocks
          // the profile from being reported as complete.
          { key: 'logo', label: 'Company logo', required: true },
          // Location is saved either as GPS coordinates (latitude/longitude) or as
          // a pasted map location — either one counts as "location added".
          { key: 'location', label: 'Company location', required: true, keys: ['latitude', 'map_location'] },
          { key: 'website', label: 'Website' },
        ],
      },
      { ...BANK_STEP, link: '/company/bank-details' },
    ],
  },
  business: {
    title: 'Complete Your Business Profile',
    subtitle: 'Businesses with complete profiles get faster and better quote responses.',
    steps: [
      {
        key: 'personal',
        label: 'Personal Information',
        weight: 45,
        required: true,
        link: '/business/profile',
        hint: 'Add your contact details so companies can reach you with quotes.',
        items: [
          { key: 'name', label: 'Business name' },
          { key: 'email', label: 'Email address' },
          { key: 'phone', label: 'Phone number' },
          { key: 'owner_name', label: 'Owner name' },
          { key: 'owner_phone', label: 'Owner phone' },
        ],
      },
      {
        key: 'business',
        label: 'Business Information',
        weight: 25,
        required: false,
        link: '/business/profile',
        hint: 'Complete details help logistics partners quote you accurately.',
        items: [
          { key: 'category', label: 'Categories' },
          { key: 'country', label: 'Country' },
          { key: 'city', label: 'City' },
          { key: 'company_address', label: 'Business address' },
          { key: 'about_company', label: 'About business' },
          { key: 'logo', label: 'Business logo' },
        ],
      },
      { ...BANK_STEP, link: '/business/profile' },
    ],
  },
  user: {
    title: 'Complete Your Profile',
    subtitle: 'A complete profile helps companies send you accurate quotes.',
    steps: [
      {
        key: 'personal',
        label: 'Personal Information',
        weight: 45,
        required: true,
        link: '/user/profile',
        hint: 'Add your name, phone and country so companies can quote you.',
        items: [
          { key: 'name', label: 'Full name' },
          { key: 'email', label: 'Email address' },
          { key: 'phone', label: 'Phone number' },
          { key: 'country', label: 'Country' },
        ],
      },
      {
        key: 'profile',
        label: 'Profile Details',
        weight: 25,
        required: false,
        link: '/user/profile',
        hint: 'A profile photo and location build trust with service providers.',
        items: [
          { key: 'logo', label: 'Profile photo' },
          { key: 'city', label: 'City' },
        ],
      },
      { ...BANK_STEP, link: '/user/profile' },
    ],
  },
};

const evaluateStep = (step, profile, bankDetails) => {
  if (step.key === 'bank') {
    const accounts = Array.isArray(bankDetails) ? bankDetails : [];
    const hasAccount = accounts.length > 0;

    const items = step.items.map((item) => ({ ...item, done: hasAccount }));

    return { ...step, items };
  }

  const items = step.items.map((item) => {
    let done;
    if (item.minLength) {
      // Needs a real description, not just any value.
      done = textLength(profile?.[item.key]) >= item.minLength;
    } else if (item.keys) {
      // `keys` lets one item be satisfied by any of several profile fields
      // (e.g. location via latitude OR map_location).
      done = item.keys.some((k) => isFilled(profile?.[k]));
    } else {
      done = isFilled(profile?.[item.key]);
    }
    return { ...item, done };
  });

  return { ...step, items };
};

/**
 * @param {'company'|'business'|'user'} role
 * @param {object|null} profile   full profile object for the role
 * @param {Array|null}  bankDetails own bank details
 */
export const computeProfileCompletion = (role, profile, bankDetails) => {
  const checklist = ROLE_CHECKLISTS[role];
  if (!checklist) {
    // Unknown / not-yet-resolved role (e.g. admin, or identity not synced yet).
    // Must never report "complete" — that caused empty profiles to show 100%.
    return { percentage: 0, steps: [], missingRequired: [], isComplete: false, totalWeight: 0 };
  }

  const steps = checklist.steps.map((step) => {
    const evaluated = evaluateStep(step, profile, bankDetails);
    const total = evaluated.items.length;
    const done = evaluated.items.filter((item) => item.done).length;
    return {
      key: evaluated.key,
      label: evaluated.label,
      hint: evaluated.hint,
      link: evaluated.link,
      required: !!evaluated.required,
      weight: evaluated.weight,
      items: evaluated.items,
      total,
      done,
      ratio: total === 0 ? 1 : done / total,
    };
  });

  const totalWeight = steps.reduce((sum, step) => sum + step.weight, 0) || 1;
  const weighted = steps.reduce((sum, step) => sum + step.weight * step.ratio, 0);
  const percentage = Math.max(0, Math.min(100, Math.round((weighted / totalWeight) * 100)));

  // A step is "missing" when the whole step is required and incomplete, OR when
  // it holds an individually required item (e.g. the company logo) that is still
  // empty — even inside an otherwise optional step.
  const missingRequired = steps
    .map((step) => {
      const pendingItems = step.items.filter(
        (item) => !item.done && (step.required || item.required)
      );
      if (pendingItems.length === 0) return null;
      return {
        key: step.key,
        label: step.label,
        link: step.link,
        hint: step.hint,
        stepRequired: !!step.required,
        pending: pendingItems.map((item) => item.label),
      };
    })
    .filter(Boolean);

  return {
    percentage,
    steps,
    missingRequired,
    isComplete: percentage >= 100,
    totalWeight,
  };
};

export const completionColor = (percentage) => {
  if (percentage >= 100) return { ring: '#16a34a', text: 'text-green-600', soft: 'rgba(22,163,74,0.12)' };
  if (percentage >= 60) return { ring: '#bca142', text: 'text-[#bca142]', soft: 'rgba(188,161,66,0.14)' };
  return { ring: '#e11d48', text: 'text-rose-600', soft: 'rgba(225,29,72,0.12)' };
};
