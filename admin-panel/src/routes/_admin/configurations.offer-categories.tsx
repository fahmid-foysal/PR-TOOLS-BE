import { createFileRoute } from "@tanstack/react-router";
import { ConfigCrudPage } from "@/components/configuration/ConfigCrudPage";

export const Route = createFileRoute("/_admin/configurations/offer-categories")({
  component: () => <ConfigCrudPage kind="offerCategories" />,
});
