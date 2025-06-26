const axios = require('axios');

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

Welcome to *Christ University Student Wellness Support System*

*Privacy Notice:* This WhatsApp chat is completely anonymous and confidential. Your conversations are secure and private.

*We're here for you!* This platform is designed to:
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

  // Send department selection
  async sendDepartmentSelection(to) {
    const sections = [
      {
        title: "School of Sciences",
        rows: [
          {
            id: "dept_mca",
            title: "MCA",
            description: "Master of Computer Applications"
          },
          {
            id: "dept_msc_aiml",
            title: "MSC AIML",
            description: "MSc Artificial Intelligence & Machine Learning"
          }
        ]
      }
    ];

    return await this.sendListMessage(
      to,
      "Please select your department:",
      "Choose Department",
      sections
    );
  }
}

module.exports = new WhatsAppService(); 