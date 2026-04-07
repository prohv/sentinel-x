import { redirect } from 'next/navigation';
import { checkNoUsers } from './setup.actions';
import SetupForm from './SetupForm';

export default async function SetupPage() {
  const noUsers = await checkNoUsers();

  if (!noUsers) {
    redirect('/api/auth/sign-in');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-zinc-800 bg-zinc-900 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-zinc-100">
            Sentinel-X Setup
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Create the first admin account to claim ownership of this instance.
          </p>
        </div>

        <SetupForm />
      </div>
    </div>
  );
}
