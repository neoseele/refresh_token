// Copyright 2017 Google Inc. All Rights Reserved

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

/**
 * search text for finding the project span
 */
const searchTextForProject = 'Cloud Project > Cloud Project Inspection';

/**
 * fetch the current url
 * which will be used to parse the project number
 */
const url = window.location;

/**
 * fetch project number from url
 *
 * url.pathname.split('/') =>
 * ["", "v2", "overview", "cloud-project", "<project number>"]
 *
 */
const segments = url.pathname.split('/');
const projectNumber = segments[segments.length - 1];


document.addEventListener('DOMNodeInserted', function() {
  const span = getDomWithText('span', projectNumber);

  // spans not found yet
  console.log('span', span);
  if (!span) return;

  // find the project id
  const projectIdDiv = span.parentElement.parentElement.nextSibling;
  const projectId = projectIdDiv.getElementsByTagName('span')[0].innerText;
  console.log('...found project id', projectId);

  const projectSpan =
      getDomWithText('span', searchTextForProject.toLowerCase());
  // console.log('projectSpan', projectSpan);

  if (!projectSpan) return;

  // click the span to trigger the AJAX calls
  projectSpan.click();

  const div = document.querySelectorAll(
      '[data-title="' + searchTextForProject + '"]')[0];

  div.addEventListener('DOMNodeInserted', function() {
    const links = div.querySelectorAll('a');
    // console.log('links', links);

    // If the link hasn't yet been inserted, return immediately
    if (!links[0]) return;

    const match = links[0].search.match(/project=([^&]+)&token=([^&]+)/);
    if (!match) return;

    // const projectNumber = match[1];
    const token = match[2];

    console.log('...found token for project number', projectNumber);
    console.log('...token', token);

    chrome.runtime.sendMessage({
      action: 'create_alarm',
      payload: {
        'ga_link': window.location.href,
        'token_link': links[0],
        'project': projectId,
        'project_number': projectNumber,
        'token': token,
        'time': Date.now()
      }
    });
  });
});
