// to check the date is valid or not when admin is adding a coupon
const dateField = document.getElementById("dateField");
const dateError = document.getElementById("dateError");

dateField.addEventListener("input", function () {
  const selectedDate = new Date(dateField.value);
  const currentDate = new Date();

  if (selectedDate < currentDate) {
    dateError.textContent = "Please select a future date.";
    dateField.setCustomValidity("Please select a future date.");
  } else {
    dateError.textContent = "";
    dateField.setCustomValidity("");
  }
});

document
  .getElementById("addCouponForm")
  .addEventListener("submit", function (event) {
    if (!dateField.checkValidity()) {
      event.preventDefault();
    }
  });

// coupon adding expire date validation ended
