import { createFileRoute, redirect } from "@tanstack/react-router";
import { TOKEN_KEY } from "@/lib/constants";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window === "undefined") {
      throw redirect({ to: "/login" });
    }
    const token = window.localStorage.getItem(TOKEN_KEY);
    throw redirect({ to: token ? "/dashboard" : "/login" });
  },
});
