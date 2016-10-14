
define(['okta', 'util/FormController'], function (Okta, FormController) {

  return FormController.extend({
    className: 'recovery-loading',

    Model: {},
    Form: {
      noButtonBar: true
    },

    initialize: function (options) {
      var self = this;
      return this.model.startTransaction(function (authClient) {
        return authClient.verifyAccountCreationRecoveryToken({
          recoveryToken: options.token
        });
      })
      .fail(function () {
        self.options.appState.trigger('loading', false);
      });
    },

    preRender: function () {
      this.options.appState.trigger('loading', true);
    },

    trapAuthResponse: function () {
      this.options.appState.trigger('loading', false);
      return false;
    }

  });
});
