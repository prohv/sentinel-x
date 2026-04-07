'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { setupAdmin } from './setup.actions';
import { useRouter } from 'next/navigation';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-violet-600 px-4 py-2 text-sm font-medium
                 text-white transition-colors duration-150
                 hover:bg-violet-500 disabled:opacity-50"
    >
      {pending ? 'Creating...' : 'Create Admin'}
    </button>
  );
}

export default function SetupForm() {
  const router = useRouter();
  const [state, formAction] = useActionState(setupAdmin, null);

  if (state?.success) {
    setTimeout(() => router.push('/api/auth/sign-in'), 1500);
  }

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2
                     text-sm text-zinc-100 placeholder-zinc-500
                     focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
          placeholder="Admin"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-zinc-400">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2
                     text-sm text-zinc-100 placeholder-zinc-500
                     focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
          placeholder="admin@localhost"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-zinc-400">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2
                     text-sm text-zinc-100 placeholder-zinc-500
                     focus:border-violet-600 focus:outline-none focus:ring-1 focus:ring-violet-600"
          placeholder="••••••••"
        />
      </div>

      {state && !state.success && (
        <p className="text-sm text-rose-500">{state.error}</p>
      )}

      {state?.success && (
        <p className="text-sm text-emerald-500">{state.message}</p>
      )}

      <SubmitButton />
    </form>
  );
}
