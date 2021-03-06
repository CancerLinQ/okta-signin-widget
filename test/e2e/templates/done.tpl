// OIDC Redirect Flow - this is the page that is redirected to with
// tokens in the parameters

function addMessageToPage(id, msg) {
  var appNode = document.createElement('div');
  appNode.setAttribute('id', id);
  appNode.innerHTML = msg;
  document.body.appendChild(appNode);
}

var oktaSignIn = new OktaSignIn({
  'baseUrl': '{{{WIDGET_TEST_SERVER}}}',
  'clientId': 'rW47c465c1wc3MKzHznu'
});

if (oktaSignIn.token.hasTokensInUrl()) {
  oktaSignIn.token.parseTokensFromUrl(
    function (res) {
      addMessageToPage('idtoken_user', res.claims.name);
    },
    function (err) {
      addMessageToPage('oidc_error', JSON.stringify(err));
    }
  );
}

