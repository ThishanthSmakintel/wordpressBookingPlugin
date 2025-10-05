describe('Booking Flow E2E Tests', () => {
  beforeEach(() => {
    // Login as admin and navigate to test page
    cy.visit('/wp-admin');
    cy.get('#user_login').type('admin');
    cy.get('#user_pass').type('password');
    cy.get('#wp-submit').click();
    
    // Navigate to page with booking form
    cy.visit('/booking-test-page');
  });

  it('completes full booking flow', () => {
    // Step 1: Select Service
    cy.get('[data-testid="service-selector"]').should('be.visible');
    cy.get('[data-testid="service-option"]').first().click();
    cy.get('[data-testid="next-button"]').click();

    // Step 2: Select Employee
    cy.get('[data-testid="employee-selector"]').should('be.visible');
    cy.get('[data-testid="employee-option"]').first().click();
    cy.get('[data-testid="next-button"]').click();

    // Step 3: Select Date
    cy.get('[data-testid="date-selector"]').should('be.visible');
    cy.get('[data-testid="date-option"]').first().click();
    cy.get('[data-testid="next-button"]').click();

    // Step 4: Select Time
    cy.get('[data-testid="time-selector"]').should('be.visible');
    cy.get('[data-testid="time-slot"]:not([data-unavailable="true"])').first().click();
    cy.get('[data-testid="next-button"]').click();

    // Step 5: Fill Customer Info
    cy.get('[data-testid="customer-form"]').should('be.visible');
    cy.get('#firstName').type('John');
    cy.get('#lastName').type('Doe');
    cy.get('#email').type('john@example.com');
    cy.get('#phone').type('1234567890');
    cy.get('[data-testid="submit-button"]').click();

    // Step 6: Confirm Booking
    cy.get('[data-testid="booking-summary"]').should('be.visible');
    cy.get('[data-testid="confirm-button"]').click();

    // Step 7: Success Page
    cy.get('[data-testid="success-page"]').should('be.visible');
    cy.get('[data-testid="appointment-id"]').should('contain', 'APT-');
  });

  it('handles reschedule flow', () => {
    // Login user and navigate to dashboard
    cy.get('[data-testid="login-button"]').click();
    cy.get('#loginEmail').type('user@example.com');
    cy.get('[data-testid="send-otp"]').click();
    cy.get('#otpCode').type('123456');
    cy.get('[data-testid="verify-otp"]').click();

    // Dashboard should be visible
    cy.get('[data-testid="dashboard"]').should('be.visible');
    
    // Click reschedule on first appointment
    cy.get('[data-testid="reschedule-button"]').first().click();

    // Should navigate to date selector
    cy.get('[data-testid="date-selector"]').should('be.visible');
    cy.get('h2').should('contain', 'Rescheduling Appointment');

    // Select new date and time
    cy.get('[data-testid="date-option"]').first().click();
    cy.get('[data-testid="next-button"]').click();

    cy.get('[data-testid="time-selector"]').should('be.visible');
    cy.get('[data-testid="time-slot"]:not([data-current="true"]):not([data-unavailable="true"])').first().click();
    cy.get('[data-testid="next-button"]').click();

    // Confirm reschedule
    cy.get('[data-testid="reschedule-summary"]').should('be.visible');
    cy.get('[data-testid="confirm-reschedule"]').click();

    // Success page
    cy.get('[data-testid="reschedule-success"]').should('be.visible');
  });

  it('shows correct availability during reschedule', () => {
    // Setup: Create appointment and login
    cy.createTestAppointment('2025-01-15 14:00:00');
    cy.loginUser('user@example.com');

    // Navigate to reschedule
    cy.get('[data-testid="reschedule-button"]').first().click();
    cy.get('[data-testid="date-option"][data-date="2025-01-15"]').click();
    cy.get('[data-testid="next-button"]').click();

    // Current appointment time should be highlighted
    cy.get('[data-testid="time-slot"][data-time="14:00"]')
      .should('have.attr', 'data-current', 'true')
      .should('contain', 'Your Current Time');

    // Other booked slots should show as unavailable
    cy.get('[data-testid="time-slot"][data-unavailable="true"]')
      .should('contain', 'Booked');

    // Available slots should be clickable
    cy.get('[data-testid="time-slot"]:not([data-current="true"]):not([data-unavailable="true"])')
      .should('contain', 'Available')
      .first()
      .click();
  });
});