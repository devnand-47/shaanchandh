import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import AppLayout from "./components/layout/AppLayout";
import { WelcomeAnimation } from "./components/WelcomeAnimation";

import Landing from "./pages/Landing";
import Feed from "./pages/Feed";
import Projects from "./pages/Projects";
import ProjectDetails from "./pages/ProjectDetails";
import CreateProject from "./pages/CreateProject";
import MyProfile from "./pages/MyProfile";
import UserProfile from "./pages/UserProfile";
import ChatList from "./pages/ChatList";
import ChatRoom from "./pages/ChatRoom";
import Notifications from "./pages/Notifications";
import Bookmarks from "./pages/Bookmarks";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const WELCOME_SHOWN_KEY = "cc_welcome_shown";

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

const queryClient = new QueryClient();

const clerkAppearance = {
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(346, 87%, 43%)",
    colorBackground: "hsl(224, 71%, 4%)",
    colorInputBackground: "hsl(215, 28%, 17%)",
    colorText: "hsl(210, 40%, 98%)",
    colorTextSecondary: "hsl(215, 20%, 65%)",
    colorInputText: "hsl(210, 40%, 98%)",
    colorNeutral: "hsl(215, 20%, 65%)",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "rounded-2xl w-full overflow-hidden border border-border bg-card",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: { color: "hsl(210, 40%, 98%)" },
    headerSubtitle: { color: "hsl(215, 20%, 65%)" },
    socialButtonsBlockButtonText: { color: "hsl(210, 40%, 98%)" },
    formFieldLabel: { color: "hsl(210, 40%, 98%)" },
    footerActionLink: { color: "hsl(346, 87%, 43%)" },
    footerActionText: { color: "hsl(215, 20%, 65%)" },
    dividerText: { color: "hsl(215, 20%, 65%)" },
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-8">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/feed" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <AppLayout>
          <Component />
        </AppLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator({
  onSignIn,
}: {
  onSignIn: () => void;
}) {
  const { addListener } = useClerk();
  const queryClient = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;

      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        queryClient.clear();

        // User just signed in (was null/different, now has an id)
        if (userId && !sessionStorage.getItem(WELCOME_SHOWN_KEY)) {
          onSignIn();
        }
      }

      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, queryClient, onSignIn]);

  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  const [showWelcome, setShowWelcome] = useState(false);

  const handleSignIn = () => setShowWelcome(true);
  const handleWelcomeDone = () => setShowWelcome(false);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator onSignIn={handleSignIn} />

        {showWelcome && (
          <WelcomeAnimation onDone={handleWelcomeDone} />
        )}

        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />

          <Route path="/feed" component={() => <ProtectedRoute component={Feed} />} />
          <Route path="/projects" component={() => <ProtectedRoute component={Projects} />} />
          <Route path="/projects/new" component={() => <ProtectedRoute component={CreateProject} />} />
          <Route path="/projects/:id" component={() => <ProtectedRoute component={ProjectDetails} />} />
          <Route path="/profile/me" component={() => <ProtectedRoute component={MyProfile} />} />
          <Route path="/profile/:userId" component={() => <ProtectedRoute component={UserProfile} />} />
          <Route path="/chat" component={() => <ProtectedRoute component={ChatList} />} />
          <Route path="/chat/:userId" component={() => <ProtectedRoute component={ChatRoom} />} />
          <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
          <Route path="/bookmarks" component={() => <ProtectedRoute component={Bookmarks} />} />

          <Route component={NotFound} />
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}

export default App;
