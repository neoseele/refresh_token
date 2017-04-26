
function getTokenLink() {
  var links = [].slice.apply(document.getElementsByTagName('a'));
  links = links.map(function(element) {
    return element.href;
  });

  for (var i = 0; i < links.length; ++i) {
    var link = links[i];
    if (link.search(/.*\?project=.*\&token=.*/) != -1) {
      return link;
    }
  }
}

function getAlarmName() {
  var token_link = getTokenLink();
  var match = token_link.match(/.*\?project=(.*)\&token=.*/i);
  return match[1]; // use project id as alarm name
}

function checkAlarm(callback) {
  var current_label = document.getElementById('toggleAlarm').innerText;
  // alert('current_label:' + current_label);

  var hasAlarm = (current_label != 'Activate alarm');
  if (callback) callback(hasAlarm);
}

function createAlarm() {
  chrome.extension.sendRequest({action: 'create_alarm', alarm_name: getAlarmName()});
  document.getElementById('toggleAlarm').innerText = 'Cancel alarm';
}

function clearAlarm() {
  chrome.extension.sendRequest({action: 'clear_alarm', alarm_name: getAlarmName()});
  document.getElementById('toggleAlarm').innerText = 'Activate alarm';
}

function doToggleAlarm() {
  checkAlarm(function(hasAlarm) {
    if (hasAlarm) {
     clearAlarm();
    } else {
     createAlarm();
    }
    checkAlarm();
  });
}

var button = document.createElement('button');
button.id = 'toggleAlarm';
button.innerText = 'Activate alarm';
var p = document.createElement('p');
p.appendChild(button);
document.body.appendChild(p);
document.getElementById('toggleAlarm').onclick = doToggleAlarm;
// };
