/**
 * Dealer onboarding MVP — supported metros and profile schema.
 */

export const SUPPORTED_DEALER_CITIES = [
  { slug: "bengaluru", name: "Bengaluru" },
  { slug: "mumbai", name: "Mumbai" },
  { slug: "delhi", name: "Delhi NCR" },
  { slug: "hyderabad", name: "Hyderabad" },
  { slug: "chennai", name: "Chennai" },
  { slug: "pune", name: "Pune" },
  { slug: "kolkata", name: "Kolkata" },
  { slug: "ahmedabad", name: "Ahmedabad" },
  { slug: "jaipur", name: "Jaipur" },
  { slug: "lucknow", name: "Lucknow" },
  { slug: "kochi", name: "Kochi" },
  { slug: "chandigarh", name: "Chandigarh" },
  { slug: "indore", name: "Indore" },
  { slug: "nagpur", name: "Nagpur" },
  { slug: "coimbatore", name: "Coimbatore" },
  { slug: "surat", name: "Surat" },
  { slug: "noida", name: "Noida" },
  { slug: "gurgaon", name: "Gurgaon" },
];

export const DEALER_BRANDS = [
  "Tata",
  "MG",
  "Mahindra",
  "Hyundai",
  "BYD",
  "Kia",
  "Citroën",
  "Mercedes-Benz",
  "BMW",
  "Volvo",
  "Other",
];

/**
 * @typedef {object} DealershipProfile
 * @property {string} dealershipName
 * @property {string} contactName
 * @property {string} email
 * @property {string} phone
 * @property {string} citySlug
 * @property {string[]} brands
 * @property {string} address
 * @property {string} gstin
 * @property {string} notes
 * @property {'pending'|'review'|'active'} onboardingStatus
 * @property {string} [assignedTo] - lead ops placeholder
 */

export const EMPTY_DEALERSHIP_PROFILE = {
  dealershipName: "",
  contactName: "",
  email: "",
  phone: "",
  citySlug: "",
  brands: [],
  address: "",
  gstin: "",
  notes: "",
  onboardingStatus: "pending",
  assignedTo: "unassigned",
};

export const LEAD_ASSIGNMENT_PLACEHOLDER = {
  queue: "dealer-onboarding-pilot",
  assignee: "ops@evsavari.com",
  slaHours: 48,
};
