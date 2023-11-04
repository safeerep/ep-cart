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

document.addEventListener("DOMContentLoaded", async function () {
  let filter = "day";
  const newSalesData = await getDataandLabel(filter);
  const dataArray = newSalesData.orders;

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

  // function to update the chart's data
  function updateChartData(newLabels, newData) {
    myChart.data.labels = newLabels;
    myChart.data.datasets[0].data = newData;
    myChart.update();
  }

  async function toUpdateChart(filter) {
    const dataandLabel = await getDataandLabel(filter);
    const dataArray = dataandLabel.orders;

    // initializing the chart

    var salesData = {
      labels: dataArray.map((item) => item._id),
      data: dataArray.map((item) => item.totalAmount),
    };
    updateChartData(salesData.labels, salesData.data);
  }

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
