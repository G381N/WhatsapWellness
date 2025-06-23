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

  // Counselor questionnaire states with interactive options
  getCounselorQuestions() {
    return [
      {
        key: 'issue_description',
        question: 'What specific issue or concern would you like to discuss with a counselor?\n\nPlease describe your situation in your own words.',
        state: 'counselor_q1',
        type: 'text' // This one stays as text input for detailed description
      },
      {
        key: 'issue_duration',
        question: 'How long have you been experiencing this issue?',
        state: 'counselor_q2',
        type: 'list',
        options: [
          { id: 'duration_1', title: 'Less than a week', value: 'Less than a week' },
          { id: 'duration_2', title: '1-2 weeks', value: '1-2 weeks' },
          { id: 'duration_3', title: '1 month', value: '1 month' },
          { id: 'duration_4', title: 'More than a month', value: 'More than a month' },
          { id: 'duration_5', title: 'Several months', value: 'Several months' }
        ]
      },
      {
        key: 'previous_help',
        question: 'Have you sought help for this issue before?',
        state: 'counselor_q3',
        type: 'list',
        options: [
          { id: 'help_1', title: 'Professional counselor', value: 'Yes, from a professional counselor' },
          { id: 'help_2', title: 'Friends/family', value: 'Yes, from friends/family' },
          { id: 'help_3', title: 'Online resources', value: 'Yes, from online resources' },
          { id: 'help_4', title: 'First time seeking help', value: 'No, this is my first time seeking help' }
        ]
      },
      {
        key: 'urgency_level',
        question: 'How urgent do you feel your need for support is?',
        state: 'counselor_q4',
        type: 'list',
        options: [
          { id: 'urgency_1', title: 'Very urgent', value: 'Very urgent - need immediate help' },
          { id: 'urgency_2', title: 'Somewhat urgent', value: 'Somewhat urgent - within this week' },
          { id: 'urgency_3', title: 'Moderate', value: 'Moderate - within 2 weeks' },
          { id: 'urgency_4', title: 'Not urgent', value: 'Not urgent - flexible timing' }
        ]
      },
      {
        key: 'preferred_contact',
        question: 'How would you prefer the counselor to contact you?',
        state: 'counselor_q5',
        type: 'list',
        options: [
          { id: 'contact_1', title: 'WhatsApp message', value: 'WhatsApp message' },
          { id: 'contact_2', title: 'Phone call', value: 'Phone call' },
          { id: 'contact_3', title: 'Email', value: 'Email' },
          { id: 'contact_4', title: 'In-person meeting', value: 'In-person meeting' },
          { id: 'contact_5', title: 'Video call', value: 'Video call' }
        ]
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