import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UserProfileState {
  fullName: string;
  email: string;
  welcomeDismissed: boolean;
  setProfile: (patch: Partial<Pick<UserProfileState, "fullName" | "email">>) => void;
  dismissWelcome: () => void;
}

export const useUserProfile = create<UserProfileState>()(
  persist(
    (set) => ({
      fullName: "",
      email: "",
      welcomeDismissed: false,
      setProfile: (patch) => set(patch),
      dismissWelcome: () => set({ welcomeDismissed: true }),
    }),
    { name: "allegory.userProfile.v1" },
  ),
);

export function getFirstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] ?? "";
}

export function getLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? parts.slice(1).join(" ") : "";
}
