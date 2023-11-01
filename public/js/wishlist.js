document.querySelectorAll(".openModalBtn").forEach(function (btn) {
  btn.addEventListener("click", function (e) {
    e.preventDefault();
    var productId = this.getAttribute("data-product-id");
    console.log(productId);

    fetch("/wishlist/available-size/" + productId)
      .then((response) => response.json())
      .then((data) => {
        const form = document.getElementById("sizeModal");
        const sizeContainer = form.querySelector(".size-container");

        sizeContainer.innerHTML = "";

        if (data.availability === true) {
          data.sizesAvailable.forEach((size) => {
            const label = document.createElement("label");
            label.className = "containerforsize";

            const input = document.createElement("input");
            input.type = "radio";
            input.name = "size";
            input.value = size;
            input.checked = false;
            input.required = true;

            const span = document.createElement("span");
            span.className = "sizeselected m-2 btn size-btn border btn-lg";
            span.textContent = size;

            label.appendChild(input);
            label.appendChild(span);

            sizeContainer.appendChild(label);
          });
          form.action = "/cart/" + productId;
        } else {
          const message = document.getElementById("outOfStockMessage");
          if (message) {
            message.classList.remove("d-none");
          }
        }
      })
      .then(() => {
        $("#modalforSizeSelection").modal("show");
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  });
});
