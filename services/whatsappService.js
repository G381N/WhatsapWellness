const axios = require('axios');
const admin = require('firebase-admin');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Initialize Firebase Admin (if not already initialized)
let db = null;
if (admin.apps.length === 0) {
  try {
    // Try to use environment variables first (for production deployment)
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
      console.log('✅ Firebase Admin initialized successfully with environment variables');
      db = admin.firestore();
    } else {
      // Fallback to JSON file for local development
      console.log('🔧 Attempting to use local service account file...');
      const serviceAccount = require('../firebaseServiceAccount.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      console.log('✅ Firebase Admin initialized successfully with service account file');
      db = admin.firestore();
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.log('⚠️ Running in demo mode without Firebase connectivity');
    // db remains null - service will work in demo mode
  }
} else {
  // If Firebase is already initialized
  try {
    db = admin.firestore();
    console.log('✅ Using existing Firebase Admin instance');
  } catch (error) {
    console.log('⚠️ Firebase not available, running in demo mode');
  }
}

class WhatsAppService {
  constructor() {
    this.baseURL = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
    this.headers = {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
    this.conversationStates = new Map();
    this.departmentMapping = new Map();
    this.loadDepartmentsFromFirebase();
  }

  // =================== CORE MESSAGING METHODS ===================

  async sendTextMessage(to, message) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'text',
        text: {
          body: message
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log(`✅ Text message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending text message:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendButtonMessage(to, message, buttons) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: message
          },
          action: {
            buttons: buttons.map((button, index) => ({
              type: 'reply',
              reply: {
                id: button.id,
                title: button.title
              }
            }))
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log(`✅ Button message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending button message:', error.response?.data || error.message);
      // Fallback to text message
      const buttonText = buttons.map((btn, index) => `${index + 1}. ${btn.title}`).join('\n');
      await this.sendTextMessage(to, `${message}\n\n${buttonText}`);
    }
  }

  async sendListMessage(to, message, buttonText, sections) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: message
          },
          action: {
            button: buttonText,
            sections: sections
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log(`✅ List message sent to ${to}`);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending list message:', error.response?.data || error.message);
      // Fallback to text message
      let fallbackText = message + '\n\n';
      sections.forEach(section => {
        fallbackText += `*${section.title}:*\n`;
        section.rows.forEach((row, index) => {
          fallbackText += `${index + 1}. ${row.title}\n`;
        });
        fallbackText += '\n';
      });
      await this.sendTextMessage(to, fallbackText);
    }
  }

  // =================== WELCOME & MENU MESSAGES ===================

  async sendWelcomeMessage(to, userName) {
    const welcomeText = `🎓 *Welcome to Christ University Student Wellness Portal*

Hello ${userName || 'Student'}! 

Our portal offers support for:
🧠 Mental Health Support
📝 Anonymous Complaints  
🏛️ Department Complaints
👥 Community Connect

What would you like to do today?`;

    const buttons = [
      { id: 'counseling', title: '🧠 Counseling' },
      { id: 'anonymous', title: '📝 Anonymous' },
      { id: 'department', title: '🏛️ Department' }
    ];

    await this.sendButtonMessage(to, welcomeText, buttons);
  }

  async sendMainMenu(to) {
    const menuText = `🎓 *Christ University Wellness Portal*

Select a service:`;

    const buttons = [
      { id: 'counseling', title: '🧠 Counseling' },
      { id: 'anonymous', title: '📝 Anonymous' },
      { id: 'department', title: '🏛️ Department' }
    ];

    await this.sendButtonMessage(to, menuText, buttons);
  }

  // =================== DEPARTMENT MANAGEMENT ===================

  loadDefaultDepartments() {
    console.log('⚠️ Using fallback departments...');
    const defaultDepartments = [
      { id: 'dept_cs', name: 'Computer Science', category: 'Engineering' },
      { id: 'dept_ece', name: 'Electronics & Comm', category: 'Engineering' },
      { id: 'dept_mech', name: 'Mechanical Eng', category: 'Engineering' },
      { id: 'dept_civil', name: 'Civil Engineering', category: 'Engineering' },
      { id: 'dept_bba', name: 'Business Admin', category: 'Business' },
      { id: 'dept_bcom', name: 'Commerce', category: 'Business' },
      { id: 'dept_nursing', name: 'Nursing', category: 'Health Sciences' },
      { id: 'dept_pharmacy', name: 'Pharmacy', category: 'Health Sciences' },
      { id: 'dept_psychology', name: 'Psychology', category: 'Liberal Arts' },
      { id: 'dept_english', name: 'English Literature', category: 'Liberal Arts' }
    ];

    this.departmentMapping.clear();
    defaultDepartments.forEach(dept => {
      this.departmentMapping.set(dept.id, dept);
    });
  }

  async loadDepartmentsFromFirebase() {
    try {
      console.log('📋 Loading departments from Firebase...');
      
      if (!db) {
        console.log('⚠️ Firebase not available, using fallback departments');
        this.loadDefaultDepartments();
        return;
      }
      
      // Simplified query without ordering to avoid index requirement
      const departmentsSnapshot = await db.collection('departments')
        .where('isActive', '==', true)
        .get();

      this.departmentMapping.clear();
      
      departmentsSnapshot.forEach((doc) => {
        const department = doc.data();
        this.departmentMapping.set(doc.id, {
          id: doc.id,
          name: department.name,
          description: department.description,
          category: department.category
        });
      });

      console.log(`✅ Loaded ${this.departmentMapping.size} departments from Firebase`);
      
      // Fallback to default if no departments found
      if (this.departmentMapping.size === 0) {
        this.loadDefaultDepartments();
      }
    } catch (error) {
      console.error('❌ Error loading departments from Firebase:', error);
      this.loadDefaultDepartments();
    }
  }

  async sendDepartmentSelection(to) {
    // Always use hardcoded departments for now to avoid Firebase issues
    this.loadDefaultDepartments();

    const message = `🏛️ *Select Your Department*

Please choose your department:`;

    // Create simple sections with shorter names
    const sections = [
      {
        title: "Engineering",
        rows: [
          { id: 'dept_cs', title: 'Computer Science', description: 'CS & IT Department' },
          { id: 'dept_ece', title: 'Electronics', description: 'ECE Department' },
          { id: 'dept_mech', title: 'Mechanical', description: 'Mechanical Engineering' },
          { id: 'dept_civil', title: 'Civil', description: 'Civil Engineering' }
        ]
      },
      {
        title: "Business & Others",
        rows: [
          { id: 'dept_bba', title: 'Business Admin', description: 'BBA Department' },
          { id: 'dept_bcom', title: 'Commerce', description: 'B.Com Department' },
          { id: 'dept_nursing', title: 'Nursing', description: 'Nursing Department' },
          { id: 'dept_psychology', title: 'Psychology', description: 'Psychology Department' }
        ]
      }
    ];

    await this.sendListMessage(to, message, "Choose Department", sections);
  }

  getDepartmentName(departmentId) {
    const department = this.departmentMapping.get(departmentId);
    return department ? department.name : 'Unknown Department';
  }

  // =================== COMPLAINT CATEGORIES ===================

  async sendComplaintCategorySelection(to) {
    const message = `📝 *Select Complaint Category*

Choose the category that best describes your complaint:`;

    const sections = [
      {
        title: "Academic Issues",
        rows: [
          { id: 'cat_1', title: 'Course Content', description: 'Course structure issues' },
          { id: 'cat_2', title: 'Teaching Methods', description: 'Faculty teaching concerns' },
          { id: 'cat_3', title: 'Grading Issues', description: 'Assessment concerns' },
          { id: 'cat_4', title: 'Scheduling', description: 'Timetable issues' }
        ]
      },
      {
        title: "Infrastructure",
        rows: [
          { id: 'cat_5', title: 'Classrooms', description: 'Classroom facilities' },
          { id: 'cat_6', title: 'Lab Equipment', description: 'Laboratory issues' },
          { id: 'cat_7', title: 'Library', description: 'Library services' },
          { id: 'cat_8', title: 'IT & Internet', description: 'Technology issues' }
        ]
      },
      {
        title: "Other Issues",
        rows: [
          { id: 'cat_9', title: 'Administration', description: 'Admin processes' },
          { id: 'cat_10', title: 'Student Support', description: 'Support services' },
          { id: 'cat_11', title: 'Hostel', description: 'Accommodation issues' },
          { id: 'cat_12', title: 'Other', description: 'Other concerns' }
        ]
      }
    ];

    await this.sendListMessage(to, message, "Choose Category", sections);
  }

  getCategoryName(categoryId) {
    const categories = {
      'cat_1': 'Course Content & Curriculum',
      'cat_2': 'Faculty Teaching Methods', 
      'cat_3': 'Assessment & Grading',
      'cat_4': 'Academic Scheduling',
      'cat_5': 'Classroom Facilities',
      'cat_6': 'Laboratory Equipment',
      'cat_7': 'Library Services',
      'cat_8': 'Internet & Technology',
      'cat_9': 'Administrative Processes',
      'cat_10': 'Student Support Services',
      'cat_11': 'Hostel & Accommodation',
      'cat_12': 'Other Issues'
    };
    return categories[categoryId] || 'Unknown Category';
  }

  // =================== SEVERITY SELECTION ===================

  async sendSeveritySelection(to) {
    const message = `⚠️ *Select Priority Level*

How urgent is this issue?`;

    const sections = [
      {
        title: "Priority Levels",
        rows: [
          { id: 'sev_1', title: 'Low Priority', description: 'Minor issue, can wait' },
          { id: 'sev_2', title: 'Medium Priority', description: 'Needs attention this week' },
          { id: 'sev_3', title: 'High Priority', description: 'Significant impact' },
          { id: 'sev_4', title: 'Critical', description: 'Urgent, immediate attention' }
        ]
      }
    ];

    await this.sendListMessage(to, message, "Choose Priority", sections);
  }

  getSeverityName(severityId) {
    const severities = {
      'sev_1': 'Low',
      'sev_2': 'Medium', 
      'sev_3': 'High',
      'sev_4': 'Critical'
    };
    return severities[severityId] || 'Medium';
  }

  // =================== UTILITY METHODS ===================

  async initialize() {
    console.log('🚀 Initializing WhatsApp Service...');
    await this.loadDepartmentsFromFirebase();
    console.log('✅ WhatsApp Service initialized successfully');
  }

  getStats() {
    return {
      departmentsLoaded: this.departmentMapping.size,
      firebaseConnected: !!db
    };
  }
}

// Create and export instance
const whatsappServiceInstance = new WhatsAppService();
module.exports = whatsappServiceInstance; 