// Saves options to chrome.storage
function save_options() {
  var pantheon_site = document.getElementById('pantheon_site').value;
  var ga_site = document.getElementById('ga_site').value;
  chrome.storage.sync.set({
    pantheon_site: pantheon_site,
    ga_site: ga_site,
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
    pantheon_site,
    ga_site,
  }, function(items) {
    document.getElementById('pantheon_site').value = items.pantheon_site;
    document.getElementById('ga_site').value = items.ga_site;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
