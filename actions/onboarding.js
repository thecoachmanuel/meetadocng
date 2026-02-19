"use server";

import { db } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

/**
 * Sets the user's role and related information
 */
export async function setUserRole(formData) {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }

  const authUser = data.user;

  // Find user in our database
  let dbUser = await db.user.findUnique({
    where: { supabaseUserId: authUser.id },
  });

  if (!dbUser) {
    const email = authUser.email || authUser.identities?.[0]?.email || "";
    if (email) {
      const byEmail = await db.user.findUnique({ where: { email } });
      if (byEmail) {
        await db.user.update({ where: { email }, data: { supabaseUserId: authUser.id } });
        dbUser = await db.user.findUnique({ where: { supabaseUserId: authUser.id } });
      }
    }
  }

  if (!dbUser) {
    const name = authUser.user_metadata?.full_name || (authUser.email?.split("@")[0]) || "User";
    const imageUrl = authUser.user_metadata?.avatar_url || null;
    const email = authUser.email || authUser.identities?.[0]?.email || "";
    dbUser = await db.user.create({
      data: {
        supabaseUserId: authUser.id,
        name,
        imageUrl,
        email,
      },
    });
  }

  const role = formData.get("role");

  if (!role || !["PATIENT", "DOCTOR"].includes(role)) {
    throw new Error("Invalid role selection");
  }

  try {
    // For patient role - simple update
    if (role === "PATIENT") {
      await db.user.update({
        where: {
          supabaseUserId: authUser.id,
        },
        data: {
          role: "PATIENT",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/appointments" };
    }

    // For doctor role - need additional information
    if (role === "DOCTOR") {
      const specialty = formData.get("specialty");
      const experience = parseInt(formData.get("experience"), 10);
      const credentialUrl = formData.get("credentialUrl");
      const description = formData.get("description");

      // Validate inputs
      if (!specialty || !experience || !credentialUrl || !description) {
        throw new Error("All fields are required");
      }

      await db.user.update({
        where: {
          supabaseUserId: authUser.id,
        },
        data: {
          role: "DOCTOR",
          specialty,
          experience,
          credentialUrl,
          description,
          verificationStatus: "PENDING",
        },
      });

      revalidatePath("/");
      return { success: true, redirect: "/doctor/verification" };
    }
  } catch (error) {
    console.error("Failed to set user role:", error);
    throw new Error(`Failed to update user profile: ${error.message}`);
  }
}

/**
 * Gets the current user's complete profile information
 */
export async function getCurrentUser() {
  const supabase = await supabaseServer();
  const { data, error } = await supabase.auth.getUser();
  const authUser = data?.user;

  if (error || !authUser) {
    return null;
  }

  try {
    let dbUser = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },
    });

    if (!dbUser) {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      if (email) {
        const byEmail = await db.user.findUnique({
          where: { email },
        });
        if (byEmail) {
          if (!byEmail.supabaseUserId) {
            await db.user.update({
              where: { email },
              data: { supabaseUserId: authUser.id },
            });
          }
          dbUser = byEmail;
        }
      }
    }

    return dbUser;
  } catch (error) {
    console.error("Failed to get user information:", error);
    return null;
  }
}
