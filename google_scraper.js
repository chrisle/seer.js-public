/* ---------------------------------------------------------------------------
 * google_scraper.js
 * More info: http://bit.ly/wDFMn5
 *
 * @desc    Google Scraper for Google Docs Spreadsheet.
 * @author  Chris Le - @djchrisle - chrisl at seerinteractive.com
 * @license MIT (see: http://www.opensource.org/licenses/mit-license.php)
 * @version 1.2
 * 
 * Change Log:
 * 1.2.0 - Added ability to offset results (thanks @johnsee)
 * 1.1.0 - Added ability to change the TLD
 * 1.0.1 - Fixed Non-URL universal searches getting returned (Thanks Gareth Brown)
 * 1.0.0 - Initial release
 * -------------------------------------------------------------------------*/

var SeerJs_GoogleScraper = (function() {

  var errorOccurred;

  /**
   * Gets stuff inside two tags
   * @param  {string} haystack String to look into
   * @param  {string} start Starting tag
   * @param  {string} end Ending tag
   * @return {string} Stuff inside the two tags
   */
  function getInside(haystack, start, end) {
    var startIndex = haystack.indexOf(start) + start.length;
    var endIndex = haystack.indexOf(end);
    return haystack.substr(startIndex, endIndex - startIndex);
  }

  /**
   * Fetch keywords from Google.  Returns error message if an error occurs.
   * @param {string} kw Keyword
   * @param {array} optResults (Optional) Number of results to return (defaults to 10)
   * @param {string} optTld (Optional) Top level domain (eg: ".co.uk". Defaults to ".com")
   * @param {string} optStart (Optional) Sets the starting offset for results (defaults to 0)
   * filter=0 Force all results from Google. Important when using large offset
   */
  function fetch(kw, optResults, optTld, optStart) {
    errorOccurred = false;
    optResults = optResults || 10;
    optStart = optStart || 0;
    optTld = optTld || '.com';
    try {
      var url = 'http://www.google' + optTld + '/search?q=' + kw + '&start=' + optStart + '&num=' + optResults  + '&filter=0';
      return UrlFetchApp.fetch(url).getContentText()
    } catch(e) {
      errorOccurred = true;
      return e;
    }
  }

  /**
   * Extracts the URL from an organic result. Returns false if nothing is found.
   * @param {string} result XML string of the result
   */
  function extractUrl(result) {
    var url;
    if (result.match(/\/url\?q=/)) {
      url = decodeURIComponent(getInside(result, "?q=", "&amp"));
      return (url != '') ? url : false
    }
    return false;
  }

  /**
   * Extracts the organic results from the page and puts them into an array.
   * One per element.  Each element is an XMLElement.
   */
  function extractOrganic(html) {
    html = html.replace(/\n|\r/g, '');
    var allOrganic = html.match(/<li class=\"g\">(.*)<\/li>/gi).toString(),
        results = allOrganic.split("<li class=\"g\">"),
        organicData = [],
        i = 0,
        len = results.length,
        url;
    while(i < len) {
      url = extractUrl(results[i]);
      if (url && url.indexOf('http') == 0) {
        organicData.push(url);
      }
      i++;
    }
    return organicData;
  }

  /**
   * Transpose an array from row to cols
   */
  function transpose(ary) {
    var i = 0, len = ary.length, ret = [];
    while(i < len) {
      ret.push([ary[i]]);
      i++;
    }
    return ret;
  }

  //--------------------------------------------------------------------------

  return {
    /**
     * Returns Google SERPs for a given keyword
     * @param  {string} kw Keyword
     */
    get: function(kw, optResults, tld, optStart) {
      var result = fetch(kw, optResults, tld, optStart);
      if (errorOccurred) { return result; }
      return transpose(extractOrganic(result));
    }
  }
  
})();

function googleScraper(keyword, optResults, optTld, optStart) {
  return SeerJs_GoogleScraper.get(keyword, optResults, optTld, optStart);
}

function test() { 
  var withArg = googleScraper("seer interactive", 20);
  var noArg = googleScraper("seer interactive");
  return 0;
}
