/*!
 * Copyright (c) 2015-2016, Okta, Inc. and/or its affiliates. All rights reserved.
 * The Okta software accompanied by this notice is provided pursuant to the Apache License, Version 2.0 (the "License.")
 *
 * You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0.
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *
 * See the License for the specific language governing permissions and limitations under the License.
 */

define([
  'okta',
  'util/FormController',
  'util/FormType',
  'util/ValidationUtil',
  'views/enroll-factors/BackToSigninFooter',
  'views/shared/TextBox'
],
function (Okta, FormController, FormType, ValidationUtil, BackToSigninFooter, TextBox) {

  var _ = Okta._;

  return FormController.extend({
    className: 'create-user',
    Model: {
      props: {
        newPassword: ['string', true],
        confirmPassword: ['string', true],
        question: ['string', true],
        answer: ['string', true]
      },
      local: {
        securityQuestions: 'object'
      },
      validate: function () {
        return ValidationUtil.validatePasswordMatch(this);
      },
      save: function () {
        var self = this;

        // http://stackoverflow.com/questions/979975/how-to-get-the-value-from-the-get-parameters
        var gup = function( name, url ) {
          if (!url) url = location.href;
          name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
          var regexS = "[\\?&]"+name+"=([^&#]*)";
          var regex = new RegExp( regexS );
          var results = regex.exec( url );
          return results == null ? null : results[1];
        }

        return this.startTransaction (function(authClient) {
          return authClient.signUp({
            password: self.get('newPassword'),
            question: self.get('question'),
            answer: self.get('answer'),
            token: gup('recoveryToken', window.location.search)
          })
          .then( function(transaction) {
            console.log(JSON.stringify(transaction));
            // Need to display errors if they are passed in.
            self.options.appState.trigger('navigate', 'signin/created-user');
          })
          .fail(function() {
            console.log("submit form failed");
          })
        });
      }
    },
    Form: {
      autosave: true,
      title: _.partial(Okta.loc, 'usercreation.title', 'login'),
      subtitle: function () {
        var policy = this.options.appState.get('policy');
        if (!policy || !policy.complexity) {
          return;
        }

        var fields = {
          minLength: {i18n: 'password.complexity.length', args: true},
          minLowerCase: {i18n: 'password.complexity.lowercase'},
          minUpperCase: {i18n: 'password.complexity.uppercase'},
          minNumber: {i18n: 'password.complexity.number'},
          minSymbol: {i18n: 'password.complexity.symbol'},
          excludeUsername: {i18n: 'password.complexity.no_username'}
        };

        var requirements = _.map(policy.complexity, function (complexityValue, complexityType) {
        var params = fields[complexityType];

        return params.args ?
          Okta.loc(params.i18n, 'login', [complexityValue]) : Okta.loc(params.i18n, 'login');
        });s

        if (requirements.length) {
          requirements = _.reduce(requirements, function (result, requirement) {
            return result ?
              (result + Okta.loc('password.complexity.list.element', 'login', [requirement])) :
              requirement;
          });

          return Okta.loc('password.complexity.description', 'login', [requirements]);
        }
      },
      formChildren: function () {
        return [
          FormType.Input({
            placeholder: Okta.loc('password.newPassword.placeholder', 'login'),
            name: 'newPassword',
            input: TextBox,
            type: 'password',
            params: {
              innerTooltip: Okta.loc('password.newPassword.tooltip', 'login'),
              icon: 'credentials-16'
            }
          }),
          FormType.Input({
            placeholder: Okta.loc('password.confirmPassword.placeholder', 'login'),
            name: 'confirmPassword',
            input: TextBox,
            type: 'password',
            params: {
              innerTooltip: Okta.loc('password.confirmPassword.tooltip', 'login'),
              icon: 'credentials-16'
            }
          }),
          // CLQ change to styling in sass/widgets/_chosen.scss
          // Needed in order to properly align dropdown with rest of widget. 
          // For unknown reason, the dropdown's absolute positioning is shifted
          // 100 pixels down resulting in improper display. During investigation 
          // of cause, noticed that in target/js/shared/views/forms/inputs/Select.js
          // the function recalculateChosen $clone.offset() returns a top offset
          // that is 100 pixels more than it should be therefore causing the issue.
          // Note: Revisit and identify the source of the issue rather than
          // implementing an !important css edit.
          FormType.Input({
            label: false,
            'label-top': true,
            name: 'question',
            type: 'select',
            wide: true,
            options: function () {
              return this.model.get('securityQuestions');
            },
            params: {
              searchThreshold: 25
            }
          }),
          FormType.Input({
            label: false,
            'label-top': true,
            placeholder: Okta.loc('mfa.challenge.answer.placeholder', 'login'),
            className: 'o-form-fieldset o-form-label-top auth-passcode',
            name: 'answer',
            input: TextBox,
            type: 'text',
            params: {
              innerTooltip: Okta.loc('mfa.challenge.answer.tooltip', 'login')
            }
          })
        ];
      }
    },
    Footer: BackToSigninFooter,

    initialize: function () {
      this.listenTo(this.form, 'save', function () {
        // var processCreds = this.settings.get('processCreds');
        // if (_.isFunction(processCreds)) {
        //   processCreds({
        //     username: this.options.appState.get('userEmail'),
        //     password: this.model.get('newPassword')
            
        //   });
        // }
        this.model.save();
      });
    },

    fetchInitialData: function() {
      var http = require('@okta/okta-auth-js/lib/http');

      var self = this;
      return this.model.manageTransaction(function(transaction) {
        /* Original code commented out for CLQ edits

        var factor = _.findWhere(transaction.factors, {
          factorType: 'question',
          provider: 'OKTA'
        });
        return factor.questions(); */
        var factor = {
          "enrollment": "OPTIONAL",
          "status": "NOT_SETUP",
          "factorType": "question",
          "provider": "OKTA",
          "vendorName": "OKTA"
        };
        factor.questions = function() {
          return http.get(self.settings.getAuthClient(), 
            self.settings.attributes.oktaUrl + '/api/v1/users/00u829stnwnkWBj340h7/factors/questions')
        }
        return factor.questions();
      })
      .then(function(questionRes) {
        var questions = {};
        for (var i = 0; i < questionRes.length; i++) {
          questions[questionRes[i].question] = questionRes[i].questionText;
        }

        // Original code below was causing errors for unknown reason
        // _.each(questionsRes, function(question) {
          // questions[question.question] = question.questionText;
        // });
        self.model.set('securityQuestions', questions);
      });
    }

  });

});
