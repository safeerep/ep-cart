function upDateOrder(button) {
  const orderId = $(button).data("order-id");
  const status = $(button).data("status");
  const statusButton = $(button)
    .closest(".dropdown")
    .find("#current-status-of-order");
  $.ajax({
    url: `/admin/update-order/${orderId}?status=${status}`,
    method: "get",
    success: (response) => {
      statusButton.text(response.orderStatus);
      const paymentStatusCell = $(`#payment-status-cell-${orderId}`);
      paymentStatusCell.text(response.paymentStatus);
    },
  });
}
