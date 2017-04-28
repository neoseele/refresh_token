
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
    // console.log('matched');
    return {
      'ga_link': window.location.href,
      'token_link': tokenLink,
      'project_id': match[1],
      'token': match[2],
      'time': Date.now()
    }
  }
}

function checkAlarm(alarm, callback) {
  const currentLabel = document.getElementById('toggleAlarm').innerText;
  // alert('currentLabel:' + currentLabel);

  const hasAlarm = (currentLabel != 'Activate alarm');
  if (callback) callback(alarm, hasAlarm);
}

function createAlarm(alarm) {
  chrome.extension.sendRequest({
    action: 'create_alarm',
    alarm: alarm
  });
  document.getElementById('toggleAlarm').innerText = 'Cancel alarm';
}

function clearAlarm(alarm) {
  chrome.extension.sendRequest({
    action: 'clear_alarm',
    alarm: alarm
  });
  document.getElementById('toggleAlarm').innerText = 'Activate alarm';
}

function viewAlarms() {
  chrome.extension.sendRequest({
    action: 'view_alarms',
  });
}

function toggleAlarm(alarm) {
  checkAlarm(alarm, function(alarm, hasAlarm) {
    if (hasAlarm) {
     clearAlarm(alarm);
    } else {
     createAlarm(alarm);
    }
  });
}

$('#accountoverview_123').on('click', 'a', function() {
  // create buttons
  const button = document.createElement('button');
  button.id = 'toggleAlarm';
  button.innerText = 'Activate alarm';

  const button1 = document.createElement('button');
  button1.id = 'viewAlarms';
  button1.innerText = 'View alarms';

  // create the p
  const p = document.createElement('p');
  p.appendChild(button);
  p.appendChild(button1);

  document.getElementById('accountoverview_123').appendChild(p);

  $('#toggleAlarm').on('click', function(){
    const tokenDetails = getTokenDetails();
    toggleAlarm(tokenDetails);
  });

  $('#viewAlarms').on('click', function(){
    viewAlarms();
  });

  $('#toggleAlarm').trigger('click');
});
