import * as React from "react";
import { appContext } from "../hooks/provider";
import { useConfigStore } from "../hooks/store";
import "antd/dist/reset.css";
import { ConfigProvider, theme } from "antd";
import { SessionManager } from "./views/manager";


const classNames = (...classes: (string | undefined | boolean)[]) => {
  return classes.filter(Boolean).join(" ");
};

type Props = {
  title: string;
  link: string;
  children?: React.ReactNode;
  showHeader?: boolean;
  restricted?: boolean;
  meta?: any;
};

const MagenticUILayout = ({
  meta,
  title,
  link,
  showHeader = true,
  restricted = false,
}: Props) => {
  const { darkMode, user, setUser } = React.useContext(appContext);
  const { sidebar } = useConfigStore();
  const { isExpanded } = sidebar;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  // Mimic sign-in: if no user or user.email, set default user and localStorage
  React.useEffect(() => {
    if (!user?.email) {
      const defaultEmail = "default";
      setUser({ ...user, email: defaultEmail, name: defaultEmail });
      if (typeof window !== "undefined") {
        window.localStorage.setItem("user_email", defaultEmail);
      }
    }
  }, [user, setUser]);

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [link]);

  React.useEffect(() => {
    document.getElementsByTagName("html")[0].className = `${
      darkMode === "dark" ? "dark bg-[#1a1a1a]" : "light bg-primary"
    }`;
  }, [darkMode]);

  const layoutContent = (
    <div className="h-screen flex">
      {/* Content area */}
      <div
        className={classNames(
          "flex-1 flex flex-col min-h-screen",
          "transition-all duration-300 ease-in-out",
          "md:pl-1",
          isExpanded ? "md:pl-1" : "md:pl-1"
        )}
      >
        <ConfigProvider
          theme={{
            token: {
              borderRadius: 8,
              colorPrimary: '#0076FF',
              colorSuccess: '#2CCC71',
              colorWarning: '#FF9800',
              colorError: '#E53935',
              colorInfo: '#0288D1',
              colorBgBase: darkMode === "dark" ? "#1a1a1a" : "#FFFFFF",
              colorTextBase: darkMode === "dark" ? "#FFFFFF" : "#14253A",
              fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
            },
            components: {
              Button: {
                borderRadius: 8,
                boxShadow: 'none',
                colorPrimaryHover: '#0055BA',
              },
              Card: {
                borderRadius: 8,
              },
              Input: {
                borderRadius: 8,
              },
              Select: {
                borderRadius: 8,
                colorBgContainer: '#2a2a2a',
                colorBgElevated: '#2a2a2a',
                colorTextLabel: 'rgba(255, 255, 255, 0.85)',
                colorText: 'rgba(255, 255, 255, 0.85)',
                zIndexPopup: 1050,
                controlHeight: 36,
                motionDurationMid: '0.1s',
                optionPadding: '8px 12px',
                optionSelectedBg: 'rgba(0, 118, 255, 0.2)',
                optionActiveBg: 'rgba(0, 118, 255, 0.1)',
                optionSelectedFontWeight: 500,
              },
              Dropdown: {
                borderRadius: 8,
                colorBgElevated: '#2a2a2a',
                zIndexPopup: 1050,
                motionDurationMid: '0s',
              },
              Modal: {
                zIndexPopup: 1000,
              },
            },
            algorithm:
              darkMode === "dark"
                ? theme.darkAlgorithm
                : theme.defaultAlgorithm,
          }}
        >
          <main className="flex-1 p-1 text-primary" style={{ height: "100%" }}>
            <SessionManager />
          </main>
        </ConfigProvider>
        <div className="text-sm text-secondary mt-2 mb-2 text-center border-t border-secondary py-2 bg-gradient-to-r from-transparent via-blue-400/5 to-transparent">
          AI can make mistakes. Please monitor its work and intervene if necessary.
        </div>
      </div>
    </div>
  );

  if (restricted) {
    return (
      <appContext.Consumer>
        {(context: any) => {
          if (context.user) {
            return layoutContent;
          }
          return null;
        }}
      </appContext.Consumer>
    );
  }

  return layoutContent;
};

export default MagenticUILayout;
