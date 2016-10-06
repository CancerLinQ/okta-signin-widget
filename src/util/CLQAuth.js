// Custom urls that redirect to CLQ service rather than Okta API Service
// Custom class wraps the Okta API while modifying the necessary APIs
var CLQAuth = (function() {
  OktaAuth = require('@okta/okta-auth-js/jquery');
  tx = require('@okta/okta-auth-js/lib/tx');
  
  OktaAuth.prototype.forgotPassword = function(opts) {
    return tx.postToTransaction(this, '/asco/dev/commons/security/login/xs/api/resetPasswordRequest', opts);
  };

  OktaAuth.prototype.verifyRecoveryToken = function (opts) {
    return tx.postToTransaction(this, '/asco/dev/commons/security/login/xs/api/verifyRecoveryToken', opts);
  };

  OktaAuth.prototype.unlockAccount = function(opts) {
    return tx.postToTransaction(this, '/asco/dev/commons/security/login/xs/api/unlockAccountRequest', opts);
  };

  OktaAuth.prototype.signIn = function(opts) {
    return tx.postToTransaction(this, 'temp', opts);
  };

  OktaAuth.prototype.signUp = function(opts) {
    return tx.postToTransaction(this, 'temp', opts);
  };


  return OktaAuth;

})();

module.exports = CLQAuth;