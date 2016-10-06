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
  'views/shared/FooterSignout',
  'views/shared/TextBox'
],
function (Okta, FormController, FormType, ValidationUtil, FooterSignout, TextBox) {

  var _ = Okta._;

  return FormController.extend({
    className: 'create-user',
    Model: {
      props: {
        newPassword: ['string', true],
        confirmPassword: ['string', true],
        question: 'string',
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
        return this.doTransaction(function(transaction) {
          return transaction
          .resetPassword({
            newPassword: self.get('newPassword')
          });
        });
      }
    },
    Form: {
      save: _.partial(Okta.loc, 'password.reset', 'login'),
      title: _.partial(Okta.loc, 'password.reset.title', 'login'),
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
        });

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
            //name: 'answer',
            input: TextBox,
            type: 'text',
            params: {
              innerTooltip: Okta.loc('mfa.challenge.answer.tooltip', 'login')
            }
          })
        ];
      }
    },
    Footer: FooterSignout,

    initialize: function () {
      this.listenTo(this.form, 'save', function () {
        var processCreds = this.settings.get('processCreds');
        if (_.isFunction(processCreds)) {
          processCreds({
            username: this.options.appState.get('userEmail'),
            password: this.model.get('newPassword')
            
          });
        }
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
        return http.get(self.settings.authClient, 'https://cancerlinq.oktapreview.com/api/v1/users/00u829stnwnkWBj340h7/factors/questions')
      })
      .then(function(questionRes) {
        var questions = {};
        _.each(questionsRes, function(question) {
          questions[question.question] = question.questionText;
        });
        self.model.set('securityQuestions', questions);
      });
    }

  });

});
