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
 * Enhanced phone number formatting for WhatsApp
 * Handles various input formats and ensures proper WhatsApp format
 */
function formatWhatsAppPhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;
  
  // Remove 'whatsapp:' prefix if present
  let cleanNumber = phoneNumber.toString();
  if (cleanNumber.startsWith('whatsapp:')) {
    cleanNumber = cleanNumber.replace('whatsapp:', '');
  }
  
  // Remove all non-digit characters except +
  cleanNumber = cleanNumber.replace(/[^\d+]/g, '');
  
  // Handle different input formats
  if (cleanNumber.startsWith('+91')) {
    // Already in correct format
    return cleanNumber;
  } else if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
    // Indian number without + (91XXXXXXXXXX)
    return '+' + cleanNumber;
  } else if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
    // Indian number with leading 0 (0XXXXXXXXXX)
    return '+91' + cleanNumber.substring(1);
  } else if (cleanNumber.length === 10) {
    // 10-digit Indian mobile number (XXXXXXXXXX)
    return '+91' + cleanNumber;
  } else if (cleanNumber.startsWith('+')) {
    // International format
    return cleanNumber;
  } else {
    // Default: assume it's an Indian number and add +91
    return '+91' + cleanNumber;
  }
}

/**
 * Save Anonymous Complaint to Firebase
 * Developer: Gebin George
 */
async function saveAnonymousComplaint(complaintData) {
  try {
    if (!db) {
      throw new Error('Firebase not initialized - Contact developer Gebin George');
    }

    // Enhanced phone number formatting
    const formattedPhone = formatWhatsAppPhoneNumber(complaintData.studentPhone);

    const complaint = {
      title: complaintData.title || 'Anonymous Complaint',
      description: complaintData.description,
      category: complaintData.category || 'General',
      severity: complaintData.severity || 'Medium',
      studentPhone: formattedPhone, // Hidden field for potential follow-up
      status: 'Pending',
      isResolved: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      source: 'whatsapp_bot'
    };

    const docRef = await db.collection('anonymousComplaints').add(complaint);
    
    console.log(`✅ Anonymous complaint saved with ID: ${docRef.id} (Developer: Gebin George)`);
    
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
 * Save Department Complaint to match website's Firebase structure
 */
async function saveDepartmentComplaint(complaintData) {
  try {
    if (!db) {
      throw new Error('Firebase not initialized');
    }

    // Enhanced phone number formatting
    const formattedPhone = formatWhatsAppPhoneNumber(complaintData.studentPhone);

    // Structure the complaint to match the DepartmentComplaint interface exactly
    const complaint = {
      studentId: formattedPhone, // Use phone as studentId since we don't have user ID
      studentName: complaintData.studentName,
      studentEmail: `student.${Date.now()}@christ.edu.in`, // Generate placeholder email
      studentPhone: formattedPhone, // Add this field for contact
      departmentId: complaintData.departmentId || 'unknown',
      department: complaintData.department, // Keep department name for compatibility
      category: complaintData.category,
      severity: complaintData.severity || 'Medium',
      title: complaintData.title || `${complaintData.category} - ${complaintData.department}`,
      description: complaintData.description,
      status: 'Pending',
      isResolved: false,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      source: complaintData.source || 'whatsapp_bot'
    };

    // Save to the same collection used by the website
    const docRef = await db.collection('departmentComplaints').add(complaint);
    
    console.log(`✅ Department complaint saved with ID: ${docRef.id}`);
    
    return {
      id: docRef.id,
      ...complaint
    };
  } catch (error) {
    console.error('❌ Error saving department complaint:', error);
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

/**
 * Send WhatsApp notification when complaint status is updated
 */
async function sendComplaintStatusNotification(studentPhone, complaintDetails, newStatus, notes) {
  try {
    if (!studentPhone) return;

    // Import WhatsApp service
    const whatsappService = require('../services/whatsappService');
    
    // Enhanced phone number formatting
    const formattedPhone = formatWhatsAppPhoneNumber(studentPhone);
    if (!formattedPhone) {
      console.log('❌ Invalid phone number for notification:', studentPhone);
      return;
    }

    const statusEmoji = {
      'Pending': '🕐',
      'Under Review': '👁️',
      'In Review': '👁️',
      'In Progress': '⚙️',
      'Resolved': '✅',
      'Closed': '🔒'
    };

    const message = `*📢 Complaint Status Update*

Your complaint has been updated:

*Status:* ${statusEmoji[newStatus] || '📝'} ${newStatus}
*Department:* ${complaintDetails.department || 'Anonymous'}
*Category:* ${complaintDetails.category || 'General'}
${complaintDetails.title ? `*Issue:* ${complaintDetails.title}\n` : ''}
${notes ? `*Update Notes:*\n${notes}\n\n` : ''}*Next Steps:*
${newStatus === 'Resolved' 
  ? '• Your complaint has been resolved\n• Thank you for bringing this to our attention\n• You may contact the department if you need further assistance' 
  : newStatus === 'Under Review' || newStatus === 'In Review'
    ? '• Your complaint is being reviewed by the department head\n• You will receive further updates as progress is made\n• Expected response within 2-3 business days'
    : newStatus === 'In Progress'
      ? '• Action is being taken to address your complaint\n• You will be notified once the issue is resolved\n• Thank you for your patience'
      : '• Your complaint is in the queue for review\n• You will receive updates as progress is made'}

Thank you for using the Christ University Student Wellness Support System.

Type 'menu' to access other services.`;

    await whatsappService.sendTextMessage(formattedPhone, message);
    console.log(`✅ Status notification sent to ${formattedPhone} for complaint status: ${newStatus}`);
    
  } catch (error) {
    console.error('❌ Error sending complaint status notification:', error);
    // Don't throw error to avoid blocking the status update
  }
}

module.exports = { 
  initializeFirebase, 
  saveAnonymousComplaint, 
  saveCounselorRequest,
  saveDepartmentComplaint,
  sendComplaintStatusNotification,
  getSystemStats,
  checkFirebaseHealth,
  // Developer attribution
  developer: 'Gebin George',
  version: '1.0.0',
  description: 'Christ University Student Wellness WhatsApp Bot Firebase Integration'
}; 