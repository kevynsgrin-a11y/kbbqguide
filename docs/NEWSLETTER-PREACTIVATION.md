# Newsletter preactivation specification

Status: disabled. This document is an acceptance specification, not a
provider selection, retention policy, consent record, or authorization to
collect an email address. The newsletter form, automation, and sends remain
disabled until `data/newsletter-activation.json` and the automation registry
pass `newsletterActivationEligibility()`.

## Required controls before activation

1. State one exact list purpose next to an unchecked, explicit consent control.
   Do not preselect consent or infer it from an interest tag, direct message,
   browsing behavior, or prior visit.
2. Decide and configure double opt-in: use `required-and-configured`, or record
   a specific reviewed exception rationale and legal approval before selecting
   `not-required-with-reason`.
3. Select a provider only after its data-processing agreement and documented
   retention period are approved.
4. Include the required legal postal address in every email.
5. Configure a one-click unsubscribe path and a durable suppression list that
   prevents later resubscription or automated sends until a valid new consent
   process occurs.
6. Provide an accessible preference center, including clear keyboard-operable
   form controls and accessible errors, success messages, and confirmations.
7. Prohibit tags inferred from direct messages or browsing. Tags must be chosen
   by the subscriber or created through a separately documented consent flow.
8. Document deletion and export handling, including who completes the request,
   the systems searched, and the approved response process.
9. Apply privacy-preserving rate limiting and bot protection without a broad
   behavioral-tracking dependency.
10. Update and approve the privacy policy, then record the accountable
    approver and approval date.

## Release check

The activation record must be `active`, the automation registry must indicate
that a provider and collection are configured, and every required control must
be complete. Any missing evidence makes `assertNewsletterActivation()` throw;
the public UI must retain its inert, non-collecting form state.
