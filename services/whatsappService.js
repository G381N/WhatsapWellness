const axios = require('axios');
const admin = require('firebase-admin');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

// Initialize Firebase Admin (if not already initialized)
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
    } else {
      // Fallback to JSON file for local development
      console.log('🔧 Attempting to use local service account file...');
      const serviceAccount = require('../firebaseServiceAccount.json');
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIREBASE_DATABASE_URL
      });
      console.log('✅ Firebase Admin initialized successfully with service account file');
    }
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.log('⚠️ Running in demo mode without Firebase connectivity');
    // Continue without Firebase for demo purposes
  }
}

const db = admin.firestore ? admin.firestore() : null;

class WhatsAppService {
  constructor() {
    this.baseURL = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
    this.headers = {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
    this.conversationStates = new Map();
    this.departmentMapping = new Map(); // Cache for department data
    this.loadDepartmentsFromFirebase(); // Load departments on startup
  }

  // =================== DEPARTMENT MANAGEMENT ===================

  // Load departments from Firebase and cache them
  async loadDepartmentsFromFirebase() {
    try {
      console.log('📋 Loading departments from Firebase...');
      
      // Check if Firebase is available
      if (!db) {
        console.log('⚠️ Firebase not available, using fallback departments');
        this.loadDefaultDepartments();
        return;
      }
      
      const departmentsSnapshot = await db.collection('departments')
        .where('isActive', '==', true)
        .orderBy('name')
        .get();

      this.departmentMapping.clear();
      
      departmentsSnapshot.forEach((doc) => {
        const department = doc.data();
        this.departmentMapping.set(doc.id, {
          id: doc.id,
          name: department.name,
          description: department.description,
          category: department.category,
          hodPhone: department.hodPhone
        });
      });

      console.log(`✅ Loaded ${this.departmentMapping.size} departments from Firebase`);
    } catch (error) {
      console.error('❌ Error loading departments from Firebase:', error);
      // Fallback to default departments if Firebase fails
      this.loadDefaultDepartments();
    }
  }

  // Fallback department data
  loadDefaultDepartments() {
    console.log('⚠️ Using fallback departments...');
    const defaultDepartments = [
      { id: 'cs', name: 'Computer Science & Engineering', category: 'Engineering', hodPhone: '+91XXXXXXXXXX' },
      { id: 'ece', name: 'Electronics & Communication Engineering', category: 'Engineering', hodPhone: '+91XXXXXXXXXX' },
      { id: 'mech', name: 'Mechanical Engineering', category: 'Engineering', hodPhone: '+91XXXXXXXXXX' },
      { id: 'civil', name: 'Civil Engineering', category: 'Engineering', hodPhone: '+91XXXXXXXXXX' },
      { id: 'bba', name: 'Bachelor of Business Administration', category: 'Business & Commerce', hodPhone: '+91XXXXXXXXXX' },
      { id: 'bcom', name: 'Bachelor of Commerce', category: 'Business & Commerce', hodPhone: '+91XXXXXXXXXX' },
      { id: 'nursing', name: 'Nursing', category: 'Health Sciences', hodPhone: '+91XXXXXXXXXX' },
      { id: 'pharmacy', name: 'Pharmacy', category: 'Health Sciences', hodPhone: '+91XXXXXXXXXX' },
      { id: 'psychology', name: 'Psychology', category: 'Liberal Arts', hodPhone: '+91XXXXXXXXXX' },
      { id: 'english', name: 'English Literature', category: 'Liberal Arts', hodPhone: '+91XXXXXXXXXX' }
    ];

    this.departmentMapping.clear();
    defaultDepartments.forEach(dept => {
      this.departmentMapping.set(dept.id, dept);
    });
  }

  // Refresh departments from Firebase (can be called periodically)
  async refreshDepartments() {
    await this.loadDepartmentsFromFirebase();
  }

  // =================== CONVERSATION STATE MANAGEMENT ===================

  setConversationState(phoneNumber, state, data = {}) {
    this.conversationStates.set(phoneNumber, {
      state,
      data,
      timestamp: Date.now()
    });
  }

  getConversationState(phoneNumber) {
    return this.conversationStates.get(phoneNumber);
  }

  clearConversationState(phoneNumber) {
    this.conversationStates.delete(phoneNumber);
  }

  // Clean up old conversation states (older than 30 minutes)
  cleanupOldStates() {
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    for (const [phoneNumber, state] of this.conversationStates.entries()) {
      if (state.timestamp < thirtyMinutesAgo) {
        this.conversationStates.delete(phoneNumber);
      }
    }
  }

  // =================== COMPLAINT SUBMISSION WORKFLOW ===================

  // Send welcome message and complaint type selection
  sendWelcomeMessage() {
    return `🎓 *Welcome to Christ University Student Wellness Portal* 📱

Hello! I'm here to help you submit complaints and concerns. Please choose how you'd like to proceed:

*1️⃣ Submit Anonymous Complaint*
• Your identity will remain completely anonymous
• Perfect for sensitive issues
• Two-way communication without revealing your identity

*2️⃣ Submit Department-Specific Complaint*
• Direct complaint to your specific department
• Department Head will review and respond
• Tracked complaint with status updates

*3️⃣ Get Help*
• Learn more about the complaint process
• Contact information for urgent matters

Please reply with *1*, *2*, or *3* to continue.`;
  }

  // Send department selection with dynamic loading
  async sendDepartmentSelection() {
    // Refresh departments from Firebase to get latest data
    await this.refreshDepartments();

    let message = `🏛️ *Select Your Department* 📋

Please choose your department from the list below:

`;

    // Group departments by category
    const categories = {
      'Engineering': [],
      'Business & Commerce': [],
      'Health Sciences': [],
      'Liberal Arts': []
    };

    // Populate categories
    for (const [id, dept] of this.departmentMapping.entries()) {
      if (categories[dept.category]) {
        categories[dept.category].push({ id, ...dept });
      }
    }

    // Build message with categorized departments
    let rowNumber = 1;
    for (const [category, departments] of Object.entries(categories)) {
      if (departments.length > 0) {
        message += `\n*${category}:*\n`;
        departments.forEach(dept => {
          message += `${rowNumber}️⃣ ${dept.name}\n`;
          rowNumber++;
        });
      }
    }

    message += `\nPlease reply with the number corresponding to your department (1-${rowNumber - 1}).`;
    
    return message;
  }

  // Get department by row number
  getDepartmentByRowNumber(rowNumber) {
    const departments = Array.from(this.departmentMapping.values());
    return departments[rowNumber - 1] || null;
  }

  // Send complaint category selection
  sendComplaintCategorySelection() {
    return `📝 *Select Complaint Category* 🎯

Please choose the category that best describes your complaint:

*Academic Issues:*
1️⃣ Course Content & Curriculum
2️⃣ Faculty Teaching Methods
3️⃣ Assessment & Grading
4️⃣ Academic Scheduling

*Infrastructure & Services:*
5️⃣ Classroom Facilities
6️⃣ Laboratory Equipment
7️⃣ Library Services
8️⃣ Internet & Technology

*Administrative & Others:*
9️⃣ Administrative Processes
🔟 Student Support Services
1️⃣1️⃣ Hostel & Accommodation
1️⃣2️⃣ Other Issues

Please reply with the number (1-12) that matches your complaint category.`;
  }

  // Send severity selection
  sendSeveritySelection() {
    return `⚠️ *Select Priority Level* 🎯

How urgent is this issue?

1️⃣ *Low Priority*
   • Minor inconvenience
   • Can wait for resolution
   • Non-urgent matter

2️⃣ *Medium Priority*
   • Moderate impact on studies
   • Needs attention within a week
   • Standard complaint

3️⃣ *High Priority*
   • Significant impact on academics
   • Requires prompt attention
   • Important matter

4️⃣ *Critical Priority*
   • Urgent issue affecting studies
   • Immediate attention required
   • Emergency complaint

Please reply with the number (1-4) that represents the urgency of your complaint.`;
  }

  // =================== DATA MAPPING FUNCTIONS ===================

  getDepartmentName(departmentId) {
    const department = this.departmentMapping.get(departmentId);
    return department ? department.name : 'Unknown Department';
  }

  getCategoryName(categoryId) {
    const categories = {
      '1': 'Course Content & Curriculum',
      '2': 'Faculty Teaching Methods', 
      '3': 'Assessment & Grading',
      '4': 'Academic Scheduling',
      '5': 'Classroom Facilities',
      '6': 'Laboratory Equipment',
      '7': 'Library Services',
      '8': 'Internet & Technology',
      '9': 'Administrative Processes',
      '10': 'Student Support Services',
      '11': 'Hostel & Accommodation',
      '12': 'Other Issues'
    };
    return categories[categoryId] || 'Unknown Category';
  }

  getSeverityName(severityId) {
    const severities = {
      '1': 'Low',
      '2': 'Medium', 
      '3': 'High',
      '4': 'Critical'
    };
    return severities[severityId] || 'Medium';
  }

  // =================== FIREBASE OPERATIONS ===================

  // Submit department complaint to Firebase
  async submitDepartmentComplaint(complaintData) {
    try {
      console.log('📝 Submitting department complaint to Firebase...');
      
      // Check if Firebase is available
      if (!db) {
        console.log('⚠️ Firebase not available - complaint logged locally');
        // In production, you might want to queue this for later processing
        const mockId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('📋 Local complaint logged:', complaintData);
        return mockId;
      }
      
      const complaint = {
        title: complaintData.title,
        description: complaintData.description,
        category: complaintData.category,
        department: complaintData.departmentName,
        departmentId: complaintData.departmentId,
        severity: complaintData.severity,
        status: 'Open',
        resolved: false,
        studentName: complaintData.studentName,
        studentPhone: complaintData.studentPhone,
        source: 'whatsapp_bot',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
      };

      const docRef = await db.collection('departmentComplaints').add(complaint);
      console.log('✅ Department complaint submitted with ID:', docRef.id);
      
      // Notify department head if phone number is available
      await this.notifyDepartmentHead(complaintData.departmentId, complaint, docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error submitting department complaint:', error);
      throw error;
    }
  }

  // Submit anonymous complaint to Firebase
  async submitAnonymousComplaint(complaintData) {
    try {
      console.log('🔒 Submitting anonymous complaint to Firebase...');
      
      // Check if Firebase is available
      if (!db) {
        console.log('⚠️ Firebase not available - complaint logged locally');
        const mockId = `anon_local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('📋 Local anonymous complaint logged:', {
          ...complaintData,
          studentPhone: '[HIDDEN]' // Don't log the actual phone number
        });
        return mockId;
      }
      
      const complaint = {
        title: complaintData.title,
        description: complaintData.description,
        category: complaintData.category,
        severity: complaintData.severity,
        status: 'Open',
        resolved: false,
        source: 'whatsapp_bot',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        // Hidden fields for response tracking
        _studentPhone: complaintData.studentPhone,
        _responseTrackingId: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      const docRef = await db.collection('anonymousComplaints').add(complaint);
      console.log('✅ Anonymous complaint submitted with ID:', docRef.id);
      
      return docRef.id;
    } catch (error) {
      console.error('❌ Error submitting anonymous complaint:', error);
      throw error;
    }
  }

  // =================== NOTIFICATION SYSTEM ===================

  // Notify department head about new complaint
  async notifyDepartmentHead(departmentId, complaint, complaintId) {
    try {
      const department = this.departmentMapping.get(departmentId);
      if (department && department.hodPhone) {
        const message = `🚨 *New Department Complaint* 📋

*Department:* ${department.name}
*Category:* ${complaint.category}
*Severity:* ${complaint.severity}
*Student:* ${complaint.studentName}

*Title:* ${complaint.title}

*Description:* ${complaint.description}

*Complaint ID:* ${complaintId}

Please log into the admin portal to review and respond to this complaint.

🌐 *Admin Portal:* ${process.env.ADMIN_PORTAL_URL || 'https://yourdomainhere.com/dashboard'}`;

        // Here you would integrate with your WhatsApp API to send message
        console.log(`📱 Would notify HOD at ${department.hodPhone}:`, message);
        
        // TODO: Implement actual WhatsApp API call
        // await this.sendWhatsAppMessage(department.hodPhone, message);
      }
    } catch (error) {
      console.error('❌ Error notifying department head:', error);
    }
  }

  // Send status update to student
  async sendStatusUpdateToStudent(phoneNumber, complaint, newStatus, notes = '') {
    try {
      let message = `📢 *Complaint Status Update* ✅\n\n`;
      
      if (complaint.title) {
        message += `*Complaint:* ${complaint.title}\n`;
      }
      
      message += `*Previous Status:* ${complaint.status || 'Open'}\n`;
      message += `*New Status:* ${newStatus}\n`;
      
      if (notes) {
        message += `\n*Update Notes:*\n${notes}\n`;
      }
      
      message += `\n*Updated:* ${new Date().toLocaleString('en-IN')}\n`;
      
      if (newStatus === 'Resolved' || newStatus === 'Closed') {
        message += `\n✅ *This complaint has been ${newStatus.toLowerCase()}.*`;
        if (newStatus === 'Resolved') {
          message += `\n\nIf you're not satisfied with the resolution, please submit a new complaint or contact the administration directly.`;
        }
      } else {
        message += `\n⏳ *Your complaint is being processed.* You'll receive another update when the status changes.`;
      }
      
      message += `\n\n💬 Reply with "NEW" to submit a new complaint.`;

      console.log(`📱 Sending status update to ${phoneNumber}:`, message);
      
      // TODO: Implement actual WhatsApp API call
      // await this.sendWhatsAppMessage(phoneNumber, message);
      
      return message;
    } catch (error) {
      console.error('❌ Error sending status update:', error);
      throw error;
    }
  }

  // =================== FIREBASE LISTENERS ===================

  // Listen for complaint status changes and send notifications
  startComplaintStatusListener() {
    console.log('👂 Starting complaint status listeners...');

    // Check if Firebase is available
    if (!db) {
      console.log('⚠️ Firebase not available - status listeners disabled');
      return;
    }

    try {
      // Listen for department complaint updates
      const deptComplaintsRef = db.collection('departmentComplaints');
      deptComplaintsRef.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const complaint = change.doc.data();
            const complaintId = change.doc.id;
            
            if (complaint.studentPhone) {
              this.sendStatusUpdateToStudent(
                complaint.studentPhone,
                complaint,
                complaint.status,
                complaint.resolutionNotes || complaint.adminNotes || ''
              );
            }
          }
        });
      });

      // Listen for anonymous complaint updates
      const anonComplaintsRef = db.collection('anonymousComplaints');
      anonComplaintsRef.onSnapshot((snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'modified') {
            const complaint = change.doc.data();
            const complaintId = change.doc.id;
            
            if (complaint._studentPhone) {
              this.sendStatusUpdateToStudent(
                complaint._studentPhone,
                complaint,
                complaint.status,
                complaint.resolutionNotes || complaint.adminNotes || ''
              );
            }
          }
        });
      });

      console.log('✅ Complaint status listeners started');
    } catch (error) {
      console.error('❌ Error starting status listeners:', error);
    }
  }

  // =================== MESSAGE PROCESSING ===================

  // Process incoming WhatsApp message
  async processMessage(phoneNumber, message) {
    try {
      const messageText = message.trim().toLowerCase();
      const state = this.getConversationState(phoneNumber);

      // Clean up old states periodically
      if (Math.random() < 0.1) { // 10% chance to run cleanup
        this.cleanupOldStates();
      }

      // Handle "new" command to start fresh
      if (messageText === 'new' || messageText === 'start' || messageText === 'reset') {
        this.clearConversationState(phoneNumber);
        return this.sendWelcomeMessage();
      }

      // If no state, start with welcome message
      if (!state) {
        return this.sendWelcomeMessage();
      }

      // Process based on current state
      switch (state.state) {
        case 'waiting_for_complaint_type':
          return await this.handleComplaintTypeSelection(phoneNumber, messageText);
        
        case 'waiting_for_department':
          return await this.handleDepartmentSelection(phoneNumber, messageText);
        
        case 'waiting_for_category':
          return await this.handleCategorySelection(phoneNumber, messageText);
        
        case 'waiting_for_severity':
          return await this.handleSeveritySelection(phoneNumber, messageText);
        
        case 'waiting_for_title':
          return await this.handleTitleInput(phoneNumber, message.trim());
        
        case 'waiting_for_description':
          return await this.handleDescriptionInput(phoneNumber, message.trim());
        
        case 'waiting_for_student_name':
          return await this.handleStudentNameInput(phoneNumber, message.trim());
        
        default:
          this.clearConversationState(phoneNumber);
          return this.sendWelcomeMessage();
      }
    } catch (error) {
      console.error('❌ Error processing message:', error);
      this.clearConversationState(phoneNumber);
      return "❌ Sorry, there was an error processing your message. Please reply with 'NEW' to start again.";
    }
  }

  // =================== MESSAGE HANDLERS ===================

  async handleComplaintTypeSelection(phoneNumber, messageText) {
    switch (messageText) {
      case '1':
        this.setConversationState(phoneNumber, 'waiting_for_category', { type: 'anonymous' });
        return this.sendComplaintCategorySelection();
      
      case '2':
        this.setConversationState(phoneNumber, 'waiting_for_department', { type: 'department' });
        return await this.sendDepartmentSelection();
      
      case '3':
        return this.sendHelpMessage();
      
      default:
        return "❌ Invalid option. Please reply with 1, 2, or 3.";
    }
  }

  async handleDepartmentSelection(phoneNumber, messageText) {
    const rowNumber = parseInt(messageText);
    if (isNaN(rowNumber) || rowNumber < 1) {
      return "❌ Invalid department number. Please enter a valid number from the list.";
    }

    const department = this.getDepartmentByRowNumber(rowNumber);
    if (!department) {
      return "❌ Invalid department selection. Please choose a number from the list above.";
    }

    const currentState = this.getConversationState(phoneNumber);
    currentState.data.departmentId = department.id;
    currentState.data.departmentName = department.name;
    
    this.setConversationState(phoneNumber, 'waiting_for_category', currentState.data);
    return this.sendComplaintCategorySelection();
  }

  async handleCategorySelection(phoneNumber, messageText) {
    const categoryNumber = parseInt(messageText);
    if (isNaN(categoryNumber) || categoryNumber < 1 || categoryNumber > 12) {
      return "❌ Invalid category. Please enter a number between 1 and 12.";
    }

    const currentState = this.getConversationState(phoneNumber);
    currentState.data.categoryId = categoryNumber.toString();
    currentState.data.categoryName = this.getCategoryName(categoryNumber.toString());
    
    this.setConversationState(phoneNumber, 'waiting_for_severity', currentState.data);
    return this.sendSeveritySelection();
  }

  async handleSeveritySelection(phoneNumber, messageText) {
    const severityNumber = parseInt(messageText);
    if (isNaN(severityNumber) || severityNumber < 1 || severityNumber > 4) {
      return "❌ Invalid priority level. Please enter a number between 1 and 4.";
    }

    const currentState = this.getConversationState(phoneNumber);
    currentState.data.severityId = severityNumber.toString();
    currentState.data.severityName = this.getSeverityName(severityNumber.toString());
    
    this.setConversationState(phoneNumber, 'waiting_for_title', currentState.data);
    return "📝 *Enter Complaint Title* ✏️\n\nPlease provide a brief, clear title for your complaint (max 100 characters):";
  }

  async handleTitleInput(phoneNumber, title) {
    if (!title || title.length < 5) {
      return "❌ Title is too short. Please provide a meaningful title (at least 5 characters).";
    }

    if (title.length > 100) {
      return "❌ Title is too long. Please keep it under 100 characters.";
    }

    const currentState = this.getConversationState(phoneNumber);
    currentState.data.title = title;
    
    this.setConversationState(phoneNumber, 'waiting_for_description', currentState.data);
    return "📄 *Enter Complaint Description* 📝\n\nPlease provide a detailed description of your complaint or concern:";
  }

  async handleDescriptionInput(phoneNumber, description) {
    if (!description || description.length < 10) {
      return "❌ Description is too short. Please provide more details (at least 10 characters).";
    }

    const currentState = this.getConversationState(phoneNumber);
    currentState.data.description = description;

    // For department complaints, ask for student name
    if (currentState.data.type === 'department') {
      this.setConversationState(phoneNumber, 'waiting_for_student_name', currentState.data);
      return "👤 *Enter Your Full Name* 📝\n\nPlease provide your full name for the department complaint:";
    } else {
      // For anonymous complaints, submit directly
      return await this.submitComplaint(phoneNumber, currentState.data);
    }
  }

  async handleStudentNameInput(phoneNumber, studentName) {
    if (!studentName || studentName.length < 2) {
      return "❌ Please provide your full name.";
    }

    const currentState = this.getConversationState(phoneNumber);
    currentState.data.studentName = studentName;
    
    return await this.submitComplaint(phoneNumber, currentState.data);
  }

  async submitComplaint(phoneNumber, complaintData) {
    try {
      complaintData.studentPhone = phoneNumber;

      let complaintId;
      if (complaintData.type === 'department') {
        complaintId = await this.submitDepartmentComplaint({
          title: complaintData.title,
          description: complaintData.description,
          category: complaintData.categoryName,
          departmentId: complaintData.departmentId,
          departmentName: complaintData.departmentName,
          severity: complaintData.severityName,
          studentName: complaintData.studentName,
          studentPhone: phoneNumber
        });
      } else {
        complaintId = await this.submitAnonymousComplaint({
          title: complaintData.title,
          description: complaintData.description,
          category: complaintData.categoryName,
          severity: complaintData.severityName,
          studentPhone: phoneNumber
        });
      }

      this.clearConversationState(phoneNumber);

      let confirmationMessage = `✅ *Complaint Submitted Successfully!* 🎉\n\n`;
      confirmationMessage += `*Complaint ID:* ${complaintId}\n`;
      confirmationMessage += `*Type:* ${complaintData.type === 'department' ? 'Department Complaint' : 'Anonymous Complaint'}\n`;
      
      if (complaintData.type === 'department') {
        confirmationMessage += `*Department:* ${complaintData.departmentName}\n`;
        confirmationMessage += `*Student Name:* ${complaintData.studentName}\n`;
      }
      
      confirmationMessage += `*Category:* ${complaintData.categoryName}\n`;
      confirmationMessage += `*Priority:* ${complaintData.severityName}\n`;
      confirmationMessage += `*Title:* ${complaintData.title}\n\n`;
      
      confirmationMessage += `📱 *What happens next?*\n`;
      if (complaintData.type === 'department') {
        confirmationMessage += `• Your complaint has been forwarded to the ${complaintData.departmentName} department\n`;
        confirmationMessage += `• The Department Head will review your complaint\n`;
        confirmationMessage += `• You'll receive status updates via WhatsApp\n`;
      } else {
        confirmationMessage += `• Your anonymous complaint has been submitted to the administration\n`;
        confirmationMessage += `• You'll receive status updates via WhatsApp\n`;
        confirmationMessage += `• Your identity will remain completely anonymous\n`;
      }
      
      confirmationMessage += `\n⏱️ *Expected Response Time:* 2-5 business days\n`;
      confirmationMessage += `\n💬 Reply with "NEW" to submit another complaint.`;

      return confirmationMessage;
    } catch (error) {
      console.error('❌ Error submitting complaint:', error);
      this.clearConversationState(phoneNumber);
      return "❌ Sorry, there was an error submitting your complaint. Please try again later or contact the administration directly.";
    }
  }

  sendHelpMessage() {
    return `ℹ️ *Help & Information* 📚

*About the Complaint System:*
• Submit complaints easily via WhatsApp
• Choose between anonymous or department-specific complaints
• Receive real-time status updates
• Two-way communication maintained

*Complaint Types:*
🔒 *Anonymous:* Your identity remains hidden
🏛️ *Department:* Direct communication with department heads

*Response Time:* 2-5 business days

*For Urgent Matters:*
📞 Emergency Helpline: +91-XXXXXXXXXX
📧 Email: wellness@christuniversity.in
🌐 Website: https://christuniversity.in

*Privacy:*
Your personal information is secure and used only for complaint resolution.

💬 Reply with "NEW" to submit a complaint.`;
  }

  // =================== UTILITY METHODS ===================

  // Initialize the service
  async initialize() {
    console.log('🚀 Initializing WhatsApp Service...');
    await this.loadDepartmentsFromFirebase();
    this.startComplaintStatusListener();
    console.log('✅ WhatsApp Service initialized successfully');
  }

  // Get statistics
  getStats() {
    return {
      activeSessions: this.conversationStates.size,
      departmentsLoaded: this.departmentMapping.size,
      lastDepartmentRefresh: this.lastDepartmentRefresh || 'Never'
    };
  }
}

module.exports = WhatsAppService; 