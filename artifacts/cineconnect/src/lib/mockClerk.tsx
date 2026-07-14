import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";

const MockAuthContext = createContext({
  isLoaded: true,
  isSignedIn: true,
  userId: "mock-user-123",
  sessionId: "mock-session-123",
  getToken: async () => "mock-token",
});

export const ClerkProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

export const useAuth = () => useContext(MockAuthContext);

export const useUser = () => ({
  isLoaded: true,
  isSignedIn: true,
  user: {
    id: "mock-user-123",
    fullName: "Mock User",
    imageUrl: "",
    primaryEmailAddress: { emailAddress: "mock@example.com" },
  },
});

export const useClerk = () => ({
  addListener: (cb: any) => {
    // Notify immediately that user is signed in
    setTimeout(() => {
      cb({ user: { id: "mock-user-123" } });
    }, 0);
    return () => {};
  },
  openSignIn: () => {},
  signOut: () => {},
});

export const SignIn = () => <div>Mock SignIn</div>;
export const SignUp = () => <div>Mock SignUp</div>;
export const UserButton = () => <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs">MU</div>;

export const Show = ({ when, children }: any) => {
  if (when === "signed-in") return <>{children}</>;
  if (when === "signed-out") return null;
  return <>{children}</>;
};

export const SignedIn = ({ children }: { children: ReactNode }) => <>{children}</>;
export const SignedOut = ({ children }: { children: ReactNode }) => null;
