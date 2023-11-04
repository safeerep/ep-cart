const sharp = require("sharp");
const pdf = require("pdf-creator-node");
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

  cropImageForBanner: (image) => {
    try {
      sharp(`./public/uploads/${image}`)
        .resize({
          width: 1500,
          height: 400,
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
    } catch (error) {
      console.log(`an error happened ${error}`);
    }
  },

  generateSalesReportPdf: async (req, res, orders, totalSales) => {
    return new Promise((resolve, reject) => {
      const html = fs.readFileSync(
        path.join(__dirname, "../views/admin/sales-report.hbs"),
        "utf-8"
      );
      const filename = Math.random()*10 + "_doc" + ".pdf";
  
      const document = {
        html: html,
        data: {
          orders,
          totalSales,
        },
        path: "./public/SRpdf/" + filename,
      };
      const options = {
        formate: 'A3',
        orientation: 'portrait'
      }
      pdf
        .create(document, options)
        .then((res) => {
          const filename = res.filename
          resolve(filename)
        })
        .catch((error) => {
          console.log(error);
          reject(error)
        });

    })
  },
};
