# Questions for Factori Leadership & Engineering Committee

This document highlights critical questions that can only be answered authoritatively by the Factori founding team and core architects, along with the interim assumptions adopted to complete the technical architecture and working proof.

---

### Question 1: Customer Authentication & Session Handoff
- **The Question:** How does a customer session currently persist on Factori storefronts? Specifically, does the web platform use standard HTTP session cookies, client-side JWTs in `localStorage`, or an encrypted token in a proprietary cookie?
- **Why it matters:** In a native Android WebView, persistent sessions depend on whether cookies (`CookieManager.getInstance()`) or local storage (`WebSettings.setDomStorageEnabled(true)`) carry the authentication payload. Furthermore, the native JS bridge needs a clean method to hook into the login event to bind the customer's phone number to their push notification token.
- **Interim Assumption Adopted:** We assume standard HTTP cookies with `SameSite=Lax` and `Secure` attributes, complemented by a client-side authentication state in `localStorage`. The native Android shell enables DOM storage, third-party cookies, and forces a `CookieManager.flush()` to disk on app lifecycle transitions.

---

### Question 2: Retailer Legal Structure & D-U-N-S Numbers
- **The Question:** What percentage of Factori retailers who hit the 500 order / ₹2.5 Lakh milestone are registered business entities (Private Limited, LLP, Partnership with GSTIN) versus unregistered individual sole proprietors?
- **Why it matters:** Google Play's policy since November 13, 2023 requires all personal developer accounts to maintain 20 testers for 14 days before production publishing is granted. Organization accounts with a D-U-N-S number are completely exempt from this 14-day delay and can publish directly.
- **Interim Assumption Adopted:** We assume that successful merchants qualifying at ≥500 orders or ₹2.5L GMV have active GSTIN registrations and can acquire a free D-U-N-S number, allowing them to register as an organization on Google Play Console and publish within 3–5 days without the 14-day personal testing blocker.

---

### Question 3: Distribution Model: Direct Sideloading vs. Google Play Console
- **The Question:** Does Factori intend for the majority of retailers to distribute their app via direct APK download (e.g. sharing a download link with their shoppers via WhatsApp / SMS / Instagram bio), or must 100% of apps be published to the Google Play Store?
- **Why it matters:** Direct APK distribution works instantly with zero approval delays, zero account registration fees ($25 saved), and zero risk of store policy rejections. However, Android displays an "Install from Unknown Sources" warning to users. Google Play requires an Android App Bundle (`.aab`), developer account verification, and annual maintenance.
- **Interim Assumption Adopted:** We recommend and implement a **hybrid distribution model**:
  1. Instant APK generation for immediate merchant sideloading and customer distribution via WhatsApp / store banner.
  2. Simultaneous generation of a signed `.aab` package with step-by-step guides for merchants who wish to publish on Google Play.

---

### Question 4: Product Strategy for iOS Users
- **The Question:** What is the product expectation for iPhone shoppers? Are we prepared to set realistic expectations that native Apple App Store packaging for pure web storefronts faces an ~80% rejection rate under Apple Guideline 4.2 (Minimum Functionality)?
- **Why it matters:** Promising small Indian merchants an instant "one-click iOS App Store launch" will create immense frustration, cost each retailer $99/year in Apple fees, and lead to repeated rejections from Apple review teams.
- **Interim Assumption Adopted:** We advise positioning Android as the native app product, while providing iOS users with a polished **Progressive Web App (PWA)** experience with an automated "Add to Home Screen" prompt and Web Push Notifications (supported in iOS 16.4+).

---

### Question 5: Commercial & Support Model
- **The Question:** Will Factori support staff handle Google Play Console uploads on behalf of the retailer (e.g. being invited as a developer to the merchant's console), or is the process completely self-service with video guides?
- **Why it matters:** Providing white-glove manual upload for 1,000+ stores requires dedicated support headcount. Conversely, self-service requires comprehensive in-dashboard tutorials and automated validation of Play Console prerequisites.
- **Interim Assumption Adopted:** Self-service with rich visual video and PDF guides, with an optional paid white-glove onboarding add-on (e.g. ₹1,999 one-time fee) that can be monetized profitably.

---
*Factori Architecture Proposal - Confidential*

