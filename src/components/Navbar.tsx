"use client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navbar() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    // Redirect to signin page after signout
    router.push('/signin');
  };

  return (
    <header className="flex items-center justify-between py-4">
      <Link href="/" className="font-semibold text-xl">Fitaura</Link>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        {!loading && (
          <>
            {user ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {user.email}
                </span>
                <Button onClick={handleSignOut} size="sm" variant="outline">
                  Sign out
                </Button>
              </>
            ) : (
              <Button asChild size="sm">
                <Link href="/signin">Sign in</Link>
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
}