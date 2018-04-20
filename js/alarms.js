// metastore inspector url
const metastore_inspector = 'https://metastore-inspector.corp.google.com/home/scan';

/**
 * find the dom node by selector and inner text
 * @param {string} elementType: the element type (tag)
 * @param {string} innerText: the stuff between the tags
 * @param {object=} dom: object to search from
 * @return {object} return the found node
 */
function getDomWithText(elementType, innerText, dom = document) {
  const nodes = dom.querySelectorAll(elementType);
  let node = null;

  for (let i = 0; i < nodes.length; i++) {
    node = nodes[i];
    if (node.innerText.toLowerCase() == innerText) {
      return node;
    }
  }
}

/**
 * find parameters from a url
 * @param {string} url:
 * @return {object} return the parameters as a hash map
 */
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

/**
 * add a metastore link to a DOM element
 * @param {string} projectNumber:
 * @param {object} domElement: the DOM element
 */
function addMetastoreLink(projectNumber, domElement) {
  const result = parseQueryString(location.search);
  let jt = 'Unify-Id';

  if (result['jt'] == '1') jt = 'Bug-Id';

  const a = document.createElement('a');
  const linkText = document.createTextNode(' (Metastore Inspector)');
  a.appendChild(linkText);
  a.href = metastore_inspector+'?query=c:'+projectNumber+'%20t:CHNAGEME&access_reason='+result['jv']+'&justification_type='+jt;
  a.target = '_blank';
  domElement.appendChild(a);
}

// search text for finding the project span
const searchTextForProject = 'Cloud Project > Cloud Project Inspection';

// track if the project inspection span is clicked or not
let clicked = false;

// track the project token
let token = '';

document.addEventListener('DOMNodeInserted', () => {
  // triggered from
  // https://google-admin.corp.google.com/v2/overview/cloud-project/10288399232?jt=8&jv=1238384
  // direct link is
  // https://google-admin.corp.google.com/v2/cloud-project-inspection-only/cloud-project/10288399232?jt=8&jv=1238384

  // parse URL for information
  const segments = window.location.pathname.split('/');
  // `segments` should looks like ["", "v2", "overview", "cloud-project",
  // "<project number>"] OR ["", "v2", "cloud-project-inspection-only",
  // "cloud-project",
  // "<project number>"]

  if (segments[2] != 'overview' &&
      segments[2] != 'cloud-project-inspection-only') {
    return;
  }

  const projectNumber = segments[4];
  const span = getDomWithText('span', projectNumber);

  // spans not found yet
  if (!span) return;

  // find the project id
  const projectNameDiv = span.parentElement.parentElement.nextSibling;
  const projectName = projectNameDiv.getElementsByTagName('span')[0].innerText;

  const projectSpan =
      getDomWithText('span', searchTextForProject.toLowerCase());
  if (!projectSpan) return;

  // click the span to trigger the AJAX calls
  if (segments[2] == 'overview' && !clicked) {
    projectSpan.click();
    clicked = true;
    return;
  }

  const div = document.querySelector(
      '[data-title="' + searchTextForProject + '"]');

  const link = div.querySelector('a');

  if (!link) return; // div hasn't been added yet. try again on next event

  const match = link.search.match(/token=([^&]+)/);

  if (!match) return; // link hasn't been added yet. try again on next event

  if (token != match[1]) {
    token = match[1];

    // add metastore-inspector link
    addMetastoreLink(projectNumber, link.parentElement.parentElement);

    console.log('projectName', projectName);

    const payload = {
      'gaLink': window.location.href,
      'tokenLink': link.href,
      'projectName': projectName,
      'projectNumber': projectNumber,
      'token': token,
      'time': Date.now()
    };
    chrome.runtime.sendMessage({action: 'create_alarm', payload: payload});
  }
});
