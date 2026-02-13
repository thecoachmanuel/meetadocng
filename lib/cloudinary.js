import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.replace(/"/g, '').trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.replace(/"/g, '').trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.replace(/"/g, '').trim(),
});

export default cloudinary;
