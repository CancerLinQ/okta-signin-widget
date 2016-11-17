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
  'views/shared/FooterSignout',
  'views/shared/TextBox'
],
function (Okta, FormController, FormType, FooterSignout, TextBox) {

  
  return FormController.extend({
    className: 'recovery-question',
    Model: {
      props: {
        answer: ['string', true],
        showAnswer: 'boolean'
      },
      save: function () {
        return this.doTransaction(function(transaction) {
          return transaction.answer({ answer: this.get('answer') });
        });
      }
    },
    Form: {
      autoSave: true,
      save: function () {
        switch (this.options.appState.get('recoveryType')) {
        case 'PASSWORD':
          return Okta.loc('password.forgot.question.submit', 'login');
        case 'UNLOCK':
          return Okta.loc('account.unlock.question.submit', 'login');
        default:
          return Okta.loc('mfa.challenge.verify', 'login');
        }
      },
      title: function () {
        switch (this.options.appState.get('recoveryType')) {
        case 'PASSWORD':
          return Okta.loc('password.forgot.question.title', 'login');
        case 'UNLOCK':
          return Okta.loc('account.unlock.question.title', 'login');
        default:
          return '';
        }
      },
      formChildren: function () {

        // Temporary fix to accomodate the Okta API not returning questionText for emails/usernames
        // with a + or a . inside the address
        var questions = [{
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
        var qText = Okta._.findWhere(questions, {"question": this.options.appState.get('recoveryQuestion')});
        var label = qText ? qText.questionText : this.options.appState.get('recoveryQuestion');
        return [
          FormType.Input({
            label: label,
            placeholder: Okta.loc('mfa.challenge.answer.placeholder', 'login'),
            name: 'answer',
            input: TextBox,
            type: 'password',
            initialize: function () {
              this.listenTo(this.model, 'change:showAnswer', function () {
                var type = this.model.get('showAnswer') ? 'text' : 'password';
                this.getInputs()[0].changeType(type);
              });
            }
          }),
          FormType.Input({
            label: false,
            'label-top': true,
            placeholder: Okta.loc('mfa.challenge.answer.showAnswer', 'login'),
            className: 'recovery-question-show margin-btm-0',
            name: 'showAnswer',
            type: 'checkbox'
          })
        ];
      }
    },
    Footer: FooterSignout

  });

});
