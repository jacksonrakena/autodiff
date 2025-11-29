import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Theme } from "@radix-ui/themes";
import "./main.css";
import {
  createBrowserRouter,
  createMemoryRouter,
  isRouteErrorResponse,
  useRouteError,
} from "react-router";
import { RouterProvider } from "react-router/dom";
import { ResourceTable } from "./ResourceTable";

const router = createBrowserRouter([
  {
    path: "/",
    Component: App,
    children: [
      {
        // API/core group resources
        path: "api/:api_version/:resource_plural",
        ErrorBoundary: RootErrorBoundary,
        Component: ResourceTable,
      },
      {
        // Custom resources
        path: "apis/:api_group_domain/:api_group_version/:resource_plural",
        ErrorBoundary: RootErrorBoundary,
        Component: ResourceTable,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Theme>
      <RouterProvider router={router} />
    </Theme>
  </React.StrictMode>
);

function RootErrorBoundary() {
  let error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </>
    );
  } else if (error instanceof Error) {
    return (
      <div>
        <h1>Error</h1>
        <p>{error.message}</p>
        <p>The stack trace is:</p>
        <pre>{error.stack}</pre>
      </div>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
