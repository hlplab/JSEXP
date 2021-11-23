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
var keyPress = false;
function SubtitlePresentationBlock(params) {
    // process parameters
    var stimuliObj, namespace, css_stim_class;
    for (p in params) {
        switch(p) {
        case 'stimuli':
            stimuliObj = params[p];
            break;
        case 'instructions':
            this.instructions = params[p];
            break;
        case 'mediaType':
            this.mediaType= params[p];
            break;
        case 'namespace':
            namespace = params[p];
            break;
        case 'reps':
            this.reps = params[p];
            break;
        case 'blockReps':
            this.blockReps = params[p];
            break;
        case 'stimOrderMethod':
            this.stimOrderMethod = params[p];
            break;
        case 'blockOrderMethod':
            this.blockOrderMethod = params[p];
            break;
        case 'ITI':
            this.ITI = params[p];
            break;
        case 'subtitlePosition':
            this.subtitlePosition = params[p];
            break;
        case 'isPractice':
            this.isPractice = params[p];
            break;
        default:
            break;
        }
    }

    // set namespace for this block (prefix for events/form fields/etc.) and
    // the class that the stimuli are assigned
    if (typeof(namespace) === 'undefined') {
        var namespace = '';
        var css_stim_class = 'stim';
    } else {
        var css_stim_class = namespace + 'stim';
        this.namespace = namespace;
    }
    if (typeof(isPractice) === 'undefined') {
        isPractice = false;
    }

    console.log(this.subtitlePosition);
    if (isArray(stimuliObj)) {
        // concatenate into one mega-object, and set for this block
        console.log("YO you should figure out this loop here");
        this.stimuliObj = concatenate_stimuli_and_install(stimuliObj, css_stim_class);
        this.auds = this.stimuliObj.installed;
    } else {
        // set stimuli object for this block
        this.stimuliObj = stimuliObj;
        console.log(stimuliObj);
        $('#continue').show();
    }

    // create responses form element and append to form
    this.respField = $('<textArea id="' + namespace + 'Resp" ' +
                       'name="' + namespace + 'Resp" ></textArea>').appendTo('#mturk_form');
    $('#mturk_form').append('<br />');

}

SubtitlePresentationBlock.prototype = {
    reps: undefined,
    blockReps: 1,
    stims: [], // the indices WITH randomiziation
    n: 0,
    ncorrect: 0,
    tResp: -1,
    tStart: -1,
    ITI: 1000,
    namespace: '',
    respField: undefined,
    onEndedBlock: undefined,
    pbIncrement: undefined,
    stimOrderMethod: 'dont_randomize',
    blockOrderMethod: 'large_blocks_first',
    totalUniqueTrials: undefined,
    instructions: undefined,
    mediaType: "audio",
    pressedSpace: false,
    isPractice: false,

    run: function() {
        var _self = this;
        _self.init();
       _self.next();
    },

    init: function(opts) {
        console.log("In init");
        var _self = this;

        _self.totalUniqueTrials = _self.stimuliObj.filenames.length;

        console.log("trials: " + _self.totalUniqueTrials);
        // initialize trial counter
        this.n = 0;

        ////////////////////////////////////////////////////////////////////////////////
        // Randomize stimuli order.

        this.stims = [];
        for (var br = 0; br < this.blockReps; br++) {
            this.stims = this.stims.concat(createStimulusOrder(this.reps, this.totalUniqueTrials, this.blockstimOrderMethod, this.block.blockOrderMethod));
        }
        this.pbIncrement = 1.0 / this.stims.length;
        //Move to next trial on click

        $(document).on('keydown.' + this.namespace, function(e) {_self.handleRespDown(e);});
        $(document).on('keyup.' + this.namespace, function(e) {_self.handleResp(e);});

        $("#instructionsLower").html(_self.instructions);

        // install, initialize, and show a progress bar (progressBar.js)
        installPB("progressBar");
        resetPB("progressBar");
        $("#progressBar").show();
        $beep = $('<audio>')
        $beep.attr("src", 'JSEXP/sounds/beep.wav');
        // DEBUGGING: add button to force start of calibration block (skip preview)
    },

    handleResp: function(e) {
        //Press space for next trial
        if (keyPress === true) {
            if (e.keyCode === 0 || e.keyCode === 32) {
             //   $('#catchTrialInstruction').hide();
                $('#catchTrialFeedbackTrue').show();
                this.pressedSpace = true;
            }
        }
    },

    handleRespDown: function(e) {
        //Press space for next trial
        if (keyPress === true) {
            if (e.keyCode === 0 || e.keyCode === 32) {
                e.preventDefault();
                return false;
            }
        }
    },
    // start next trial
    next: function() {
        var _self = this;
        this.pressedSpace = false;
        // some status information (hidden by default)
        $('#testStatus').append('<br />stims: ' + this.stims + ', n: ' + this.n);
        $('#testStatus').html('...wait');

        $("#instructionsLower").show();
        $("#wrongAnsMessage").hide();

        var extension = "";
        if (_self.mediaType === "audio") {
            extension = ".wav";
        }
        if (_self.mediaType === "video") {
            extension = ".webm";
        }
        var originalFile = _self.stimuliObj.prefix + _self.stimuliObj.filenames[_self.stims[_self.n]] + extension;
        $("#subtitle").text(_self.stimuliObj.subtitles[_self.stims[_self.n]]);
        keyPress = true;

    if (this.subtitlePosition === "during") {
        $('#fixation').show();
        $('#catchTrialInstruction').show();
        if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
            $beep[0].play();
        }
        setTimeout(function() {
            $('#fixation').hide();
            $originalAudio = $('<audio>')
            $originalAudio.attr("src", originalFile);
            $originalAudio.attr("preload", "auto");
            $originalAudio[0].play();
            $originalAudio.on('playing', function() {
                $("#subtitle").show();
            });
            $originalAudio.on('ended', function() {
                $("#subtitle").hide();
                setTimeout(function() {
                    keyPress = false;
                    $('#catchTrialFeedbackTrue').hide();
                    _self.recordResp();
                }, _self.ITI);
            });
        }, _self.ITI/2);
    }
    if (this.subtitlePosition === "during_with_1500") {
        $('#fixation').show();
        $('#catchTrialInstruction').show();
        if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
            $beep[0].play();
        }
        setTimeout(function() {
            $originalAudio = $('<audio>')
            $originalAudio.attr("src", originalFile);
            $originalAudio.attr("preload", "auto");
            var audLength;
            $originalAudio.on("canplay", function() {
                audLength = $originalAudio[0].duration * 1000;
                console.log(audLength);
                $originalAudio[0].play();
                $originalAudio.on('playing', function() {
                //    $('#catchTrialInstruction').hide();
                    $('#fixation').hide();
                    $("#subtitle").show();
                });
                setTimeout(function() {
                    $("#subtitle").hide();
                    setTimeout(function() {
                        keyPress = false;
                        $('#catchTrialFeedbackTrue').hide();
                        _self.recordResp();
                    }, _self.ITI + audLength);
                }, 1500); //Show subtitle for this time
            });
        }, _self.ITI/2);
    }
    if (this.subtitlePosition === "during_delay") {
            $('#fixation').show();
            $('#catchTrialInstruction').show();
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
                $beep[0].play();
            }
            setTimeout(function() {
                $('#fixation').hide();
                $originalAudio = $('<audio>')
                $originalAudio.attr("src", originalFile);
                $originalAudio.attr("preload", "auto");
                $originalAudio[0].play();
                $originalAudio.on('playing', function() {
                    $("#subtitle").show();
                });
                $originalAudio.on('ended', function() {
                    $("#subtitle").hide();
                    setTimeout(function() {
                        keyPress = false;
                        $('#catchTrialFeedbackTrue').hide();
                        _self.recordResp();
                    }, _self.ITI+1500);
                });
            }, _self.ITI/2);
        }
        if (this.subtitlePosition === "noSubs") {
            $('#fixation').show();
            $('#catchTrialInstruction').show();
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
                $beep[0].play();
            }
            setTimeout(function() {
                $('#fixation').hide();
                if (_self.mediaType === "audio") {
                        $originalAudio = $('<audio>')
                        $originalAudio.attr("src", originalFile);
                        $originalAudio.attr("preload", "auto");
                        $originalAudio[0].play();
                        $originalAudio.on('playing', function() {
                            $('#fixation').hide();
                        });
                        $originalAudio.on('ended', function() {
                          //  $('#catchTrialInstruction').hide();
                            setTimeout(function() {
                                keyPress = false;
                                $('#catchTrialFeedbackTrue').hide();
                                _self.recordResp();
                            }, _self.ITI);
                        });
                }
            }, _self.ITI/2); //ITI
        }

        if (this.subtitlePosition === "after") {
            $('#fixation').show();
            $('#catchTrialInstruction').show();
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
                $beep[0].play();
            }

            setTimeout(function() {
                $('#fixation').hide();
                $originalAudio = $('<audio>')
                $originalAudio.attr("src", originalFile);
                $originalAudio.attr("preload", "auto");
                var duration;
                $originalAudio.on("canplay", function() {
                    duration = $originalAudio[0].duration * 1000;
                    if (_self.mediaType === "audio") {
                            $originalAudio[0].play();
                            console.log(duration);
                            $originalAudio.on('ended', function() {
                                $("#subtitle").show();
                                setTimeout(function() {
                                    $("#subtitle").hide();
                                    setTimeout(function() {
                                        keyPress = false;
                                        $('#catchTrialFeedbackTrue').hide();
                                        _self.recordResp();
                                    }, _self.ITI); //ITI - how long to wait before recordingResponse and moving on to next file
                                }, 1500); //How long to show on scalarreen
                            });
                    }
                });
            }, _self.ITI/2)
        }

        if (this.subtitlePosition === "after_long_iti") {
            $('#fixation').show();
            $('#catchTrialInstruction').show();
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
                $beep[0].play();
            }

            setTimeout(function() {
                $('#fixation').hide();
                $originalAudio = $('<audio>')
                $originalAudio.attr("src", originalFile);
                $originalAudio.attr("preload", "auto");
                var duration;
                $originalAudio.on("canplay", function() {
                    duration = $originalAudio[0].duration * 1000;
                    if (_self.mediaType === "audio") {
                            $originalAudio[0].play();
                            console.log(duration);
                            $originalAudio.on('ended', function() {
                                $("#subtitle").show();
                                setTimeout(function() {
                                    $("#subtitle").hide();
                                    setTimeout(function() {
                                        keyPress = false;
                                        $('#catchTrialFeedbackTrue').hide();
                                        _self.recordResp();
                                    }, 2500 - duration); //ITI - how long to wait before recordingResponse and moving on to next file
                                }, duration); //How long to show on scalarreen
                            });
                    }
                });
            }, _self.ITI/2)
        }

        if (this.subtitlePosition === "after1500") {
            $('#fixation').show();
            $('#catchTrialInstruction').show();
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
                $beep[0].play();
            }

            setTimeout(function() {
                $('#fixation').hide();
                $originalAudio = $('<audio>')
                $originalAudio.attr("src", originalFile);
                $originalAudio.attr("preload", "auto");
                var duration;
                $originalAudio.on("canplay", function() {
                    duration = $originalAudio[0].duration * 1000;
                    if (_self.mediaType === "audio") {
                            $originalAudio[0].play();
                            console.log(duration);
                            $originalAudio.on('ended', function() {
                                setTimeout(function() {
                                    $("#subtitle").show();
                                    setTimeout(function() {
                                        $("#subtitle").hide();
                                        setTimeout(function() {
                                            keyPress = false;
                                            $('#catchTrialFeedbackTrue').hide();
                                            _self.recordResp();
                                        }, 2500 - duration); //ITI - how long to wait before recordingResponse and moving on to next file
                                    }, duration); //How long to show on scalarreen
                                }, 1500); //Time between audio and subtitle
                            });
                    }
                });
            }, _self.ITI/2)
        }
        if (this.subtitlePosition === "after6000") {
            $('#fixation').show();
            $('#catchTrialInstruction').show();
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
                $beep[0].play();
            }

            setTimeout(function() {
                $('#fixation').hide();
                $originalAudio = $('<audio>')
                $originalAudio.attr("src", originalFile);
                $originalAudio.attr("preload", "auto");
                var duration;
                $originalAudio.on("canplay", function() {
                    duration = $originalAudio[0].duration * 1000;
                    if (_self.mediaType === "audio") {
                            $originalAudio[0].play();
                            console.log(duration);
                            $originalAudio.on('ended', function() {
                                setTimeout(function() {
                                    $("#subtitle").show();
                                    setTimeout(function() {
                                        $("#subtitle").hide();
                                        setTimeout(function() {
                                            keyPress = false;
                                            $('#catchTrialFeedbackTrue').hide();
                                            _self.recordResp();
                                        }, 2500 - duration); //ITI - how long to wait before recordingResponse and moving on to next file
                                    }, duration); //How long to show on scalarreen
                                }, 6000); //Time between audio and subtitle
                            });
                    }
                });
            }, _self.ITI/2)
        }

        if (this.subtitlePosition === "before") {
            $('#fixation').show();
            $('#catchTrialInstruction').show();
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y') {
                $beep[0].play();
            }

            setTimeout(function() {
                if (_self.mediaType === "audio") {
                        $originalAudio = $('<audio>')
                        $originalAudio.attr("src", originalFile);
                        $originalAudio.attr("preload", "auto");
                        $("#subtitle").show();
                        $('#fixation').hide();
                        setTimeout(function() {
                            $("#subtitle").hide(); //delay only works for animations, so make hide an animation
                            $originalAudio[0].play();
                            $originalAudio.on('ended', function() {
                                setTimeout(function() {
                                    keyPress = false;
                                    $('#catchTrialFeedbackTrue').hide();
                                    _self.recordResp();
                                }, _self.ITI);
                            });

                        }, 1500); //How long to show on scalarreen
                    }
            }, _self.ITI/2);
        }
    },

    // handle end of trial (called by key press handler)
    end: function() {
        // update progress bar
        plusPB("progressBar", this.pbIncrement);
        //unbind things
        keyPress = false;
        $("#subtitle").empty();
        $("#subtitle").hide();
        // if more trials remain, trigger next trial
        if (++this.n < this.stims.length) {
            this.next();
        } else {
            this.endBlock();
        }
    },

    endBlock: function() {
        // trigger endCalibrationBlock event
        $('#fixation').hide();
        $("#taskInstructions").hide();
        $("#progressBar").hide();
        $("#wrongAnsMessage").hide();
        $('#catchTrialInstruction').hide();
       // $(this.auds).unbind('.' + this.namespace).height(0);
       // $(document).unbind('.' + this.namespace);
        $("#instructionsLower").hide();
        $("#subtitle").hide();
        $(document).off();
        if (typeof(this.onEndedBlock) === 'function') {
            this.onEndedBlock();
        } else {
            if (console) console.log('WARNING: End of block reached but no callback found');
        }
    },

    // method to handle response. takes event object as input
    recordResp: function() {

        // format trial information
        _self = this;
        this.urlparams = gupo();
        var workerid = this.urlparams['workerId'];
        var condition = this.urlparams['condition'];
        var list = this.urlparams['list'];
        var resp = [this.namespace, this.n, this.stims[this.n], _self.stimuliObj.filenames[_self.stims[_self.n]], _self.stimuliObj.subtitles[_self.stims[_self.n]],
            _self.stimuliObj.blockNum[_self.stims[_self.n]],_self.stimuliObj.isCatch[_self.stims[_self.n]],this.pressedSpace, condition, list, workerid].join('|');

        if (_self.isPractice == true && this.namespace == 'practice') {
            //if (transcript !== _self.stimuliObj.subtitles[_self.stims[_self.n]]) { //does not match exactly
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'Y')
                if (this.pressedSpace === false) {
                    $("#wrongAnsMessage").show();
                    _self.n = 0;
                    resetPB("progressBar");
                    setTimeout(function() {
                        _self.next();
                    }, _self.ITI);
                    return;
                }
            if (_self.stimuliObj.isCatch[_self.stims[_self.n]] === 'N')
                if (this.pressedSpace === true) {
                    $("#wrongAnsMessage").show();
                    _self.n = 0;
                    resetPB("progressBar");
                    setTimeout(function() {
                        _self.next();
                    }, 3000);
                    return;
                }
        }

        // write info to form field
        //$('#calibrationResp').val($('#calibrationResp').val() + resp + RESP_DELIM);
        if (this.n < this.stims.length) {
            console.log("Writing resp:" + resp);
            $(this.respField).val($(this.respField).val() + resp + RESP_DELIM);
        };
        _self.end();
    },

};


// reverse map lookup (get key given value)
function valToKey(obj, v) {
    var keys = [];
    for (k in obj) {
        if (obj[k]==v) {
            keys.push(k);
        }
    }
    return(keys);
}


// classical-esque class inheritance: sets prototype of prototype to superclass prototype
function extend(child, supertype)
{
    child.prototype.__proto__ = supertype.prototype;
    child.prototype.__super__ = supertype.prototype;
}

function validateRespKeys(respKeys, categories) {
    for (k in respKeys) {
        if (! categories.has(respKeys[k])) {
            if (console) console.log('ERROR: response label {0} not found in specified categories {1}'.format(respKeys[k], categories));
            return false;
        }
    }
    return true;
}
