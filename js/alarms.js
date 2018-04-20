
const metastore_inspector = 'https://metastore-inspector.corp.google.com/home/scan'

/**
 * find the dom node by selector and inner text
 * @param {string} nodeSelector:
 * @param {string} innerText: the stuff between the tags
 * @param {object=} dom: object to search from
 * @return {object} return the found node
 */
function getDomWithText(nodeSelector, innerText, dom = document) {
  const nodes = dom.querySelectorAll(nodeSelector);
  let node = null;

  for (let i = 0; i < nodes.length; i++) {
    node = nodes[i];
    if (node.innerText.toLowerCase() == innerText) {
      return node;
    }
  }
}

function parseQueryString(url) {
  const urlParams = {};
  url.replace(
    new RegExp("([^?=&]+)(=([^&]*))?", "g"),
    function($0, $1, $2, $3) {
      urlParams[$1] = $3;
    }
  );

  return urlParams;
}

function addMetastoreLink(projectNumber, parentElement) {
  const result = parseQueryString(location.search);
  const jt = 'Unify-Id'

  if (result['jt'] == '1') jt = 'Bug-Id';

  const a = document.createElement('a');
  const linkText = document.createTextNode(' (Metastore Inspector)');
  a.appendChild(linkText);
  a.href = metastore_inspector+'?query=c:'+projectNumber+'%20t:CHNAGEME&access_reason='+result['jv']+'&justification_type='+jt;
  a.target = '_blank';
  parentElement.appendChild(a);
}

/**
 * search text for finding the project span
 */
const searchTextForProject = 'Cloud Project > Cloud Project Inspection';

/**
 * track if the project inspection span is clicked or not
 */
let clicked = false;

/**
 * track the project token
 */
let token = "";

document.addEventListener('DOMNodeInserted', function() {
  /**
   * segments should looks like
   * ["", "v2", "overview", "cloud-project", "<project number>"]
   */
  const segments = window.location.pathname.split('/');

  /**
   * return if the segments looks like this:
   * ["", "v2", "search". "<search string>"]
   */
  if (segments[2] != "overview") return;

  const projectNumber = segments[4];
  const span = getDomWithText('span', projectNumber);

  // spans not found yet
  if (!span) return;

  // find the project id
  const projectIdDiv = span.parentElement.parentElement.nextSibling;
  const projectId = projectIdDiv.getElementsByTagName('span')[0].innerText;
  console.log('...found project id', projectId);

  const projectSpan =
      getDomWithText('span', searchTextForProject.toLowerCase());
  if (!projectSpan) return;

  // click the span to trigger the AJAX calls
  if (!clicked) {
    projectSpan.click();
    clicked = true;
    console.log('...span clicked');
    return;
  }

  const div = document.querySelectorAll(
      '[data-title="' + searchTextForProject + '"]')[0];

  const links = div.querySelectorAll('a');
  // return if the link hasn't yet been inserted
  if (!links[0]) return;

  const match = links[0].search.match(/token=([^&]+)/);
  // return if no token found
  if (!match) return;

  if (token != match[1]) {
    token = match[1];

    // add metastore-inspector link
    addMetastoreLink(projectNumber, links[0].parentElement.parentElement);

    console.log('...found token for project number', projectNumber);
    console.log('...token', token);

    chrome.runtime.sendMessage({
      action: 'create_alarm',
      payload: {
        'ga_link': window.location.href,
        'token_link': links[0].href,
        'project': projectId,
        'project_number': projectNumber,
        'token': token,
        'time': Date.now(),
      }
    });
  }
});
