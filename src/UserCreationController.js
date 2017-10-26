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
  'util/Util',
  'views/shared/FooterSignout',
  'views/shared/TextBox'
],
function (Okta, FormController, FormType, ValidationUtil, Util, FooterSignout, TextBox) {

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
        var rv = {};
        var passwordComplexEnough = ValidationUtil.validatePasswordComplexity(this.get("newPassword"));
        if (passwordComplexEnough) {_.extend(rv, passwordComplexEnough);}
        var answerLongEnough = ValidationUtil.validateAnswerLength(this.get("answer"));
        if (answerLongEnough) {_.extend(rv, answerLongEnough);}
        var passwordMatch = ValidationUtil.validatePasswordMatch(this);
        if (passwordMatch) {_.extend(rv, passwordMatch);}
        return rv;
      },
      save: function () {
        var self = this;        

        return this.startTransaction (function(authClient) {
          return authClient.signUp({
            password: self.get('newPassword'),
            question: self.get('question'),
            answer: self.get('answer'),
            token: Util.gup('recoveryToken', window.location.search)
          })
          .then( function(transaction) {
            // Need to display errors if they are passed in.
            self.options.appState.trigger('navigate', 'signin/created-user');
          })
          .fail(function(e) {
            var msg, location;
            switch (e.errorCode) {
              case 'E0000011': // Invalid token 
                msg = Okta.loc('error.expired.createUserToken');
                location = '';
                break;
              case 'E0000001': // API validation
                if (e.errorSummary === 'Api validation failed: password') {
                  msg = Okta.loc('error.password.complexity');
                  loc = 'signin/create-user';
                  break;
                }
              default:
                msg = Okta.loc('usercreation.failure');
                location = '';
                break;
            }
            self.options.appState.set('flashError', msg);
            self.options.appState.trigger('navigate', location);
          })
        });
      }
    },
    Form: {
      save: _.partial(Okta.loc, 'usercreation.signup', 'login'),
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

        // CLQ-2323, Okta API added Password Policy object
        // Custom CLQ code
        // Object contained the attribute excludeAttributes which caused the _.map function to fail as
        // the excludeAttributes does not exist in the above fields dictionary. As CLQ does not
        // use the excludeAttributes policy yet, this attribute is removed so that the rendering
        // of the controller continues as normal. This is also found in the PasswordResetController.
        if (Object.keys(policy.complexity).indexOf('excludeAttributes') !== -1) delete policy.complexity.excludeAttributes;

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

          // UPDATE: This has been fixed; leaving note as precautionary reference
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

    // The focus in and out events should clear relevant fields and keep the other
    // errors populated. However, the clear-errors code clears all errors therefore
    // other fields are re-checked to keep the error present if necessary.
    events: {
      'focusout input[name=newPassword]': function() {
        if (ValidationUtil.validatePasswordComplexity(this.model.get("newPassword"))) {
          this.model.trigger('form:field-error', 'newPassword', [Okta.loc('error.password.complexity')]);
        }
      },
      'focusin input[name=newPassword]': function() {
        this.model.trigger('form:clear-errors', 'newPassword');
        var answer = this.model.get("answer")
        if (answer && answer.length < 4) {
          this.model.trigger('form:field-error', 'answer', [Okta.loc('error.security.answer.length')]);
        }
      },
      'focusout input[name=confirmPassword]': function() {
        if (ValidationUtil.validatePasswordMatch(this.model) != undefined) {
          this.model.trigger('form:field-error', 'confirmPassword', [Okta.loc('password.error.match')]);
        }
      },
      'focusin input[name=confirmPassword]': function() {
        this.model.trigger('form:clear-errors', 'confirmPassword');
        if (ValidationUtil.validatePasswordComplexity(this.model.get("newPassword"))) {
          this.model.trigger('form:field-error', 'newPassword', [Okta.loc('error.password.complexity')]);
        }
        var answer = this.model.get("answer")
        if (answer && answer.length < 4) {
          this.model.trigger('form:field-error', 'answer', [Okta.loc('error.security.answer.length')]);
        }
      },
      'focusout input[name=answer]': function() {
        var answer = this.model.get("answer")
        if (answer && answer.length < 4) {
          this.model.trigger('form:field-error', 'answer', [Okta.loc('error.security.answer.length')]);
        }
      },
      'focusin input[name=answer]': function() {
        this.model.trigger('form:clear-errors', 'answer');
        if (ValidationUtil.validatePasswordComplexity(this.model.get("newPassword"))) {
          this.model.trigger('form:field-error', 'newPassword', [Okta.loc('error.password.complexity')]);
        }
        if (ValidationUtil.validatePasswordMatch(this.model) != undefined) {
          this.model.trigger('form:field-error', 'confirmPassword', [Okta.loc('password.error.match')]);
        }
      }
    },

    initialize: function () {
      var self = this;
      this.listenTo(this.form, 'save', function () {
        this.model.save();
      });

      this.add(new FooterSignout(_.extend(this.toJSON(), 
        {
          linkText: Okta.loc('goback', 'login'), 
          linkClassName: ''
        })));
    },

    fetchInitialData: function() {
      // var http = require('@okta/okta-auth-js/lib/http');

      var questions = {};
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
          return [{
                    "question": "disliked_food",
                    "questionText": "What is the food you least liked as a child?"
                  }, {
                    "question": "name_of_first_plush_toy",
                    "questionText": "What is the name of your first stuffed animal?"
                  }, {
                    "question": "first_award",
                    "questionText": "What did you earn your first medal or award for?"
                  }, {
                    "question": "favorite_security_question",
                    "questionText": "What is your favorite security question?"
                  }, {
                    "question": "first_computer_game",
                    "questionText": "What was the first computer game you played?"
                  }, {
                    "question": "favorite_movie_quote",
                    "questionText": "What is your favorite movie quote?"
                  }, {
                    "question": "first_sports_team_mascot",
                    "questionText": "What was the mascot of the first sports team you played on?"
                  }, {
                    "question": "first_music_purchase",
                    "questionText": "What music album or song did you first purchase?"
                  }, {
                    "question": "favorite_art_piece",
                    "questionText": "What is your favorite piece of art?"
                  }, {
                    "question": "grandmother_favorite_desert",
                    "questionText": "What was your grandmother's favorite dessert?"
                  }, {
                    "question": "first_thing_cooked",
                    "questionText": "What was the first thing you learned to cook?"
                  }, {
                    "question": "childhood_dream_job",
                    "questionText": "What was your dream job as a child?"
                  }, {
                    "question": "place_where_significant_other_was_met",
                    "questionText": "Where did you meet your spouse/significant other?"
                  }, {
                    "question": "favorite_vacation_location",
                    "questionText": "Where did you go for your favorite vacation?"
                  }, {
                    "question": "new_years_two_thousand",
                    "questionText": "Where were you on New Year's Eve in the year 2000?"
                  }, {
                    "question": "favorite_speaker_actor",
                    "questionText": "Who is your favorite speaker/orator?"
                  }, {
                    "question": "favorite_book_movie_character",
                    "questionText": "Who is your favorite book/movie character?"
                  }, {
                    "question": "favorite_sports_player",
                    "questionText": "Who is your favorite sports player?"
                  }]

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
