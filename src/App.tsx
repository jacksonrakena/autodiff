import "@radix-ui/colors/gray.css";
import "@radix-ui/colors/blue.css";
import "@radix-ui/colors/green.css";
import "@radix-ui/colors/red.css";
import "@radix-ui/colors/gray-dark.css";
import "@radix-ui/colors/blue-dark.css";
import "@radix-ui/colors/green-dark.css";
import "@radix-ui/colors/red-dark.css";
import "@radix-ui/themes/styles.css";
import { Flex, IconButton } from "@radix-ui/themes";
import { ResourceTypeList } from "./panes/resource-type-list/ResourceTypeList";
import { Outlet } from "react-router";
import { ArrowLeftIcon, ArrowRightIcon } from "@radix-ui/react-icons";
import { QuickSwitch } from "./popups/QuickSwitch";

function App() {
  return (
    <main className="container" style={{ height: "100vh" }}>
      <Flex
        gap="4"
        style={{
          overflow: "clip",
          height: "100%",
        }}
      >
        <Flex gap="2" direction={"column"}>
          <Flex
            data-tauri-drag-region
            style={{
              paddingTop: "48px",
              paddingLeft: "32px",
              paddingBottom: "32px",
              borderBottom: "1px solid var(--gray-3)",
              //backgroundColor: "red",
            }}
            align={"center"}
            justify={"between"}
          >
            <Flex>hello :) </Flex>
            <Flex gap="4" data-tauri-drag-region>
              <IconButton
                variant="surface"
                color="gray"
                disabled={window.history.state?.idx === 0}
                onClick={() => window.history.back()}
              >
                <ArrowLeftIcon />
              </IconButton>
              <IconButton
                variant="surface"
                color="gray"
                disabled={
                  window.history.state?.idx === window.history.length - 1
                }
                onClick={() => window.history.forward()}
              >
                <ArrowRightIcon />
              </IconButton>
            </Flex>
          </Flex>

          <ResourceTypeList />
        </Flex>
        <Outlet />
      </Flex>

      <QuickSwitch />
    </main>
  );
}

export default App;
