async function getDataandLabel(filter) {
  const response = await fetch("/admin/dashboard/get-data/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ filter }),
  });

  if (response.ok) {
    const data = await response.json();
    return data;
  } else {
    console.log("its not okay");
  }
}

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", async function () {
  let filter = "day";
  const newSalesData = await getDataandLabel(filter);
  const dataArray = newSalesData.orders;

  // Initialize the chart
  var ctx = document.getElementById("myChart").getContext("2d");

  var salesData = {
    labels: dataArray.map((item) => item._id),
    data: dataArray.map((item) => item.totalAmount),
  };

  var myChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: salesData.labels,
      datasets: [
        {
          label: "Sales",
          data: salesData.data,
          backgroundColor: "rgba(75, 192, 192, 0.2)",
          borderColor: "rgba(75, 192, 192, 1)",
          borderWidth: 2,
        },
      ],
    },
    options: {
      scales: {
        x: [
          {
            grid: {
              display: false,
            },
          },
        ],
        y: [
          {
            beginAtZero: true,
            maxTicksLimit: 5,
          },
        ],
      },
    },
  });

  // Function to update the chart's data
  function updateChartData(newLabels, newData) {
    // console.log("yes called");
    myChart.data.labels = newLabels;
    myChart.data.datasets[0].data = newData;
    myChart.update();
  }

  async function toUpdateChart(filter) {
    const dataandLabel = await getDataandLabel(filter);
    const dataArray = dataandLabel.orders;

    // Initialize the chart

    var salesData = {
      labels: dataArray.map((item) => item._id),
      data: dataArray.map((item) => item.totalAmount),
    };
    updateChartData(salesData.labels, salesData.data);
  }

  // Add an event listener to the button
  const filterOptions = document.querySelectorAll(".filter-option");
  filterOptions.forEach((option) => {
    option.addEventListener("click", function () {
      const filterValue = this.getAttribute("data-filter");
      toUpdateChart(filterValue);
    });
  });
});

const filterButtons = document.querySelectorAll('.filter-option');
function handleFilter(event) {
  filterButtons.forEach(button => button.classList.remove('active'));
  const filterValue = event.target.getAttribute('data-filter');
  console.log(`Filtering by ${filterValue}`);
  event.target.classList.add('active');
}

filterButtons.forEach(button => {
  button.addEventListener('click', handleFilter);
});
