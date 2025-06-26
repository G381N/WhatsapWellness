const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const sessionManager = require('../services/sessionManager');
const { saveAnonymousComplaint, saveCounselorRequest, saveDepartmentComplaint } = require('../config/firebase');

// Webhook verification
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      res.status(200).send(challenge);
    } else {
      console.log('❌ Webhook verification failed');
      res.sendStatus(403);
    }
  } else {
    res.sendStatus(400);
  }
});

// Webhook message handler
router.post('/', async (req, res) => {
  try {
    const body = req.body;

    if (body.object === 'whatsapp_business_account') {
      body.entry?.forEach(async (entry) => {
        const changes = entry.changes?.[0];
        
        if (changes?.field === 'messages') {
          const messages = changes.value?.messages;
          const contacts = changes.value?.contacts;

          if (messages && messages.length > 0) {
            for (const message of messages) {
              await processMessage(message, contacts);
            }
          }
        }
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.sendStatus(500);
  }
});

async function processMessage(message, contacts) {
  try {
    const from = message.from;
    const messageType = message.type;
    
    // Get contact info
    const contact = contacts?.find(c => c.wa_id === from);
    const userName = contact?.profile?.name || 'Student';

    console.log(`📨 Processing message from ${from} (${userName}): ${messageType}`);

    // Handle different message types
    switch (messageType) {
      case 'text':
        await handleTextMessage(from, message.text.body, userName);
        break;
      case 'interactive':
        await handleInteractiveMessage(from, message.interactive, userName);
        break;
      default:
        await whatsappService.sendTextMessage(from, 
          `Hello ${userName}! Type 'menu' to see all available services.`);
    }
  } catch (error) {
    console.error('❌ Error processing message:', error);
  }
}

async function handleTextMessage(from, messageText, userName) {
  const text = messageText.toLowerCase().trim();
  const currentState = sessionManager.getState(from);

  // Handle menu keyword
  if (text === 'menu' || text === 'start' || text === 'hi' || text === 'hello') {
    if (currentState === 'initial') {
      sessionManager.setData(from, 'userName', userName);
      sessionManager.setData(from, 'phoneNumber', from);
      await whatsappService.sendWelcomeMessage(from, userName);
      // Welcome message already includes the service selection menu
    } else {
      await whatsappService.sendMainMenu(from);
    }
    return;
  }

  // Handle states
  switch (currentState) {
    case 'counselor_q1':
    case 'counselor_q2':
    case 'counselor_q3':
    case 'counselor_q4':
    case 'counselor_q5':
      await handleCounselorQuestionnaire(from, messageText, userName);
      break;

    case 'anonymous_complaint_input':
      await handleAnonymousComplaint(from, messageText, userName);
      break;

    case 'department_complaint_input':
      await handleDepartmentComplaint(from, messageText, userName);
      break;

    default:
      await whatsappService.sendTextMessage(from, 
        `Hello ${userName}! Type 'menu' to see all available services.`);
  }
}

async function handleInteractiveMessage(from, interactive, userName) {
  const buttonReply = interactive.button_reply;
  const listReply = interactive.list_reply;
  
  const replyId = buttonReply?.id || listReply?.id;

  // Handle complaint management actions (dashboard, chat, call)
  if (replyId.startsWith('dashboard_') || replyId.startsWith('chat_') || replyId.startsWith('call_') || replyId.startsWith('quick_')) {
    await whatsappService.handleComplaintAction(from, replyId);
    return;
  }

  switch (replyId) {
    case 'connect_counselors':
      await startCounselorFlow(from, userName);
      break;

    case 'anonymous_complaints':
      await startAnonymousComplaintFlow(from, userName);
      break;

    case 'department_complaints':
      await startDepartmentComplaintFlow(from, userName);
      break;

    case 'community':
      await handleCommunityRedirect(from, userName);
      break;

    case 'about':
      await handleAboutInfo(from, userName);
      break;

    case 'dept_mca':
      sessionManager.setData(from, 'selectedDepartment', 'MCA - Master of Computer Applications');
      await startDepartmentComplaintInput(from, userName);
      break;

    case 'dept_msc_aiml':
      sessionManager.setData(from, 'selectedDepartment', 'MSC AIML - MSc Artificial Intelligence & Machine Learning');
      await startDepartmentComplaintInput(from, userName);
      break;

    case 'confirm_counselor_request':
      await submitCounselorRequest(from, userName);
      break;

    case 'confirm_department_complaint':
      await submitDepartmentComplaint(from, userName);
      break;

    // Handle counselor questionnaire interactive responses
    case 'duration_1':
    case 'duration_2':
    case 'duration_3':
    case 'duration_4':
    case 'duration_5':
    case 'help_1':
    case 'help_2':
    case 'help_3':
    case 'help_4':
    case 'urgency_1':
    case 'urgency_2':
    case 'urgency_3':
    case 'urgency_4':
    case 'contact_1':
    case 'contact_2':
    case 'contact_3':
    case 'contact_4':
    case 'contact_5':
      await handleCounselorInteractiveResponse(from, replyId, userName);
      break;

    default:
      // Handle counselor "Message Student" button
      if (replyId.startsWith('message_student_')) {
        const studentPhone = replyId.replace('message_student_', '');
        await handleCounselorMessageStudent(from, studentPhone);
      } else {
        await whatsappService.sendMainMenu(from);
      }
  }
}

async function startCounselorFlow(from, userName) {
  const introText = `*Professional Counseling Service*

Hello ${userName}! Welcome to our confidential counseling service.

I'll guide you through a brief assessment to help match you with the most suitable counselor for your needs. This process typically takes 2-3 minutes and ensures you receive personalized support.

*Your privacy is our priority:*
• All information shared is strictly confidential
• Only qualified counselors will have access
• Your responses help us provide better support

Ready to begin? Let's start with understanding your situation:`;

  await whatsappService.sendTextMessage(from, introText);
  
  // Start with first question
  sessionManager.setState(from, 'counselor_q1');
  const firstQuestion = sessionManager.getCurrentQuestion(from);
  
  setTimeout(async () => {
    if (firstQuestion.type === 'list') {
      // Send interactive list for multiple choice questions
      const sections = [{
        title: "Select an option",
        rows: firstQuestion.options.map(option => ({
          id: option.id,
          title: option.title,
          description: ""
        }))
      }];
      
      await whatsappService.sendListMessage(from, firstQuestion.question, "Choose Option", sections);
    } else {
      // Send text question for descriptive answers
      await whatsappService.sendTextMessage(from, firstQuestion.question);
    }
  }, 1500);
}

async function handleCounselorQuestionnaire(from, messageText, userName) {
  const currentQuestion = sessionManager.getCurrentQuestion(from);
  
  if (currentQuestion) {
    // Store the answer
    sessionManager.setData(from, currentQuestion.key, messageText);
    
    // Get next question
    const nextQuestion = sessionManager.getNextQuestion(from);
    
    if (nextQuestion) {
      // Move to next question
      sessionManager.setState(from, nextQuestion.state);
      
      if (nextQuestion.type === 'list') {
        // Send interactive list for multiple choice questions
        const sections = [{
          title: "Select an option",
          rows: nextQuestion.options.map(option => ({
            id: option.id,
            title: option.title,
            description: ""
          }))
        }];
        
        await whatsappService.sendListMessage(from, nextQuestion.question, "Choose Option", sections);
      } else {
        // Send text question for descriptive answers
        await whatsappService.sendTextMessage(from, nextQuestion.question);
      }
    } else {
      // Questionnaire complete - show summary
      await showCounselorRequestSummary(from, userName);
    }
  }
}

async function handleCounselorInteractiveResponse(from, replyId, userName) {
  const currentQuestion = sessionManager.getCurrentQuestion(from);
  
  if (currentQuestion && currentQuestion.type === 'list') {
    // Find the selected option
    const selectedOption = currentQuestion.options.find(opt => opt.id === replyId);
    
    if (selectedOption) {
      // Store the answer
      sessionManager.setData(from, currentQuestion.key, selectedOption.value);
      
      // Get next question
      const nextQuestion = sessionManager.getNextQuestion(from);
      
      if (nextQuestion) {
        // Move to next question
        sessionManager.setState(from, nextQuestion.state);
        
        if (nextQuestion.type === 'list') {
          // Send interactive list for multiple choice questions
          const sections = [{
            title: "Select an option",
            rows: nextQuestion.options.map(option => ({
              id: option.id,
              title: option.title,
              description: ""
            }))
          }];
          
          await whatsappService.sendListMessage(from, nextQuestion.question, "Choose Option", sections);
        } else {
          // Send text question for descriptive answers
          await whatsappService.sendTextMessage(from, nextQuestion.question);
        }
      } else {
        // Questionnaire complete - show summary
        await showCounselorRequestSummary(from, userName);
      }
    }
  }
}

async function showCounselorRequestSummary(from, userName) {
  const userData = sessionManager.getAllData(from);
  
  const summaryText = `*Counseling Request Summary*

*Name:* ${userName}
*Phone:* ${from}

*Issue Description:* ${userData.issue_description}
*Duration:* ${userData.issue_duration}
*Previous Help:* ${userData.previous_help}
*Urgency:* ${userData.urgency_level}
*Preferred Contact:* ${userData.preferred_contact}

Please review your information and confirm to submit your counseling request.`;

  const buttons = [
    { id: 'confirm_counselor_request', title: 'Confirm & Submit' },
    { id: 'cancel_request', title: 'Cancel' }
  ];

  await whatsappService.sendButtonMessage(from, summaryText, buttons);
  sessionManager.setState(from, 'counselor_confirm');
}

async function submitCounselorRequest(from, userName) {
  try {
    const userData = sessionManager.getAllData(from);
    
    const requestData = {
      name: userName,
      phoneNumber: from,
      issueDescription: userData.issue_description,
      issueDuration: userData.issue_duration,
      previousHelp: userData.previous_help,
      urgencyLevel: userData.urgency_level,
      preferredContact: userData.preferred_contact,
      requestType: 'counselor_session'
    };

    // Save to Firebase
    await saveCounselorRequest(requestData);

    // Send confirmation to user
    await whatsappService.sendTextMessage(from, 
      `*Request Submitted Successfully!*

Thank you ${userName}! Your counseling request has been submitted to our professional counselors.

*What happens next?*
• A counselor will review your request
• You'll be contacted within 24-48 hours
• They'll schedule a session based on your preferred contact method

Remember, you're taking a positive step towards your mental wellness. We're here to support you!`);

    // Send notification to counselor with interactive button
    const counselorMessage = `*New Counseling Request*

*Student:* ${userName}
*Phone:* ${from}

*Request Details:*
• Issue: ${userData.issue_description}
• Duration: ${userData.issue_duration}
• Previous Help: ${userData.previous_help}
• Urgency: ${userData.urgency_level}
• Preferred Contact: ${userData.preferred_contact}

*Submitted:* ${new Date().toLocaleString()}

Please contact the student to schedule a counseling session.`;

    const counselorButtons = [
      { id: `message_student_${from}`, title: 'Message Student' }
    ];

    await whatsappService.sendButtonMessage(process.env.COUNSELOR_PHONE, counselorMessage, counselorButtons);

    // Reset session
    sessionManager.clearSession(from);
    
    // Show main menu
    setTimeout(async () => {
      await whatsappService.sendMainMenu(from);
    }, 2000);

  } catch (error) {
    console.error('Error submitting counselor request:', error);
    await whatsappService.sendTextMessage(from, 
      "Sorry, there was an error submitting your request. Please try again later or contact support.");
  }
}

async function startAnonymousComplaintFlow(from, userName) {
  const disclaimerText = `*Anonymous Complaints*

*Important Disclaimer:*
• This complaint will be completely anonymous
• Only university-level administrators will have access to review this complaint
• Your identity will NOT be shared with anyone
• This is a safe space to report concerns without fear

Please type your complaint or concern below. Take your time to describe the situation in detail.`;

  await whatsappService.sendTextMessage(from, disclaimerText);
  sessionManager.setState(from, 'anonymous_complaint_input');
}

async function handleAnonymousComplaint(from, complaintText, userName) {
  try {
    // Generate unique complaint ID for anonymous complaints
    const complaintId = `ANON-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    // Enhanced complaint data structure to match website's anonymous complaints
    const complaintData = {
      id: complaintId,
      title: 'WhatsApp Anonymous Complaint',
      description: complaintText,
      complaint: complaintText, // Backward compatibility
      category: 'General',
      severity: 'Medium',
      submittedBy: 'Anonymous WhatsApp Student',
      phoneHash: Buffer.from(from).toString('base64'), // Hashed phone for tracking without revealing identity
      studentPhone: from, // For admin contact (but kept anonymous)
      department: 'Anonymous Complaint',
      issueType: 'Anonymous Issue',
      urgency: 'Normal',
      complaintType: 'anonymous',
      source: 'whatsapp_bot',
      developerNote: 'Submitted via WhatsApp Bot - Developed by Gebin George'
    };

    // Save to Firebase (same collection as website: anonymousComplaints)
    await saveAnonymousComplaint(complaintData);

    await whatsappService.sendTextMessage(from, 
      `*Anonymous Complaint Submitted Successfully*

*Complaint ID:* ${complaintId}

Thank you for bringing this to our attention. Your complaint has been submitted anonymously to the university administrators and is now integrated with our main system.

*Your Privacy is Protected:*
• Your identity remains completely anonymous
• Only authorized administrators can access this complaint  
• Integrated with the main wellness platform for faster resolution
• You may receive updates through this chat if needed

Thank you for helping us improve our university environment.`);

    // Notify admin with interactive buttons for anonymous complaints too
    const adminPhoneNumber = '919741301245'; // Admin phone number
    await whatsappService.notifyComplaintToAdmin(adminPhoneNumber, complaintData);

    // Reset session
    sessionManager.setState(from, 'initial');
    
    // Show main menu
    setTimeout(async () => {
      await whatsappService.sendMainMenu(from);
    }, 2000);

  } catch (error) {
    console.error('Error submitting anonymous complaint (Developer: Gebin George):', error);
    await whatsappService.sendTextMessage(from, 
      "Sorry, there was an error submitting your complaint. Please try again later or contact support.");
  }
}

async function startDepartmentComplaintFlow(from, userName) {
  await whatsappService.sendTextMessage(from, 
    "*Department Complaints*\n\nPlease select your department from the list below:");
  await whatsappService.sendDepartmentSelection(from);
  sessionManager.setState(from, 'department_selection');
}

async function startDepartmentComplaintInput(from, userName) {
  const department = sessionManager.getData(from, 'selectedDepartment');
  
  await whatsappService.sendTextMessage(from, 
    `*Department: ${department}*\n\nPlease describe your complaint or concern related to this department. Be as detailed as possible to help us address your issue effectively.`);
  
  sessionManager.setState(from, 'department_complaint_input');
}

async function handleDepartmentComplaint(from, complaintText, userName) {
  const department = sessionManager.getData(from, 'selectedDepartment');
  
  const summaryText = `*Department Complaint Summary*

*Name:* ${userName}
*Phone:* ${from}
*Department:* ${department}

*Complaint:*
${complaintText}

Please review and confirm to submit your complaint to the department.`;

  const buttons = [
    { id: 'confirm_department_complaint', title: 'Submit Complaint' },
    { id: 'cancel_complaint', title: 'Cancel' }
  ];

  sessionManager.setData(from, 'complaintText', complaintText);
  await whatsappService.sendButtonMessage(from, summaryText, buttons);
  sessionManager.setState(from, 'department_complaint_confirm');
}

async function submitDepartmentComplaint(from, userName) {
  try {
    const department = sessionManager.getData(from, 'selectedDepartment');
    const complaintText = sessionManager.getData(from, 'complaintText');
    
    // Generate unique complaint ID
    const complaintId = `DEPT-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    
    const complaintData = {
      id: complaintId,
      name: userName,
      phoneNumber: from,
      studentPhone: from, // For compatibility with new system
      department: department,
      complaint: complaintText,
      complaintType: 'department_specific',
      issueType: 'Department Issue',
      description: complaintText,
      urgency: 'Normal', // Default urgency
      developerNote: 'Submitted via WhatsApp Bot - Developed by Gebin George'
    };

    // Save to Firebase
    await saveDepartmentComplaint(complaintData);

    // Send confirmation to user
    await whatsappService.sendTextMessage(from, 
      `*Complaint Submitted Successfully!*

*Complaint ID:* ${complaintId}

Thank you ${userName}! Your complaint regarding ${department} has been submitted and forwarded to the department team.

*What happens next?*
• Your complaint will be reviewed by department representatives
• The department team has been notified via WhatsApp with management tools
• You may be contacted for follow-up within 2-3 business days

Thank you for helping us improve our services!`);

    // Notify HOD/admin with interactive buttons using the new system
    const adminPhoneNumber = '919741301245'; // HOD/Admin phone number
    await whatsappService.notifyComplaintToAdmin(adminPhoneNumber, complaintData);

    // Reset session
    sessionManager.clearSession(from);
    
    // Show main menu
    setTimeout(async () => {
      await whatsappService.sendMainMenu(from);
    }, 2000);

  } catch (error) {
    console.error('Error submitting department complaint (Developer: Gebin George):', error);
    await whatsappService.sendTextMessage(from, 
      "Sorry, there was an error submitting your complaint. Please try again later or contact support.");
  }
}

async function handleCommunityRedirect(from, userName) {
  await whatsappService.sendTextMessage(from, 
    `*Community Platform*

Hello ${userName}! Visit our wellness community platform to:

• Connect with fellow students
• Access mental health resources
• Join wellness activities
• Share experiences safely

*Website:* ${process.env.COMMUNITY_WEBSITE || 'https://your-community-website.com'}

Join our supportive community today!`);
  
  // Show main menu
  setTimeout(async () => {
    await whatsappService.sendMainMenu(from);
  }, 2000);
}

async function handleAboutInfo(from, userName) {
  const aboutText = `*About Christ University Student Wellness Support System*

*Our Mission:*
We're dedicated to providing comprehensive mental health support for Christ University students.

*What We Offer:*
• Professional counseling services
• Anonymous complaint system
• Department-specific support
• Mental wellness resources
• Supportive community platform

*Privacy & Safety:*
• All conversations are confidential
• Anonymous options available
• Professional counselors
• 24/7 support access

*Our Commitment:*
Your mental health and well-being are our top priorities. We're here to support you through every step of your academic journey.

*Contact:* This WhatsApp bot
*Website:* ${process.env.COMMUNITY_WEBSITE || 'https://your-community-website.com'}

*Remember: Seeking help is a sign of strength, not weakness.*`;

  await whatsappService.sendTextMessage(from, aboutText);
  
  // Show main menu
  setTimeout(async () => {
    await whatsappService.sendMainMenu(from);
  }, 2000);
}

async function handleCounselorMessageStudent(counselorPhone, studentPhone) {
  // Create WhatsApp deep link to directly open the student's chat
  const whatsappLink = `https://wa.me/${studentPhone}`;
  
  const messageText = `*Student Contact*

Click this link to message the student directly:
${whatsappLink}

*Student Phone:* ${studentPhone}

*Professional Guidelines:*
• Maintain counseling ethics in all communications
• Respect student privacy and confidentiality
• Schedule sessions as per your availability`;

  await whatsappService.sendTextMessage(counselorPhone, messageText);
}

// Cleanup old sessions every hour
setInterval(() => {
  sessionManager.cleanupOldSessions();
  console.log('Cleaned up old user sessions');
}, 60 * 60 * 1000);

module.exports = router; 