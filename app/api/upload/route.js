import { NextResponse } from "next/server";
import { getCloudinary } from "@/lib/cloudinary";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.startsWith("multipart/form-data")) {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "meetadoc";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    const mime = file.type || "";

    if (mime.startsWith("audio/") || mime.startsWith("video/")) {
      return NextResponse.json({ error: "Audio and video uploads are not allowed here" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const cloudinary = getCloudinary();

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      stream.end(buffer);
    });

    return NextResponse.json({
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      resourceType: uploadResult.resource_type,
    });
  } catch (e) {
    console.error("Cloudinary upload failed", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

