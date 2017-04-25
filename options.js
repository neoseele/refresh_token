// Saves options to chrome.storage
function save_options() {
  var url = document.getElementById('site').value;
  chrome.storage.sync.set({
    site: url,
  }, function() {
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved';
    setTimeout(function() {
      status.textContent = '';
    }, 1000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restore_options() {
  // Use default value for site
  chrome.storage.sync.get({
    site: 'https://pantheon.corp.google.com/',
  }, function(items) {
    document.getElementById('site').value = items.site;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
