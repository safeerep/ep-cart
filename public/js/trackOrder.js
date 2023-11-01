async function forDownloadInvoice(orderId) {
  try {
    const response = await fetch("/create-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    });

    if (response.ok) {
      const filepath = await response.json();
      if (filepath) {
        window.location.href = `/download-invoice/${orderId}`;
      } else {
        console.log("No files in the given directory.");
      }
    } else {
      console.error(`Request failed with status: ${response.status}`);
    }
  } catch (err) {
    console.error("An error occurred:", err);
  }
}
