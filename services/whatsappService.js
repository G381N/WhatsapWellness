const axios = require('axios');
const { getDepartments } = require('../config/firebase');

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;

class WhatsAppService {
  constructor() {
    this.baseURL = `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`;
    this.headers = {
      'Authorization': `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    };
  }

  // Send a text message
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
      console.log('✅ Text message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending text message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send interactive buttons
  async sendButtonMessage(to, bodyText, buttons) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText
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
      console.log('✅ Button message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending button message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send interactive list
  async sendListMessage(to, bodyText, buttonText, sections) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'list',
          body: {
            text: bodyText
          },
          action: {
            button: buttonText,
            sections: sections
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ List message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending list message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send welcome message with main menu
  async sendWelcomeMessage(to, userName) {
    const welcomeText = `Hello ${userName}!

Welcome to Christ University Student Wellness Support System

Privacy Notice: This WhatsApp chat is completely anonymous and confidential. Your conversations are secure and private.

We're here for you! This platform is designed to:
• Connect you with professional counselors
• Provide a safe space for concerns and complaints
• Offer mental health support and resources
• Build a supportive community

Please select an option from the menu below:`;

    const sections = [
      {
        title: "Support Services",
        rows: [
          {
            id: "connect_counselors",
            title: "Connect with Counselors",
            description: "Get professional mental health support"
          },
          {
            id: "anonymous_complaints",
            title: "Anonymous Complaints",
            description: "Submit anonymous concerns safely"
          },
          {
            id: "department_complaints",
            title: "Department Complaints",
            description: "Report department-specific issues"
          }
        ]
      },
      {
        title: "Information & Community",
        rows: [
          {
            id: "community",
            title: "Community Platform",
            description: "Visit our wellness community website"
          },
          {
            id: "about",
            title: "About This Service",
            description: "Learn about our support system"
          }
        ]
      }
    ];

    return await this.sendListMessage(to, welcomeText, "Select Service", sections);
  }

  // Send main menu
  async sendMainMenu(to) {
    const sections = [
      {
        title: "Support Services",
        rows: [
          {
            id: "connect_counselors",
            title: "Connect with Counselors",
            description: "Get professional mental health support"
          },
          {
            id: "anonymous_complaints",
            title: "Anonymous Complaints",
            description: "Submit anonymous concerns safely"
          },
          {
            id: "department_complaints",
            title: "Department Complaints",
            description: "Report department-specific issues"
          }
        ]
      },
      {
        title: "Information & Community",
        rows: [
          {
            id: "community",
            title: "Community Platform",
            description: "Visit our wellness community website"
          },
          {
            id: "about",
            title: "About This Service",
            description: "Learn about our support system"
          }
        ]
      }
    ];

    return await this.sendListMessage(
      to, 
      "Please choose from the options below:", 
      "Select Service", 
      sections
    );
  }

  // Send department selection - fetched dynamically from Firebase
  async sendDepartmentSelection(to) {
    try {
      const departments = await getDepartments();
      
      if (departments.length === 0) {
        // Fallback if no departments found
        await this.sendTextMessage(to, 
          "Sorry, no departments are currently available. Please try again later or contact support.");
        return;
      }

      const sections = [
        {
          title: "Available Departments",
          rows: departments.map(dept => ({
            id: `dept_${dept.code}`,
            title: dept.name.split(' - ')[0], // Show short name
            description: dept.name.split(' - ')[1] || dept.name // Show full description
          }))
        }
      ];

      return await this.sendListMessage(
        to,
        "Please select your department from the list below to proceed with raising a complaint:",
        "Choose Department",
        sections
      );
    } catch (error) {
      console.error('❌ Error fetching departments (Developer: Gebin George):', error);
      // Fallback to hardcoded departments
      const sections = [
        {
          title: "School of Sciences",
          rows: [
            {
              id: "dept_MCA",
              title: "MCA",
              description: "Master of Computer Applications"
            },
            {
              id: "dept_MSC_AIML",
              title: "MSC AIML",
              description: "MSc Artificial Intelligence & Machine Learning"
            }
          ]
        }
      ];

      return await this.sendListMessage(
        to,
        "Please select your department from the list below to proceed with raising a complaint:",
        "Choose Department",
        sections
      );
    }
  }

  // Send urgency selection buttons
  async sendUrgencySelection(to) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: `Priority Level Selection

How urgent is this issue? Please choose one of the following:

• High: Requires immediate attention (within 24 hours)
• Normal: Standard processing time (2-3 business days)  
• Low: Non-urgent matter (within a week)

Your selection helps us prioritize and respond appropriately.`
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: 'urgency_high',
                  title: '🔴 High Priority'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'urgency_normal',
                  title: '🟡 Normal Priority'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: 'urgency_low',
                  title: '🟢 Low Priority'
                }
              }
            ]
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Urgency selection sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending urgency selection:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send admin/HOD complaint management buttons
  async sendComplaintManagementButtons(to, complaintId, studentPhoneNumber, complaintSummary) {
    const bodyText = `*New Complaint Received*

Complaint ID: *${complaintId}*
Summary: ${complaintSummary}

Please choose an action:`;

    const buttons = [
      {
        id: `dashboard_${complaintId}`,
        title: "📊 Open Dashboard"
      },
      {
        id: `chat_${studentPhoneNumber}`,
        title: "💬 Message Student"
      },
      {
        id: `call_${studentPhoneNumber}`,
        title: "📞 Call Student"
      }
    ];

    return await this.sendButtonMessage(to, bodyText, buttons);
  }

  // Send URL button message (for dashboard links)
  async sendUrlButtonMessage(to, bodyText, buttonText, url) {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: {
            text: bodyText
          },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: buttonText,
              url: url
            }
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ URL button message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending URL button message:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send service completion menu (replaces static "service completed" message)
  async sendServiceCompletionMenu(to, completionMessage = "Your request has been processed successfully.") {
    const sections = [
      {
        title: "Support Services",
        rows: [
          {
            id: "connect_counselors",
            title: "Connect with Counselors",
            description: "Get professional mental health support"
          },
          {
            id: "anonymous_complaints",
            title: "Anonymous Complaints",
            description: "Submit anonymous concerns safely"
          },
          {
            id: "department_complaints",
            title: "Department Complaints",
            description: "Report department-specific issues"
          }
        ]
      },
      {
        title: "Information & Community",
        rows: [
          {
            id: "community",
            title: "Community Platform",
            description: "Visit our wellness community website"
          },
          {
            id: "about",
            title: "About This Service",
            description: "Learn about our support system"
          }
        ]
      }
    ];

    const menuText = `✅ Service Completed

${completionMessage} What would you like to do next?`;

    return await this.sendListMessage(to, menuText, "Explore More Services", sections);
  }

  // Send notification to HOD/Admin about new complaint with enhanced format using template message
  async notifyComplaintToAdmin(adminPhoneNumber, complaintData) {
    const { id, studentPhone, department, issueType, urgency, name } = complaintData;
    
    // Format phone number for display and WhatsApp URL
    const formattedPhone = studentPhone.startsWith('91') ? 
      `+${studentPhone}` : `+91${studentPhone}`;
    const whatsappPhone = studentPhone.startsWith('91') ? 
      studentPhone : `91${studentPhone}`;
    
    // Format submission date
    const submissionDate = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long', 
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // Send template message with direct action buttons
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: adminPhoneNumber,
        type: 'template',
        template: {
          name: 'complaint_alert', // You'll need to create this template in WhatsApp Business
          language: {
            code: 'en'
          },
          components: [
            {
              type: 'header',
              parameters: [
                {
                  type: 'text',
                  text: 'New Complaint Alert'
                }
              ]
            },
            {
              type: 'body',
              parameters: [
                {
                  type: 'text',
                  text: id
                },
                {
                  type: 'text',
                  text: issueType
                },
                {
                  type: 'text',
                  text: urgency
                },
                {
                  type: 'text',
                  text: department
                },
                {
                  type: 'text',
                  text: name
                },
                {
                  type: 'text',
                  text: formattedPhone
                },
                {
                  type: 'text',
                  text: submissionDate
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 0,
              parameters: [
                {
                  type: 'text',
                  text: id
                }
              ]
            },
            {
              type: 'button',
              sub_type: 'url',
              index: 1,
              parameters: [
                {
                  type: 'text',
                  text: whatsappPhone
                }
              ]
            }
          ]
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Template complaint alert sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Template message failed, falling back to interactive message:', error.response?.data || error.message);
      
      // Fallback to interactive message with direct URL buttons
      const alertText = `🚨 New Complaint Alert

Complaint ID: ${id}
Issue Type: ${issueType}
Urgency: ${urgency}
Department: ${department}
Raised By: ${name}
Phone: ${formattedPhone}
Submitted On: ${submissionDate}

Please choose an action:`;

      return await this.sendComplaintActionButtons(adminPhoneNumber, id, studentPhone, alertText);
    }
  }

  // Send complaint action buttons (fallback method)
  async sendComplaintActionButtons(to, complaintId, studentPhoneNumber, messageText) {
    try {
      const formattedPhone = studentPhoneNumber.startsWith('91') ? 
        studentPhoneNumber : `91${studentPhoneNumber}`;

      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: {
            text: messageText
          },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: 'Open Dashboard',
              url: `https://student-wellness-gamma.vercel.app/complaints/${complaintId}`
            }
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Complaint action buttons sent successfully:', response.data);
      
      // Send additional WhatsApp and call buttons separately
      setTimeout(async () => {
        await this.sendDirectUrlButton(
          to,
          `Contact Student: +${formattedPhone}`,
          "Message on WhatsApp",
          `https://wa.me/${formattedPhone}`
        );
      }, 1000);

      setTimeout(async () => {
        await this.sendTextMessage(
          to,
          `📞 Call Student: ${formattedPhone.startsWith('+') ? formattedPhone : '+' + formattedPhone}

Tap the number above to call directly.`
        );
      }, 2000);

      return response.data;
    } catch (error) {
      console.error('❌ Error sending complaint action buttons:', error.response?.data || error.message);
      throw error;
    }
  }

  // Handle complaint management actions
  async handleComplaintAction(from, action, actionData) {
    const actionParts = action.split('_');
    const actionType = actionParts[0];
    const urlType = actionParts[1];
    const targetData = actionParts.slice(2).join('_');

    switch (actionType) {
      case 'dashboard':
        if (urlType === 'url') {
          const complaintId = targetData;
          const dashboardUrl = `https://student-wellness-gamma.vercel.app/complaints/${complaintId}`;
          
          return await this.sendDirectUrlButton(
            from,
            `📊 Dashboard Access\n\nComplaint ID: ${complaintId}\n\nClick the button below to open the complaint dashboard:`,
            "🔗 Open Dashboard",
            dashboardUrl
          );
        }
        break;

      case 'whatsapp':
        if (urlType === 'url') {
          const studentPhone = targetData;
          const formattedPhone = studentPhone.startsWith('91') ? studentPhone : `91${studentPhone}`;
          const whatsappUrl = `https://wa.me/${formattedPhone}`;
          
          return await this.sendDirectUrlButton(
            from,
            `💬 Direct Message Student\n\nStudent Phone: +${formattedPhone}\n\nClick the button below to open WhatsApp chat:`,
            "💬 Open WhatsApp Chat",
            whatsappUrl
          );
        }
        break;

      case 'call':
        if (urlType === 'url') {
          const studentPhone = targetData;
          const formattedPhone = studentPhone.startsWith('91') ? `+${studentPhone}` : `+91${studentPhone}`;
          
          return await this.sendTextMessage(
            from,
            `📞 Call Student Directly\n\nStudent Phone: ${formattedPhone}\n\nTap the number above to call directly from WhatsApp.`
          );
        }
        break;

      default:
        return await this.sendTextMessage(from, "Action completed. The requested link or action has been processed.");
    }
  }

  // Updated direct action buttons method for cleaner complaint alerts
  async sendDirectActionButtons(to, complaintId, studentPhoneNumber, customMessage = null) {
    try {
      // Format phone number for international format (assuming Indian numbers)
      const formattedPhone = studentPhoneNumber.startsWith('91') ? 
        studentPhoneNumber : `91${studentPhoneNumber}`;
      
      const bodyText = customMessage || `🚨 *New Complaint Alert*

*Complaint ID:* ${complaintId}
*Student Phone:* +${formattedPhone}
*Submitted:* ${new Date().toLocaleString()}

Choose an action below:`;

      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: bodyText
          },
          action: {
            buttons: [
              {
                type: 'reply',
                reply: {
                  id: `dashboard_url_${complaintId}`,
                  title: '📊 Open Dashboard'
                }
              },
              {
                type: 'reply', 
                reply: {
                  id: `whatsapp_url_${studentPhoneNumber}`,
                  title: '💬 Message Student'
                }
              },
              {
                type: 'reply',
                reply: {
                  id: `call_url_${studentPhoneNumber}`,
                  title: '📞 Call Student'
                }
              }
            ]
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Direct action buttons sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending direct action buttons:', error.response?.data || error.message);
      throw error;
    }
  }

  // Send URL button message that opens directly
  async sendDirectUrlButton(to, bodyText, buttonText, url, buttonType = 'url') {
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: to,
        type: 'interactive',
        interactive: {
          type: 'cta_url',
          body: {
            text: bodyText
          },
          action: {
            name: 'cta_url',
            parameters: {
              display_text: buttonText,
              url: url
            }
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Direct URL button sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending direct URL button:', error.response?.data || error.message);
      throw error;
    }
  }
}

module.exports = new WhatsAppService(); 