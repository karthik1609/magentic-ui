import React, { useContext } from "react";
import { Settings } from "lucide-react";
import { Tooltip, Divider } from "antd";
import { appContext } from "../hooks/provider";
import { useConfigStore } from "../hooks/store";
import SignInModal from "./signin";
import SettingsModal from "./settings/SettingsModal";
import { Button } from "./common/Button";
import { LoginButton, LogoutButton, UserProfileButton } from "./auth/AuthButtons";

type ContentHeaderProps = {
  onMobileMenuToggle: () => void;
  isMobileMenuOpen: boolean;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewSession: () => void;
};

const ContentHeader = ({
  isSidebarOpen,
  onToggleSidebar,
  onNewSession,
}: ContentHeaderProps) => {
  const { user } = useContext(appContext);
  useConfigStore();
  const [isEmailModalOpen, setIsEmailModalOpen] = React.useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);

  const isLoggedIn = user && user.email && user.email !== "guest";

  return (
    <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#2a2a2a] z-50">
      {/* Main Header */}
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left side: Brand */}
        <div className="flex items-center space-x-4">
          {/* Brand Logo with Toggle Button */}
          <div className="flex items-center">
            <button 
              onClick={onToggleSidebar}
              className="w-8 h-8 mr-3 bg-[#2a2a2a] hover:bg-[#333333] rounded-md flex items-center justify-center transition-all duration-200 hover:shadow-md focus:outline-none"
              aria-label="Toggle navigation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
            </button>
            <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br  flex items-center justify-center shadow-md">
                  <img src="/images/bg/fx-logo.svg" alt="fusionAIx Logo" className="w-12 h-12" />
                </div>
              <div>
                <div className="text-white text-lg font-semibold">fusionAIx Studio</div>
                <div className="text-gray-400 text-xs">AI Agent Management Platform</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: User Profile */}
        <div className="flex items-center space-x-4">
          <span className="text-secondary text-sm">fusionaix.com</span>
          
          {/* Authentication Buttons */}
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                {/* User Profile */}
                <UserProfileButton onClick={() => setIsEmailModalOpen(true)} />
                
                <Divider type="vertical" className="h-6 bg-secondary" />
                
                {/* Logout Button */}
                <LogoutButton />
              </>
            ) : (
              <LoginButton />
            )}
          </div>

          {/* Settings Button */}
          <Tooltip title="Settings">
            <Button
              variant="tertiary"
              size="sm"
              icon={<Settings className="h-5 w-5" />}
              onClick={() => setIsSettingsOpen(true)}
              className="!px-2 transition-colors hover:text-accent hover:bg-blue-400/10 rounded"
              aria-label="Settings"
            />
          </Tooltip>
        </div>
      </div>

      <SignInModal
        isVisible={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
      />
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export default ContentHeader;
