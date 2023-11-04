document.addEventListener("DOMContentLoaded", () => {
  const decreaseButtons = document.querySelectorAll(".decrease-quantity");
  const increaseButtons = document.querySelectorAll(".increase-quantity");

  let productId = null;
  let size = null;

  async function updateQuantity(productId, size, change) {
    try {
      const response = await fetch("/update-quantity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, size, change }),
      });

      if (response.ok) {
        const data = await response.json();
        const total = document.getElementById(`totalAmountCell`);
        const payable = document.getElementById(`Payable`);
        const discount = document.getElementById(`Saved`);
        const quantityInput = document.getElementById(
          `count_${productId}_${size}`
        );
        const ToShowOutOfStock = document.getElementById(
          `ToShowOutOfStock_${productId}_${size}`
        );

        if (data.outOfStock) {
          ToShowOutOfStock.textContent = "Out of Stock";
          setTimeout(() => {
            ToShowOutOfStock.textContent = "";
          }, 3000);
        } else if (quantityInput) {
          quantityInput.value = data.newQuantity;
          total.textContent = data.total;
          payable.textContent = data.payable;
          discount.textContent = data.discount;
        }
      } else {
        console.error("error in updating quantity:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
    }
  }

  decreaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      productId = button.getAttribute("data-product-id");
      size = button.getAttribute("data-product-size");
      const quantityInput = document.getElementById(
        `count_${productId}_${size}`
      );
      const quantity = parseInt(quantityInput.value, 10);

      if (quantity === 1) {
        return;
      }
      $.ajax({
        url: "/to-check-coupon-validity",
        method: "post",
        data: {
          productId,
        },
        success: (response) => {
          if (response.conditionSatisfied) {
            updateQuantity(productId, size, -1);
          } else {
            // couponWillLoose
            $("#confirmationForDeleteCouponModal").modal("show");
          }
        },
      });
    });
  });

  const continueButton = document.getElementById(
    "remove-coupon-and-decrease-quantity"
  );
  if (continueButton) {
    continueButton.addEventListener("click", () => {
      $.ajax({
        url: "/delete-coupon-from-cart",
        method: "post",
        success: (response) => {
          console.log(response);
          updateQuantity(productId, size, -1);
          $("#to-show-discount").addClass("d-none");
          $("#cartDiscount").addClass("d-none");
          $("#confirmationForDeleteCouponModal").modal("hide");
        },
        error: (error) => {
          console.log("an unexpected error", error);
        },
      });
    });
  }

  increaseButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const productId = button.getAttribute("data-product-id");
      const size = button.getAttribute("data-product-size");
      updateQuantity(productId, size, 1);
    });
  });
});

$("#form-for-coupon").submit((e) => {
  e.preventDefault();

  $.ajax({
    url: "/apply-coupon",
    method: "post",
    data: $("#form-for-coupon").serialize(),
    success: (response) => {
      if (response.couponNotFound) {
        $("#coupon-code-text").val("");
        $("#invalid-coupon-error").removeClass("d-none");

        setTimeout(() => {
          $("#invalid-coupon-error").addClass("d-none");
        }, 3000);
      } else if (response.orderAmountNotEnough) {
        $("#coupon-code-text").val("");
        $("#order-amount-not-enough").removeClass("d-none");
        setTimeout(() => {
          $("#order-amount-not-enough").addClass("d-none");
        }, 3000);
      } else if (response.alreadyUsed) {
        $("#coupon-code-text").val("");
        $("#already-used-error").removeClass("d-none");
        setTimeout(() => {
          $("#already-used-error").addClass("d-none");
        }, 3000);
      } else if (response.oneCouponExist) {
        $("#confirmationModal").modal("show");
      } else if (response.couponFoundAndAbleToApply) {
        $("#coupon-code-text").val("");
        $("#coupon-applied-message").removeClass("d-none");
        setTimeout(() => {
          $("#coupon-applied-message").addClass("d-none");
        }, 3000);
        $("#to-show-discount").removeClass("d-none");
        $("#cartDiscount").addClass("d-none");
        $("#dicountAmountByCoupon").text(response.couponDiscount);
        $("#Payable").text(response.priceAfterCouponApplied);
      }
    },
  });
});

$("#toContinueWithAnotherCoupon").on("click", function () {
  const CouponCode = $("#coupon-code-text").val();

  $.ajax({
    url: "/apply-another-coupon",
    method: "POST",
    data: {
      CouponCode,
    },
    success: (response) => {
      $("#confirmationModal").modal("hide");
      if (response.couponFoundAndAbleToApply) {
        $("#coupon-code-text").val("");
        $("#coupon-applied-message").removeClass("d-none");
        $("#to-show-discount").removeClass("d-none");
        $("#cartDiscount").addClass("d-none");
        $("#dicountAmountByCoupon").text(response.couponDiscount);
        $("#Payable").text(response.priceAfterCouponApplied);
      } else {
        $("#coupon-code-text").val("");
        $("#wrong-message").removeClass("d-none");
      }
    },
  });
});

document.addEventListener("DOMContentLoaded", () => {
  let productId;
  let size;
  let quantity;

  $(".buttonToDeleteItemFromCart").on("click", async function () {
    productId = $(this).data("product-id");
    size = $(this).data("product-size");
    quantity = $(`#count_${productId}_${size}`).val();
    console.log(productId);
    console.log(size);
    console.log(quantity);
    $.ajax({
      url: "/check-before-delete-cart",
      method: "POST",
      data: {
        productId: productId,
        size: size,
        quantity: quantity,
      },
      success: (response) => {
        if (response.couponWillLoose) {
          $("#delete-coupon-for-delete-item").modal("show");
          // coupon Will Loose
        } else if (response.conditionSatisfied) {
          $.ajax({
            url: "/delete-cart-item",
            method: "post",
            data: {
              productId,
              size,
              quantity,
            },
            success: (response) => {
              window.location.href = "/cart";
            },
          });
          //coupon Will not Loose
        }
      },
      error: (err) => {
        console.log(err);
      },
    });
  });

  $("#remove-coupon-and-delete-cart-item").on("click", function () {
    $.ajax({
      url: "/delete-coupon-from-cart",
      method: "post",
      data: {
        productId,
        size,
        quantity,
      },
      success: (response) => {
        if (response.success) {
          $.ajax({
            url: "/delete-cart-item",
            method: "post",
            data: {
              productId,
              size,
              quantity,
            },
            success: (response) => {
              window.location.href = "/cart";
            },
          });
        }
      },
    });
  });
});

$("#button-to-check-out").on("click", () => {
  $.ajax({
    url: "/check-products-availability",
    method: "post",
    success: (response) => {
      if (response.someProductsNotAvailable) {
        console.log(response.notAvailableProducts);
        response.notAvailableProducts.forEach((item) => {
          const ToShowOutOfStock = document.getElementById(
            `ToShowOutOfStock_${item.productId}_${item.size}`
          );
          ToShowOutOfStock.textContent = "Out of Stock";
          //console.log('its ok')
        });
        $("#some-products-not-available").modal("show");
      } else if (response.everythingIsOk) {
        window.location.href = "/checkout";
      }
    },
  });
});
