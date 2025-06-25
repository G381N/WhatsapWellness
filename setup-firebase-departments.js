const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (admin.apps.length === 0) {
  try {
    // Try to use environment variables first
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      console.log('🔧 Initializing Firebase Admin with environment variables...');
      admin.initializeApp({
        credential: admin.credential.cert({
          type: "service_account",
          project_id: process.env.FIREBASE_PROJECT_ID,
          private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
          private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          client_email: process.env.FIREBASE_CLIENT_EMAIL,
          client_id: process.env.FIREBASE_CLIENT_ID,
          auth_uri: "https://accounts.google.com/o/oauth2/auth",
          token_uri: "https://oauth2.googleapis.com/token",
          auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
          client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL)}`
        }),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    } else {
      // Fallback to JSON file
      console.log('🔧 Using local service account file...');
      const serviceAccount = require('./firebaseServiceAccount.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
    }
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.firestore();

// Department data - SAFE: All use your phone number
const departments = [
  {
    id: 'dept_cs',
    name: 'Computer Science & Engineering',
    description: 'Software development, algorithms, and computing systems',
    category: 'Engineering',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_ece',
    name: 'Electronics & Communication',
    description: 'Electronics, telecommunications, and signal processing',
    category: 'Engineering',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_mech',
    name: 'Mechanical Engineering',
    description: 'Design, manufacturing, and mechanical systems',
    category: 'Engineering',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_civil',
    name: 'Civil Engineering',
    description: 'Construction, infrastructure, and structural engineering',
    category: 'Engineering',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_bba',
    name: 'Business Administration',
    description: 'Management, leadership, and business strategy',
    category: 'Business',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_bcom',
    name: 'Commerce',
    description: 'Accounting, finance, and commercial studies',
    category: 'Business',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_nursing',
    name: 'Nursing',
    description: 'Healthcare, patient care, and medical assistance',
    category: 'Health Sciences',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_psychology',
    name: 'Psychology',
    description: 'Human behavior, mental health, and counseling',
    category: 'Liberal Arts',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_social_work',
    name: 'Social Work',
    description: 'Community service, social welfare, and advocacy',
    category: 'Liberal Arts',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  },
  {
    id: 'dept_law',
    name: 'Law',
    description: 'Legal studies, jurisprudence, and legal practice',
    category: 'Liberal Arts',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  }
];

// Department heads data - ALL SAFE: Using your phone number +919741301245
const departmentHeads = [
  {
    id: 'head_cs',
    departmentId: 'dept_cs',
    name: 'Dr. Rajesh Kumar',
    email: 'hod.cse@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Block A, Room 301',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_ece',
    departmentId: 'dept_ece',
    name: 'Dr. Priya Sharma',
    email: 'hod.ece@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Block B, Room 201',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_mech',
    departmentId: 'dept_mech',
    name: 'Dr. Suresh Nair',
    email: 'hod.mech@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Block C, Room 101',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_civil',
    departmentId: 'dept_civil',
    name: 'Dr. Meera Reddy',
    email: 'hod.civil@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Block D, Room 205',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_bba',
    departmentId: 'dept_bba',
    name: 'Dr. Arun Gupta',
    email: 'hod.bba@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Management Block, Room 301',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_bcom',
    departmentId: 'dept_bcom',
    name: 'Dr. Kavitha Menon',
    email: 'hod.bcom@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Commerce Block, Room 201',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_nursing',
    departmentId: 'dept_nursing',
    name: 'Dr. Sunita Thomas',
    email: 'hod.nursing@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Health Sciences Block, Room 101',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_psychology',
    departmentId: 'dept_psychology',
    name: 'Dr. Rohit Joshi',
    email: 'hod.psychology@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Liberal Arts Block, Room 302',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_social_work',
    departmentId: 'dept_social_work',
    name: 'Dr. Anjali Verma',
    email: 'hod.socialwork@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Liberal Arts Block, Room 201',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  },
  {
    id: 'head_law',
    departmentId: 'dept_law',
    name: 'Dr. Vikram Singh',
    email: 'hod.law@christuniversity.in',
    phoneNumber: '+919741301245', // YOUR NUMBER
    office: 'Law Block, Room 401',
    isActive: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    notes: 'Test contact - All notifications will go to system admin'
  }
];

async function setupFirebaseCollections() {
  try {
    console.log('🚀 Starting Firebase collections setup...');
    
    // Setup departments collection
    console.log('📋 Setting up departments collection...');
    const batch = db.batch();
    
    // Add departments
    departments.forEach((dept) => {
      const { id, ...deptData } = dept;
      const deptRef = db.collection('departments').doc(id);
      batch.set(deptRef, deptData);
    });
    
    // Add department heads
    console.log('👥 Setting up department heads collection...');
    departmentHeads.forEach((head) => {
      const { id, ...headData } = head;
      const headRef = db.collection('departmentHeads').doc(id);
      batch.set(headRef, headData);
    });
    
    // Commit the batch
    await batch.commit();
    
    console.log('✅ Successfully created Firebase collections:');
    console.log(`   📋 Departments: ${departments.length} records`);
    console.log(`   👥 Department Heads: ${departmentHeads.length} records`);
    console.log('');
    console.log('🔒 SAFETY CONFIRMED:');
    console.log('   📱 All department heads use phone number: +919741301245');
    console.log('   ✅ No random phone numbers - safe for testing');
    console.log('');
    console.log('📝 How to manage:');
    console.log('   1. Access Firebase Console: https://console.firebase.google.com');
    console.log('   2. Go to Firestore Database');
    console.log('   3. Edit collections: "departments" and "departmentHeads"');
    console.log('   4. Update phone numbers when ready for production');
    console.log('');
    console.log('🎯 Collections created:');
    console.log('   - departments (department info)');
    console.log('   - departmentHeads (contact details)');
    
  } catch (error) {
    console.error('❌ Error setting up Firebase collections:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  setupFirebaseCollections()
    .then(() => {
      console.log('🎉 Firebase setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupFirebaseCollections }; 