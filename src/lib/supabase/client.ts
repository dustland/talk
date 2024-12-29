import { createBrowserClient } from "@supabase/ssr";
import { nanoid } from "nanoid";

export interface Attachment {
  url: string;
  contentType: string;
  name: string;
}

// Create a single supabase client instance
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      getAll() {
        if (typeof window === 'undefined') return [];
        return document.cookie.split("; ").map((cookie) => {
          const [name, value] = cookie.split("=");
          return { name, value };
        });
      },
      setAll(cookiesToSet) {
        if (typeof window === 'undefined') return;
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=${
            options?.path || "/"
          }; secure; samesite=lax${
            process.env.NODE_ENV === "production" ? "; domain=.ting.fm" : ""
          }`;
        });
      },
    },
  }
);

// Export a function that returns the singleton instance
export function createClient() {
  return supabase;
}

export async function uploadFile(file: File, bucket = "audio"): Promise<Attachment> {
  // Validate file size (10MB limit)
  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    throw new Error(
      `File size exceeds 10MB limit. Current size: ${(
        file.size /
        1024 /
        1024
      ).toFixed(2)}MB`
    );
  }

  const ext = file.name.split(".").pop()?.toLowerCase();

  const path = `${nanoid()}.${ext}`;

  try {
    console.log("Starting file upload...", path, file);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    console.log("File uploaded:", data, error);

    if (error) {
      throw error;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(path);

    return {
      url: publicUrl,
      contentType: file.type,
      name: file.name,
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to upload file"
    );
  }
}

export function bufferToFile(buffer: Buffer, filename: string, mimetype: string): File {
  return new File([buffer], filename, { type: mimetype });
}

export async function deleteFile(path: string, bucket = "attachments") {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw error;
  }
}
