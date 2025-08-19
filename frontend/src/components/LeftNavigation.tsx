import React, { useState, useEffect } from 'react';
import { Home, Settings, MessageSquare, Layers, PlusCircle, Server, ChevronRight, ChevronLeft, MoreHorizontal } from 'lucide-react';
import { Badge, Tooltip, Spin } from 'antd';
import { Session, RunStatus } from './types/datamodel';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
  isExpanded?: boolean;
  className?: string;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge, isExpanded = true, className = '' }) => {
  return (
    <Tooltip title={!isExpanded ? label : ""} placement="right">
      <div 
        className={`
          flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} p-3 mb-4 rounded-md
          ${isExpanded ? 'w-full' : 'w-12'} h-12 cursor-pointer
          transition-all duration-300 ease-in-out transform
          ${active && !className 
            ? 'bg-gradient-to-r from-blue-700 to-[#7B61FF] text-white shadow-md' 
            : !active ? 'bg-[#333333] hover:bg-[#444444] text-gray-400 hover:text-white hover:scale-105' : ''}
          ${className}
        `}
        onClick={onClick}
      >
        <div className={`relative ${active ? 'animate-pulse-subtle' : ''}`}>
          {icon}
          {badge && badge > 0 && (
            <Badge 
              count={badge} 
              size="small" 
              className="absolute -top-1 -right-2 animate-pulse"
              style={{ 
                backgroundColor: active ? '#ffffff' : '#7B61FF',
                color: active ? '#0076FF' : '#ffffff',
                boxShadow: '0 0 5px rgba(123, 97, 255, 0.5)'
              }} 
            />
          )}
        </div>
        {isExpanded && <span className="ml-3 whitespace-nowrap font-medium">{label}</span>}
      </div>
    </Tooltip>
  );
};

interface LeftNavigationProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onToggle?: () => void;
  isExpanded?: boolean;
  sessions?: Session[];
  currentSession?: Session | null;
  sessionRunStatuses?: Record<number, RunStatus>;
  onSelectSession?: (session: Session) => void;
  onNewSession?: () => void;
  isLoading?: boolean;
}

const LeftNavigation: React.FC<LeftNavigationProps> = ({ 
  activeSection, 
  onNavigate, 
  onToggle, 
  isExpanded = true, 
  sessions = [], 
  currentSession, 
  sessionRunStatuses = {}, 
  onSelectSession,
  onNewSession,
  isLoading = false
}) => {
  const [showSessionsTable, setShowSessionsTable] = useState(false);
  
  // When chat is clicked, show sessions list
  useEffect(() => {
    if (activeSection === 'chat') {
      setShowSessionsTable(true);
    } else {
      setShowSessionsTable(false);
    }
  }, [activeSection]);
  
  const handleBackToNav = () => {
    setShowSessionsTable(false);
    onNavigate('home');
  };
  return (
    <div className="h-full flex flex-col bg-[#1a1a1a] border-r border-[#2a2a2a] w-full transition-all duration-500 ease-in-out">
      {showSessionsTable ? (
        // Sessions Table View - Replaces the entire navbar
        <div className="h-full flex flex-col overflow-hidden">
          {/* Header with Back Button */}
          <div className="p-3 flex items-center justify-between">
            <button 
              onClick={handleBackToNav}
              className="w-8 h-8 bg-[#2a2a2a] hover:bg-[#333333] rounded-md flex items-center justify-center transition-all duration-200 hover:shadow-md focus:outline-none"
            >
              <ChevronLeft size={18} className="text-gray-400 hover:text-white" />
            </button>
            <button 
              onClick={onNewSession} 
              className="p-1 rounded-full hover:bg-blue-500 text-blue-500 hover:text-white transition-colors"
              disabled={isLoading}
              aria-label="New session"
            >
              <PlusCircle size={16} />
            </button>
          </div>
          <div className="px-3 py-2 border-b border-[#2a2a2a]">
            <h3 className="text-white font-medium">Sessions</h3>
          </div>
          
          {/* Sessions List */}
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Spin size="default" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <MessageSquare className="w-12 h-12 text-gray-600 mb-3 opacity-50" />
                <p className="text-gray-400 mb-2">No sessions found</p>
                <button 
                  onClick={onNewSession}
                  className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors flex items-center gap-2"
                >
                  <PlusCircle size={16} />
                  New Session
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map((s) => (
                  <div 
                    key={s.id} 
                    className={`p-3 cursor-pointer transition-colors rounded-md ${currentSession?.id === s.id ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white' : 'hover:bg-[#333333] text-gray-300'}`}
                    onClick={() => onSelectSession && onSelectSession(s)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="truncate flex-1">{s.name}</div>
                      {s.id && sessionRunStatuses[s.id] && (
                        <div className="ml-2 w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        // Regular Navigation Menu
        <>
                    {/* Space for top padding */}
          <div className="h-5"></div>

          {/* Navigation Items */}
          <div className="p-3 flex-1 flex flex-col overflow-hidden">
            <NavItem 
              icon={<Home className="w-5 h-5" />} 
              label="Home" 
              active={activeSection === 'home' || activeSection === ''} 
              onClick={() => onNavigate('home')} 
              isExpanded={isExpanded}
            />
            <NavItem 
              icon={<MessageSquare className="w-5 h-5" />} 
              label="Chat" 
              active={activeSection === 'chat'} 
              onClick={() => onNavigate('chat')} 
              isExpanded={isExpanded}
              className={activeSection === 'chat' ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-500 !text-white shadow-md' : ''}
            />
            <NavItem 
              icon={<Server className="w-5 h-5" />} 
              label="MCP Servers" 
              active={activeSection === 'mcp_servers'} 
              onClick={() => onNavigate('mcp_servers')} 
              isExpanded={isExpanded}
            />
            <NavItem 
              icon={<Layers className="w-5 h-5" />} 
              label="Saved Plans" 
              active={activeSection === 'saved_plan'} 
              onClick={() => onNavigate('saved_plan')}
              badge={2}
              isExpanded={isExpanded}
            />
            <NavItem 
              icon={<MessageSquare className="w-5 h-5" />} 
              label="Agents" 
              active={activeSection === 'agents'} 
              onClick={() => onNavigate('agents')} 
              isExpanded={isExpanded}
            />
          </div>

          {/* Bottom Navigation */}
          <div className="p-3 mt-auto">
            <NavItem 
              icon={<PlusCircle className="w-5 h-5" />} 
              label="New Session" 
              onClick={() => onNavigate('new')} 
              isExpanded={isExpanded}
            />
            <NavItem 
              icon={<Settings className="w-5 h-5" />} 
              label="Settings" 
              active={activeSection === 'settings'}
              onClick={() => onNavigate('settings')} 
              isExpanded={isExpanded}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default LeftNavigation; 