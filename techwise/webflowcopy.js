(function () {
  var currentPayload = "";
  var hiddenTrigger = document.createElement("button");
  hiddenTrigger.contentEditable = "true";
  hiddenTrigger.style.cssText =
    "position:fixed;clip:rect(1px,1px,1px,1px);overflow:hidden;height:1px;width:1px;padding:0;border:0;";
  document.body.appendChild(hiddenTrigger);

  hiddenTrigger.addEventListener("copy", function (e) {
    e.clipboardData.setData("application/json", currentPayload);
    e.preventDefault();
  });

  document.querySelectorAll("[data-copy-btn]").forEach(function (btn) {
    var originalText = btn.textContent.trim();
    btn.addEventListener("click", function () {
      var id = btn.getAttribute("data-payload-id");
      currentPayload = document.getElementById(id).textContent.trim();
      hiddenTrigger.focus();
      document.execCommand("copy");
      btn.textContent = "✅ Copied!";
      setTimeout(function () {
        btn.textContent = originalText;
      }, 2000);
    });
  });
})();
