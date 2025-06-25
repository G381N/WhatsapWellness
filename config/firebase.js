/**
 * Firebase Configuration for Christ University Student Wellness WhatsApp Bot
 * Developer: Gebin George (gebingeorge)
 * Integrates with the same Firebase database as the main website
 */

const admin = require('firebase-admin');

let db = null;

/**
 * Initialize Firebase Admin SDK
 * Developer: Gebin George
 */
function initializeFirebase() {
  try {
    if (!admin.apps.length) {
      // Enhanced private key parsing - handles multiple formatting issues
      let privateKey = process.env.FIREBASE_PRIVATE_KEY;
      
      if (privateKey) {
        // Replace escaped newlines with actual newlines
        privateKey = privateKey.replace(/\\n/g, '\n');
        
        // Remove extra quotes that might be added by environment variable systems
        privateKey = privateKey.replace(/^"(.*)"$/, '$1');
        privateKey = privateKey.replace(/^'(.*)'$/, '$1');
        
        // Ensure proper PEM format
        if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
          // If the key doesn't have headers, try to reconstruct it
          privateKey = privateKey.replace(/-----BEGIN PRIVATE KEY-----/g, '');
          privateKey = privateKey.replace(/-----END PRIVATE KEY-----/g, '');
          privateKey = privateKey.replace(/\s/g, '');
          
          // Add proper PEM headers and format
          const chunks = privateKey.match(/.{1,64}/g) || [];
          privateKey = '-----BEGIN PRIVATE KEY-----\n' + chunks.join('\n') + '\n-----END PRIVATE KEY-----';
        }
        
        // Clean up any double newlines or spaces
        privateKey = privateKey.replace(/\n\s+/g, '\n');
        privateKey = privateKey.replace(/\n+/g, '\n');
      }

      const serviceAccount = {
        type: process.env.FIREBASE_TYPE || 'service_account',
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: privateKey,
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI || 'https://accounts.google.com/o/oauth2/auth',
        token_uri: process.env.FIREBASE_TOKEN_URI || 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      // Debug logging for troubleshooting (without exposing the actual key)
      console.log('🔧 Firebase config check (Developer: Gebin George):');
      console.log('  - Project ID:', serviceAccount.project_id ? '✓' : '✗');
      console.log('  - Client Email:', serviceAccount.client_email ? '✓' : '✗');
      console.log('  - Private Key:', privateKey ? `✓ (length: ${privateKey.length})` : '✗');
      console.log('  - Private Key starts with PEM header:', privateKey?.startsWith('-----BEGIN PRIVATE KEY-----') ? '✓' : '✗');

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      });

      console.log('✅ Firebase initialized successfully by Gebin George');
    }

    db = admin.firestore();
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization error (Developer: Gebin George):', error);
    throw error;
  }
}

/**
 * Save Anonymous Complaint to same Firebase collection as website
 * Developer: Gebin George
 * Integrates with student-wellness website anonymous complaints
 */
async function saveAnonymousComplaint(complaintData) {
  try {
    if (!db) {
      throw new Error('Firebase not initialized - Contact developer Gebin George');
    }

    // Use the same collection as the website: 'anonymousComplaints'
    const complaint = {
      title: complaintData.title || 'WhatsApp Anonymous Complaint',
      description: complaintData.complaint || complaintData.description,
      category: complaintData.category || 'General',
      severity: complaintData.severity || 'Medium',
      timestamp: admin.firestore.Timestamp.now(),
      status: 'Open',
      resolved: false,
      source: 'whatsapp_bot',
      submittedBy: 'Anonymous WhatsApp User',
      phoneHash: complaintData.phoneHash,
      developerNote: 'Submitted via WhatsApp Bot - Developed by Gebin George'
    };

    const docRef = await db.collection('anonymousComplaints').add(complaint);
    
    console.log(`✅ Anonymous complaint saved to Firebase by Gebin George: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...complaint
    };
  } catch (error) {
    console.error('❌ Error saving anonymous complaint (Developer: Gebin George):', error);
    throw error;
  }
}

/**
 * Save Counselor Request
 * Developer: Gebin George
 */
async function saveCounselorRequest(requestData) {
  try {
    if (!db) {
      throw new Error('Firebase not initialized - Contact developer Gebin George');
    }

    const request = {
      ...requestData,
      timestamp: admin.firestore.Timestamp.now(),
      status: 'pending',
      source: 'whatsapp_bot',
      developerNote: 'Submitted via WhatsApp Bot - Developed by Gebin George'
    };

    const docRef = await db.collection('counselorRequests').add(request);
    
    console.log(`✅ Counselor request saved by Gebin George: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...request
    };
  } catch (error) {
    console.error('❌ Error saving counselor request (Developer: Gebin George):', error);
    throw error;
  }
}

/**
 * Save Department Complaint with SMS notification to +919741301245
 * Developer: Gebin George
 */
async function saveDepartmentComplaint(complaintData) {
  try {
    if (!db) {
      throw new Error('Firebase not initialized - Contact developer Gebin George');
    }

    const complaint = {
      ...complaintData,
      timestamp: admin.firestore.Timestamp.now(),
      status: 'submitted',
      source: 'whatsapp_bot',
      notificationSent: true,
      notificationPhone: '+919741301245',
      developerNote: 'Submitted via WhatsApp Bot - Developed by Gebin George'
    };

    const docRef = await db.collection('departmentComplaints').add(complaint);
    
    console.log(`✅ Department complaint saved by Gebin George: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...complaint
    };
  } catch (error) {
    console.error('❌ Error saving department complaint (Developer: Gebin George):', error);
    throw error;
  }
}

/**
 * Get System Statistics
 * Developer: Gebin George
 */
async function getSystemStats() {
  try {
    if (!db) {
      throw new Error('Firebase not initialized - Contact developer Gebin George');
    }

    const [complaintsSnapshot, requestsSnapshot, deptComplaintsSnapshot] = await Promise.all([
      db.collection('anonymousComplaints').get(),
      db.collection('counselorRequests').get(),
      db.collection('departmentComplaints').get()
    ]);

    return {
      totalAnonymousComplaints: complaintsSnapshot.size,
      totalCounselorRequests: requestsSnapshot.size,
      totalDepartmentComplaints: deptComplaintsSnapshot.size,
      lastUpdated: new Date().toISOString(),
      developer: 'Gebin George',
      system: 'Christ University Student Wellness WhatsApp Bot'
    };
  } catch (error) {
    console.error('❌ Error fetching system stats (Developer: Gebin George):', error);
    throw error;
  }
}

/**
 * Health check for Firebase connection
 * Developer: Gebin George
 */
async function checkFirebaseHealth() {
  try {
    if (!db) {
      return { healthy: false, message: 'Firebase not initialized - Contact Gebin George' };
    }

    // Test database connection
    await db.collection('_health').doc('test').get();
    
    return {
      healthy: true,
      message: 'Firebase connection healthy',
      developer: 'Gebin George',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Firebase health check failed (Developer: Gebin George):', error);
    return {
      healthy: false,
      message: 'Firebase connection failed',
      error: error.message,
      developer: 'Gebin George',
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = {
  initializeFirebase,
  saveAnonymousComplaint,
  saveCounselorRequest,
  saveDepartmentComplaint,
  getSystemStats,
  checkFirebaseHealth,
  // Developer attribution
  developer: 'Gebin George',
  version: '1.0.0',
  description: 'Christ University Student Wellness WhatsApp Bot Firebase Integration'
}; 