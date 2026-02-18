import { db } from "./prisma";
import { supabaseServer } from "./supabase-server";

export async function checkUser() {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return null;
    }

    const authUser = data.user;

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

    if (dbUser) {
      return dbUser;
    }

    return null;
  } catch (error) {
    return null;
  }
}
