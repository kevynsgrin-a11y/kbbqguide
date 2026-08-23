/**
 * Pure policy evaluation for the production-build performance budget.
 *
 * A performance exception is deliberately structured rather than a boolean
 * escape hatch. It must name the affected metric, bound its byte impact, cite
 * an approval reference, identify the signer, and expire. This records a
 * reviewable exception, but does not claim cryptographic-signature validation.
 */

function actualText(value) {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    !/\b(?:tbd|todo|unknown|placeholder)\b/i.test(value)
  );
}

function validDate(value) {
  if (!actualText(value)) return false;
  return Number.isFinite(new Date(value).valueOf());
}

function metricException(exception, metric, actualBytes, now) {
  if (!exception || typeof exception !== 'object') return false;
  if (!actualText(exception.id)) return false;
  if (!Array.isArray(exception.metrics) || !exception.metrics.includes(metric))
    return false;
  if (!exception.maxBytes || typeof exception.maxBytes !== 'object')
    return false;
  const approvedMaximum = exception.maxBytes[metric];
  if (!Number.isFinite(approvedMaximum) || approvedMaximum < actualBytes)
    return false;
  if (!actualText(exception.rationale)) return false;
  if (!actualText(exception.signedBy) || !validDate(exception.signedAt))
    return false;
  if (!actualText(exception.approvalReference)) return false;
  if (!validDate(exception.expiresAt)) return false;
  const signedAt = new Date(exception.signedAt).valueOf();
  const expiresAt = new Date(exception.expiresAt).valueOf();
  return (
    signedAt <= now.valueOf() &&
    signedAt <= expiresAt &&
    expiresAt >= now.valueOf()
  );
}

export function evaluatePerformanceBudget({
  policy,
  metrics,
  now = new Date(),
}) {
  if (!policy || policy.status !== 'enforced')
    throw new Error('Performance budget policy must be present and enforced.');
  if (policy.maxRegressionPercent !== 10)
    throw new Error(
      'Performance budget policy must enforce a 10% regression limit.',
    );
  if (!policy.metrics || typeof policy.metrics !== 'object')
    throw new Error('Performance budget policy is missing metric definitions.');
  if (!Array.isArray(policy.signedExceptions))
    throw new Error('Performance budget policy must define signedExceptions.');

  const failures = [];
  const exceptionsUsed = [];
  const regressionMultiplier = 1 + policy.maxRegressionPercent / 100;

  for (const [metric, rule] of Object.entries(policy.metrics)) {
    const actualBytes = metrics[metric];
    if (!Number.isFinite(actualBytes) || actualBytes < 0)
      throw new Error(`Missing non-negative measurement for ${metric}.`);
    if (
      !rule ||
      !Number.isFinite(rule.limitBytes) ||
      !Number.isFinite(rule.baselineBytes)
    )
      throw new Error(`Invalid performance budget rule for ${metric}.`);

    if (actualBytes > rule.limitBytes) {
      failures.push({
        metric,
        actualBytes,
        reasons: [`absolute ${actualBytes} B > ${rule.limitBytes} B`],
      });
      continue;
    }

    const regressionLimit = Math.floor(
      rule.baselineBytes * regressionMultiplier,
    );
    if (actualBytes <= regressionLimit) continue;
    const reasons = [
      `regression ${actualBytes} B > ${regressionLimit} B (${policy.maxRegressionPercent}% over ${rule.baselineBytes} B baseline)`,
    ];

    const exception = policy.signedExceptions.find((candidate) =>
      metricException(candidate, metric, actualBytes, now),
    );
    if (exception) {
      exceptionsUsed.push({ metric, exceptionId: exception.id, reasons });
      continue;
    }
    failures.push({ metric, actualBytes, reasons });
  }

  return { failures, exceptionsUsed };
}
