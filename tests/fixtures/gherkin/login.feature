Feature: User Login
  As a user
  I want to login to the application
  So that I can access my account

  Scenario: Successful login with valid credentials
    Given I am on the login page
    When I enter valid username "user@example.com"
    And I enter valid password "password123"
    And I click the login button
    Then I should be redirected to the dashboard
    And I should see a welcome message

  Scenario: Failed login with invalid credentials
    Given I am on the login page
    When I enter invalid username "wrong@example.com"
    And I enter invalid password "wrongpass"
    And I click the login button
    Then I should see an error message "Invalid credentials"
    And I should remain on the login page
