function getDomWithText(nodeSelector, innerText) {
  var nodes = document.querySelectorAll(nodeSelector);
  for (i=0; i<nodes.length; i++) {
    var node = nodes[i];
    if (node.innerText.toLowerCase() == innerText) {
      return node;
    }
  }
}

function googlAdminPage() {
  var epoch_ms = Date.now();
  var dom1 = "div.admin-zippy-group-header.goog-zippy-header.goog-zippy-";
  var dom2 = "div.admin-zippy-group-child-header.goog-zippy-header.goog-zippy-";

  if (!getDomWithText(dom1+"expanded", "project overview")) {
    console.log("...expanding Project overview zippy");
    getDomWithText(dom1+"collapsed", "project overview").click();
  }

  if(!getDomWithText(dom2+"expanded", "cloud project inspection")) {
    console.log("...expanding Cloud Project inspection zippy");
    getDomWithText(dom2+"collapsed", "cloud project inspection").click();
    // Refresh the current epoch
    epoch_ms = Date.now();
  }

  console.log("...examining inserted DOM nodes");

  document.getElementById("accountoverview_123").addEventListener(
    "DOMNodeInserted", function() {

      var link = getDomWithText("#accountoverview_123 a", "open developers console");
      // If the link hasn't yet been inserted, return immediately
      if (!link)
        return;

      // link.origin = https://google-admin.corp.google.com
      // link.path = /accountoverview?
      // console.log('search', link.search);
      var match = link.search.match(/project=([^&]+)&token=([^&]+)/);
      if (!match) {
        console.log("Failed to extract project/token from URL", "error");
        return;
      }

      var project_id = match[1];
      var token = match[2];

      console.log("...found token for project " + project_id);
      console.log("...token " + token);
      console.log("...getting token expiration");

      var expiry_ms = 0;
      var nodes = document.querySelectorAll("#accountoverview_123 span");
      for (i=0; i<nodes.length; i++) {
        var node = nodes[i];
        var results = node.innerText.match(/minutes left until token expiration: (\d+)/i);
        if (results) {
          expiry_ms = parseInt(results[1]) * 60 * 1000;
          break;
        }
      }
      console.log('expiry_ms', expiry_ms);

      if (expiry_ms) {
        // send message when expiry_ms > 0
        chrome.runtime.sendMessage({
          action: 'create_alarm',
          payload: {
            'ga_link': window.location.href,
            'token_link': link,
            'project': project_id,
            'token': token,
            'time': Date.now()
          }
        });
      }
  });
}

googlAdminPage();
