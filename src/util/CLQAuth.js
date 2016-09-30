var CLQAuth = (function() {
  OktaAuth = require('@okta/okta-auth-js/jquery');
  tx = require('@okta/okta-auth-js/lib/tx');

  // Custom urls that redirect to CLQ service rather than Okta API Service
  // Custom class wraps the Okta API while modifying the necessary APIs
  OktaAuth.prototype.forgotPassword = function(opts) {
    return tx.postToTransaction(this, '/asco/dev/commons/security/okta/xs/api/resetPasswordRequest', opts);
  };

  OktaAuth.prototype.unlockAccount = function(opts) {
    return tx.postToTransaction(this, 'temp', opts);
  };

  OktaAuth.prototype.signUp = function(opts) {
    return tx.postToTransaction(this, 'temp', opts);
  }

  return OktaAuth;

})();

module.exports = CLQAuth;