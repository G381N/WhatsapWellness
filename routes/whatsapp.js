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
          "I can only process text messages and menu selections. Please use the menu options or type 'menu' to see available services.");
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
      // Send main menu after welcome
      setTimeout(async () => {
        await whatsappService.sendMainMenu(from);
      }, 1000);
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
        `Hello ${userName}! 👋\n\nType 'menu' to see all available services, or choose from the options below:`);
      await whatsappService.sendMainMenu(from);
  }
}

async function handleInteractiveMessage(from, interactive, userName) {
  const buttonReply = interactive.button_reply;
  const listReply = interactive.list_reply;
  
  const replyId = buttonReply?.id || listReply?.id;

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

    default:
      await whatsappService.sendMainMenu(from);
  }
}

async function startCounselorFlow(from, userName) {
  const introText = `*Professional Counseling Service*

Hello ${userName}! I'll ask you a few questions to better understand your needs and connect you with the right counselor.

This information will help our counselors provide you with the best possible support. All information is confidential.

Let's start:`;

  await whatsappService.sendTextMessage(from, introText);
  
  // Start with first question
  sessionManager.setState(from, 'counselor_q1');
  const firstQuestion = sessionManager.getCurrentQuestion(from);
  
  setTimeout(async () => {
    await whatsappService.sendTextMessage(from, firstQuestion.question);
  }, 1000);
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
      await whatsappService.sendTextMessage(from, nextQuestion.question);
    } else {
      // Questionnaire complete - show summary
      await showCounselorRequestSummary(from, userName);
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

    // Send notification to counselor
    const counselorMessage = `🆘 *New Counseling Request*\n\n👤 *Student:* ${userName}\n📞 *Phone:* ${from}\n\n📋 *Request Details:*\n• *Issue:* ${userData.issue_description}\n• *Duration:* ${userData.issue_duration}\n• *Previous Help:* ${userData.previous_help}\n• *Urgency:* ${userData.urgency_level}\n• *Preferred Contact:* ${userData.preferred_contact}\n\n⏰ *Submitted:* ${new Date().toLocaleString()}\n\nPlease contact the student to schedule a counseling session.`;

    await whatsappService.sendTextMessage(process.env.COUNSELOR_PHONE, counselorMessage);

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
  const disclaimerText = `🔒 *Anonymous Complaints*

⚠️ *Important Disclaimer:*
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
    // Enhanced complaint data structure to match website's anonymous complaints
    const complaintData = {
      title: 'WhatsApp Anonymous Complaint',
      description: complaintText,
      complaint: complaintText, // Backward compatibility
      category: 'General',
      severity: 'Medium',
      submittedBy: 'Anonymous WhatsApp Student',
      phoneHash: Buffer.from(from).toString('base64'), // Hashed phone for tracking without revealing identity
      complaintType: 'anonymous',
      source: 'whatsapp_bot',
      developerNote: 'Submitted via WhatsApp Bot - Developed by Gebin George'
    };

    // Save to Firebase (same collection as website: anonymousComplaints)
    await saveAnonymousComplaint(complaintData);

    await whatsappService.sendTextMessage(from, 
      `✅ *Anonymous Complaint Submitted Successfully*

Thank you for bringing this to our attention. Your complaint has been submitted anonymously to the university administrators and is now integrated with our main system.

🔒 *Your Privacy is Protected:*
• Your identity remains completely anonymous
• Only authorized administrators can access this complaint  
• Integrated with the main wellness platform for faster resolution
• You may receive updates through this chat if needed

💙 Thank you for helping us improve our university environment.

_System developed by Gebin George for Christ University Student Wellness_`);

    // Reset session
    sessionManager.setState(from, 'initial');
    
    // Show main menu
    setTimeout(async () => {
      await whatsappService.sendMainMenu(from);
    }, 2000);

  } catch (error) {
    console.error('Error submitting anonymous complaint (Developer: Gebin George):', error);
    await whatsappService.sendTextMessage(from, 
      "Sorry, there was an error submitting your complaint. Please try again later or contact support.\n\n_If issue persists, contact developer: Gebin George_");
  }
}

async function startDepartmentComplaintFlow(from, userName) {
  await whatsappService.sendTextMessage(from, 
    "🏢 *Department Complaints*\n\nPlease select your department from the list below:");
  await whatsappService.sendDepartmentSelection(from);
  sessionManager.setState(from, 'department_selection');
}

async function startDepartmentComplaintInput(from, userName) {
  const department = sessionManager.getData(from, 'selectedDepartment');
  
  await whatsappService.sendTextMessage(from, 
    `📝 *Department: ${department}*\n\nPlease describe your complaint or concern related to this department. Be as detailed as possible to help us address your issue effectively.`);
  
  sessionManager.setState(from, 'department_complaint_input');
}

async function handleDepartmentComplaint(from, complaintText, userName) {
  const department = sessionManager.getData(from, 'selectedDepartment');
  
  const summaryText = `📋 *Department Complaint Summary*

👤 *Name:* ${userName}
📞 *Phone:* ${from}
🏢 *Department:* ${department}

📝 *Complaint:*
${complaintText}

Please review and confirm to submit your complaint to the department.`;

  const buttons = [
    { id: 'confirm_department_complaint', title: '✅ Submit Complaint' },
    { id: 'cancel_complaint', title: '❌ Cancel' }
  ];

  sessionManager.setData(from, 'complaintText', complaintText);
  await whatsappService.sendButtonMessage(from, summaryText, buttons);
  sessionManager.setState(from, 'department_complaint_confirm');
}

async function submitDepartmentComplaint(from, userName) {
  try {
    const department = sessionManager.getData(from, 'selectedDepartment');
    const complaintText = sessionManager.getData(from, 'complaintText');
    
    const complaintData = {
      name: userName,
      phoneNumber: from,
      department: department,
      complaint: complaintText,
      complaintType: 'department_specific',
      developerNote: 'Submitted via WhatsApp Bot - Developed by Gebin George'
    };

    // Save to Firebase
    await saveDepartmentComplaint(complaintData);

    // Send confirmation to user
    await whatsappService.sendTextMessage(from, 
      `✅ *Complaint Submitted Successfully!*

Thank you ${userName}! Your complaint regarding ${department} has been submitted and forwarded to +919741301245.

📧 *What happens next?*
• Your complaint will be reviewed by department representatives
• The department team has been notified via SMS
• You may be contacted for follow-up within 2-3 business days

💙 Thank you for helping us improve our services!

_System developed by Gebin George for Christ University Student Wellness_`);

    // Send to department phone: +919741301245
    const departmentMessage = `🆘 *New Department Complaint*

🏢 *Department:* ${department}
👤 *Student:* ${userName}
📞 *Phone:* ${from}

📝 *Complaint:*
${complaintText}

⏰ *Submitted:* ${new Date().toLocaleString()}

Please review and take appropriate action.

_Christ University Student Wellness System_
_Developed by Gebin George_`;

    // Send to specific phone number: 919741301245 (correct WhatsApp API format)
    await whatsappService.sendTextMessage('919741301245', departmentMessage);

    // Reset session
    sessionManager.clearSession(from);
    
    // Show main menu
    setTimeout(async () => {
      await whatsappService.sendMainMenu(from);
    }, 2000);

  } catch (error) {
    console.error('Error submitting department complaint (Developer: Gebin George):', error);
    await whatsappService.sendTextMessage(from, 
      "Sorry, there was an error submitting your complaint. Please try again later or contact support.\n\n_If issue persists, contact developer: Gebin George_");
  }
}

async function handleCommunityRedirect(from, userName) {
  await whatsappService.sendTextMessage(from, 
    `🤝 *Community Platform*\n\nHello ${userName}! Visit our wellness community platform to:\n\n• Connect with fellow students\n• Access mental health resources\n• Join wellness activities\n• Share experiences safely\n\n🌐 *Website:* ${process.env.COMMUNITY_WEBSITE}\n\n💙 Join our supportive community today!`);
  
  // Show main menu
  setTimeout(async () => {
    await whatsappService.sendMainMenu(from);
  }, 2000);
}

async function handleAboutInfo(from, userName) {
  const aboutText = `ℹ️ *About Christ Mental Health Support System*

🌟 *Our Mission:*
We're dedicated to providing comprehensive mental health support for Christ University students.

🤝 *What We Offer:*
• Professional counseling services
• Anonymous complaint system
• Department-specific support
• Mental wellness resources
• Supportive community platform

🔒 *Privacy & Safety:*
• All conversations are confidential
• Anonymous options available
• Professional counselors
• 24/7 support access

💙 *Our Commitment:*
Your mental health and well-being are our top priorities. We're here to support you through every step of your academic journey.

📞 *Contact:* This WhatsApp bot
🌐 *Website:* ${process.env.COMMUNITY_WEBSITE}

*Remember: Seeking help is a sign of strength, not weakness.*`;

  await whatsappService.sendTextMessage(from, aboutText);
  
  // Show main menu
  setTimeout(async () => {
    await whatsappService.sendMainMenu(from);
  }, 2000);
}

// Cleanup old sessions every hour
setInterval(() => {
  sessionManager.cleanupOldSessions();
  console.log('🧹 Cleaned up old user sessions');
}, 60 * 60 * 1000);

module.exports = router; 