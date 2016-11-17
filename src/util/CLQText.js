var CLQText = (function() {
  return {
    // CLQ custom text
    'error.auth.lockedOut.selfUnlock': 'Your account has been locked. Please request a link to unlock your account below.',
    'error.expired.accountUnlockToken': 'The link has expired. To request a new link, click below: Need help signing in? and Unlock account?',
    'error.expired.passwordResetToken': 'The link has expired. To request a new link, click below: Need help signing in? and Forgot password?',
    'error.expired.createUserToken': "The link has expired. Please contact your practice's Primary Account User.",
    'error.password.complexity': 'Your password does not meet the minimum requirements.',
    'error.security.answer.length': 'Answers must be at least 4 characters in length.',
    'usercreation.title': 'Please enter your new password and security question.',
    'usercreation.failure': "There was an issue creating your account. Please contact your practice's Primary Account User.",
    'usercreation.signup': 'Submit',
    'usercreationsuccess.title': 'Your account was successfully created',
    'usercreationsuccess.subtitle': 'Please click the button below to log in to CancerLinQ',
    'goback.login': 'Back to Log In',

    // Over-write existing widget text
    "account.unlock.sendEmail": "Request via Email",
    "account.unlock.email.or.username.placeholder": "Email",
    "account.unlock.email.or.username.tooltip": "Email",
    'enroll.choices.description' : 'CancerLinQ requires multifactor authentication as an additional security measure when signing in',
    'factor.u2f.description' : 'Use a Universal 2nd Factor (U2F) security key to sign on to CancerLinQ.',
    'password.reset.title' : 'Reset your CancerLinQ Password',
    'password.forgot.emailSent.desc' : 'An email has been sent to {0} with instructions on how to reset your password.',
    "password.forgot.email.or.username.placeholder": "Email",
    "password.forgot.email.or.username.tooltip": "Email",
    'password.expired.title' : 'Your CancerLinQ password has expired',
    'password.expiring.subtitle' : 'When password expires you may be locked out of Okta Mobile, mobile email, and other services.',
    'password.forgot.question.title' : 'Please answer your security question'
  }
})();

module.exports = CLQText;