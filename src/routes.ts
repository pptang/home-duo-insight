import { type RouteConfig, route, index } from "@react-router/dev/routes";

export default [
  index("pages/Index.tsx"),
  route("compare", "routes/compare-redirect.tsx"),
  route("feed", "pages/Feed.tsx"),
  route("experts", "pages/Experts.tsx"),
  route("experts/:expertId", "pages/ExpertProfilePage.tsx"),
  route("about", "pages/About.tsx"),
  route("auth", "pages/Auth.tsx"),
  route("admin/experts", "pages/AdminExpertPanel.tsx"),
  route("admin/expert-review", "pages/AdminExpertReview.tsx"),
  route("comparisons/:id", "pages/ComparisonDetail.tsx"),
  route("dashboard", "pages/Dashboard.tsx"),
  route("sitemap.xml", "routes/sitemap.tsx"),
  route("*", "pages/NotFound.tsx"),
] satisfies RouteConfig;
