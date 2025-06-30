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
async function initializeFirebase() {
  try {
    if (admin.apps.length === 0) {
      const serviceAccount = {
        type: process.env.FIREBASE_TYPE,
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: process.env.FIREBASE_AUTH_URI,
        token_uri: process.env.FIREBASE_TOKEN_URI,
        auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com/`
      });

      console.log('✅ Firebase Admin SDK initialized successfully by Gebin George');
    }

    db = admin.firestore();
    
    // Initialize departments collection if it doesn't exist
    await initializeDepartments();
    
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization failed (Developer: Gebin George):', error);
    throw error;
  }
}

/**
 * Initialize departments collection with default departments
 * Developer: Gebin George
 */
async function initializeDepartments() {
  try {
    const departmentsRef = db.collection('departments');
    const snapshot = await departmentsRef.get();
    
    if (snapshot.empty) {
      console.log('🔧 Initializing departments collection...');
      
      const defaultDepartments = [
        {
          name: 'MCA - Master of Computer Applications',
          code: 'MCA',
          headPhoneNumber: '+919741301245',
          isActive: true,
          createdBy: 'Gebin George',
          createdAt: admin.firestore.Timestamp.now()
        },
        {
          name: 'MSC AIML - MSc Artificial Intelligence & Machine Learning',
          code: 'MSC_AIML',
          headPhoneNumber: '+919741301245',
          isActive: true,
          createdBy: 'Gebin George',
          createdAt: admin.firestore.Timestamp.now()
        }
      ];

      for (const dept of defaultDepartments) {
        await departmentsRef.add(dept);
      }
      
      console.log('✅ Departments collection initialized by Gebin George');
    }
  } catch (error) {
    console.error('❌ Error initializing departments (Developer: Gebin George):', error);
  }
}

/**
 * Get all active departments from Firebase
 * Developer: Gebin George
 */
async function getDepartments() {
  try {
    if (!db) {
      throw new Error('Firebase not initialized - Contact developer Gebin George');
    }

    const departmentsRef = db.collection('departments');
    const snapshot = await departmentsRef.where('isActive', '==', true).get();
    
    const departments = [];
    snapshot.forEach(doc => {
      departments.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Retrieved ${departments.length} departments by Gebin George`);
    return departments;
  } catch (error) {
    console.error('❌ Error fetching departments (Developer: Gebin George):', error);
    throw error;
  }
}

/**
 * Get department head phone number by department code
 * Developer: Gebin George
 */
async function getDepartmentHeadPhone(departmentCode) {
  try {
    if (!db) {
      throw new Error('Firebase not initialized - Contact developer Gebin George');
    }

    const departmentsRef = db.collection('departments');
    const snapshot = await departmentsRef.where('code', '==', departmentCode).where('isActive', '==', true).get();
    
    if (snapshot.empty) {
      console.log(`⚠️ Department not found: ${departmentCode}`);
      return '+919741301245'; // Default admin phone
    }

    const dept = snapshot.docs[0].data();
    return dept.headPhoneNumber;
  } catch (error) {
    console.error('❌ Error fetching department head phone (Developer: Gebin George):', error);
    return '+919741301245'; // Default admin phone
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
 * Save Department Complaint with dynamic department head notification
 * Developer: Gebin George
 */
async function saveDepartmentComplaint(complaintData) {
  try {
    if (!db) {
      throw new Error('Firebase not initialized - Contact developer Gebin George');
    }

    // Get department head phone number
    const headPhoneNumber = await getDepartmentHeadPhone(complaintData.departmentCode);

    const complaint = {
      ...complaintData,
      timestamp: admin.firestore.Timestamp.now(),
      status: 'submitted',
      source: 'whatsapp_bot',
      notificationSent: true,
      notificationPhone: headPhoneNumber,
      developerNote: 'Submitted via WhatsApp Bot - Developed by Gebin George'
    };

    const docRef = await db.collection('departmentComplaints').add(complaint);
    
    console.log(`✅ Department complaint saved by Gebin George: ${docRef.id}`);
    
    return {
      id: docRef.id,
      headPhoneNumber: headPhoneNumber,
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
  getDepartments,
  getDepartmentHeadPhone,
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