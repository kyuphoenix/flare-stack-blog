import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import theme from "@theme";
import { useEffect } from "react";
import { toast } from "sonner";
import { ErrorPage } from "@/components/common/error-page";
import { AUTH_KEYS, sessionQuery } from "@/features/auth/queries";
import { authClient } from "@/lib/auth/auth.client";
import { sharedAuthErrorMessages } from "@/lib/auth/auth-error-messages";
import { getLogoutAuthErrorMessage } from "@/lib/auth/auth-errors";
import { CACHE_CONTROL } from "@/lib/constants";
import { auth_logout_failed } from "@/paraglide/messages";
import { auth_logout_failed_desc } from "@/paraglide/messages";
import { auth_logout_success } from "@/paraglide/messages";
import { auth_logout_success_desc } from "@/paraglide/messages";
import { nav_friend_links } from "@/paraglide/messages";
import { nav_home } from "@/paraglide/messages";
import { nav_posts } from "@/paraglide/messages";

export const Route = createFileRoute("/_user")({
  loader: async ({ context }) => {
    const session = await context.queryClient.fetchQuery(sessionQuery);
    return { session };
  },
  component: UserLayout,
  errorComponent: ({ error }) => <ErrorPage error={error} />,
  headers: () => {
    return CACHE_CONTROL.private;
  },
});

function UserLayout() {
  const { session } = Route.useLoaderData();
  const navigate = useNavigate();
  const { isPending: isSessionPending } = authClient.useSession();
  const queryClient = useQueryClient();

  const navOptions = [
    { label: nav_home(), to: "/" as const, id: "home" },
    { label: nav_posts(), to: "/posts" as const, id: "posts" },
    {
      label: nav_friend_links(),
      to: "/friend-links" as const,
      id: "friend-links",
    },
  ];

  const logout = async () => {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(auth_logout_failed(), {
        description:
          getLogoutAuthErrorMessage(error, sharedAuthErrorMessages) ??
          auth_logout_failed_desc(),
      });
      return;
    }

    queryClient.removeQueries({ queryKey: AUTH_KEYS.session });

    toast.success(auth_logout_success(), {
      description: auth_logout_success_desc(),
    });
  };

  // Global shortcut: Cmd/Ctrl + K to navigate to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isToggle = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      if (isToggle) {
        e.preventDefault();
        navigate({ to: "/search" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <>
      <theme.UserLayout
        isAuthenticated={!!session?.user}
        navOptions={navOptions}
        user={session?.user}
        isSessionLoading={isSessionPending}
        logout={logout}
      >
        <Outlet />
      </theme.UserLayout>
      <theme.Toaster />
    </>
  );
}
