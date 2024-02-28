const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const uploadToCloudinary = (fieldName) => async (req, res, next) => {
    try {
        let file;
        if (!req.files) {
            file = req.file;
        } else {
            file = req.files[fieldName]?.[0];
        }
        const singleStream = file.buffer
        const uploadImage = async () => {
            return new Promise(async (resolve, reject) => {
                cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, response) => {
                    if (error) {
                        reject("Error in uploading a file");
                    } else {
                        console.log("url data", response.url);
                        const fileUrl = response.url;
                        if (fileUrl) {
                            req.body.results = req.body.results || {};
                            req.body.results[fieldName] = fileUrl;
                            resolve()
                          } else {
                            console.error("Error: Unable to get file URL from response");
                            reject()
                          }
                    }
                }).end(singleStream);
            })
        }
        uploadImage().then(() => {
            next();
        }) .catch((err) => {
            console.log(`an error happened ${err}`);
        })
    } catch (error) {
        console.log(`something went wrong during uploading to cloudinary ${error}`);
    }
};

module.exports = uploadToCloudinary;
