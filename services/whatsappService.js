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

    // Dashboard URL
    const dashboardUrl = `https://student-wellness-gamma.vercel.app/complaints/${id}`;
    
    // WhatsApp chat URL
    const whatsappUrl = `https://wa.me/${whatsappPhone}`;

    const alertText = `🚨 *NEW COMPLAINT ALERT*

*Complaint ID:* ${id}
*Issue Type:* ${issueType}
*Urgency Level:* ${urgency}
*Department:* ${department}
*Raised By:* ${name}
*Phone Number:* ${formattedPhone}
*Submitted On:* ${submissionDate}

Please take appropriate action using the buttons below:`;

    // Send single message with all 3 direct action buttons
    try {
      const data = {
        messaging_product: 'whatsapp',
        to: adminPhoneNumber,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: {
            text: alertText
          },
          action: {
            buttons: [
              {
                type: 'url',
                url: dashboardUrl,
                text: '📊 Open Dashboard'
              },
              {
                type: 'url', 
                url: whatsappUrl,
                text: '💬 Message Student'
              },
              {
                type: 'phone_number',
                phone_number: formattedPhone,
                text: '📞 Call Student'
              }
            ]
          }
        }
      };

      const response = await axios.post(this.baseURL, data, { headers: this.headers });
      console.log('✅ Professional complaint alert with direct action buttons sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error sending complaint alert:', error.response?.data || error.message);
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