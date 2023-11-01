$(document).ready(function () {
  $(".star").on("click", function () {
    const ProductId = $(this).data("product-id");
    const Rating = $(this).data("star-number");

    $(".star").removeClass("text-warning fa-regular fas");

    $(this).nextAll(".star").addClass("fa-regular");
    $(this).prevAll(".star").addClass("fas text-warning");
    $(this).addClass("fas text-warning");

    $.ajax({
      type: "POST",
      url: "/rate-product",
      data: {
        ProductId,
        Rating,
      },
      success: function (response) {
        if (response.success) {
          $("#thanksforrating").removeClass("d-none");
        }
      },
      error: function (error) {
        console.log(error);
      },
    });
  });
});

$("#reviewComment").submit((e) => {
  e.preventDefault();
  $.ajax({
    url: "/post-comment",
    method: "post",
    data: $("#reviewComment").serialize(),
    success: (response) => {
      const inputField = document.getElementById("comment");
      inputField.value = "";
      const commentsContainer = document.getElementById("commentsContainer");
      commentsContainer.innerHTML = "";

      console.log(response.users);
      response.reviews.forEach((review, index) => {
        const user = response.users[index]; // Get the user data corresponding to the current review
        const element = addNewComment(review.Comment, user); // Use the user data in your code
        commentsContainer.prepend(element);
      });
    },
  });
});

function addNewComment(text, userName) {
  const outerDiv = document.createElement("div");
  outerDiv.classList.add("col-sm-12", "col-md-6", "mb-3");

  const cardDiv = document.createElement("div");
  cardDiv.classList.add("card");

  const cardBodyDiv = document.createElement("div");
  cardBodyDiv.classList.add("card-body");

  const starContainer = document.createElement("div");
  starContainer.classList.add("d-flex", "align-items-center");

  const nameParagraph = document.createElement("p");
  nameParagraph.classList.add("card-text");
  nameParagraph.innerHTML = `<strong>${userName}</strong>`;

  const commentParagraph = document.createElement("p");
  commentParagraph.classList.add("card-text");
  commentParagraph.textContent = text;

  cardBodyDiv.appendChild(starContainer);
  cardBodyDiv.appendChild(nameParagraph);
  cardBodyDiv.appendChild(commentParagraph);
  cardDiv.appendChild(cardBodyDiv);
  outerDiv.appendChild(cardDiv);
  return outerDiv;
}

function changeSrc(id) {
  let mainImage = document.getElementById("mainImage");
  mainImage.src = `/uploads/${id}`;
  mainImage.setAttribute("src", `/uploads/${id}`);

  const options = {
    width: 350,
    height: 350,
    zoomWidth: 300,
    zoomHeight: 300,
    offset: { vertical: 0, horizontal: 100 },
  };

  new ImageZoom(document.getElementById("mainImageContainer"), options);
}

// image zoom functionality
const options = {
  width: 350,
  height: 350,
  zoomWidth: 200,
  zoomheight: 200,
  offset: { vertical: 0, horizontal: 100 },
};

new ImageZoom(document.getElementById("mainImageContainer"), options);
