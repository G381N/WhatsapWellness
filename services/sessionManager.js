class SessionManager {
  constructor() {
    // In-memory storage for user sessions (use Redis in production)
    this.sessions = new Map();
  }

  // Get user session
  getSession(phoneNumber) {
    if (!this.sessions.has(phoneNumber)) {
      this.sessions.set(phoneNumber, {
        state: 'initial',
        data: {},
        createdAt: new Date(),
        lastActivity: new Date()
      });
    }
    return this.sessions.get(phoneNumber);
  }

  // Update user session
  updateSession(phoneNumber, updates) {
    const session = this.getSession(phoneNumber);
    Object.assign(session, updates, { lastActivity: new Date() });
    this.sessions.set(phoneNumber, session);
    return session;
  }

  // Set user state
  setState(phoneNumber, state) {
    const session = this.getSession(phoneNumber);
    session.state = state;
    session.lastActivity = new Date();
    this.sessions.set(phoneNumber, session);
  }

  // Get user state
  getState(phoneNumber) {
    const session = this.getSession(phoneNumber);
    return session.state;
  }

  // Store data in session
  setData(phoneNumber, key, value) {
    const session = this.getSession(phoneNumber);
    session.data[key] = value;
    session.lastActivity = new Date();
    this.sessions.set(phoneNumber, session);
  }

  // Get data from session
  getData(phoneNumber, key) {
    const session = this.getSession(phoneNumber);
    return session.data[key];
  }

  // Clear session
  clearSession(phoneNumber) {
    this.sessions.delete(phoneNumber);
  }

  // Clean up old sessions (run periodically)
  cleanupOldSessions() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [phoneNumber, session] of this.sessions.entries()) {
      if (now - session.lastActivity > maxAge) {
        this.sessions.delete(phoneNumber);
      }
    }
  }

  // Get all session data for a user
  getAllData(phoneNumber) {
    const session = this.getSession(phoneNumber);
    return session.data;
  }

  // Counselor questionnaire states
  getCounselorQuestions() {
    return [
      {
        key: 'issue_description',
        question: '🤔 What specific issue or concern would you like to discuss with a counselor?\n\nPlease describe your situation in your own words.',
        state: 'counselor_q1'
      },
      {
        key: 'issue_duration',
        question: '⏰ How long have you been experiencing this issue?\n\nPlease choose:\n1️⃣ Less than a week\n2️⃣ 1-2 weeks\n3️⃣ 1 month\n4️⃣ More than a month\n5️⃣ Several months',
        state: 'counselor_q2'
      },
      {
        key: 'previous_help',
        question: '🔄 Have you sought help for this issue before?\n\nPlease choose:\n1️⃣ Yes, from a professional counselor\n2️⃣ Yes, from friends/family\n3️⃣ Yes, from online resources\n4️⃣ No, this is my first time seeking help',
        state: 'counselor_q3'
      },
      {
        key: 'urgency_level',
        question: '🚨 How urgent do you feel your need for support is?\n\nPlease choose:\n1️⃣ Very urgent - need immediate help\n2️⃣ Somewhat urgent - within this week\n3️⃣ Moderate - within 2 weeks\n4️⃣ Not urgent - flexible timing',
        state: 'counselor_q4'
      },
      {
        key: 'preferred_contact',
        question: '📞 How would you prefer the counselor to contact you?\n\nPlease choose:\n1️⃣ WhatsApp message\n2️⃣ Phone call\n3️⃣ Email\n4️⃣ In-person meeting\n5️⃣ Video call',
        state: 'counselor_q5'
      }
    ];
  }

  // Get current question for counselor flow
  getCurrentQuestion(phoneNumber) {
    const questions = this.getCounselorQuestions();
    const currentState = this.getState(phoneNumber);
    
    return questions.find(q => q.state === currentState);
  }

  // Get next question for counselor flow
  getNextQuestion(phoneNumber) {
    const questions = this.getCounselorQuestions();
    const currentState = this.getState(phoneNumber);
    const currentIndex = questions.findIndex(q => q.state === currentState);
    
    if (currentIndex >= 0 && currentIndex < questions.length - 1) {
      return questions[currentIndex + 1];
    }
    return null;
  }

  // Check if counselor questionnaire is complete
  isCounselorQuestionnaireComplete(phoneNumber) {
    const questions = this.getCounselorQuestions();
    const userData = this.getAllData(phoneNumber);
    
    return questions.every(q => userData[q.key]);
  }
}

// Export singleton instance
module.exports = new SessionManager(); 