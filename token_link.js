// Copyright (c) 2012 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

// Send the token link back to the background
// background injects this script into all frames in the active tab.

var links = [].slice.apply(document.getElementsByTagName('a'));
links = links.map(function(element) {
  return element.href;
});

for (var i = 0; i < links.length; ++i) {
  var link = links[i];
  if (link.search(/.*\?project=.*\&token=.*/) != -1) {
    chrome.extension.sendRequest({action: 'refresh', link: link});
    break;
  }
}
