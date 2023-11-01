const walletAlert = $("#alertforWallet");
const onlinePaymentAlert = $("#alertforOnline");

$("#checkout-form").submit((e) => {
  e.preventDefault();

  $.ajax({
    url: "/checkout",
    method: "post",
    data: $("#checkout-form").serialize(),
    success: (response) => {
      console.log(response);
      if (response.noAddressAdded)
        alert("Hey user, Add an address first to continue");
      else if (response.noCart) alert("Your cart is empty");
      else if (response.codSuccess) location.href = "/order-placed";
      else if (response.onlinePayment) initializepayment(response);
      else if (response.onlinePaymentFailed) onlinePaymentAlert.show();
      else if (response.walletPaymentFailed) walletAlert.show();
      else if (response.walletPaymentSuccess) location.href = "/order-placed";
    },
  });
});

function initializepayment(order) {
  const imageName = "/public/images/logo-no-background 1.png";
  var options = {
    key: "rzp_test_4KYXC57Tjb8Rt5",
    amount: order.paymentResponse.amount,
    currency: "INR",
    name: "EP CART",
    description: "Test Transaction",
    image: imageName,
    order_id: order.paymentResponse.id,
    handler: (response) => verifyPayment(response, order),
    prefill: { user: order.orderDocument.UserId },
    notes: { address: "Razorpay Corporate Office" },
    theme: { color: "#3399cc" },
  };
  var rzp1 = new Razorpay(options);
  rzp1.on("payment.failed", (response) => {
    alert(response.error.code);
    alert(response.error.description);
    alert(response.error.source);
    alert(response.error.step);
    alert(response.error.reason);
    alert(response.error.metadata.order_id);
    alert(response.error.metadata.payment_id);
  });
  rzp1.open();
}

function verifyPayment(payment, order) {
  $.ajax({
    url: "/verify-payment",
    data: { payment, order },
    method: "post",
    success: (response) => {
      if (response.success) location.href = "/order-placed";
      else location.href = "*";
    },
  });
}
