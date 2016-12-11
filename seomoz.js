/* ---------------------------------------------------------------------------
 * seomoz.js
 * 
 * @desc    Wrapper for SEOmoz API
 * @author  Chris Le - @djchrisle - chrisl at seerinteractive.com
 * @license MIT (see: http://www.opensource.org/licenses/mit-license.php)
 * @version 1.0
 * -------------------------------------------------------------------------*/

/**
 * Credits and history:
 *   Chris Le:      http://bit.ly/xLop1a
 *   Tom Anthony:   http://bit.ly/lARZ9u
 *   Ian Lurie:     http://bit.ly/mBpRXC
 *   Tom Critchlow: http://bit.ly/xmWlEP
 */

//----------------------------------------------------------------------------
// Expose functions to Google Docs

function getLinkscape(urlRange, optIncludeHeader) { 
  try {
    return SeerJs.SeomozApi.urlMetrics(urlRange, optIncludeHeader);   
  } catch(e) {
    return e.message;
  }
}

function filterColumns(input, filterCols) {
  return SeerJs.ArrayTransform.filterColumns(input, filterCols);
}

function SeerJs_() { VERSION = 'v1.5'; return VERSION; }
var SeerJs = new SeerJs_();

//----------------------------------------------------------------------------
// Settings tab in the spreadsheet

SeerJs_.prototype.Settings = (function() {

  function getSettingsSheet_() {
    SETTINGS_SHEET = "Settings";
    var thisDoc = SpreadsheetApp.getActiveSpreadsheet();
    var settingsSheet = thisDoc.getSheetByName(SETTINGS_SHEET);
    if (settingsSheet == null) {
      thisDoc.insertSheet(SETTINGS_SHEET);
    }
    return settingsSheet;
  }

  return {
    /**
     * Returns setting names need to be in column A and the setting value needs to 
     * be in column B.
     *
     * @param {string} settingName Name of the setting you want to return
     * @return The setting or false if not found.
     */
    get: function(settingName) {
      var settings = getSettingsSheet_().getRange("A:B").getValues();
      for (var i = 0; i < settings.length; i++) {
        var setting = settings[i][0];
        if (settings[i][0].toUpperCase() == settingName.toUpperCase()) {
          return settings[i][1];
        }
      }
      return false;
    }

  };
})();

//----------------------------------------------------------------------------
// Http module

SeerJs_.prototype.Http = (function() { 
  
  function toParam(params) {
    var tuples = [];
    for (key in params) {
      tuples.push(key + "=" + params[key]);
    }
    return tuples.join("&");
  }
   
  return {
    /**
     * Builds a URI with parameters from an array, fetches it and returns a JSON
     * parse object.
     * @param {string} uri The URI you want to get
     * @param {hash} optParams (optional) Hash of parameters to pass
     * @return A Utilities.jsonParse object
     * @example
     * var result = fetchJson("http://www.some-api.com/param", {
     *    "key" : "12345",
     *    "param" : "value"
     * });
     */
    fetchJson: function(uri, optParams, optArgs) {
      var response, fetch;
      if (optParams != undefined) uri = uri + "?" + toParam(optParams);
      if (optArgs == undefined) {
        response = UrlFetchApp.fetch(uri)
        fetch = response.getContentText();
      } else {
        response = UrlFetchApp.fetch(uri, optArgs);
        fetch = response.getContentText();
      }
      return Utilities.jsonParse(fetch);
    }

  };
})();

//----------------------------------------------------------------------------
// Utils module

SeerJs_.prototype.Utils = (function() { 
  return {
    
    /**
     * Groups the array into chucks of size.
     * @example
     * SeerJs.Utils.groupBy([1,2,3,4,5,6], 3); // => [[1,2,3], [4,5,6]]
     */
    groupBy: function(array, size) {
      if (array.length <= size) return [array];
      var temp = array;
      var first = true;
      var retval = [];
      while (temp.length > size) {
        var temp2 = temp.splice(size);
        if (first) {
          retval.push(temp);
          first = false;
        }
        retval.push(temp2);
        temp = temp2;
      }
      return retval;
    },

    /**
     * Converts a string to an array (only if it's actually a string)
     * @example
     * SeerJs.Utils.strToArray('hello world');    // => ['hello world']
     * SeerJs.Utils.strToArray(['hello world']);  // => ['hello world']
     */
    strToArray: function(obj) {
      if (typeof obj == "string") {
        return [obj];
      } else {
        return obj;
      }
    },

    /**
     * Checks if the object is an array
     * @example
     * SeerJs.Utils.isArray([1,2,3]); // => true
     * SeerJs.Utils.isArray('not an array'); // => false
     */
    isArray: function(obj) {
      if (obj.constructor.toString().indexOf("Array") == -1) {
        return false;
      } else {
        return true;
      }
    },

    /**
     * Returns true if the array is actually in columns
     * @example
     * // myArray is A1:A3
     * isColumn(myArray); // => true
     * // myArray is A1:C1
     * isColumn(myArray); // => false
     * // myArray is A1
     * isColumn(myArray); // => false
     */
    isColumn: function(array) {
      if (SeerJs.Utils.isArray(array)) {
        if (SeerJs.Utils.isArray(array[0])) { 
          return true;
        }
      }
      return false;
    }
  };
})();

//----------------------------------------------------------------------------
// Array Transformer! (... more than meets the eye!)

SeerJs_.prototype.ArrayTransform = (function() { 

  // Transposes hash tables
  function hashTableToCols_ (input, filter) {
    var retval = new Array, colIndex = new Array, newRow = new Array;
    retval.push(filter);
    for (row in input) {
      newRow = new Array;
      for (col in filter) { 
        newRow.push(input[row][filter[col]]);
      }
      retval.push(newRow);
    }  
    return retval;
  }

  // Transposes arrays that have created an array in rows
  function arrayToCols_ (input, filter) {
    var retval = new Array, colIndex = new Array, newRow = new Array;
    for (col in filter) { colIndex.push(input[0].indexOf(filter[col])); }
    for (row in input) {
      newRow = new Array;
      for (col in colIndex) { newRow.push(input[row][colIndex[col]]); }
      retval.push(newRow);
    }
    return retval;
  }

  return {
    /**
     * Filters data by columns using the header.
     *
     * @param {array|range} input Input array or range of cells.
     * @param {array|range} filterCols Columns you want to filter by
     * @example
     * 
     * Headers in the first row
     * ------------------------
     *   A1: url
     *   B1: title
     *   C1: mozrank
     *   D1: page authority
     *   
     * URLs down column A
     * ------------------
     *   A2: www.seerinteractive.com
     *   A3: www.seomoz.org
     *   A4: www.distilled.net
     *
     * filterColumns + getLinkscape + Magic
     * --------------------------------------
     *   B2: =filterColumns( getLinkscape(A2:A4, false), B1:D1 )
     */
    filterColumns: function(input, filterCols) {
      var retval, filter;
      filter = (filterCols.length == 1) ? filterCols[0] : filterCols; // transpose
      if ((input[0].length != undefined) && (input[0].length > 0)){
        retval = arrayToCols_(input, filter);
      } else {
        retval = hashTableToCols_(input, filter);
      }
      return (filterCols.length == 1) ? 
          SeerJs.ArrayTransform.removeFirstRow(retval) : retval;
    },

    /**
     * Removes the header of an array or range
     * @param {array|range} input Array to shift
     * @return The array without a header
     */
    removeFirstRow: function(input) {
      var temp = input;
      temp.shift();
      return temp;
    }
  };

})();

//----------------------------------------------------------------------------
// Seomoz module

/**
 * SEOmoz enclosure
 * @author  Chris Le - @djchrisle - chrisl at seerinteractive.com
 * @author  Tom Anthony (original: http://bit.ly/lARZ9u)
 */
SeerJs_.prototype.SeomozApi = (function() { 

  var SEOMOZ_MEMBER_ID          = SeerJs.Settings.get("SEOmoz Member ID");
  var SEOMOZ_SECRET_KEY         = SeerJs.Settings.get("SEOmoz Secret Key");
  var SEOMOZ_BITFLAGS = {
    "ut"   : "title"              , // 1
    "uu"   : "url"                , // 4
    "ueid" : "external links"     , // 32
    "uid"  : "links"              , // 2048
    "umrp" : "mozrank"            , // 16384
    "fmrp" : "subdomain mozrank"  , // 32768
    "us"   : "http status code"   , // 536870912
    "upa"  : "page authority"     , // 34359738368
    "pda"  : "domain authority"     // 6871947673
  };
  var SEOMOZ_ALL_METRICS    = 103616137253; // All the free metrics
  var SEOMOZ_BATCH_SIZE     = 10; // Size of batch (Maximum 10)
  var OBEY_FREE_RATE_LIMIT  = true; // Zzz for 5 sec. after every request 

  /**
   * Extracts URLs from columns and removes the protocol from them
   */
  function linkscapePrepUrls_ (urls) {
    var retval = [];
    if (SeerJs.Utils.isArray(urls)) {
      // remove outer array if we get columns
      if (SeerJs.Utils.isColumn(urls)) {
        var i = 0; var len = urls.length;
        while (i < len) {
          retval.push(urls[i]);
          i++;
        }
      } else {
        retval = urls;
      }
    } else {  
      // if we get a string, convert it to an array.
      retval = SeerJs.Utils.strToArray(urls);
    }
    // remove protocol or seomoz doesn't work right.
    for (var i = 0; i < retval.length; i++) {
      retval[i] = retval[i].toString().replace(/http(s)?:\/\//gi, "");
    }
    return retval;
  }

  /**
   * Transposes results from linkscape api to a 2d array
   */
  function linkscapeTranspose_ (response) {
    var retval = [];
    var row = [];
    // push headers
    for (key in SEOMOZ_BITFLAGS) { row.push(SEOMOZ_BITFLAGS[key]); }
    retval.push(row);
    // push rows
    for (var i = 0; i < response.length; i++) {  
      row = [];
      for (key in SEOMOZ_BITFLAGS) { 
        row.push(response[i][key]);
      }
      retval.push(row);
    }
    return retval;
  }

  /**
   * Creates a XOR bit flag based on the array of columns you want.
   */
  function linkscapeBitFlag_(cols) {
     for (flag in SEOMOZ_BITFLAGS) {
      var hash = SEOMOZ_BITFLAGS[flag];
    }
  }

  /**
   * Creates a expiration time stamp
   */
  function linkscapeExp_() {
    var uDate = new Date().getTime();
    return Math.round(uDate/1000) + 1200;
  }

  /**
   * Calculates 64bit hash signature
   */
  function linkscapeSig_(expire) {
    var signature = Utilities.computeHmacSignature(
        Utilities.MacAlgorithm.HMAC_SHA_1, SEOMOZ_MEMBER_ID + "\n" +
        expire, SEOMOZ_SECRET_KEY);
    return encodeURIComponent(Utilities.base64Encode(signature));
  }

  return {
    
    /**
     * Returns all metrics from SEOmoz's Linkscape. <p>
     * 
     * Original by {@link http://www.tomanthony.co.uk/blog/seomoz-linkscape-api-with-google-docs/}
     * Modified so that you can select a large range of URLs and it will get the 
     * metrics in batches of 10.<p>
     *
     * @param {string[]} urlRange One or more URLs to send to Linkscape
     * @param {boolean} optIncludeHeader Include the header? (Default is true)
     * @function getLinkscape
     * 
     * @example
     * Cells:
     *    A1: www.seerinteractive.com
     *    A2: http://www.domain.com/blog
     *    A3: http://www.anotherdomain.com/page.html
     *
     * // => Gets current data on www.seerinteractive.com
     * =getLinkscape("www.seerinteractive.com")
     * // => Gets current data on www.seerinteractive.com
     * =getLinkscape(A1)
     * // => Gets data for three URLS in a batch
     * =getLInkscape(A1:A3)
     * // => Gets data for three URLS in a batch and reomves the header row
     * =getLInkscape(A1:A3, false)
     *
     */
    urlMetrics: function(urlRange, optIncludeHeader) {
      if (optIncludeHeader == undefined) optIncludeHeader = true;
      var expire = linkscapeExp_();
      var retval = new Array;
      var first = true;
      var response;

      // POST in batches of 10 and merge results
      urlRange = SeerJs.Utils.strToArray(urlRange);
      var urlGroups = SeerJs.Utils.groupBy(linkscapePrepUrls_(urlRange),
                                          SEOMOZ_BATCH_SIZE);
      for (var g = 0; g < urlGroups.length; g++) {
        var payload = Utilities.jsonStringify(urlGroups[g])
        response = linkscapeTranspose_(SeerJs.Http.fetchJson(
            "http://lsapi.seomoz.com/linkscape/url-metrics/",
            {
              "AccessID"  : SEOMOZ_MEMBER_ID,
              "Expires"   : expire,
              "Signature" : linkscapeSig_(expire),
              "Cols"      : SEOMOZ_ALL_METRICS
            },
            {
              "method"    : "post",
              "payload"   : payload
            }
        ));
        // merge results from batches together
        if (first == false) response.shift();
        retval.push.apply(retval, response);
        first = false;
        if (OBEY_FREE_RATE_LIMIT) { Utilities.sleep(5000); }
      }
      // remove header if user requests.
      if (!optIncludeHeader) retval.shift();
      return retval;
    }
  };
})();

//----------------------------------------------------------------------------
// test

function _cheap_test() {
  /*var response = getLinkscape("www.seerinteractive.com");
  (response[1][1] == 'www.seerinteractive.com/')
      ? (Logger.log('passed.'))
      : (Logger.log('failed.'));*/
  
  var response = getLinkscape([ ["www.seerinteractive.com"], 
                                ['www.seomoz.org'], 
                                ['www.google.com'] ]);
  return response;
}
