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


installPB = function(elemID, startProportion) {
    if ($("#" + elemID + " .pbInner").length == 0) {
        $('#' + elemID).append('<div class="pbInner" style="height: 100%; background-color: #339933; width: 0%"></div>');
        $('#' + elemID + ' .pbInner').attr('prop', '0');
    }

    throwMessage("Initializing progress bar with start proportion " + startProportion);
    if (typeof(startProportion) !== 'undefined') setPB(elemID, startProportion);
}

setPB = function(elemID, proportion) {
    var proportion = proportion > 1 ? 1 :
        proportion < 0 ? 0 :
        proportion;
    $('#' + elemID + ' .pbInner').attr('prop', proportion);
    refreshPB(elemID);
}

plusPB = function(elemID, proportion) {
    var eInner = $('#' + elemID + ' .pbInner');

    setPB(elemID, proportion + parseFloat(eInner.attr('prop')));
    refreshPB(elemID);
}

minusPB = function(elemID, proportion) {
    plusPB(elemID, -proportion);
}

resetPB = function(elemID) {
    setPB(elemID, 0);
}

refreshPB = function(elemID) {
    var prop = parseFloat($('#' + elemID + ' .pbInner').attr('prop'));
    throwMessage("Refreshing progress bar to " + prop);

    $('#' + elemID + ' .pbInner').width(prop * $('#' + elemID).width());
}

getProgressPB = function(elemID) {
    var eInner = $('#' + elemID + ' .pbInner');

    return (eInner.attr('prop'));
}
