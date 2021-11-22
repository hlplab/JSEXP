//+ Jonas Raoni Soares Silva
//@ http://jsfromhell.com/array/shuffle [rev. #1]
//  shuffle the input array
var shuffle = function(v){
    for(var j, x, i = v.length; i; j = parseInt(Math.random() * i), x = v[--i], v[i] = v[j], v[j] = x);
    return v;
};


// repeat x, n times
function repeat(x, n) {
    if (typeof(n) !== "number") {
        throw "Number of reps must be numeric";
    } else {
        var y=Array(n);
        for (var i=0; i<n; i++) {
            y[i] = x;
        }
        return(y);
    }
}

// repeat Array x until length is n, slicing long arrays to make them length n
function repeatToLength(x, n) {
    // put x in an array if it's naked
    x = [].concat(x);
    var y = x;
    while (y.length < n) {
        y = y.concat(x);
    }
    return(y.slice(0,n));
}



// function to create a truly random (shuffled) item order, either from an array
// of repetition numbers or from a uniform number of repetitions and number of items n.
function randomOrder(reps, n) {
    var itemOrder = [];
    for (var i=0; i<reps.length; i++) {
        for (var j=0; j<reps[i]; j++) {
            itemOrder.push(i);
        }
    }

    return shuffle(itemOrder);
}

/* Function to order (incl randomize) stimuli into blocks. Takes either vector of repetitions for
   each item, or (scalar) number of repetitions for each item and the length of the continuum.
   The method determines how stimuli will be ordered within each block. The block_method determines
   how blocks are ordered. Methods include:

   block_method = 'large_blocks_first' (DEFAULT)
         order blocks with more stimuli first
   block_method = 'large_blocks_last'
         order blocks with fewer stimuli first
   block_method = 'shuffle'
         randomize the order of blocks

   method = 'dont_randomize' (DEFAULT)
         keep stimuli within each block in the original order. If stimuli have different numbers
         of reps, this does not necessarily mean that the same stimuli will be presented in reached
         block.
   method = 'shuffle_within_blocks'
         randomize stimuli within each block
   method = 'shuffle_across_blocks'
         don't create stimulus blocks. Just randomize. (will ignore value of block_method)
*/
function createStimulusOrder(reps, n_total, method, block_method) {
    // If reps is specified as a scalar, convert to an array using n_total. This results in
    // an arraw of length n_total, each value of which is reps
    if (typeof(reps) === "number" || reps.length == 1) {
        if (typeof(n_total) !== "undefined") {
            reps = (function(N) {var x=[]; for (var i=0; i<N; i++) {x[i] = reps;}; return(x);})(n_total);
        } else {
          throwError("Must provide either vector of repetitions (reps) or the total number of stimuli (n_total).");
          return(-1);
        }
    }

    // Check method of ordering and apply defaults
    if (typeof(method) === 'undefined') {
        throwWarning("No method provided for ordering stimuli. Setting method to 'dont_randomize'.");
        method = 'dont_randomize';
    } else if (!($.inArray(method, ['dont_randomize', 'shuffle_within_blocks', 'shuffle_across_blocks', 'shuffle']))) {
        throwError("Unknown method specified. Should be one of 'dont_randomize', 'shuffle_within_blocks', or 'shuffle_across_blocks'. You used: " + method);
    } else if (method == 'shuffle_across_blocks' | method == 'shuffle') {
        return randomOrder(reps, n_total);
    }

    if (typeof(block_method) === 'undefined') {
        throwWarning("No block_method provided for ordering stimuli. Setting block_method to 'shuffle'.");
        block_method = 'shuffle';
    } else if (!($.inArray(method, ['large_blocks_first', 'large_blocks_last']))) {
        throwError("Unknown block_method specified. Should be one of 'shuffle', 'large_blocks_first', or 'large_blocks_last'. You used: " + block_method);
    }

    // create blocks with one of each stimulus, and determine order *within* each block
    // based on method (only necessary because of non-uniform repetitions)
    var repsRem = reps.slice(0);
    var block = [];
    var blocks = [];
    do {
        block = [];
        for (var i=0; i<repsRem.length; i++) {
            if (repsRem[i] > 0) {
                block.push(i);
                repsRem[i]--;
            }
        }
        if (method == 'dont_randomize') {
            blocks.push(block);
        } else if (method == 'shuffle_within_blocks') {
            // randomize order of stimuli in THIS block
            blocks.push(shuffle(block));
        }
    } while (block.length > 0);

    // concatenate each block to list of trials
    var stims = [];
    switch(block_method) {
      // DON'T randomize order of blocks, so that blocks with many stimuli come
      // first.
      case 'large_blocks_first':
        for (var i=0; i<blocks.length; i++) {
            stims = stims.concat(blocks[i]);
        }
        break;
      // DON'T randomize order of blocks, so that blocks with many stimuli come
      // last
      case 'large_blocks_last':
        for (var i=blocks.length; i>0; i--) {
            stims = stims.concat(blocks[i-1]);
        }
        break;
      // RANDOMIZE order of blocks
      case 'shuffle':
        blocks = shuffle(blocks);
        for (var i=0; i<blocks.length; i++) {
            stims = stims.concat(blocks[i]);
        }
        break;
      default:
        throwError('bad randomization method: ' + block_method);
    }

    return(stims);
}


//Generates a random String of a given length using the provided characters.
function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
        return result;
}


/* Get the relevant column that matched the column header*/
function getFromPapa(parsed, columnHeader) {
    var colVals = [];
    for (var i=0; i < parsed.data.length; i++) {
        colVals.push(parsed.data[i][columnHeader]);
    }
    return colVals;
}



// strip off everything but the filename tail from an absolute URL (like that
// returned by video.currentSrc)
function absURLtoFilename(url) {
    // FIXME: JavaScript Lint and Vim's syntax highlighter are both confused
    // by this regex. Something is probably wrong with it.
    // Should it be?: /[^\/]*$/
    return /[^/]*$/.exec(url);
}


// python style string formatting.  Replace {0} with first argument, {1} with second, etc.
String.prototype.format = function() {
  var args = arguments;
  return this.replace(/{(\d+)}/g, function(match, number) {
    return typeof args[number] != 'undefined'
      ? args[number]
      : match
    ;
  });
};
