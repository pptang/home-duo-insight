import { Navigate } from "react-router";

// Client redirect: hash fragments cannot be set by a server 302, so this must be client-side.
export default function CompareRedirect() {
  return <Navigate to="/#compare-widget" replace />;
}
