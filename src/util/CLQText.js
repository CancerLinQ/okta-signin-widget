var CLQText = (function() {
  return {
    // CLQ custom text
    'error.auth.lockedOut.selfUnlock': 'Your account was locked due to excessive attempts. To protect your security, please unlock your account',
    'error.expired.accountUnlockToken': 'Session expired, please request a new account unlock',
    'error.expired.passwordResetToken': 'Session expired, please request a new password reset',
    'error.expired.createUserToken': 'Session expired, please contact your administrator or PAU',
    'error.password.complexity': 'Your password does not meet the complexity requirements',
    'usercreation.title': 'Enter password and security question',
    'usercreation.failure': 'There was an issue during creation, please contact your admin',
    'usercreationsuccess.title': 'User successfully created',
    'usercreationsuccess.subtitle': 'Please return and log in to access CLQ'

    // Over-write existing widget text
    /*
    enroll.choices.description = Your company requires multifactor authentication to add an additional layer of security when signing into your Okta account
    factor.u2f.description = Use a Universal 2nd Factor (U2F) security key to sign on to Okta.
    password.reset.title = Reset your Okta password
    password.expired.title = Your Okta password has expired
    password.expiring.subtitle = When password expires you may be locked out of Okta Mobile, mobile email, and other services.
     */
  }
})();

module.exports = CLQText;