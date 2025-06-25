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

    case 'anonymous_complaint':
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

  // Get current session state to handle context-specific responses
  const currentState = sessionManager.getState(from);

  // Handle department selections
  if (currentState === 'department_selection' && replyId?.startsWith('dept_')) {
    await handleDepartmentSelectionResponse(from, replyId, userName);
    return;
  }

  // Remove category and severity selection handlers since we simplified the flow
  // if (currentState === 'category_selection' && replyId?.startsWith('cat_')) {
  //   await handleCategorySelectionResponse(from, replyId, userName);
  //   return;
  // }

  // if (currentState === 'severity_selection' && replyId?.startsWith('sev_')) {
  //   await handleSeveritySelectionResponse(from, replyId, userName);
  //   return;
  // }

  switch (replyId) {
    case 'counseling':
      await startCounselorFlow(from, userName);
      break;

    case 'anonymous':
      await startAnonymousComplaintFlow(from, userName);
      break;

    case 'department':
      await startDepartmentComplaintFlow(from, userName);
      break;

    case 'community':
      await handleCommunityRedirect(from, userName);
      break;

    case 'about':
      await handleAboutInfo(from, userName);
      break;

    case 'confirm_counselor_request':
      await submitCounselorRequest(from, userName);
      break;

    case 'confirm_department_complaint':
      await submitDepartmentComplaint(from, userName);
      break;

    case 'cancel_complaint':
      await whatsappService.sendTextMessage(from, "Complaint cancelled. Returning to main menu...");
      sessionManager.clearSession(from);
      setTimeout(async () => {
        await whatsappService.sendMainMenu(from);
      }, 1500);
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
  await whatsappService.sendTextMessage(from, 
    `*📝 Anonymous Complaint Submission*

Dear ${userName},

You have chosen to submit an anonymous complaint. This service ensures your identity remains completely confidential while allowing you to report concerns that require attention.

*Please describe your complaint in detail:*

Include relevant information such as:
• Nature of the concern
• When it occurred
• Location (if applicable)
• Any impact on student welfare

Your complaint will be reviewed by our administration team while maintaining complete anonymity.

Please type your detailed complaint now:`);
  
  sessionManager.setState(from, 'anonymous_complaint');
}

async function handleAnonymousComplaint(from, complaintText, userName) {
  try {
    const complaintData = {
      title: 'Anonymous Student Complaint',
      description: complaintText,
      category: 'Anonymous Report',
      severity: 'Medium',
      studentPhone: from // Will be formatted in Firebase function
    };

    await saveAnonymousComplaint(complaintData);

    await whatsappService.sendTextMessage(from, 
      `*✅ Anonymous Complaint Submitted Successfully*

Dear Student,

Your anonymous complaint has been successfully submitted to the Christ University Student Wellness System.

*Submission Details:*
• Submission Time: ${new Date().toLocaleString()}
• Reference: Anonymous Report
• Status: Under Review

*Important Information:*
• Your identity remains completely confidential
• Our administration team will review your complaint
• Appropriate action will be taken based on the severity
• You will not receive direct updates due to the anonymous nature

*Additional Support:*
If you need immediate assistance or wish to follow up, you can:
• Use our counseling services
• Submit a department-specific complaint
• Contact student support directly

Thank you for helping us maintain a safe and supportive environment at Christ University.`);

    // Reset session
    sessionManager.clearSession(from);
    
    // Show main menu
    setTimeout(async () => {
      await whatsappService.sendMainMenu(from);
    }, 3000);

  } catch (error) {
    console.error('Error submitting anonymous complaint:', error);
    await whatsappService.sendTextMessage(from, 
      `*❌ Submission Error*

We apologize, but there was a technical issue submitting your anonymous complaint. Please try again in a few moments.

If the problem persists, please contact our student support office directly.

Thank you for your patience.`);
  }
}

async function startDepartmentComplaintFlow(from, userName) {
  await whatsappService.sendDepartmentSelection(from);
  sessionManager.setState(from, 'department_selection');
}

async function handleDepartmentSelectionResponse(from, replyId, userName) {
  try {
    const departmentName = whatsappService.getDepartmentName(replyId);
    const contactInfo = whatsappService.getDepartmentContact(replyId);
    
    // Store both department name and ID
    sessionManager.setData(from, 'selectedDepartment', departmentName);
    sessionManager.setData(from, 'selectedDepartmentId', replyId);
    sessionManager.setData(from, 'userName', userName);
    sessionManager.setData(from, 'phoneNumber', from);
    
    const message = `*🏛️ Department Selected: ${departmentName}*

*📞 Department Contact Information:*
${contactInfo}

*📝 Complaint Submission Process:*

Your complaint will be submitted to the Christ University Student Wellness System and automatically forwarded to the department head shown above.

*Please describe your issue in detail:*

Include the following information:
• 📋 Specific situation or incident
• 📅 When it occurred
• 📍 Location (if applicable)
• 🔧 Any steps you've already taken
• 🎯 Expected resolution or outcome

*Note:* Your name (${userName}) and contact number (${from}) will be included with your complaint so the department can respond to you directly.

Please type your detailed complaint description now:`;

    await whatsappService.sendTextMessage(from, message);
    
    // Set state to handle complaint input
  sessionManager.setState(from, 'department_complaint_input');
    
  } catch (error) {
    console.error('Error handling department selection:', error);
    await whatsappService.sendTextMessage(from, 
      `*❌ Error*\n\nSorry, there was an error processing your department selection. Please try again or type 'menu' to return to the main menu.`);
  }
}

async function handleDepartmentComplaint(from, complaintText, userName) {
  try {
  const department = sessionManager.getData(from, 'selectedDepartment');
    const departmentId = sessionManager.getData(from, 'selectedDepartmentId');
    const phoneNumber = sessionManager.getData(from, 'phoneNumber') || from;
    
    // Validate required data
    if (!department || !departmentId || !complaintText.trim()) {
      await whatsappService.sendTextMessage(from, 
        `*❌ Missing Information*\n\nPlease provide a detailed description of your complaint. Type 'menu' to start over if needed.`);
      return;
    }

    // Format the complaint summary with proper WhatsApp formatting
    const summaryText = `*📋 Department Complaint Summary*

*👤 Student Information:*
• Name: ${userName}
• Phone: ${phoneNumber}
• WhatsApp: ${from}

*🏛️ Selected Department:*
${department}

*📝 Complaint Description:*
${complaintText}

*⚠️ Important Notice:*
Your complaint will be:
✅ Submitted to the Christ University Student Wellness System
✅ Forwarded to the ${department} department head
✅ Tracked with a unique reference number
✅ Updated with progress notifications

*📞 Department Contact:*
${whatsappService.getDepartmentContact(departmentId)}

Please review the information above and confirm submission:`;

  const buttons = [
    { id: 'confirm_department_complaint', title: '✅ Submit Complaint' },
      { id: 'cancel_complaint', title: '❌ Cancel & Return' }
  ];

    // Store complaint data for submission
  sessionManager.setData(from, 'complaintText', complaintText);
    sessionManager.setData(from, 'complaintSummary', summaryText);
    
  await whatsappService.sendButtonMessage(from, summaryText, buttons);
  sessionManager.setState(from, 'department_complaint_confirm');
    
  } catch (error) {
    console.error('Error handling department complaint:', error);
    await whatsappService.sendTextMessage(from, 
      `*❌ Error*\n\nSorry, there was an error processing your complaint. Please try again or contact support.`);
  }
}

async function submitDepartmentComplaint(from, userName) {
  try {
    const department = sessionManager.getData(from, 'selectedDepartment');
    const departmentId = sessionManager.getData(from, 'selectedDepartmentId');
    const complaintText = sessionManager.getData(from, 'complaintText');
    const phoneNumber = sessionManager.getData(from, 'phoneNumber') || from;
    
    // Validate all required data
    if (!department || !departmentId || !complaintText || !userName) {
      await whatsappService.sendTextMessage(from, 
        `*❌ Submission Error*\n\nMissing required information. Please start over by typing 'menu'.`);
      return;
    }

    // Create comprehensive complaint data
    const complaintData = {
      title: `${department} - Student Complaint`,
      description: complaintText,
      category: 'General Complaint',
      department: department,
      departmentId: departmentId,
      severity: 'Medium',
      studentName: userName,
      studentPhone: phoneNumber,
      whatsappNumber: from,
      source: 'whatsapp_bot',
      submissionTime: new Date().toISOString(),
      contactMethod: 'WhatsApp Bot'
    };

    // Save to Firebase
    const savedComplaint = await saveDepartmentComplaint(complaintData);
    
    // Generate reference number
    const referenceNumber = `CU-${savedComplaint.id.substring(0, 8).toUpperCase()}`;

    // Send detailed confirmation to student
    const confirmationMessage = `*✅ Complaint Submitted Successfully*

Dear ${userName},

Your complaint has been successfully submitted to the Christ University Student Wellness System.

*📋 Complaint Details:*
• Reference: ${referenceNumber}
• Department: ${department}
• Status: Pending Review
• Submitted: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}

*📞 Your Contact Information:*
• Name: ${userName}
• Phone: ${phoneNumber}
• WhatsApp: ${from}

*🔄 What Happens Next:*
1️⃣ Your complaint is now in the system
2️⃣ Department head will receive notification
3️⃣ You'll get status updates via WhatsApp
4️⃣ Expected response: 2-3 business days
5️⃣ For urgent matters, contact department directly

*📞 Department Contact Information:*
${whatsappService.getDepartmentContact(departmentId)}

*📱 Stay Connected:*
• You'll receive WhatsApp notifications for status updates
• Type 'menu' anytime to access other services
• Keep this reference number: ${referenceNumber}

Thank you for using the Christ University Student Wellness Support System. We are committed to addressing your concerns promptly and effectively.`;

    await whatsappService.sendTextMessage(from, confirmationMessage);

    // Send notification to department head (if configured)
    await sendDepartmentNotification(departmentId, {
      studentName: userName,
      studentPhone: phoneNumber,
      whatsappNumber: from,
      department: department,
      complaintText: complaintText,
      referenceNumber: referenceNumber,
      submissionTime: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
    });

    // Reset session and show menu
    sessionManager.clearSession(from);
    
    // Show main menu after a brief delay
    setTimeout(async () => {
      await whatsappService.sendTextMessage(from, 
        `*🎓 Christ University Wellness Portal*\n\nType 'menu' to access services or submit another complaint.`);
    }, 3000);

  } catch (error) {
    console.error('Error submitting department complaint:', error);
    await whatsappService.sendTextMessage(from, 
      `*❌ Submission Error*

We apologize, but there was a technical issue submitting your complaint.

*Please try:*
• Wait a moment and try again
• Type 'menu' to restart the process
• Contact technical support if the issue persists

*Emergency Contact:*
For urgent matters, please contact the department directly or visit the student wellness office.

Thank you for your patience.`);
  }
}

// New function to send notifications to department heads
async function sendDepartmentNotification(departmentId, complaintInfo) {
  try {
    // Get department head contact information
    const departmentContact = whatsappService.getDepartmentHeadPhone(departmentId);
    
    if (!departmentContact) {
      console.log(`No WhatsApp contact found for department: ${departmentId}`);
      return;
    }

    const notificationMessage = `*🚨 New Student Complaint Received*

*📋 Complaint Details:*
• Reference: ${complaintInfo.referenceNumber}
• Department: ${complaintInfo.department}
• Submitted: ${complaintInfo.submissionTime}

*👤 Student Information:*
• Name: ${complaintInfo.studentName}
• Phone: ${complaintInfo.studentPhone}
• WhatsApp: ${complaintInfo.whatsappNumber}

*📝 Complaint Description:*
${complaintInfo.complaintText}

*🔄 Action Required:*
1️⃣ Review the complaint details
2️⃣ Contact the student if needed
3️⃣ Update status in the wellness portal
4️⃣ Student will receive automatic notifications

*📱 Student Contact:*
• Direct WhatsApp: https://wa.me/${complaintInfo.whatsappNumber.replace('+', '')}
• Phone: ${complaintInfo.studentPhone}

*💻 System Access:*
Login to the Student Wellness Portal to manage this complaint and update its status.

This is an automated notification from the Christ University Student Wellness System.`;

    await whatsappService.sendTextMessage(departmentContact, notificationMessage);
    console.log(`✅ Department notification sent to ${departmentContact} for complaint ${complaintInfo.referenceNumber}`);
    
  } catch (error) {
    console.error('Error sending department notification:', error);
    // Don't throw error to avoid blocking complaint submission
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