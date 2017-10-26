/*globals module */
/*jshint unused:false, camelcase: false */



var OktaSignIn = (function () {

  var config  = require('json!config/config'),
      _ = require('underscore'),
      $ = require('jquery');
  var URLSearchParams = require('url-search-params');

  function getProperties(authClient, LoginRouter, Util, config) {

    /**
     * Check if a session exists
     * @param callback - callback function invoked with 'true'/'false' as the argument.
     */
    function checkSession(callback) {
      authClient.session.exists().then(callback);
    }

    /**
     * Close the current session (sign-out). Callback is invoked with an error message
     * if the operation was not successful.
     * @param callback - function to invoke after closing the session.
     */
    function closeSession(callback) {
      authClient.session.close().then(callback)
      .fail(function () {
        callback('There was a problem closing the session');
      });
    }

    /**
     * Keep-alive for the session. The callback is invoked with the object containing
     * the session if successful and {status: 'INACTIVE'} if it is not successful.
     * @param callback - function to invoke after refreshing the session.
     */
    function refreshSession(callback) {
      authClient.session.refresh().then(callback)
      .fail(function() {
        callback({status: 'INACTIVE'});
      });
    }

    /**
     * Refresh the idToken
     * @param idToken - idToken generated from the OAUTH call
     * @param callback - function to invoke after refreshing the idToken.
     *        The callback will be passed a new idToken if successful and
     *        an error message if not.
     * @param opts - OAUTH options to refresh the idToken
     */
    function refreshIdToken(idToken, callback, opts) {
      authClient.idToken.refresh(opts).then(callback)
      .fail(function () {
        callback('There was a problem refreshing the id_token');
      });
    }

    /**
     * Check if there is an active session. If there is one, the callback is invoked with
     * the session and user information (similar to calling the global success callback)
     * and if not, the callback is invoked with {status: 'INACTIVE'}, at which point,
     * the widget can be rendered using renderEl().
     * @param callback - function to invoke after checking if there is an active session.
     */
    function getSession(callback) {
      authClient.session.get()
      .then(function(res) {
        if (res.status === 'ACTIVE' && res.user) {
          // only include the attributes that are passed into the successFn on primary auth.
          res.user = _.pick(res.user, 'id', 'profile', 'passwordChanged');
        }
        callback(res);
      });
    }

    /**
     * Render the sign in widget to an element.
     * @param options - options for the signin widget.
     *        Must have an el or $el property to render the widget to.
     * @param success - success callback function
     * @param error - error callback function
     */
    function render(options, success, error) {
      var router = new LoginRouter(_.extend({}, config, options, {
        authClient: authClient,
        globalSuccessFn: success,
        globalErrorFn: error
      }));
      router.start();
    }

    /**
     * Check if tokens have been passed back into the url, which happens in
     * the social auth IDP redirect flow.
     */
    function hasTokensInUrl() {
      return Util.hasTokensInHash(window.location.hash);
    }

    /**
     * Parses tokens from the url.
     * @param success - success callback function (usually the same as passed to render)
     * @param error - error callback function (usually the same as passed to render)
     */
    function parseTokensFromUrl(success, error) {
      authClient.token.parseFromUrl()
      .then(success)
      .fail(error);
    }

    // Properties exposed on OktaSignIn object.
    return {
      renderEl: render,
      signOut: closeSession,
      idToken: {
        refresh: refreshIdToken
      },
      session: {
        close: closeSession,
        exists: checkSession,
        get: getSession,
        refresh: refreshSession
      },
      token: {
        hasTokensInUrl: hasTokensInUrl,
        parseTokensFromUrl: parseTokensFromUrl
      },
      tokenManager: authClient.tokenManager
    };
  }

  function OktaSignIn(options) {
    var OktaAuth, Util, authClient, LoginRouter;

    // Modify the underscore, handlebars, and jquery modules
    // Remove once these are explicitly required in Courage
    require('vendor/lib/underscore-wrapper');
    require('vendor/lib/handlebars-wrapper');
    require('vendor/lib/jquery-wrapper');

    var ajaxRequest = function jqueryRequest(method, url, args) {
      var deferred = $.Deferred();
      $.ajax({
        type: method,
        url: url,
        headers: args.headers,
        data: JSON.stringify(args.data),
        xhrFields: {
          withCredentials: true
        }
      })
      .then(function(data, textStatus, jqXHR) {
        delete jqXHR.then;
        deferred.resolve(jqXHR);
      }, function(jqXHR) {
        delete jqXHR.then;
        deferred.reject(jqXHR);
      });
      return deferred;
    }

    OktaAuth = require('util/CLQAuth');
    Util = require('util/Util');
    LoginRouter = require('LoginRouter');

    // Add in backdoor around disabled login
    var params = new URLSearchParams(window.location.search.slice(1));
    if (params.get('forcedEntry') && params.get('forcedEntry')==='true') {
      options.disableLogin = false;
    }

    authClient = new OktaAuth({
      url: options.baseUrl, // URL for okta, regular calls
      clqUrl: options.clqUrl, // URL for calls that are passed through CLQ
      notification: options.notification, // Either a message to display or false/undefined
      disableLogin: options.disableLogin, // true/false to disable login
      transformErrorXHR: Util.transformErrorXHR,
      headers: {
        'X-Okta-User-Agent-Extended': 'okta-signin-widget-' + config.version
      },
      clientId: options.clientId,
      redirectUri: options.redirectUri,
      ajaxRequest: ajaxRequest
    });

    // New options must be added separately
    authClient.options.clqUrl = options.clqUrl;
    authClient.options.notification = options.notification,
    authClient.options.disableLogin = options.disableLogin,
    
    _.extend(this, LoginRouter.prototype.Events, getProperties(authClient, LoginRouter, Util, options));

    // Triggers the event up the chain so it is available to the consumers of the widget.
    this.listenTo(LoginRouter.prototype, 'all', this.trigger);

  }

  return OktaSignIn;

})();

module.exports = OktaSignIn;
