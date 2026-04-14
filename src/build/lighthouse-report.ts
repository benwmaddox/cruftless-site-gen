export type LighthouseAuditDetails = {
  overallSavingsBytes?: number | null;
  overallSavingsMs?: number | null;
  type?: string;
};

export type LighthouseAudit = {
  details?: LighthouseAuditDetails;
  displayValue?: string | null;
  id?: string;
  numericValue?: number | null;
  score?: number | null;
  title?: string | null;
};

export type LighthouseAuditRef = {
  id: string;
  weight?: number;
};

export type LighthouseCategory = {
  auditRefs?: LighthouseAuditRef[];
  score?: number | null;
};

export type LighthouseReport = {
  audits?: Record<string, LighthouseAudit>;
  categories?: Record<string, LighthouseCategory>;
};

const formatPercent = (score: number): string => `${Math.round(score * 100)}`;

const formatBytes = (value: number): string => {
  const absolute = Math.abs(value);

  if (absolute < 1024) {
    return `${Math.round(value)}B`;
  }

  const kib = value / 1024;

  if (Math.abs(kib) < 1024) {
    return `${kib.toFixed(Math.abs(kib) < 10 ? 1 : 0)} KiB`;
  }

  const mib = kib / 1024;
  return `${mib.toFixed(Math.abs(mib) < 10 ? 1 : 0)} MiB`;
};

const formatAuditValue = (audit: LighthouseAudit): string | undefined => {
  if (audit.displayValue) {
    return audit.displayValue;
  }

  if (typeof audit.numericValue === "number") {
    return `${Math.round(audit.numericValue)}`;
  }

  return undefined;
};

const formatAuditDetails = (audit: LighthouseAudit): string | undefined => {
  if (audit.details?.type === "opportunity") {
    if (typeof audit.details.overallSavingsMs === "number" && audit.details.overallSavingsMs > 0) {
      return `estimated savings ${Math.round(audit.details.overallSavingsMs)}ms`;
    }

    if (
      typeof audit.details.overallSavingsBytes === "number" &&
      audit.details.overallSavingsBytes > 0
    ) {
      return `estimated savings ${formatBytes(audit.details.overallSavingsBytes)}`;
    }
  }

  const displayValue = formatAuditValue(audit);
  return displayValue ? `value ${displayValue}` : undefined;
};

export const collectCategoryAuditDetails = (
  report: LighthouseReport,
  categoryKey: string,
  maxItems = 5,
): string[] => {
  const category = report.categories?.[categoryKey];
  const auditRefs = category?.auditRefs ?? [];

  return auditRefs
    .map((ref) => {
      const audit = report.audits?.[ref.id];

      if (!audit || typeof audit.score !== "number") {
        return undefined;
      }

      const weight = ref.weight ?? 0;
      const score = audit.score;
      const impact = weight * (1 - score);

      return {
        audit,
        impact,
      };
    })
    .filter(
      (entry): entry is { audit: LighthouseAudit; impact: number } =>
        entry !== undefined && entry.impact > 0,
    )
    .sort((left, right) => right.impact - left.impact)
    .slice(0, maxItems)
    .map(({ audit }) => {
      const score = typeof audit.score === "number" ? ` (${formatPercent(audit.score)})` : "";
      const detail = formatAuditDetails(audit);

      return `- ${audit.title ?? audit.id ?? "Unnamed audit"}${score}${detail ? `: ${detail}` : ""}`;
    });
};

export const formatFailedCategoryDetails = (report: LighthouseReport, categoryKey: string): string[] => {
  const details = collectCategoryAuditDetails(report, categoryKey);

  if (details.length === 0) {
    return [];
  }

  return ["  Top related audits:", ...details.map((detail) => `    ${detail}`)];
};
