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
            // Need to display errors if they are passed in.
            // signin/created-user is set as a stateless page because the signup
            // function is a conglomerate customized for CLQ and does not represent
            // one of the defined Okta authorization states.
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
    Footer: FooterSignout,

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
        // return factor.questions();
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
    "question": "favorite_toy",
    "questionText": "What is the toy\/stuffed animal you liked the most as a kid?"
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
    "question": "first_kiss_location",
    "questionText": "Where did you have your first kiss?"
  }, {
    "question": "place_where_significant_other_was_met",
    "questionText": "Where did you meet your spouse\/significant other?"
  }, {
    "question": "favorite_vacation_location",
    "questionText": "Where did you go for your favorite vacation?"
  }, {
    "question": "new_years_two_thousand",
    "questionText": "Where were you on New Year's Eve in the year 2000?"
  }, {
    "question": "favorite_speaker_actor",
    "questionText": "Who is your favorite speaker\/orator?"
  }, {
    "question": "favorite_book_movie_character",
    "questionText": "Who is your favorite book\/movie character?"
  }, {
    "question": "favorite_sports_player",
    "questionText": "Who is your favorite sports player?"
  }];
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
