// Saves options to chrome.storage
function save_options() {
  const pantheon_site = document.getElementById('pantheon_site').value;
  const ga_site = document.getElementById('ga_site').value;
  chrome.storage.sync.set({
    pantheon_site: pantheon_site,
    ga_site: ga_site,
  }, function() {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
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
    pantheon_site: 'https://pantheon.corp.google.com/',
    ga_site: 'https://google-admin.corp.google.com/',
  }, function(result) {
    document.getElementById('pantheon_site').value = result.pantheon_site;
    document.getElementById('ga_site').value = result.ga_site;
  });
}
document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
