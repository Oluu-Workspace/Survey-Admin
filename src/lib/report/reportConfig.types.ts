/** Per-survey report configuration — drives section order, headlines, and crosstabs. */

export type ReportSectionConfig = {
  id: string;
  title: string;
  /** Question ids in this section (order preserved). */
  questionIds: string[];
  accent?: string;
};

export type ReportCrosstabConfig = {
  questionId: string;
  /** Demographic / segment question id (e.g. lari_ward, lari_gender). */
  byQuestionId: string;
  /** Surface in main body only if chi-square p < 0.05 */
  headlineOnlyIfSignificant?: boolean;
};

export type ReportWeightingConfig = {
  enabled: boolean;
  /** Question id used for post-stratification (e.g. ward). */
  variableQuestionId?: string;
  /** Target population shares keyed by option label. */
  targetShares?: Record<string, number>;
};

export type SurveyReportConfig = {
  schemaVersion: 1;
  surveyId: string;
  title?: string;
  confidentialityNotice?: string;
  /** Top-line questions for executive summary stat cards. */
  headlineQuestionIds: string[];
  /** Consent yes/no question id, if any. */
  consentQuestionId?: string;
  /** Demographic profile question ids. */
  demographicQuestionIds?: string[];
  /** Single-choice questions treated as horse-race / ranked lists. */
  horseRaceQuestionIds?: string[];
  sections: ReportSectionConfig[];
  crosstabs?: ReportCrosstabConfig[];
  weighting?: ReportWeightingConfig;
  /** Labels treated as undecided / non-response for ballot questions. */
  undecidedLabels?: string[];
  openTextSampleSize?: number;
};
