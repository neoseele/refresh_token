function getTokenLink() {
  var links = [].slice.apply(document.getElementsByTagName('a'));
  links = links.map(function(element) {
    return element.href;
  });

  for (var i = 0; i < links.length; ++i) {
    const link = links[i];
    if (link.search(/.*\?project=.*\&token=.*/) != -1) {
      return link;
    }
  }
}

function getTokenDetails() {
  const tokenLink = getTokenLink();
  const match = tokenLink.match(/.*\?project=(.*)\&token=(.*)/i);
  if (match) {
    return {
      'ga_link': window.location.href,
      'token_link': tokenLink,
      'project': match[1],
      'token': match[2],
      'time': Date.now()
    }
  }
}

function createAlarm(alarm) {
  chrome.extension.sendRequest({
    action: 'create_alarm',
    payload: alarm
  });
}

$('#accountoverview_123').on('click', 'a', function() {
  createAlarm(getTokenDetails());
});
