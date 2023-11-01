function validateSizeSelection() {
  // check if any radio button is selected
  const radioButtons = document.querySelectorAll('input[name="radio"]');
  let isSelected = false;

  for (const radioButton of radioButtons) {
    if (radioButton.checked) {
      isSelected = true;
      break;
    }
  }

  // display or hide the error message based on selection
  const sizeError = document.getElementById("sizeError");
  if (!isSelected) {
    sizeError.style.display = "block";
    return false;
  } else {
    sizeError.style.display = "none";
    return true;
  }
}

// add to wishlist started
$('[id^="addToWishlist_"]').click(function () {
  const productId = $(this).data("product-id");
  console.log(productId);
  $.ajax({
    url: "/add-to-wishlist",
    method: "post",
    data: JSON.stringify({ productId: productId }),
    contentType: "application/json",
    success: (response) => {
      const productId = response.productId;
      const selector = $(`[data-product-id="${productId}"]`);
      const messageSpace = $(selector);
      messageSpace.show();
      setTimeout(() => {
        messageSpace.hide();
      }, 2000);
    },
  });
});

//  add to wishlist ended
