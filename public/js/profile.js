document.getElementById("copyButton").addEventListener("click", function () {
  const referralLink = document.getElementById("referral-link").textContent;

  const tempInput = document.createElement("input");
  tempInput.value = referralLink;
  document.body.appendChild(tempInput);

  tempInput.select();
  document.execCommand("copy");

  document.body.removeChild(tempInput);

  const successMessage = document.getElementById("copySuccessMessage");
  successMessage.classList.remove("d-none");

  setTimeout(function () {
    successMessage.classList.add("d-none");
  }, 3000);
});
