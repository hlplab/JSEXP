/*
 * Author: Dave F. Kleinschmidt
 *
 *    Copyright 2012 Dave Kleinschmidt and
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

function Experiment(obj) {
    if (typeof(obj.platform) === 'undefined') {
      this.platform = 'mturk';
    } else {
      this.platform = obj.platform;
    }

    this.requiredURLparams = [];
    this.blocks = [];
    this.blockn = undefined;
    this.cookie = obj.cookie;
    this.survey = obj.survey; //TODO: make this a list of surveys?
    this.urlparams = gupo();
    this.consentFormDiv = typeof(obj.consentFormDiv) === 'undefined' ? '<div id="consent">By continuing this experiment, you confirm that you have read and understand the <a target="_blank" href="' + obj.rsrbConsentFormURL +
        '">consent form</a>, that you are willing to participate in this experiment, and that you agree that the data you provide by participating can be used in scientific publications (no identifying information will be published). ' +
        'Sometimes we share non-identifying data elicited from you &mdash; including sound files &mdash; with other researchers for scientific purposes (your MTurk/Prolific ID will be replaced with an arbitrary alphanumeric code).</div>' : obj.consentFormDiv;
    this.rsrbSurveyFileLocation = typeof(obj.rsrbSurveyFileLocation) === 'undefined' ? 'JSEXP/surveys/rsrb_survey.html' : obj.rsrbSurveyFileLocation;
    // Record random string as identifier
    this.randomID = randomString(16, '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ');
    this.sandboxmode = checkSandbox(this.urlparams);
    this.previewMode = checkPreview(this.urlparams);
    this.experimentCompletedInstructions = typeof(obj.experimentCompletedInstructions) === 'undefined' ? "<h3>Thanks for participating!</h3><p>That's the end of the experiment!  Just a few more things for you to answer.</p>" : obj.experimentCompletedInstructions;
    this.continueButtonText = typeof(obj.continueButtonText) === 'undefined' ? 'Click to continue...' : obj.continueButtonText;
}


Experiment.prototype = {
    init: function() {
            // write time at which experiment was started
            var userDateTimeAtInitialization = new Date();
            writeFormField("userDateTimeAtInitialization", userDateTimeAtInitialization.toJSON());

            this.experimentWrappingUp = false;
            this.blockn = 0;

            // read in URL parameters
            this.urlparams = gupo();

            // Determine whether the experiment is run in debug mode. This activates several shortcuts through
            // the experiment and makes otherwise invisible information visible. Set URL param debug=TRUE.
            this.debugMode = checkDebug(this.urlparams);

            // Check whether URLPARAMs specified different platform than handed to experiment object.
            this.platform = this.platform.toLowerCase();
            if (this.urlparams['platform']) {
              this.urlparams['platform'] = this.urlparams['platform'].toLowerCase();
              if (this.platform !== this.urlparams['platform']) {
                this.platform = this.urlparams['platform'];
                throwWarning("Overriding platform argument based on URL parameter provided. MAKE SURE THAT THIS IS INTENDED. Platform is now " + this.platform);
              }
            } else {
              writeFormField("platform", this.platform);
            }
            if ($.inArray(this.platform, ['mturk', 'proliferate', 'prolific']) < 0) throwError("Platform not recognized - " + this.platform);

            // hide all url params after having read them in.
            if (!this.debugMode) {
              if (this.platform === 'mturk') {
                window.history.replaceState(
                  {},
                  '',
                  `${window.location.pathname}`
                )
              } else {
                window.history.replaceState(
                  {},
                  '',
                  `${window.location.pathname}` + '?experiment_id=' + this.urlparams['experiment_id'] + '&participant_id=' + this.urlparams['participant_id']
                )
              }
            }

            // Determine whether the experiment is run in preview mode.
            // Preview is what MTurkers see prior to accepting a HIT. It should not contain any information
            // except for the front page of the experiment.
            // If URL parameter assignmentId=ASSIGNMENT_ID_NOT_AVAILABLE the preview mode will be selected.
            this.previewMode = checkPreview(this.urlparams);
            // Determine whether the experiment is run in sandbox mode. This is inferred not from the URL
            // parameters but automatically from the documents' referrer. I.e., this function recognizes
            // if the HTML is embedded in an MTurk sandbox iframe (the argument is optional, it seems).
            this.sandboxmode = checkSandbox(this.urlparams);

            writeFormField("userAgent", navigator.userAgent);
            writeFormField("randomID", this.randomID);
            if (this.platform === "mturk") {
              writeFormField("assignmentId", this.urlparams['assignmentId']);
              throwMessage("(this field is expected to be undefined unless you are sandboxing or live)")
            }

            // Record all url param fields
            for (param in this.urlparams) {
              writeFormField(param, this.urlparams[param]);
            }

            // detect whether the browser can play audio/video and what formats
            vidSuffix =
                Modernizr.video.webm ? '.webm' :
                Modernizr.video.h264 ? '.mp4' :
                '';
            audSuffix =
                Modernizr.audio.wav == 'probably' ? '.wav' :
                Modernizr.audio.ogg == 'probably' ? '.ogg' :
                Modernizr.audio.mp3 == 'probably' ? '.mp3' :
                Modernizr.audio.wav == 'maybe' ? '.wav' :
                '';

            var IE = (!! window.ActiveXObject && +(/msie\s(\d+)/i.exec(navigator.userAgent)[1])) || NaN;
            var Safari = NaN;
            if (navigator.userAgent.includes('Safari/') && ! navigator.userAgent.includes('Chrome/'))
                Safari = parseInt(navigator.userAgent.split('Version/')[1].split('.')[0]);

            // Browser must be IE version 10 or higher, Safari version 13 or lover, or Chrome or Opera
            if (IE < 9 || Safari > 13 || navigator.userAgent.includes('Firefox/')) {
              $("#errorMessage").show();
              $("#instructions").hide();
              this.wrapup('<p>A technical error occurred. Your browser is not compatible with the current experiment.</p>');
            }

            // check for video and audio support, and if it's missing show a message
            // with an explanation and links to browser download websites
            if (vidSuffix && audSuffix) {
              $("#errorMessage").hide();
              $("#instructions").show();
            } else {
              $("#errorMessage").show();
              $("#instructions").hide();
              this.wrapup('<p>A technical error occurred. Your browser is not compatible with the current experiment since it cannot play the required audio & video formats.</p>');
            }

            var cookie = readCookie(this.cookie);
            if (!this.sandboxmode && !this.debugMode && cookie) {
              this.wrapup('<p>It looks like you have already completed this experiment (or reloaded it) or a similar experiment. Unfortunately, this means that we cannot use your data.</p>');
            }
            createCookie(this.cookie, 1, 365);

            // format consent form div with appropriate link to consent form.
            this.consentFormDiv = this.consentFormDiv.format(this.rsrbConsentFormURL);

            // populate remaining DIVs now that all incompatible browsers have been handled
            $("#continue").html('<span id="contText">' + this.continueButtonText + '</span>');
            $("#fixation").html('+');
            $("#whiteDotFeedback").html('Press B when you see a white dot.');
            $("#whiteDotFeedbackTrue").html('You saw a white dot and pressed B!');

            // load post-experiment survey into div in form
            $('form#mturk_form')
                .append($('<div id="endForm" class="survey"></div>')
                        .load(this.survey + ' #endForm > *'));

            // set up form for end of experiment with demographic and other info
            // load demographic survey into div in form
            var rsrbNum = this.rsrbProtocolNumber;
            $('form#mturk_form')
                .append($('<div id="rsrb" class="survey">')
                        .load(this.rsrbSurveyFileLocation + ' #rsrb > *', function() {
                            // set protocol number
                            $('input[name="rsrb.protocol"]:hidden').val(rsrbNum);
                            throwMessage('Name of RSRB protocol: ' + rsrbNum + '\nRSRB information written into form field: ' + $('input[name="rsrb.protocol"]').val() + "\n(this value is expected to be undefined unless you are sandboxing or live)");
            }));

            // Check whether required URL parameters are present. If not, enter debug mode.
            // This code chunk needs to be after debug mode has been read.
            if (this.requiredURLparams.length > 0) {
              throwMessage("Checking whether all required URL parameters were provided.");
              var missing_urlparams = [];
              for (let i = 0; i < this.requiredURLparams.length; i++) {
                if (this.urlparams[this.requiredURLparams[i]] === undefined) missing_urlparams.push(this.requiredURLparams[i]);
              }
              if (missing_urlparams.length > 0) {
                this.debugMode = enterDebug();
                this.wrapup('<p>A technical error occurred. The following ' + missing_urlparams.length +
                            ' URL parameter(s) are indicated as required but were not found: ' + missing_urlparams.join(", ") +
                            '. This can happen when Prolific/Mechanical Turk encounter technical issues that are not ' +
                            'under our control.</p>');
              }
            }
    },

    //Unmodified
    addBlock: function(obj) {
        var block, instructions, endedHandler, practiceParameters, onPreview;
        // detect "naked block" vs. object with block info
        if (typeof(obj.run) === 'function' || typeof(obj) === 'function') {
            // naked block cases:
            // naked blocks are either objects with a .run() method (first case)
            // or functions themselves (which are called by Experiment.nextBlock()
            // and return a block object)
            block = obj;
        } else {
            // block + parameters objects, with fields:
            block = obj['block'];
            block.randomID = this.randomID;
            instructions = obj['instructions'];
            endedHandler = obj['endedHandler'];
            practiceParameters = obj['practiceParameters'];
            // show block during preview?
            onPreview = typeof(obj['onPreview']) === 'undefined' ?
                false :
                obj['onPreview'];
            showInTest = typeof(obj['showInTest']) === 'undefined' ?
                true :
                obj['showInTest'];
        }

        // add onEndedBlock handler function to block (block object MUST
        // call its onEndedBlock method  when it has truly ended...)
        var _self = this;
        block.onEndedBlock =
            typeof(endedHandler) === 'undefined' ?
            function() {_self.nextBlock();} :
            endedHandler;
        // and link back to this experiment object to block object...
        block.parent = _self;
        // add block object and its associated instructions to the blocks array


        //If url parameter has mode=test block has showInTest:false, don't add the block
        if (this.urlparams['mode'] == 'test' && showInTest == false) {
        }
        else {
            this.blocks.push({block: block,
                              instructions: instructions,
                              practiceParameters: practiceParameters && practiceParameters.substring ?
                              {instructions: practiceParameters} : practiceParameters,
                              onPreview: onPreview}); // gracefully handle bare instructions strings
        }
    },

    //unmodified
    nextBlock: function() {
        if (this.experimentWrappingUp) return false;

        // pull out block object holder, but don't increment block counter yet
        var this_block = this.blocks[this.blockn];
        if (typeof(this_block) === 'undefined') {
            // no more blocks, so finish up
            this.wrapup();
        } else {
            // check for preview mode, and stop if not ready.
            if (this.previewMode && !this_block.onPreview) {
                $("#continue").hide();
                $("#instructions").html('<h3>End of preview </h3><p>You must accept this HIT before continuing</p>').show();
                return false;
            }

            // if the block is given as a function, evaluate that function to create real block
            if (typeof this_block.block === 'function') {
                // functions should take a callback as first argument.
                this_block.blockfcn = this_block.block;
                // ... and return a block object.
                this_block.block = this_block.blockfcn(this_block.block.onEndedBlock);
            }

            var _self = this;

            // then check to see if practice mode is needed.
            if (typeof this_block.practiceParameters !== 'undefined') {
                // if yes, do practice mode, with a call back to run the block for real
                this_block.block.practice(this_block.practiceParameters,
                                          function() {_self.runBlock();});
            } else {
                // otherwise, run the block for real.
                this.runBlock();
            }
        }

    },

    // method to actually RUN the current block, showing optional instructions if they're provided
    // //Unmodified
    runBlock: function() {
        var this_block = this.blocks[this.blockn++];
        var _self = this;

        if (typeof(this_block.instructions) !== 'undefined') {
            // if there are instructions...
            // show them, with a continue button
            $("#instructions").html(this_block.instructions).show();
            continueButton(function() {
                               $("#instructions").hide();
                               this_block.block.run();
                           });
        } else {
            // ...otherwise, just run the block.
            this_block.block.run();
        }
    },


    wrapup: function(why) {
        throwMessage("Wrapping up experiment.");
        this.experimentWrappingUp = true;

        if (typeof(why)==='undefined') {
            // success
            // no error reported to callback
            $("#passCalibration").val("passed");
            $("#instructions").html(this.experimentCompletedInstructions).show();

            continueButton(end_surveys_and_submit);
            // end_surveys_and_submit() is a function in js-adapt/mturk-helpers.js
            // which steps through the demographics/audio equipment surveys and then submits.
        } else {
            // error?
            // any parameter not undefined is assumed to be an error, so record it and then wrap up.
            // error?
            // any parameter not undefined is assumed to be an error, so record it and then wrap up.
            $("#errorMessage").html('<h3>We apologize for the inconvenience</h3>' +
              why +
              '<p><strong>You can <a target="_blank" href="mailto: hlplab@gmail.com">email us</a> with any questions. </strong>' +
              'In case you encountered a technical error, we can best help you if you include a screen shot of ' +
              'this page in your email. If you also know your operating system (Windows, MacOS, etc. with version number), ' +
              'device type (phone, tablet, laptop/pc, etc.), and browser (e.g., Chrome, Firefox, or Safari--best with ' +
              'version number) that can help us to further narrow down the issue. Thank you!</p>' +
              '<p><strong>We would appreciate if you return the experiment/HIT.</p>');
            $("#errorMessage").show();
            $("#instructions").hide();
        }

    },

};
