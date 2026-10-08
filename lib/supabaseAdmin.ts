import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function getOrCreateUserId(email: string): Promise<string | null> {
  try {
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers();
    if (usersData && usersData.users) {
      const existingUser = usersData.users.find((u) => u.email === email);
      if (existingUser) {
        return existingUser.id;
      }
    }

    const { data: newUser } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: { source: 'checkout' },
    });

    if (newUser && newUser.user) {
      return newUser.user.id;
    }

    if (usersData && usersData.users && usersData.users.length > 0) {
      return usersData.users[0].id;
    }
  } catch (e) {
    console.error('getOrCreateUserId error:', e);
  }
  return null;
}