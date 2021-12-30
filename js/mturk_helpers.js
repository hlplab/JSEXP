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

//
// This method Gets URL Parameters (GUP)
//
function gup(name)
{
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var tmpURL = window.location.href;
  var results = regex.exec( tmpURL );
  if( results == null )
    return "";
  else
    return results[1];
}

// Get URL Parameters as Object (GUPO)
function gupo() {
    var urlParams = {};
    var e,
    a = /\+/g,  // Regex for replacing addition symbol with a space
    r = /([^&=]+)=?([^&]*)/g,
    d = function (s) { return decodeURIComponent(s.replace(a, " ")); },
    q = window.location.search.substring(1);

    while (e = r.exec(q))
        urlParams[d(e[1])] = d(e[2]);

    return urlParams;
}

//
// This method decodes the query parameters that were URL-encoded
//
function decode(strToDecode)
{
  var encoded = strToDecode;
  return unescape(encoded.replace(/\+/g,  " "));
}


var previewMode;
function checkPreview(params) {
    if (params['assignmentId'] == "ASSIGNMENT_ID_NOT_AVAILABLE") {
        previewMode = true;
        return true;
    } else {
        return false;
    }
}

var sandboxMode;
function checkSandbox() {
    if (document.referrer && ( document.referrer.indexOf('workersandbox') != -1) ) {
        $("#mturk_form").attr("action", "https://workersandbox.mturk.com/mturk/externalSubmit");
        sandboxMode = true;
        return true;
    } else {
        return false;
    }
}

var debugMode;
function checkDebug(params) {
    if (params['debug']) {
        debugMode = true;
        return true;
    } else {
      debugMode = false;
      return false;
    }
}

function collect_and_format_form_values(formID)
 {
     var str = '';
     var elem = document.getElementById(formID).elements;
     for(var i = 0; i < elem.length; i++)
     {
         str += "Type:" + elem[i].type + "\n";
         str += "Name:" + elem[i].name + "\n";
         str += "Value:" + elem[i].value + "\n\n";
     }
     return(str);
 }

// function to run through RSRB demographic and audio/comments forms and then submit
var end_surveys_and_submit = function() {
   $("#instructions").hide();
   $('.question_section').not("[style='display:none']" ).show();
   $('.question_section *').not("[style='display:none']" ).show();
   // $('.question_section > * > *').not("[style='display:none']" ).show();

   // Show endForm and all of its components
   $('#endForm').show();
   $('#endForm > *').not("[style='display:none']" ).show();

   // Cycle through survey questions
   var visibleBox;
   var currentId;
   visibleBox = $('#endForm .question_section:visible');
   currentId = visibleBox.attr("id");

   $('input').click(function() {
       var nextToShow = $(visibleBox).next('.question_section:hidden');
       if ($(this).attr('class') == 'moveOn') {
           // Check whether there is a multiple choice question that has not been checked
           // (this assumes that each section only has one multiple choice question)
           if ($('.question_section:visible input[type=radio]').length > 0 && $('.question_section:visible input[type=radio]:checked').length <= 0) {
               alert("Please select at least one option for each multiple choice question. Thank you.");
           } else if (nextToShow.length > 0) {
               visibleBox.hide();
               nextToShow.show();
               visibleBox = nextToShow;
               currentId = visibleBox.attr("id");
               document.body.scrollTop = document.documentElement.scrollTop = 0;
           } else {
               $('#mturk_form #endForm').hide();
               $('#mturk_form #rsrb').show();
               $('#mturk_form #rsrb *').show();
               $("#contText").text('Submit');

               continueButton(function() {
                     // Submit the form (and thus all data) to MTurk
                     $('#mturk_form #rsrb').hide();

                     // get clients UTC time offset (in minutes) and write into form field
                     var userDateTime = new Date();
                     writeFormField("userDateTime", userDateTime.toUTCString());
                     writeFormField("userDateTimeOffset", serDateTime.getTimezoneOffset());

                     if (debugMode) {
                       throwMessage(collect_and_format_form_values("mturk_form"));
                       alert("Pausing for read-out from console.");
                     }

                     // figure out platform and submit
                     if ($("#platform").val() === 'mturk') {
                        $("#mturk_form").submit();
                     } else {
                        const formElement = document.querySelector('form#mturk_form');

					              // convert the form to JSON
						            const getFormJSON = (form) => {
						                const data = new FormData(form);
						                return Array.from(data.keys()).reduce((result, key) => {
							                    if (result[key]) {
							                        result[key] = data.getAll(key).join();
							                        return result;
							                    }
							                    result[key] = data.get(key);
							                    return result;
						                }, {});
						            };

                        // handle the form submission event, prevent default form behaviour, check validity, convert form to JSON
					              const valid = formElement.reportValidity();
                        throwMessage("JSON conversion validity report: " + valid);
						            const result = getFormJSON(formElement);
                        throwMessage("JSON conversion of form elements prior to parising them further: " + result);
            						// handle one, multiple or no files uploaded
						            //const images = [result.images].flat().filter((file) => !!file.name)

						            // use spread function, but override the keys we've made changes to
						            const output = {
						                    ...result,
						                    // images,
						                    similar_accent_familiarity_place,
						                    specific_language_background
						            }
						            throwMessage(output);

						            proliferate.submit(output); // output is the JSON object converted from #mturk_form
                    }
               });
           }
       }
   });
}


/* Updated createCookie based on suggestion from Zach, 05-24-21
   since cookies in pages embedded in iFrames (as is the case for
   mturk pages) now need the extra properties specified in the
   the last row of the function */
function createCookie(name,value,days) {
   if (days) {
       var date = new Date();
       date.setTime(date.getTime()+(days*24*60*60*1000));
       var expires = "; expires="+date.toGMTString();
   }
   else var expires = "";
   document.cookie = name+"="+value+expires+"; path=/;SameSite=None;Secure";
}

function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name,"",-1);
}

// General functions for determining whether there is output to console.
var throwMessage = function(text) {
  if (debugMode) console.log(text);
}

var throwWarning = function(text) {
  throwMessage('WARNING: ' + text);
}

var throwError = function(text) {
  throwMessage('ERROR: ' + text);
}

var writeFormField = function(name, value) {
  if (typeof($("#" + name).val()) === 'undefined') {
    throwMessage("Writing value " + value + " into new form field " + name + ".");
    $('<input>').attr({
      type: 'hidden',
      id: name,
      name: name,
      value: value
    }).appendTo('form#mturk_form');
  } else {
    throwMessage("Writing value " + value + " into existing form field " + name + ".");
    $("#" + name).val(value);
  }
}


////////////////////////////////////////////////////////////////////////////////
// Some handlers for specific URL parameters
// global variable for resp keys map
var respKeyMap;

function setRespKeys(params, categories) {
    // default to B/D categories
    if (typeof categories === 'undefined') {
        categories = ['B', 'D'];
    }

    if (params['respKeys']) {
        //var keys = gup('respKeys');
        var keys = params['respKeys'];
        // value should be of the form Bkey,Dkey
        if (/^[A-Z],[A-Z]$/.exec(keys.toUpperCase()) && keys[0] != keys[2]) {
            keys = keys.toUpperCase().split(',');
            respKeyMap = {};
            respKeyMap[keys[0]] = categories[0];
            $("#bKey").html(keys[0]);
            respKeyMap[keys[1]] = categories[1];
            $("#dKey").html(keys[1]);
            throwMessage('Setting response key map to ' + keys[0] + '-->' + categories[0] +
                                      ', ' + keys[1] + '-->' + categories[1]);
        } else {
            $("#errors").val($("#errors").val() + "badRespKeys");
            throwError("bad response key parameter: " + gup('respKeys'));
        }
    }
}

// collect a keyboard response, with optional timeout
function collect_keyboard_resp(fcn, keys, to, tofcn) {
    var namespace = '._resp' + (new Date()).getTime();
    $(document).bind('keyup' + namespace, function(e) {
        if (!keys || keys.indexOf(String.fromCharCode(e.which)) != -1) {
            $(document).unbind(namespace);
            fcn(e);
            e.stopImmediatePropagation();
            return false;
        } else {
            return true;
        }
    });

    if (typeof tofcn !== 'undefined') {
        $(document).bind('to' + namespace, function() {
                             $(document).unbind(namespace);
                             tofcn();
                         });
    }

    if (typeof to !== 'undefined') {
        // timeout response after specified time and call function if it exists
        setTimeout(function(e) {
                       $(document).trigger('to' + namespace);
                       $(document).unbind(namespace);
                   }, to);
    }
}


////////////////////////////////////////////////////////////////////////////////
// GUI/helper things
// display a "continue" button which executes the given function
function continueButton(fcn, validateFcn) {
    $("#continue")
        .show()
        .unbind('click.cont')
        .bind('click.cont', function() {
                  if (typeof(validateFcn) !== 'function' ||
                      typeof(validateFcn) === 'function' && validateFcn())
                  {
                      $(this).unbind('click.cont');
                      $(this).hide();
                      fcn();
                  }
              });
}

function continueButtonHidden(fcn, validateFcn) {
    $("#continue")
        .hide()
        .unbind('click.cont')
        .bind('click.cont', function() {
                  if (typeof(validateFcn) !== 'function' ||
                      typeof(validateFcn) === 'function' && validateFcn())
                  {
                      $(this).unbind('click.cont');
                      $(this).hide();
                      fcn();
                  }
              });
}
