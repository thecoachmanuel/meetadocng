import { supabaseAdmin } from "@/lib/supabase-admin";
import cloudinary from "@/lib/cloudinary";

/**
 * Robust file upload utility that tries Cloudinary first and falls back to Supabase.
 * @param {File} file - The file to upload
 * @param {string} folder - Folder/Bucket name
 * @param {string} targetName - Descriptive name for the file (e.g., 'logo', 'credential')
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadFile(file, folder = "site", targetName = "asset") {
  if (!file) throw new Error("No file provided");

  const fileName = `${targetName}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
  
  // 1. Try Cloudinary first
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `meetadoc/${folder}`,
          public_id: fileName.split('.')[0],
          resource_type: "auto",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    return uploadResult.secure_url;
  } catch (cloudinaryError) {
    console.error("Cloudinary upload failed, falling back to Supabase:", cloudinaryError);
    
    // 2. Fallback to Supabase Storage
    try {
      const admin = supabaseAdmin();
      const bucket = folder;
      
      // Ensure bucket exists (Supabase admin can do this)
      await admin.storage.createBucket(bucket, { public: true }).catch(() => {});
      
      const { data, error } = await admin.storage
        .from(bucket)
        .upload(fileName, file, { 
          upsert: true,
          contentType: file.type 
        });

      if (error) throw error;
      
      const { data: { publicUrl } } = admin.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (supabaseError) {
      console.error("Supabase upload failed as well:", supabaseError);
      throw new Error("Failed to upload file to both Cloudinary and Supabase storage.");
    }
  }
}
