$(".category-filter").on("click", function () {
  const condition = $(this).data("sort-by");
  const currentURL = window.location.href;
  const urlpieces = currentURL.split("/");
  const currentlyAt = urlpieces[urlpieces.length - 1];
  if (currentlyAt === "shop" || currentlyAt.startsWith("shop?sort=")){
    window.location.href = `/shop?sort=${condition}`;
  } else if (currentlyAt.startsWith("shop?Search=")) {
    const extractedUrl = currentlyAt.match(/shop\?Search=[^&]*/);
    const newUrl = extractedUrl[0];
    window.location.href = `${newUrl}&sort=${condition}`;
  } else {
    console.log(currentlyAt);
    const extractedUrl = currentlyAt.match(/shop-in\?Category=[^&]*/);
    const newUrl = extractedUrl[0];
    window.location.href = `${newUrl}&sort=${condition}`;
  }
});
