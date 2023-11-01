const fileInputs = $("#categoryImage");
const uploadedImage = $("#uploadedImage");
const deleteButton = $(".deletes-image");

fileInputs.on("change", function () {
  const files = fileInputs[0].files;

  // delete buttons for uploaded images
  if (files.length > 0) {
    const file = files[0];
    const reader = new FileReader();

    reader.onload = function (e) {
      // src attribute of the corresponding <img> element
      uploadedImage.attr("src", e.target.result);
      deleteButton.show();
    };

    reader.readAsDataURL(file);
  } else {
    uploadedImage.attr("src", "");
    deleteButton.hide();
  }
});
// add event listener to the "Delete" buttons
// using in category adding time
deleteButton.click(function (event) {
  event.preventDefault();
  uploadedImage.attr("src", "");
  fileInputs.val("");
  deleteButton.hide();
});
