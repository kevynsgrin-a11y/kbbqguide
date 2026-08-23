# Commercial activation gate

The canonical activation record is `data/commercial-activation.json`. A
commercial module stays `disabled` until every requirement below is `true` in
that record and its corresponding revenue module has the same status. The
runtime assertion in `src/lib/commercial-activation.ts` is mandatory before a
renderer creates an active paid recommendation, checkout, lead collection, or
commercial service surface.

## Required evidence

1. `merchantOrProviderContractApproved`
2. `exactItemOrServiceEvidenceComplete`
3. `adjacentDisclosureCopyApproved`
4. `relSponsoredAppliedToPaidLinks`
5. `privacyPolicyUpdated`
6. `consentAndSuppressionConfiguredIfEmail`
7. `priceAndAvailabilityCheckedAtDisplayTime`
8. `refundTaxDeliveryTermsPublishedIfPaid`
9. `accessibilityQaComplete`
10. `securityAndRateLimitReviewComplete`

The gate applies even where a module does not collect email or sell a paid
service. In those cases the responsible owner must still record the reviewed,
not-applicable decision in the supporting evidence before setting the boolean
to `true`; a disabled state never implies an assumption of compliance.

## Activation sequence

1. Collect dated evidence for the exact merchant, item, service, and display
   surface.
2. Publish an approved privacy notice and, where relevant, applicable payment
   terms before collecting or processing the associated data.
3. Ensure the rendered paid link uses the approved disclosure copy before or
   adjacent to the recommendation and `rel="sponsored nofollow"`.
4. Set all ten fields to `true`, set both corresponding module statuses to
   `active`, and run `node scripts/validate-commercial-activation.mjs`.
5. Test the renderer, disabled fallback, accessibility behavior, rate limit,
   and security controls before release.

If any evidence expires, changes, or becomes uncertain, set the module back to
`disabled` and remove the commercial surface before re-review.
