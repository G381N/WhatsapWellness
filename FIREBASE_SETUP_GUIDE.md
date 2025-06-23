# Firebase Admin SDK Setup Guide

**Developer:** Gebin George  
**Project:** Christ University Student Wellness WhatsApp Bot

## 🎯 Goal
Get Firebase Admin SDK credentials so the WhatsApp bot can access the same database as your website (`christwellness-4ed46`).

## 📋 Steps to Get Firebase Admin SDK Credentials

### Step 1: Access Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **christwellness-4ed46**

### Step 2: Navigate to Service Accounts
1. Click on ⚙️ **Project Settings** (gear icon)
2. Go to **Service Accounts** tab
3. You should see "Firebase Admin SDK" section

### Step 3: Generate Service Account Key
1. Click **"Generate new private key"** button
2. Click **"Generate key"** in the popup
3. A JSON file will download automatically (e.g., `christwellness-4ed46-firebase-adminsdk-xxxxx.json`)

### Step 4: Extract Required Values
Open the downloaded JSON file and find these values:

```json
{
  "type": "service_account",
  "project_id": "christwellness-4ed46",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@christwellness-4ed46.iam.gserviceaccount.com",
  "client_id": "123456789012345678901",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40christwellness-4ed46.iam.gserviceaccount.com"
}
```

### Step 5: Map Values to Environment Variables

Copy these values to your Render environment variables:

| JSON Field | Environment Variable | Example Value |
|------------|---------------------|---------------|
| `type` | `FIREBASE_TYPE` | `service_account` |
| `project_id` | `FIREBASE_PROJECT_ID` | `christwellness-4ed46` |
| `private_key_id` | `FIREBASE_PRIVATE_KEY_ID` | `abc123def456...` |
| `private_key` | `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...` |
| `client_email` | `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@christwellness-4ed46.iam.gserviceaccount.com` |
| `client_id` | `FIREBASE_CLIENT_ID` | `123456789012345678901` |
| `auth_uri` | `FIREBASE_AUTH_URI` | `https://accounts.google.com/o/oauth2/auth` |
| `token_uri` | `FIREBASE_TOKEN_URI` | `https://oauth2.googleapis.com/token` |
| `auth_provider_x509_cert_url` | `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | `https://www.googleapis.com/oauth2/v1/certs` |
| `client_x509_cert_url` | `FIREBASE_CLIENT_X509_CERT_URL` | `https://www.googleapis.com/robot/v1/metadata/x509/...` |

## ⚠️ Important Notes

### Private Key Formatting
The `private_key` field contains newline characters (`\n`). In Render, paste it exactly as shown in the JSON, including the `\n` characters.

### Security
- **Never commit** the JSON file to your repository
- **Never share** these credentials publicly
- The WhatsApp bot needs these to write to your Firebase database

### Testing
After adding the credentials to Render:
1. Deploy your WhatsApp bot
2. Send an anonymous complaint via WhatsApp
3. Check your website admin panel - the complaint should appear!

## 🔧 Already Configured

Your Firebase project details are already set:
- **Project ID:** `christwellness-4ed46`
- **API Key:** `AIzaSyAYNNgABi9rnnQ0e-N2sgXaL5Rp_IkWwL8`
- **Auth Domain:** `christwellness-4ed46.firebaseapp.com`
- **Storage Bucket:** `christwellness-4ed46.firebasestorage.app`

You only need to add the **Admin SDK service account** credentials from Step 3 above.

## 📞 Need Help?

If you encounter any issues:
- **Developer:** Gebin George
- **Phone:** +919741301245
- **System:** Christ University Student Wellness

---

**© 2024 Gebin George - Firebase Integration Guide**
