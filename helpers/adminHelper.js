const hbs = require("hbs");
const sharp = require("sharp");
const pdf = require("html-pdf");
const fs = require("fs");
const path = require("path");

module.exports = {
  cropImages: (images) => {
    try {
      images.forEach((image) => {
        sharp(`./public/uploads/${image}`)
          .resize({
            width: 350,
            height: 450,
            fit: "inside",
            withoutEnlargement: true,
          })
          .toFile(`./public/uploads/cropped/${image}`, (err) => {
            if (err) {
              console.log(`an error happened ${err}`);
              throw err;
            } else {
              console.log(`cropping image ${image}`);
            }
          });
      });
    } catch (error) {
      console.log(`an error happened ${error}`);
    }
  },

  generateSalesReportPdf: (orders, startDate, endDate, totalSales) => {
    console.log(orders);
    return new Promise((resolve, reject) => {
      const templateData = {
        orders,
        startDate,
        endDate,
        totalSales,
      };

      const template = hbs.compile(
        fs.readFileSync("views/admin/sales-report.hbs", "utf-8")
      );

      const html = template(templateData);
      const pdfOptions = {
        format: "Letter",
        orientation: "portrait",
      };

      const filePath = path.join(__dirname);
      const basePath = path.resolve(filePath, "..");
      pdf
        .create(html, pdfOptions)
        .toFile(
          `${basePath}/public/SRpdf/sales-report-${startDate}-${endDate}.pdf`,
          (err, response) => {
            if (err) {
              console.error(err);
              reject(err);
            } else {
              console.log(`PDF created: ${response.filename}`);
              resolve(response.filename);
            }
          }
        );
    });
  },
};
