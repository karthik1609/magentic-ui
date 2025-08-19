import React, { useContext } from "react";
import { Button } from "../common/Button";
import { Tooltip, Modal, message } from "antd";
import { LogIn, LogOut, User } from "lucide-react";
import { appContext } from "../../hooks/provider";
import SignInModal from "../signin";

export const LoginButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Tooltip title="Log in">
        <Button
          variant="primary"
          size="sm"
          icon={<LogIn className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 border-0 shadow-sm"
        >
          Login
        </Button>
      </Tooltip>
      <SignInModal
        isVisible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export const LogoutButton: React.FC = () => {
  const { user, logout } = useContext(appContext);
  
  const handleLogout = () => {
    Modal.confirm({
      title: 'Confirm Logout',
      content: 'Are you sure you want to log out?',
      okText: 'Logout',
      okButtonProps: {
        className: 'bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 border-0'
      },
      cancelText: 'Cancel',
      onOk: () => {
        logout();
        message.success('Logged out successfully');
      },
    });
  };

  return (
    <Tooltip title="Log out">
      <Button
        variant="secondary"
        size="sm"
        icon={<LogOut className="w-4 h-4" />}
        onClick={handleLogout}
        className="border border-blue-600 text-blue-500 hover:bg-blue-400/10 transition-colors"
      >
        Logout
      </Button>
    </Tooltip>
  );
};

export const UserProfileButton: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  const { user } = useContext(appContext);
  
  return (
    <Tooltip title="View or update your profile">
      <div
        className="flex items-center space-x-2 cursor-pointer"
        onClick={onClick}
      >
        {user?.avatar_url ? (
          <img
            className="h-8 w-8 rounded-full border-2 border-blue-500 shadow-md"
            src={user.avatar_url}
            alt={user.name}
          />
        ) : (
          <div className="bg-gradient-to-br from-blue-600 to-blue-400 h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold hover:shadow-lg transition-all duration-200">
            <User className="w-4 h-4" />
          </div>
        )}
      </div>
    </Tooltip>
  );
};
