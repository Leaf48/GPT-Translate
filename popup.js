// Click handler
document.getElementById("submit").addEventListener("click", () => {
  const textValue = document.getElementById("textbox").value;
  chrome.storage.local.set({ gpt_translate_token: textValue }, () => {
    console.log("Value is set to: ", textValue);
    document.getElementById("current-token").innerHTML = textValue;
  });
});

// Set variable when load
window.addEventListener("load", () => {
  chrome.storage.local.get("gpt_translate_token", (result) => {
    // result.ここにkey
    document.getElementById("current-token").innerHTML =
      result.gpt_translate_token;
  });
});
