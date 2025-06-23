# Christ University Student Wellness WhatsApp Bot

**Developer:** Gebin George (gebingeorge)  
**Institution:** Christ University  
**Purpose:** Comprehensive mental health support system for students  

## 🌟 Overview

This WhatsApp bot provides 24/7 mental health support to Christ University students through:
- Anonymous complaint system (integrated with main website database)
- Professional counselor connections
- Department-specific complaint handling with SMS notifications
- Crisis support and resources

## 🚀 Deployment on Render

### Step 1: Environment Variables

Copy these environment variables to your Render service settings:

```bash
# WhatsApp Cloud API Configuration
WHATSAPP_ACCESS_TOKEN=your_meta_whatsapp_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_whatsapp_phone_number_id_here
WHATSAPP_VERIFY_TOKEN=gebingeorge_wellness_bot_2024
WHATSAPP_WEBHOOK_SECRET=gebingeorge

# Firebase Configuration (Use same as your Vercel website)
FIREBASE_PROJECT_ID=your_firebase_project_id_here
FIREBASE_PRIVATE_KEY=your_firebase_private_key_here
FIREBASE_CLIENT_EMAIL=your_firebase_client_email_here
FIREBASE_TYPE=service_account
FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id_here
FIREBASE_CLIENT_ID=your_firebase_client_id_here
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=https://www.googleapis.com/oauth2/v1/certs
FIREBASE_CLIENT_X509_CERT_URL=your_firebase_client_x509_cert_url_here

# Application Configuration
PORT=3000
NODE_ENV=production

# Contact Information
COUNSELOR_PHONE=+919741301245
DEPARTMENT_PHONE=+919741301245
ADMIN_PHONE=+919741301245

# Website Integration
COMMUNITY_WEBSITE=https://your-vercel-website-url.vercel.app
PRIVACY_POLICY_URL=https://your-privacy-policy-url.vercel.app

# Security (Secret Key: gebingeorge)
SECRET_KEY=gebingeorge
API_SECRET=gebingeorge_christ_wellness_2024

# Developer Information
DEVELOPER_NAME=Gebin George
DEVELOPER_EMAIL=gebingeorge@example.com
DEVELOPER_SIGNATURE=Developed by Gebin George - Christ University Student Wellness System
```

### Step 2: Render Deployment

1. **Connect Repository:** Link your GitHub repository to Render
2. **Service Type:** Select "Web Service"
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment:** Add all environment variables from above
6. **Auto-Deploy:** Enable for automatic deployments

### Step 3: WhatsApp Webhook Configuration

After deployment, configure your Meta WhatsApp webhook URL:
```
https://your-render-app-name.onrender.com/webhook
```

## 🔧 Key Features

### 1. Anonymous Complaints Integration
- **Database:** Uses same Firebase collection as website (`anonymousComplaints`)
- **Privacy:** Complete anonymity maintained
- **Access:** Only admins and counselors can view
- **Format:** Structured data compatible with website interface

### 2. Department Complaints with SMS
- **Target:** All department complaints sent to +919741301245
- **Departments:** MCA, MSC AIML (easily extensible)
- **Notification:** Automatic SMS notifications
- **Tracking:** Full audit trail in Firebase

### 3. Counselor Connections
- **Questionnaire:** 5-question assessment
- **Matching:** Intelligent counselor assignment
- **Privacy:** Session confidentiality maintained
- **Follow-up:** 24-48 hour response guarantee

### 4. Crisis Support
- **24/7 Availability:** Always accessible
- **Emergency Protocols:** Direct line to +919741301245
- **Escalation:** Automatic crisis detection and response

## 🛡️ Security & Privacy

- **Encryption:** End-to-end encryption for all communications
- **Anonymization:** Phone number hashing for anonymous features
- **Access Control:** Role-based permissions
- **Audit Trails:** Complete logging for accountability
- **Data Retention:** Automatic cleanup of sensitive data

## 📱 User Journey

1. **Initial Contact:** User messages bot with "hi", "hello", or "menu"
2. **Service Selection:** Choose from menu options
3. **Anonymous Complaints:** Direct submission to website database
4. **Department Complaints:** Category selection → SMS to +919741301245
5. **Counselor Connection:** Assessment → Counselor assignment → Follow-up

## 🔗 Integration Points

### Website Integration
- **Shared Database:** Same Firebase collections
- **User Experience:** Seamless between WhatsApp and web
- **Admin Dashboard:** Web interface shows all complaints/requests

### SMS Notifications
- **Target Number:** +919741301245 (India)
- **Trigger:** Department complaints and counselor requests
- **Format:** Structured messages with student details

## 🧑‍💻 Developer Information

**Name:** Gebin George  
**Role:** Full-Stack Developer  
**Institution:** Christ University  
**Contact:** gebingeorge@example.com  

### Code Attribution
Every function, API response, and database entry includes developer attribution to prevent code theft and ensure proper credit.

### Secret Key
- **Primary:** `gebingeorge`
- **Full:** `gebingeorge_christ_wellness_2024`

## 🚀 Quick Start (Development)

```bash
# Clone and setup
git clone <repository>
cd WhatsapWellness
npm install

# Environment setup
cp env.example .env
# Fill in your environment variables

# Start development server
npm run dev
```

## 📊 Monitoring & Health Checks

- **Health Endpoint:** `/health`
- **Status Monitoring:** Real-time Firebase connection status
- **Error Tracking:** Comprehensive logging with developer attribution
- **Performance Metrics:** Response times and user interaction analytics

## 🔄 Maintenance

- **Session Cleanup:** Automatic cleanup every hour
- **Database Optimization:** Regular maintenance scripts
- **Security Updates:** Regular dependency updates
- **Performance Monitoring:** Continuous optimization

## 📞 Support

For technical issues or feature requests:
- **Developer:** Gebin George
- **Email:** gebingeorge@example.com
- **Emergency:** +919741301245

---

**© 2024 Gebin George - Christ University Student Wellness System**  
*Committed to student mental health and privacy* 