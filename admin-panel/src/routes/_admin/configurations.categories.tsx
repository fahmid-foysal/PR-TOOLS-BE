import { createFileRoute } from "@tanstack/react-router";
import { ConfigCrudPage } from "@/components/configuration/ConfigCrudPage";

export const Route = createFileRoute("/_admin/configurations/categories")({
  component: () => <ConfigCrudPage kind="categories" />,
});
