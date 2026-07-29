export const QUESTION_TYPES = [
  'short_text',
  'long_text',
  'number',
  'single_choice',
  'multiple_choice',
  'yes_no',
  'date',
  'datetime',
  'rating',
  'likert',
  'gps',
  'photo',
  'phone',
  'email',
  'area',
] as const;

export type QuestionType = (typeof QUESTION_TYPES)[number];

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  short_text: 'Short text',
  long_text: 'Long text',
  number: 'Number',
  single_choice: 'Single choice',
  multiple_choice: 'Multiple choice',
  yes_no: 'Yes / No',
  date: 'Date',
  datetime: 'Date & time',
  rating: 'Rating',
  likert: 'Likert scale',
  gps: 'GPS',
  photo: 'Photo',
  phone: 'Phone (country code)',
  email: 'Email',
  area: 'Region (County → Village)',
};

const ALIASES: Record<string, QuestionType> = {
  text: 'short_text',
  paragraph: 'long_text',
  comment: 'long_text',
  radio: 'single_choice',
  dropdown: 'single_choice',
  checkbox: 'multiple_choice',
  location: 'area',
};

export function normalizeQuestionType(raw: unknown): QuestionType {
  if (typeof raw !== 'string') return 'short_text';
  const key = raw.toLowerCase().trim();
  if ((QUESTION_TYPES as readonly string[]).includes(key)) return key as QuestionType;
  return ALIASES[key] ?? 'short_text';
}

/** Stored answer prefix when respondent picks Other and types a custom value. */
export const OTHER_ANSWER_PREFIX = 'Other: ';

export type SurveyQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  required?: boolean;
  options?: string[];
  /** Show an “Other” choice with a free-text specify field (single/multiple choice). */
  allow_other?: boolean;
  /** Label for the Other choice (default: Other). */
  other_label?: string;
  min?: number;
  max?: number;
  pattern?: string;
  skip?: { questionId: string; equals: string } | null;
};

export function normalizeQuestions(raw: unknown): SurveyQuestion[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((q: Record<string, unknown>, i) => ({
    id: String(q.id ?? `q_${i}`),
    type: normalizeQuestionType(q.type),
    label: String(q.label ?? q.question ?? q.title ?? `Question ${i + 1}`),
    required: Boolean(q.required),
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    allow_other: Boolean(q.allow_other),
    other_label:
      typeof q.other_label === 'string' && q.other_label.trim()
        ? q.other_label.trim()
        : undefined,
    min: typeof q.min === 'number' ? q.min : (q.min_value as number | undefined),
    max: typeof q.max === 'number' ? q.max : (q.max_value as number | undefined),
    pattern: typeof q.pattern === 'string' ? q.pattern : undefined,
    skip: (q.skip as SurveyQuestion['skip']) ?? null,
  }));
}

export function newQuestion(partial?: Partial<SurveyQuestion>): SurveyQuestion {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    type: 'short_text',
    label: '',
    required: false,
    options: [],
    skip: null,
    ...partial,
  };
}
