// Custom urls that redirect to CLQ service rather than Okta API Service
// Custom class wraps the Okta API while modifying the necessary APIs
var CLQAuth = (function() {
  OktaAuth = require('@okta/okta-auth-js/jquery');
  tx = require('@okta/okta-auth-js/lib/tx');
  http = require('@okta/okta-auth-js/lib/http');
  
  OktaAuth.prototype.forgotPassword = function(opts) {
    return tx.postToTransaction(this, this.options.clqUrl + '/asco/dev/commons/security/login/xs/api/resetPasswordRequest', opts);
  };

  OktaAuth.prototype.verifyRecoveryToken = function (opts) {
    return tx.postToTransaction(this, this.options.clqUrl + '/asco/dev/commons/security/login/xs/api/verifyRecoveryToken', opts);
  };

  OktaAuth.prototype.verifyAccountCreationRecoveryToken = function (opts) {
    return tx.postToTransaction(this, this.options.clqUrl + '/asco/dev/commons/security/login/xs/api/accountCreationRecoveryToken', opts);
  };

  OktaAuth.prototype.unlockAccount = function(opts) {
    return tx.postToTransaction(this, this.options.clqUrl + '/asco/dev/commons/security/login/xs/api/unlockAccountRequest', opts);
  };

  OktaAuth.prototype.signIn = function(opts) {
    return tx.postToTransaction(this, this.options.clqUrl + '/asco/dev/commons/security/login/xs/api/signIn', opts);
  };

  OktaAuth.prototype.signUp = function(opts) {
    return tx.postToTransaction(this, this.options.clqUrl + '/asco/dev/commons/security/login/xs/api/signUp', opts);
  };

  OktaAuth.prototype.checkUsername = function(opts) {
    return tx.postToTransaction(this, this.options.clqUrl + '/asco/dev/commons/security/login/xs/api/checkUsername', opts);
  };


  return OktaAuth;

})();

module.exports = CLQAuth;