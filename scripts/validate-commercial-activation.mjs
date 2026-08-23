#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const revenue = JSON.parse(readFileSync('data/revenue-modules.json', 'utf8'));
const activation = JSON.parse(
  readFileSync('data/commercial-activation.json', 'utf8'),
);

const REQUIRED_GATES = [
  'merchantOrProviderContractApproved',
  'exactItemOrServiceEvidenceComplete',
  'adjacentDisclosureCopyApproved',
  'relSponsoredAppliedToPaidLinks',
  'privacyPolicyUpdated',
  'consentAndSuppressionConfiguredIfEmail',
  'priceAndAvailabilityCheckedAtDisplayTime',
  'refundTaxDeliveryTermsPublishedIfPaid',
  'accessibilityQaComplete',
  'securityAndRateLimitReviewComplete',
];

const errors = [];
const records = new Map();
for (const record of activation.modules ?? []) {
  if (records.has(record.moduleId))
    errors.push(`Duplicate activation record: ${record.moduleId}`);
  records.set(record.moduleId, record);
}

for (const module of revenue.modules ?? []) {
  const record = records.get(module.id);
  if (!record) {
    errors.push(`Missing activation record for revenue module: ${module.id}`);
    continue;
  }

  if (module.status !== record.status) {
    errors.push(
      `Status mismatch for ${module.id}: revenue=${module.status}, activation=${record.status}`,
    );
  }

  if (record.status !== 'disabled' && record.status !== 'active') {
    errors.push(`Invalid activation status for ${module.id}: ${record.status}`);
    continue;
  }

  if (record.status === 'active') {
    for (const gate of REQUIRED_GATES) {
      if (record.gates?.[gate] !== true)
        errors.push(`${module.id} is active without ${gate}=true`);
    }
  }
}

for (const moduleId of records.keys()) {
  if (!(revenue.modules ?? []).some((module) => module.id === moduleId))
    errors.push(`Activation record has no revenue module: ${moduleId}`);
}

if (errors.length > 0) {
  process.stderr.write(
    `commercial activation validation failed:\n${errors.map((error) => `- ${error}`).join('\n')}\n`,
  );
  process.exit(1);
}

const active = activation.modules.filter(
  (record) => record.status === 'active',
);
process.stdout.write(
  `commercial activation validation passed: ${activation.modules.length} modules, ${active.length} active.\n`,
);
