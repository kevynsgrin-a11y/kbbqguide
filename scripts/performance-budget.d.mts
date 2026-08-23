export interface PerformanceMetricRule {
  limitBytes: number;
  baselineBytes: number;
}

export interface PerformanceBudgetPolicy {
  status: 'enforced';
  maxRegressionPercent: number;
  metrics: Record<string, PerformanceMetricRule>;
  signedExceptions?: unknown[];
}

export interface PerformanceBudgetResult {
  failures: Array<{
    metric: string;
    actualBytes: number;
    reasons: string[];
  }>;
  exceptionsUsed: Array<{
    metric: string;
    exceptionId: string;
    reasons: string[];
  }>;
}

export function evaluatePerformanceBudget(input: {
  policy: PerformanceBudgetPolicy;
  metrics: Record<string, number>;
  now?: Date;
}): PerformanceBudgetResult;
