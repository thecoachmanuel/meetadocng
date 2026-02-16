import { db } from "./prisma";
import { supabaseServer } from "./supabase-server";

export async function checkUser() {
  try {
    const supabase = await supabaseServer();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return null;
    }

    const user = data.user;

    const loggedInUser = await db.user.findUnique({
      where: {
        supabaseUserId: user.id,
      },
      include: {
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
      },
    });

    if (loggedInUser) {
      return loggedInUser;
    }

    return null;
  } catch (error) {
    return null;
  }
}
