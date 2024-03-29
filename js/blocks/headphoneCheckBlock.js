/*
 * Author: T. Florian Jaeger
 *
 *    Copyright 2022 Florian Jaeger and
 *        the University of Rochester BCS Department
 *
 *    This program is free software: you can redistribute it and/or modify
 *    it under the terms of the GNU Lesser General Public License version 2.1 as
 *    published by the Free Software Foundation.
 *
 *    This program is distributed in the hope that it will be useful,
 *    but WITHOUT ANY WARRANTY; without even the implied warranty of
 *    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *    GNU Lesser General Public License for more details.
 *
 *    You should have received a copy of the GNU Lesser General Public License
 *    along with this program.
 *    If not, see <http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html>.
 *
 */

// set by Experiment.init() (in experimentControl2.js).
var audSuffix;

function HeadphoneCheckBlock(params) {
  for (p in params) {
    switch(p) {
      case 'instructions':
          this.instructions = params[p];
          break;
      case 'items':
          this.items = params[p];
          break;
      case 'test':
          this.test = params[p];
          break;
      case 'implementation':
          this.implementation = params[p];
          break;
      case 'language':
          this.language = params[p].toLowerCase();
          break;
    }
  }
}

// Optional: function to display the result after completing the test.
function showResult(result) {
  let resultMessage = result ? 'Pass' : 'Fail';
  $('#hc-container').append('<div id="testResults" style="width: 100%; text-align: center; font-size: 3em;"></div>');
  $('#testResults')
      .append('<p style="margin-top: 1em;">' + resultMessage + '</p>')
      .append('<p>' + headphonesCheck.attemptRecord[headphonesCheck.attemptCount].numberCorrect + ' out of 6 correct<br>after ' + headphonesCheck.attemptCount + ' attempt(s).<br>(The pass mark is 6.)</p>')
}
// end of headphone specific code (except for call to these functions below)


HeadphoneCheckBlock.prototype = {
    parentDiv: '#textContainer',
    items: undefined,
    test: 'HugginsPitch',
    implementation: 'McDermottLab',
    language: 'english',
    instructions: '<h3>Sound check</h3>' +
        '<p>You should complete this experiment in a quiet environment without any distractions, using headphones set to the highest comfortable volume.</p>' +
        '<p>To ensure that your audio is working properly, you must complete the following sound test. Click on each button below to play a word, and type the words in the boxes provided. You can play the soundfiles as many times as you need to to set your volume to the right level. If you enter one of the words incorrectly, you will be prompted to retry until you have entered them correctly.</p>',

    init: function() {
        var _self = this;
        // create DOM elements (container div, instructions div, and items list)
        $('<div></div>')
            .attr('id', 'headphoneCheck')
            .appendTo(this.parentDiv);
        // add validation checkbox for easy validation checking
        $('<input type="checkbox" />')
            .css('display', 'none')
            .addClass('validation')
            .attr('id', 'headphoneCheckValidationFlag')
            .appendTo('#headphoneCheck');
        $('<div></div>')
            // ID 'hc-contained' of div required by the script imported from McDermott lab
            // (https://github.com/mcdermottLab/HeadphoneCheck)
            .attr('id', 'hc-container')
            .appendTo('#headphoneCheck');
        $('<div></div>')
            .attr('id', 'headphoneCheckInstructions')
            .html(this.instructions)
            .appendTo('#hc-container');

        if (this.test === 'HugginsPitch' && this.implementation === 'McDermottLab') {
          $(document).on('hcHeadphoneCheckEnd', function(event, data) {
              _self.headphoneCheckDidPass = data.didPass;
              _self.headphoneCheckData = data.data;

              var headphoneCheckMessage, headphoneCheckMessagePass, headphoneCheckMessageFail;
              if (_self.language == 'english') {
                headphoneCheckMessage = ' (' + _self.headphoneCheckData.totalCorrect + '/' + _self.headphoneCheckData.stimIDList.length + ' trials correct). ';
                headphoneCheckMessagePass = 'Thank you. You passed the headphones test' + headphoneCheckMessage +
                                      '<font color="red"><strong>It is important that you keep your headphones at the same volume throughout ' +
                                      'the experiment.</strong></font> ';
                headphoneCheckMessageFail = 'Thank you. Unfortunately, your headphones did not pass the test' + headphoneCheckMessage +
                                      'You will not be able to take this HIT. We apologize for the inconvenience. ' +
                                      '<font color="red"><strong>Please return this HIT/experiment.</strong></font>';
              } else if (_self.language == 'swedish') {
                headphoneCheckMessage = ' (' + _self.headphoneCheckData.totalCorrect + '/' + _self.headphoneCheckData.stimIDList.length + ' tester korrekta). ';
                headphoneCheckMessagePass = 'Tack. Du har klarat testet' + headphoneCheckMessage +
                                      '<font color="red"><strong>Det är viktigt att du behåller hörlurarna på samma volym genom hela ' +
                                      'experimentet.</strong></font> ';
                headphoneCheckMessageFail = 'Tack. Tyvärr så klarade inte dina hörlurar testet' + headphoneCheckMessage +
                                      'Du kommer inte att kunna genomföra experimentet. Vi ber om ursäkt för besväret. ' +
                                      '<font color="red"><strong>Vänligen lämna detta experiment.</strong></font>';
              } else {
                throwError("Language not recognized: " + _self.language);
              }

              if (_self.headphoneCheckDidPass) {
                headphoneCheckMessage = headphoneCheckMessagePass;
              } else {
                headphoneCheckMessage = headphoneCheckMessageFail;
              }

              $('#hc-container').append('<div><p>' + headphoneCheckMessage + '</p></div>');
              // Update validation flag
              $('#headphoneCheckValidationFlag')
                  .prop('checked', _self.headphoneCheckDidPass);
          });

          HeadphoneCheck.runHeadphoneCheck({
            totalTrials: 6, // Total number of trials.
            trialsPerPage: 1, // Number of trials to render on a single page.
            correctThreshold: 5/6, // Minimum percentage of correct responses required to pass the headphone screening.
            useSequential: true, // If true, trials must be completed in order from first to last.
            doShuffleTrials: true, // If true, the trials will be shuffled before presentation.
            sampleWithReplacement: true, // If true, the trials will be shuffled with replacement so that some trials might reoccur.
            doCalibration: true, // If true, play a calibration sound before beginning headphone screening task.
            language: _self.language, // added argument to allow support for multiple languages
          });
        } else if (this.implementation === 'ChaitLab') {
          // Add headphone check
          const headphonesCheck = new HeadphonesCheck();
          headphonesCheck.checkHeadphones(showResult);
        }

        // return top-level div to allow chaining/embedding
        return($('#headphoneCheck'));
    },

    check: function() {
        if (this.headphoneCheckDidPass) {
            return(true);
        } else {
            return(false);
        }
    },

    endBlock: function() {
        $('div#headphoneCheck').hide();
        this.onEndedBlock();
    },

    run: function() {
        this.init();
        var _self = this;
        continueButton(function() {_self.endBlock();},
                       function() {return(_self.check());});
    }
};
