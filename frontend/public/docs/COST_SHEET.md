# Cost Sheet & Financial Model: Factori Mobile App Platform

**Target:** Factori Executive Leadership & Financial Planning  
**Exchange Rate Applied:** 1 USD = 83.00 INR  
**Scale Horizons:** 100 Apps, 1,000 Apps, and 10,000 Apps  

---

## 1. Executive Summary

The **"Launch Your Mobile App"** engine is designed with extreme operational efficiency. By leveraging containerized Gradle build workers, a single multi-tenant backend architecture, and Google Play App Signing, Factori's platform infrastructure cost drops from **₹70.55 ($0.85) per app/month at 100 apps** down to **₹13.70 ($0.16) per app/month at 10,000 apps**.

Even when factoring in dedicated mobile and DevOps operational engineering support, the all-in running cost per active merchant app is under **₹24 ($0.29) per month at scale**.

---

## 2. Platform Infrastructure Costs (Factori OpEx)

| Cost Component | Pricing Model & Unit Economics | 100 Apps / Month | 1,000 Apps / Month | 10,000 Apps / Month |
|---|---|---|---|---|
| **Build Compute (AWS EC2 / Spot)** | Ephemeral `c6i.xlarge` spot instances ($0.17/hr); 2.5 min build = $0.0035/build. Includes base builder instance + queue auto-scaling. | $25.00 (₹2,075) | $85.00 (₹7,055) | $350.00 (₹29,050) |
| **Artifact Storage & CDN (S3 + CloudFront)** | Storage: $0.023/GB/mo. Bandwidth: $0.085/GB. Average APK: 15 MB. AAB: 12 MB. 3 versions stored per retailer. | $10.00 (₹830) | $40.00 (₹3,320) | $250.00 (₹20,750) |
| **Database & Queue Cluster (RDS + Redis)** | AWS Aurora PostgreSQL (Serverless v2) + ElastiCache Redis for BullMQ queue management. | $30.00 (₹2,490) | $70.00 (₹5,810) | $250.00 (₹20,750) |
| **Keystore Security & KMS (AWS KMS)** | Key storage: $1.00/key/month (shared KMS CMK with envelope encryption) + $0.03 per 10,000 cryptographic operations. | $5.00 (₹415) | $20.00 (₹1,660) | $150.00 (₹12,450) |
| **Push Notification Dispatch (FCM Compute)** | Firebase Cloud Messaging has zero message egress fees. Cost accounts for token pruning & batch multicast dispatch workers. | $0.00 (₹0) | $10.00 (₹830) | $150.00 (₹12,450) |
| **Monitoring, APM & Sentry** | Crash reporting, Sentry mobile SDK telemetry, and CloudWatch audit logs (180-day Indian CERT-In compliance). | $15.00 (₹1,245) | $70.00 (₹5,810) | $500.00 (₹41,500) |
| **Total Monthly Infrastructure OpEx** | | **$85.00 (₹7,055)** | **$295.00 (₹24,485)** | **$1,650.00 (₹1,36,950)** |
| **Infra Cost Per App / Month** | | **$0.85 (₹70.55)** | **$0.295 (₹24.49)** | **$0.165 (₹13.70)** |

---

## 3. Retailer-Side Direct Costs

| Expenditure Item | Amount (USD / INR) | Billing Frequency | Mandatory / Optional | Description |
|---|---|---|---|---|
| **Google Play Developer Account** | $25.00 (₹2,075) | One-Time | **Mandatory** | Paid directly by the merchant to Google. Provides their verified merchant publishing identity. |
| **Apple Developer Program** | $99.00 (₹8,217) | Annual | *Optional (Not Advised)* | Only applicable if merchant attempts iOS App Store release. High rejection risk. |
| **Factori Mobile Platform Fee** | ₹0 (Free) | Ongoing | **Retention Benefit** | Zero cost to merchants achieving ≥500 delivered orders or ≥₹2.5L GMV. |

---

## 4. Operational Staffing & Maintenance

As the app fleet expands, maintenance duties (such as annual Google Play `targetSdkVersion` compliance updates, store review appeals, and SDK refreshes) scale sub-linearly thanks to automated batch-publishing pipelines:

| Operational Item | 100 Apps | 1,000 Apps | 10,000 Apps |
|---|---|---|---|
| **DevOps & Android Maintenance Support** | $300.00 (₹24,900) | $600.00 (₹49,800) | $1,200.00 (₹99,600) |
| **Merchant Store Listing & Support Assistance** | Handled by existing support | Part-time contractor | 1 Full-time specialist |
| **Total Monthly Operating Cost (Infra + Staffing)** | **$385.00 (₹31,955)** | **$895.00 (₹74,285)** | **$2,850.00 (₹2,36,550)** |
| **All-In Cost per Active App / Month** | **$3.85 (₹319.55)** | **$0.895 (₹74.29)** | **$0.285 (₹23.66)** |

---

## 5. Monetization & Strategic Return on Investment (ROI)

If Factori packages this feature as:
1. **Free Retention Anchor:** Retaining 1,000 top merchants generating ₹2.5L+ GMV protects **₹25 Crore+ in annual gross merchandise value** on the platform.
2. **Optional White-Glove Publishing Add-On:** If Factori charges a one-time onboarding fee of **₹1,999** to set up Google Play Console, graphics, and privacy policy for the merchant, 1,000 apps generate **₹19,99,000 in immediate gross revenue**, yielding an instant 10x profit over operating costs.

---
*Factori Financial Modeling - Confidential*
