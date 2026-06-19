---
name: Clerk combined sign-in flow title
description: Why a Clerk SignIn title override silently fails and how to force the standard flow
---

When a `<SignIn>` component (Clerk react v6) is rendered without a `signUpUrl`
(on the provider or component) and sign-up is enabled on the Clerk instance,
Clerk renders the *combined* sign-in/sign-up flow. That flow's heading uses a
different localization key than `signIn.start.title`, so a `localization` override
of `signIn.start.title` is silently ignored and the default
"Continue to {{applicationName}}" (the Clerk app display name) shows instead.

**Why:** the admin sign-in leaked the Clerk app name ("Continue to Health Commerce")
while the storefront — which has a separate `/sign-up` route and `signUpUrl` —
correctly showed its custom title. Same Clerk version, same localization structure.

**How to apply:** for a sign-in screen that should NOT offer self-serve sign-up
(e.g. an admin panel), pass `withSignUp={false}` to `<SignIn>`. That forces the
standard (non-combined) flow, so `localization.signIn.start.title/subtitle` apply.
Alternatively provide a real `signUpUrl` + sign-up route (what the storefront does).
