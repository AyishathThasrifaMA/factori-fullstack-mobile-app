# Factori Mobile App Platform - "Launch Your Mobile App"

A complete, production-grade white-label mobile app generation platform for Factori retailers (`retailing.factori.com`).

This repository contains the full submission for the **Full-Stack Developer Assignment: "Launch your mobile app" for factori retailers**, including:
1. **Architecture Document** (12-page equivalent answering all 30 questions in Sections A–G with diagrams, build flows, and data model).
2. **Working Proof Generator** (CLI and Web Dashboard that takes store name, storefront URL, and an icon, returning a signed, installable Android APK with zero manual steps).
3. **Dual Live Storefront Proofs** (Automated runner for live Factori stores: **Zolara** and **Armella**).
4. **Cost Sheet Spreadsheet** (Detailed financial model for 100, 1,000, and 10,000 apps in CSV and Markdown).
5. **Questions for Factori** (Key unknowns and interim assumptions).
6. **Extra Credit Deliverables**:
   - Push notification dispatch script sending deep links to specific product pages.
   - Native JavaScript Bridge (`FactoriBridge.kt`) for logged-in customer identification and persistent sessions.
   - Evidenced analysis of iOS App Store constraints (Apple Guideline 4.2 / 4.3).

---

## Deliverables Index & Navigation

| Deliverable | File Path | Description |
|---|---|---|
| **Architecture Document (Markdown)** | [`docs/ARCHITECTURE.md`](file:///d:/factori.com-FullStack/docs/ARCHITECTURE.md) | Answers all 30 assignment questions, system diagrams, build flows, and schema. |
| **Architecture Document (Printable HTML/PDF)** | [`docs/ARCHITECTURE.html`](file:///d:/factori.com-FullStack/docs/ARCHITECTURE.html) | Formatted with print CSS (<12 pages) for PDF export or presentation review. |
| **Cost Sheet (CSV Spreadsheet)** | [`docs/COST_SHEET.csv`](file:///d:/factori.com-FullStack/docs/COST_SHEET.csv) | Itemized spreadsheet for 100, 1,000, and 10,000 apps. |
| **Cost Sheet (Markdown Explainer)** | [`docs/COST_SHEET.md`](file:///d:/factori.com-FullStack/docs/COST_SHEET.md) | OpEx analysis, unit economics, and monetization strategy. |
| **Questions for Factori Leadership** | [`docs/QUESTIONS_FOR_FACTORI.md`](file:///d:/factori.com-FullStack/docs/QUESTIONS_FOR_FACTORI.md) | Business and technical clarifications with assumptions used. |
| **Automated App Generator CLI** | [`generator/generate_app.js`](file:///d:/factori.com-FullStack/generator/generate_app.js) | Standalone CLI to produce signed APK from name, URL, and icon. |
| **Dual Store Proof Runner** | [`generator/build_sample_stores.js`](file:///d:/factori.com-FullStack/generator/build_sample_stores.js) | Generates apps for **Zolara** (`zolara.in`) and **Armella** (`armella.in`). |
| **Product Push Notification Script** | [`scripts/send_push_notification.js`](file:///d:/factori.com-FullStack/scripts/send_push_notification.js) | FCM HTTP v1 dispatch script with product deep-linking. |
| **Customer Identification Bridge** | [`android-template/.../FactoriBridge.kt`](file:///d:/factori.com-FullStack/android-template/app/src/main/java/com/factori/shell/FactoriBridge.kt) | Native JS interface binding customer phone/ID to FCM token. |

---

## Prerequisites (Clean Machine Setup)

To build and run the generator on a clean machine:
- **Node.js**: 18.x or 20.x
- **Java Development Kit (JDK)**: JDK 17 (`java` and `keytool` on system `PATH`)
- **Android SDK**: Build-tools 35, Platform `android-35`
- **Environment Variable**: Set `ANDROID_HOME` pointing to your Android SDK directory (e.g. `%LOCALAPPDATA%\Android\Sdk` on Windows, or `~/Android/Sdk` on Linux/macOS).

---

## 1. Quick Start: Run the Dual Store Proof (Section 5.2)

To generate signed Android apps for the two live Factori stores (**Zolara** and **Armella**) in one command with nothing done by hand:

```bash
node generator/build_sample_stores.js
```

This automated runner:
1. Generates branded high-resolution icons for **Zolara** and **Armella**.
2. Creates isolated workspaces for each store.
3. Generates unique PKCS12 release keystores.
4. Executes Gradle `assembleRelease` to produce signed release APKs.
5. Saves the final installable APKs to `./output_apps/`:
   - `output_apps/zolara-release.apk`
   - `output_apps/armella-release.apk`

---

## 2. Using the Standalone App Generator CLI

You can generate a signed app for any live store using the CLI:

```bash
node generator/generate_app.js \
  --name "Zolara" \
  --url "https://zolara.in" \
  --icon "generator/assets/zolara_icon.png" \
  --out "./dist"
```

Options:
- `--name`, `-n`: Display name of the store (e.g., `"Zolara"`).
- `--url`, `-u`: HTTPS storefront address (e.g., `"https://zolara.in"`).
- `--icon`, `-i`: Path to a PNG icon (48–2048px). If omitted, an icon is generated automatically.
- `--out`, `-o`: Directory where the signed `.apk` will be saved.

---

## 3. Running the Web Dashboard & API

You can also run the full interactive Factori Retailer Dashboard with the real-time build tracker:

### Step 1: Start the Backend Service
```bash
cd backend
npm install
npm run dev
```
*API runs on `http://localhost:3001`.*

### Step 2: Start the Frontend UI
```bash
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

Enter your retailer name, HTTPS storefront URL, upload a PNG icon, and click **Generate Android App**. The UI streams live build progress from Gradle and enables the **Download APK** button once the signed release build succeeds.

---

## 4. Extra Credit: Push Notification & Deep Linking

To simulate or dispatch a targeted push notification opening a specific product page:

```bash
# Node.js version
node scripts/send_push_notification.js \
  --store "Zolara" \
  --product "https://zolara.in/products/embroidered-anarkali-kurti" \
  --title "Flash Sale: 20% Off on Kurtis!" \
  --body "Tap here to view the new collection."

# Python version
python scripts/send_push_notification.py \
  --store "Zolara" \
  --product "https://zolara.in/products/embroidered-anarkali-kurti"
```

**How It Works in the Android Shell:**
1. The app's `MainActivity` receives the intent containing extra `target_url`.
2. The WebView checks `isOnline()` and directly navigates to the target product URL.
3. The shopper lands instantly on the product details page ready to add to cart!

---

## 5. Extra Credit: Customer Identification via JS Bridge

The Android shell exposes `window.FactoriBridge` inside the WebView:
```javascript
// Executed by the retailer web store on successful OTP / login:
if (window.FactoriBridge) {
  window.FactoriBridge.identifyCustomer(JSON.stringify({
    customerId: "cust_12345",
    phone: "+919876543210",
    customerName: "Ananya Patel"
  }));
}
```

The native shell receives this payload in `FactoriBridge.kt`, securely stores it in encrypted app preferences, and binds the customer's phone number to their FCM device token in Factori's database.

---

## 6. Architecture Highlights & Key Decisions

- **WebView over iframe:** Solves cross-origin blocking, cookie persistence, and enables native UPI intent redirection (`upi://`, `phonepe://`, `gpay://`).
- **Google Play App Signing & KMS:** Each retailer has their own upload key managed in an encrypted vault, while Google holds the distribution key, allowing safe key resets if an upload key is lost.
- **Sub-Linear Economics:** Infrastructure cost drops from **₹70 ($0.85)/app/month at 100 apps** down to **₹14 ($0.16)/app/month at 10,000 apps**.
- **Android-First Strategy:** Native Android apps with push notifications capture >95% of tier-2/3 Indian e-commerce volume without the high rejection risk and $99/yr fee of Apple App Store.

---
*Factori Confidential - Full-Stack Developer Assignment Submission*
