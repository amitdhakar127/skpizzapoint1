# SK Pizza Point • Admin Android Application (APK)

A dedicated, high-performance Android Administrator app for **SK Pizza Point**.

---

## 🍕 Architecture & Firebase Integration

```
                 Firebase Project ("sk-pizza-point")
                               │
            ┌──────────────────┴──────────────────┐
            ▼                                     ▼
     Customer Website                        Admin Android APK
  (Read menu, place orders)             (Manage orders, menu, alerts)
            │                                     │
            └──────────────────┬──────────────────┘
                               ▼
                    Realtime DB & Firestore
               • /orders (live order stream)
               • /products (instant stock/pricing)
               • /settings (store open/closed)
```

- **Same Database:** Uses the exact same Firebase project (`sk-pizza-point`) and same Realtime Database & Firestore collections as the customer website.
- **Admin-Only Security:** Verifies that authenticated user has UID `vxIlz4pYZgM646mXmp2BQuXtYz32` or verified owner email (`zyvoraofficial3@gmail.com` / `skpizzapoint@gmail.com`). All customer users are rejected with `Access Denied`.
- **Zero Embedded Secrets:** No private keys or service account JSON files are embedded in the APK. Client-side Firebase credentials authenticate via Firebase Auth and Firestore / Realtime Database security rules.

---

## 🚀 Features in Admin APK

1. **Real-time Order Feed:** Live updates as customers place orders on the website.
2. **Repeating High-Volume Alarm (🚨):** Continuous siren sound & vibration until admin taps **STOP ALARM** or manages the order.
3. **Status Workflow:** One-tap status updates (`Pending` → `Preparing` → `Out for Delivery` → `Delivered` → `Cancelled`).
4. **Payment & UTR Verification:** View Cash/UPI mode and mark payment as `Verified`.
5. **Customer Communications:** One-tap Call (`tel:`) and WhatsApp (`wa.me`) buttons.
6. **Live GPS Navigation:** One-tap button opens customer address or live GPS pin directly in Google Maps.
7. **Product Stock & Price Control:** Instant toggle for In-Stock / Out-of-Stock and real-time product price/item editing.
8. **Kitchen Status:** Instant toggle to pause or open orders for the restaurant.

---

## ⚙️ Automated GitHub Actions Workflow

When you push code from Google AI Studio to GitHub (`amitdhakar127/skpizzapoint1`), GitHub Actions automatically:
1. Deploys the customer website to Firebase Hosting (`.github/workflows/deploy-customer-website.yml`).
2. Builds the Admin Android APK (`.github/workflows/build-admin-apk.yml`).

### How to download the built APK:
1. Go to your GitHub repository: `https://github.com/amitdhakar127/skpizzapoint1`.
2. Click on the **Actions** tab.
3. Click on the latest run for **"Build SK Pizza Point Admin Android APK"**.
4. Scroll to **Artifacts** at the bottom of the run page.
5. Download **`sk-pizza-point-admin-debug-apk`** and install it on your Android phone!

---

## 📱 How to Build & Test from Termux (Android)

You can build the APK directly on your Android phone using Termux:

1. Open Termux on your phone.
2. Install git and clone your repo (or navigate to your project folder):
   ```bash
   pkg update -y
   pkg install -y git openjdk-17 gradle
   ```
3. Navigate to `android-admin`:
   ```bash
   cd skpizzapoint1/android-admin
   ```
4. Run the automated build script:
   ```bash
   chmod +x build-termux.sh gradlew
   ./build-termux.sh
   ```
   Or run Gradle directly:
   ```bash
   ./gradlew assembleDebug
   ```
5. Your APK will be ready at:
   `app/build/outputs/apk/debug/app-debug.apk`

---

## 🔐 Safe Release Signing via GitHub Secrets (Optional)

To automatically generate a signed release APK:
1. Add these 4 secrets in your GitHub repository (**Settings > Secrets and variables > Actions**):
   - `ANDROID_KEYSTORE_BASE64`: Base64 string of your `.keystore` file (`base64 -w 0 my-release-key.jks`)
   - `ANDROID_KEYSTORE_PASSWORD`: Keystore password
   - `ANDROID_KEY_ALIAS`: Key alias name
   - `ANDROID_KEY_PASSWORD`: Key password
2. The GitHub workflow will automatically detect these secrets, sign the release APK, and upload **`sk-pizza-point-admin-release-apk`** to the workflow artifacts.
