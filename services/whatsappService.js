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
        title: "Engineering",
        rows: [
          {
            id: "dept_cse",
            title: "Computer Science",
            description: "Computer Science & Engineering"
          },
          {
            id: "dept_ece",
            title: "Electronics",
            description: "Electronics & Communication"
          },
          {
            id: "dept_mech",
            title: "Mechanical",
            description: "Mechanical Engineering"
          },
          {
            id: "dept_civil",
            title: "Civil",
            description: "Civil Engineering"
          }
        ]
      },
      {
        title: "Business & Commerce",
        rows: [
          {
            id: "dept_bba",
            title: "Business Admin",
            description: "Business Administration"
          },
          {
            id: "dept_commerce",
            title: "Commerce",
            description: "Commerce Department"
          }
        ]
      },
      {
        title: "Health Sciences",
        rows: [
          {
            id: "dept_medicine",
            title: "Medicine",
            description: "Medical Department"
          },
          {
            id: "dept_nursing",
            title: "Nursing",
            description: "Nursing Department"
          },
          {
            id: "dept_physio",
            title: "Physiotherapy",
            description: "Physiotherapy Department"
          },
          {
            id: "dept_pharmacy",
            title: "Pharmacy",
            description: "Pharmacy Department"
          }
        ]
      },
      {
        title: "Liberal Arts",
        rows: [
          {
            id: "dept_psychology",
            title: "Psychology",
            description: "Psychology Department"
          },
          {
            id: "dept_social_work",
            title: "Social Work",
            description: "Social Work Department"
          },
          {
            id: "dept_arts",
            title: "Arts & Humanities",
            description: "Arts & Humanities"
          },
          {
            id: "dept_law",
            title: "Law",
            description: "Law Department"
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

  // Send complaint category selection
  async sendComplaintCategorySelection(to) {
    const sections = [
      {
        title: "Academic Issues",
        rows: [
          {
            id: "cat_academic",
            title: "Academic Issues",
            description: "Course, curriculum, or academic concerns"
          },
          {
            id: "cat_faculty",
            title: "Faculty Concerns",
            description: "Issues related to faculty or teaching"
          },
          {
            id: "cat_examination",
            title: "Examination Issues",
            description: "Problems with exams or evaluation"
          }
        ]
      },
      {
        title: "Infrastructure & Services",
        rows: [
          {
            id: "cat_infrastructure",
            title: "Infrastructure",
            description: "Buildings, facilities, or equipment issues"
          },
          {
            id: "cat_library",
            title: "Library Issues",
            description: "Library services or resources"
          },
          {
            id: "cat_canteen",
            title: "Canteen/Food",
            description: "Food quality or canteen services"
          },
          {
            id: "cat_transport",
            title: "Transport Issues",
            description: "College transportation problems"
          }
        ]
      },
      {
        title: "Administrative & Others",
        rows: [
          {
            id: "cat_admin",
            title: "Administrative",
            description: "Administrative processes or staff"
          },
          {
            id: "cat_fees",
            title: "Fee/Financial",
            description: "Fee payment or financial issues"
          },
          {
            id: "cat_harassment",
            title: "Harassment/Safety",
            description: "Harassment, discrimination, or safety"
          },
          {
            id: "cat_hostel",
            title: "Hostel Issues",
            description: "Hostel facilities or services"
          },
          {
            id: "cat_other",
            title: "Other",
            description: "Any other concerns"
          }
        ]
      }
    ];

    return await this.sendListMessage(
      to,
      "Please select the category that best describes your complaint:",
      "Choose Category",
      sections
    );
  }

  // Send severity selection
  async sendSeveritySelection(to) {
    const buttons = [
      { id: "severity_low", title: "Low Priority" },
      { id: "severity_medium", title: "Medium Priority" },
      { id: "severity_high", title: "High Priority" },
      { id: "severity_critical", title: "Critical/Urgent" }
    ];

    return await this.sendButtonMessage(
      to,
      "How urgent is this complaint?\n\nPlease select the priority level:",
      buttons
    );
  }

  // Get department name from ID
  getDepartmentNameFromId(deptId) {
    const departmentMap = {
      'dept_cse': 'Computer Science & Engineering',
      'dept_ece': 'Electronics & Communication',
      'dept_mech': 'Mechanical Engineering',
      'dept_civil': 'Civil Engineering',
      'dept_bba': 'Business Administration',
      'dept_commerce': 'Commerce',
      'dept_medicine': 'Medicine',
      'dept_nursing': 'Nursing',
      'dept_physio': 'Physiotherapy',
      'dept_pharmacy': 'Pharmacy',
      'dept_psychology': 'Psychology',
      'dept_social_work': 'Social Work',
      'dept_arts': 'Arts & Humanities',
      'dept_law': 'Law'
    };
    
    return departmentMap[deptId] || 'Unknown Department';
  }

  // Get category name from ID
  getCategoryNameFromId(catId) {
    const categoryMap = {
      'cat_academic': 'Academic Issues',
      'cat_faculty': 'Faculty Concerns',
      'cat_examination': 'Examination Problems',
      'cat_infrastructure': 'Infrastructure Problems',
      'cat_library': 'Library Issues',
      'cat_canteen': 'Canteen/Food Issues',
      'cat_transport': 'Transport Issues',
      'cat_admin': 'Administrative Issues',
      'cat_fees': 'Fee/Financial Issues',
      'cat_harassment': 'Harassment/Discrimination',
      'cat_hostel': 'Hostel Issues',
      'cat_other': 'Other'
    };
    
    return categoryMap[catId] || 'Other';
  }

  // Get severity name from ID
  getSeverityNameFromId(severityId) {
    const severityMap = {
      'severity_low': 'Low',
      'severity_medium': 'Medium',
      'severity_high': 'High',
      'severity_critical': 'Critical'
    };
    
    return severityMap[severityId] || 'Medium';
  }
}

module.exports = new WhatsAppService(); 