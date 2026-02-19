import { db } from "./prisma";
import { supabaseServer } from "./supabase-server";

export async function checkUser(authUserOverride) {
  try {
    let authUser = authUserOverride;

    if (!authUser) {
      const supabase = await supabaseServer();
      const { data, error } = await supabase.auth.getUser();

      if (error || !data?.user) {
        return null;
      }

      authUser = data.user;
    }

    const baseInclude = {
      transactions: {
        where: {
          type: "CREDIT_PURCHASE",
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    };

    let dbUser = await db.user.findUnique({
      where: {
        supabaseUserId: authUser.id,
      },
      include: baseInclude,
    });

    if (!dbUser) {
      const email = authUser.email || authUser.identities?.[0]?.email || "";

      if (email) {
        dbUser = await db.user.findUnique({
          where: { email },
          include: baseInclude,
        });

        if (dbUser && !dbUser.supabaseUserId) {
          try {
            await db.user.update({
              where: { email },
              data: { supabaseUserId: authUser.id },
            });
          } catch {}
        }
      }
    }

    if (!dbUser) {
      const email = authUser.email || authUser.identities?.[0]?.email || "";
      const name =
        authUser.user_metadata?.full_name ||
        (authUser.email ? authUser.email.split("@")[0] : "User");
      const imageUrl = authUser.user_metadata?.avatar_url || null;

      if (email) {
        try {
          dbUser = await db.user.create({
            data: {
              supabaseUserId: authUser.id,
              email,
              name,
              imageUrl,
            },
            include: baseInclude,
          });
        } catch {
          dbUser = await db.user.findUnique({
            where: { supabaseUserId: authUser.id },
            include: baseInclude,
          });
        }
      }
    }

    if (dbUser) {
      if (dbUser.role === "UNASSIGNED") {
        const email = (dbUser.email || "").toLowerCase();
        const mainAdminEmailEnv = process.env.MAIN_ADMIN_EMAIL;
        const mainAdminEmail = mainAdminEmailEnv && mainAdminEmailEnv.length > 0
          ? mainAdminEmailEnv.toLowerCase()
          : "meetadocng@gmail.com";

        let inferredRole = null;

        if (email === mainAdminEmail) {
          inferredRole = "ADMIN";
        } else {
          const patientCount = await db.appointment.count({ where: { patientId: dbUser.id } });
          const doctorCount = await db.appointment.count({ where: { doctorId: dbUser.id } });
          const availCount = await db.availability.count({ where: { doctorId: dbUser.id } });

          if (patientCount > 0) {
            inferredRole = "PATIENT";
          } else if (doctorCount > 0 || availCount > 0 || dbUser.specialty || dbUser.experience || dbUser.verificationStatus) {
            inferredRole = "DOCTOR";
          }
        }

        if (inferredRole) {
          try {
            dbUser = await db.user.update({ where: { id: dbUser.id }, data: { role: inferredRole } });
          } catch {}
        }
      }

      return dbUser;
    }

    return null;
  } catch (error) {
    return null;
  }
}
