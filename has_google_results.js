/* ---------------------------------------------------------------------------
 * has_google_results.js
 * 
 * @desc    Determine if there are any results for a given a keyword / site.
 * @author  Chris Le - @djchrisle - chrisl at seerinteractive.com
 * @license MIT (see: http://www.opensource.org/licenses/mit-license.php)
 * @version 1.0
 * -------------------------------------------------------------------------*/

/**
 * Returns true if results in Google are found.  Returns false if not.
 * @param  {string}  site What site you want to look into
 * @param  {string}  kw The keyword you want to look for
 * @param  {integer}  optResults (optional) Number of results (default is 20)
 * @param  {string}  optParams (optional) Extra query string parameters
 * @return {Boolean} True / false.
 * @example
 * =hasGoogleResults('arnold.com', 'guest post'); // => false
 * =hasGoogleResults('cnn.com', 'guest post');    // => true
 */
function hasGoogleResults(site, kw, optResults, optParams) {
  var url = generateUrl_(site, kw, optResults, optParams);
  var fetch = Xml.parse(UrlFetchApp.fetch(url).getContentText(), true);
  var html = fetch.toXmlString();
  var hasResults = html.match("not match any documents");
  return (hasResults != null) ? false : true;
}

/**
 * Returns a Google search URL
 * @param  {string}  site What site you want to look into
 * @param  {string}  kw The keyword you want to look for
 * @param  {integer}  optResults (optional) Number of results (default is 20)
 * @param  {string}  optParams (optional) Extra query string parameters
 * @return {string}  Full Google search URL
 * @private
 */
function generateUrl_(site, kw, optResults, optParams) {
  optResults = optResults || 20;
  optParams = optParams || "&hl=en&lr=&ft=i&cr=&safe=images&pws=0"; // jdoherty's stuff... 
  kw.replace(/\s/, '+'); // replace spaces with +'s'
  site = 'site:' + site; // site: search
  var query = site + '%20' + kw;
  var url = 'http://www.google.com/search?q=' + query + "&num=" + optResults + optParams;
  return url;
}
