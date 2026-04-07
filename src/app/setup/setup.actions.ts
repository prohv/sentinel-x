'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { user } from '@/lib/db/schema';
import { count, eq } from 'drizzle-orm';

type SetupResult =
  | { success: true; message: string }
  | { success: false; error: string };

export async function setupAdmin(
  _prevState: unknown,
  formData: FormData,
): Promise<SetupResult> {
  //gate: check if admin already exists
  const result = await db.select({ count: count() }).from(user);
  if (result[0].count > 0) {
    return { success: false, error: 'An account already exists.' };
  }

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) {
    return { success: false, error: 'All fields are required.' };
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name,
        email,
        password,
      },
    });

    //explicitly set role to admin
    await db.update(user).set({ role: 'admin' }).where(eq(user.email, email));

    return { success: true, message: 'Admin account created. Redirecting...' };
  } catch {
    return { success: false, error: 'Failed to create admin account.' };
  }
}

export async function checkNoUsers(): Promise<boolean> {
  const result = await db.select({ count: count() }).from(user);
  return result[0].count === 0;
}
