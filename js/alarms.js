const search_txt_1 = "Cloud Project > Cloud Project Inspection";
const search_txt_2 = "Open Developers Console now";

function getDomWithText(nodeSelector, innerText, dom=document) {
  var nodes = dom.querySelectorAll(nodeSelector);
  for (i=0; i<nodes.length; i++) {
    var node = nodes[i];
    if (node.innerText.toLowerCase() == innerText) {
      return node;
    }
  }
}

// find the project id
const wiz = document.querySelectorAll('div.cWbHvc > c-wiz')[0];
console.log('wiz', wiz);

wiz.addEventListener(
  "DOMNodeInserted", function() {
    const spans = wiz.querySelectorAll('div.XqxzQb > div.IuoGAf > span');
    console.log('spans', spans);

    if (!spans) {
      console.log("Failed to extract project id", "error");
      return;
    }

    const project_id = spans[0].innerText;
    console.log('...found project id', project_id);

    const span = getDomWithText("div.GlDWyd > span.fuMCCb > span", search_txt_1.toLowerCase());
    console.log('span', span);
    span.click();

    const div = document.querySelectorAll('[data-title="'+search_txt_1+'"]', )[0];
    div.addEventListener(
      "DOMNodeInserted", function() {
        const link = getDomWithText("a.L1R4Ff", search_txt_2.toLowerCase(), div);
        console.log('link', link);

        // If the link hasn't yet been inserted, return immediately
        if (!link)
          return;

        const match = link.search.match(/project=([^&]+)&token=([^&]+)/);
        if (!match) {
          console.log("Failed to extract project/token from URL", "error");
          return;
        }

        const project_number = match[1];
        const token = match[2];

        console.log("...found token for project number", project_number);
        console.log("...token", token);

        chrome.runtime.sendMessage({
          action: 'create_alarm',
          payload: {
            'ga_link': window.location.href,
            'token_link': link,
            'project': project_id,
            'project_number': project_number,
            'token': token,
            'time': Date.now()
          }
        });
      }
    );

  }
)
