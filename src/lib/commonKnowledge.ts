/**
 * Shared “common knowledge” answer lists for surveys (gender, education, etc.).
 * Used by Admin presets and Agent enrichment when options are missing.
 */

export const GENDER_OPTIONS = ["Male", "Female", "Prefer not to say"];

export const EDUCATION_OPTIONS = [
  "None / incomplete primary",
  "Primary",
  "Secondary",
  "Certificate / diploma",
  "University degree",
  "Postgraduate",
];

export const MARITAL_OPTIONS = [
  "Single (never married)",
  "Married",
  "Separated",
  "Divorced",
  "Widowed",
];

export const RELIGION_OPTIONS = [
  "Christianity",
  "Islam",
  "Hinduism",
  "Traditional / African",
  "No religion",
];

export const OCCUPATION_OPTIONS = [
  "Farming",
  "Casual labour",
  "Formal employment",
  "Business / trade",
  "Student",
  "Unemployed",
];

export const YES_NO_OPTIONS = ["Yes", "No"];

export type CommonPreset = {
  id: string;
  name: string;
  description: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  allow_other?: boolean;
  other_label?: string;
  pattern?: string;
  min?: number;
  max?: number;
};

export const COMMON_KNOWLEDGE_PRESETS: CommonPreset[] = [
  {
    id: "gender",
    name: "Gender",
    description: "Male / Female / Prefer not to say + Other",
    type: "single_choice",
    label: "What is your gender?",
    required: true,
    options: GENDER_OPTIONS,
    allow_other: true,
    other_label: "Other",
  },
  {
    id: "phone",
    name: "Mobile phone",
    description: "Phone with country code dropdown",
    type: "phone",
    label: "Mobile phone number",
    required: true,
  },
  {
    id: "region",
    name: "Region (County → Village)",
    description: "Cascading county / sub-county / ward / village",
    type: "area",
    label: "Where do you live?",
    required: true,
  },
  {
    id: "education",
    name: "Education",
    description: "Highest education completed + Other",
    type: "single_choice",
    label: "Highest level of education completed?",
    required: true,
    options: EDUCATION_OPTIONS,
    allow_other: true,
  },
  {
    id: "marital",
    name: "Marital status",
    description: "Standard marital statuses + Other",
    type: "single_choice",
    label: "What is your marital status?",
    required: true,
    options: MARITAL_OPTIONS,
    allow_other: true,
  },
  {
    id: "religion",
    name: "Religion",
    description: "Common religions + Other",
    type: "single_choice",
    label: "What is your religion?",
    required: false,
    options: RELIGION_OPTIONS,
    allow_other: true,
  },
  {
    id: "occupation",
    name: "Occupation",
    description: "Main livelihood + Other",
    type: "single_choice",
    label: "What is your main occupation?",
    required: false,
    options: OCCUPATION_OPTIONS,
    allow_other: true,
  },
  {
    id: "age",
    name: "Age",
    description: "Number 18–120",
    type: "number",
    label: "How old are you?",
    required: true,
    min: 18,
    max: 120,
  },
  {
    id: "yes_no",
    name: "Yes / No",
    description: "Simple yes/no",
    type: "yes_no",
    label: "Yes or no?",
    required: true,
    options: YES_NO_OPTIONS,
  },
];

/** Detect common field from id/label and return preset option defaults. */
export function matchCommonKnowledge(id: string, label: string): CommonPreset | null {
  const blob = `${id} ${label}`.toLowerCase();
  if (/\b(gender|sex)\b/.test(blob)) return COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === "gender")!;
  if (/\b(phone|mobile|cellphone|cell\s*phone)\b/.test(blob))
    return COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === "phone")!;
  if (/\b(education|schooling|schooled)\b/.test(blob))
    return COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === "education")!;
  if (/\b(marital|married|marriage)\b/.test(blob) && !/\bis_married|currently married\b/.test(blob))
    return COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === "marital")!;
  if (/\b(religion|faith)\b/.test(blob)) return COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === "religion")!;
  if (/\b(occupation|livelihood|employment)\b/.test(blob))
    return COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === "occupation")!;
  if (/\b(county|sub[\s-]?county|ward|village|region|residence|where do you live)\b/.test(blob))
    return COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === "region")!;
  if (/\b(^|_)age(_|$)|how old\b/.test(blob)) return COMMON_KNOWLEDGE_PRESETS.find((p) => p.id === "age")!;
  return null;
}
