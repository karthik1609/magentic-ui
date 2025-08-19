import React, {
  useCallback,
  useEffect,
  useState,
  useContext,
  useMemo,
} from "react";
import { PlusCircle, MessageSquare } from "lucide-react";
import { message, Spin } from "antd";
import { useConfigStore } from "../../hooks/store";
import { appContext } from "../../hooks/provider";
import { sessionAPI } from "./api";
import { SessionEditor } from "./session_editor";
import type { Session } from "../types/datamodel";
import ChatView from "./chat/chat";
import { Sidebar } from "./sidebar";
import { getServerUrl } from "../utils";
import { RunStatus } from "../types/datamodel";
import ContentHeader from "../contentheader";
import PlanList from "../features/Plans/PlanList";
import McpServersList from "../features/McpServersConfig/McpServersList";
import AgentConfigPanel from "../features/AgentConfig/AgentConfigPanel";
import LeftNavigation from "../LeftNavigation";

interface SessionWebSocket {
  socket: WebSocket;
  runId: string;
}

type SessionWebSockets = {
  [sessionId: number]: SessionWebSocket;
};

export const SessionManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | undefined>();
  const [isNavExpanded, setIsNavExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("navExpanded");
      return stored !== null ? JSON.parse(stored) : true;
    }
    return true;
  });
  

  const [messageApi, contextHolder] = message.useMessage();
  const [sessionSockets, setSessionSockets] = useState<SessionWebSockets>({});
  const [sessionRunStatuses, setSessionRunStatuses] = useState<{
    [sessionId: number]: RunStatus;
  }>({});
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSubMenuItem, setActiveSubMenuItem] = useState("");

  const { user } = useContext(appContext);
  const { session, setSession, sessions, setSessions } = useConfigStore();

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("navExpanded", JSON.stringify(isNavExpanded));
    }
  }, [isNavExpanded]);
  


  const fetchSessions = useCallback(async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      const data = await sessionAPI.listSessions(user.email);
      setSessions(data);

      // Only set first session if there's no sessionId in URL
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("sessionId");
      if (!session && data.length > 0 && !sessionId) {
        setSession(data[0]);
      } else {
        if (data.length === 0) {
          createDefaultSession();
        }
      }
    } catch (error) {
      console.error("Error fetching sessions:", error);
      messageApi.error("Error loading sessions");
    } finally {
      setIsLoading(false);
    }
  }, [user?.email, setSessions, session, setSession]);

  // Handle initial URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get("sessionId");

    if (sessionId && !session) {
      handleSelectSession({ id: parseInt(sessionId) } as Session);
    }
  }, []);

  // Handle browser back/forward
  useEffect(() => {
    const handleLocationChange = () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get("sessionId");

      if (!sessionId && session) {
        setSession(null);
      }
    };

    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, [session]);

  const handleSaveSession = async (sessionData: Partial<Session>) => {
    if (!user || !user.email) return;

    try {
      setIsLoading(true);
      if (sessionData.id) {
        const updated = await sessionAPI.updateSession(
          sessionData.id,
          sessionData,
          user.email
        );
        setSessions(sessions.map((s) => (s.id === updated.id ? updated : s)));
        if (session?.id === updated.id) {
          setSession(updated);
        }
      } else {
        const created = await sessionAPI.createSession(
          {
            ...sessionData,
            name:
              "Default Session - " +
              new Date().toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              }),
          },
          user.email
        );
        setSessions([created, ...sessions]);
        setSession(created);
      }
      setIsEditorOpen(false);
      setEditingSession(undefined);
    } catch (error) {
      messageApi.error("Error saving session");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSession = (session?: Session) => {
    setIsLoading(true);
    if (session) {
      setEditingSession(session);
      setIsEditorOpen(true);
    } else {
      // this means we are creating a new session
      handleSaveSession({});
    }
    setIsLoading(false);
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      // Close and remove socket if it exists
      if (sessionSockets[sessionId]) {
        sessionSockets[sessionId].socket.close();
        setSessionSockets((prev) => {
          const updated = { ...prev };
          delete updated[sessionId];
          return updated;
        });
      }

      const response = await sessionAPI.deleteSession(sessionId, user.email);
      setSessions(sessions.filter((s) => s.id !== sessionId));
      if (session?.id === sessionId || sessions.length === 0) {
        setSession(sessions[0] || null);
        window.history.pushState({}, "", window.location.pathname); // Clear URL params
      }
      messageApi.success("Session deleted");
    } catch (error) {
      console.error("Error deleting session:", error);
      messageApi.error("Error deleting session");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSession = async (selectedSession: Session) => {
    if (!user?.email || !selectedSession.id) return;

    try {
      setActiveSubMenuItem("");
      setIsLoading(true);
      const data = await sessionAPI.getSession(selectedSession.id, user.email);
      if (!data) {
        // Session not found
        messageApi.error("Session not found");
        window.history.pushState({}, "", window.location.pathname); // Clear URL
        if (sessions.length > 0) {
          setSession(sessions[0]); // Fall back to first session
        } else {
          setSession(null);
        }
        return;
      }
      setSession(data);
      window.history.pushState({}, "", `?sessionId=${selectedSession.id}`);
    } catch (error) {
      console.error("Error loading session:", error);
      messageApi.error("Error loading session");
      window.history.pushState({}, "", window.location.pathname); // Clear invalid URL
      if (sessions.length > 0) {
        setSession(sessions[0]); // Fall back to first session
      } else {
        setSession(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionName = async (sessionData: Partial<Session>) => {
    if (!sessionData.id || !user?.email) return;

    // Check if current session name matches default pattern
    const currentSession = sessions.find((s) => s.id === sessionData.id);
    if (!currentSession) return;

    // Only update if it starts with "Default Session - "
    if (currentSession.name.startsWith("Default Session - ")) {
      try {
        const updated = await sessionAPI.updateSession(
          sessionData.id,
          sessionData,
          user.email
        );
        setSessions(sessions.map((s) => (s.id === updated.id ? updated : s)));
        if (session?.id === updated.id) {
          setSession(updated);
        }
      } catch (error) {
        console.error("Error updating session name:", error);
        messageApi.error("Error updating session name");
      }
    }
  };

  const getBaseUrl = (url: string): string => {
    try {
      let baseUrl = url.replace(/(^\w+:|^)\/\//, "");
      if (baseUrl.startsWith("localhost")) {
        baseUrl = baseUrl.replace("/api", "");
      } else if (baseUrl === "/api") {
        baseUrl = window.location.host;
      } else {
        baseUrl = baseUrl.replace("/api", "").replace(/\/$/, "");
      }
      return baseUrl;
    } catch (error) {
      console.error("Error processing server URL:", error);
      throw new Error("Invalid server URL configuration");
    }
  };

  const setupWebSocket = (sessionId: number, runId: string): WebSocket => {
    // Close existing socket for this session if it exists
    if (sessionSockets[sessionId]) {
      sessionSockets[sessionId].socket.close();
    }

    const serverUrl = getServerUrl();
    const baseUrl = getBaseUrl(serverUrl);
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${baseUrl}/api/ws/runs/${runId}`;

    const socket = new WebSocket(wsUrl);

    // Store the new socket
    setSessionSockets((prev) => ({
      ...prev,
      [sessionId]: { socket, runId },
    }));

    return socket;
  };

  const getSessionSocket = (
    sessionId: number,
    runId: string,
    fresh_socket: boolean = false,
    only_retrieve_existing_socket: boolean = false
  ): WebSocket | null => {
    if (fresh_socket) {
      return setupWebSocket(sessionId, runId);
    } else {
      const existingSocket = sessionSockets[sessionId];

      if (
        existingSocket?.socket.readyState === WebSocket.OPEN &&
        existingSocket.runId === runId
      ) {
        return existingSocket.socket;
      }
      if (only_retrieve_existing_socket) {
        return null;
      }
      return setupWebSocket(sessionId, runId);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const updateSessionRunStatus = (sessionId: number, status: RunStatus) => {
    setSessionRunStatuses((prev) => ({
      ...prev,
      [sessionId]: status,
    }));
  };

  const createDefaultSession = async () => {
    if (!user?.email) return;

    try {
      setIsLoading(true);
      const defaultName = `Default Session - ${new Date().toLocaleDateString(
        undefined,
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      )}`;

      const created = await sessionAPI.createSession(
        {
          name: defaultName,
        },
        user.email
      );

      setSessions([created, ...sessions]);
      setSession(created);
      window.history.pushState({}, "", `?sessionId=${created.id}`);
    } catch (error) {
      console.error("Error creating default session:", error);
      messageApi.error("Error creating default session");
    } finally {
      setIsLoading(false);
    }
  };

  const chatViews = useMemo(() => {
    return sessions.map((s: Session) => {
      const status = (s.id ? sessionRunStatuses[s.id] : undefined) as RunStatus;
      const isSessionPotentiallyActive = [
        "active",
        "awaiting_input",
        "pausing",
        "paused",
      ].includes(status);

      if (!isSessionPotentiallyActive && session?.id !== s.id) return null;

      return (
        <div
          key={s.id}
          className={`${session?.id === s.id ? "block" : "hidden"} relative`}
        >
          {isLoading && session?.id === s.id && (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <Spin size="large" tip="Loading session..." />
            </div>
          )}
          <ChatView
            session={s}
            onSessionNameChange={handleSessionName}
            getSessionSocket={getSessionSocket}
            visible={session?.id === s.id}
            onRunStatusChange={updateSessionRunStatus}
          />
        </div>
      );
    });
  }, [
    sessions,
    session?.id,
    handleSessionName,
    getSessionSocket,
    updateSessionRunStatus,
    isLoading,
    sessionRunStatuses,
  ]);

  // Add cleanup handlers for page unload and connection loss
  useEffect(() => {
    const closeAllSockets = () => {
      Object.values(sessionSockets).forEach(({ socket }) => {
        try {
          socket.close();
        } catch (error) {
          console.error("Error closing socket:", error);
        }
      });
    };

    // Handle page unload/refresh
    window.addEventListener("beforeunload", closeAllSockets);

    // Handle connection loss
    window.addEventListener("offline", closeAllSockets);

    return () => {
      window.removeEventListener("beforeunload", closeAllSockets);
      window.removeEventListener("offline", closeAllSockets);
      closeAllSockets(); // Clean up on component unmount too
    };
  }, []); // Empty dependency array since we want this to run once on mount

  const handleCreateSessionFromPlan = (
    sessionId: number,
    sessionName: string,
    planData: any
  ) => {
    // First select the session
    handleSelectSession({ id: sessionId } as Session);

    // Then dispatch the plan data to the chat component
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("planReady", {
          detail: {
            planData: planData,
            sessionId: sessionId,
            messageId: `plan_${Date.now()}`,
          },
        })
      );
    }, 2000); // Give time for session selection to complete
  };

  return (
    <div className="relative flex flex-col h-full w-full">
      {contextHolder}

      <ContentHeader
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isSidebarOpen={isNavExpanded}
        onToggleSidebar={() => setIsNavExpanded(!isNavExpanded)}
        onNewSession={() => handleEditSession()}
      />

      <div className="flex flex-1 relative">
        <div className={`transition-all duration-500 ease-in-out flex-shrink-0 ${isNavExpanded ? 'w-60' : 'w-16'}`}>
          <LeftNavigation 
            activeSection={activeSubMenuItem || "chat"}
            isExpanded={isNavExpanded}
            onToggle={() => setIsNavExpanded(!isNavExpanded)}
            sessions={sessions}
            currentSession={session}
            sessionRunStatuses={sessionRunStatuses}
            onSelectSession={handleSelectSession}
            onNewSession={() => handleEditSession()}
            isLoading={isLoading}
            onNavigate={(section) => {
              if (section === "new") {
                handleEditSession();
              } else if (section === "settings") {
                setActiveSubMenuItem("agents");
              } else if (section === "home" || section === "chat") {
                setActiveSubMenuItem(section); // Set to home or chat
              } else {
                setActiveSubMenuItem(section);
              }
            }} 
          />
        </div>

        <div className="flex-1 transition-all duration-500 ease-in-out transform overflow-hidden">
          {
          activeSubMenuItem === "mcp_servers" ? (
            <div className="h-full overflow-hidden">
              <McpServersList />
            </div>
          ) : activeSubMenuItem === "saved_plan" ? (
            <div className="h-full overflow-hidden">
              <PlanList
                onTabChange={setActiveSubMenuItem}
                onSelectSession={handleSelectSession}
                onCreateSessionFromPlan={handleCreateSessionFromPlan}
              />
            </div>
          ) :           activeSubMenuItem === "agents" ? (
            <div className="h-full overflow-hidden">
              <AgentConfigPanel />
            </div>
          ) : activeSubMenuItem === "chat" ? (
            <div className="h-full overflow-hidden p-6">
              {session && sessions.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-semibold text-white">{session.name}</h2>
                      <p className="text-gray-400 text-sm">Active session</p>
                    </div>
                    {session && session.id && sessionRunStatuses[session.id] && (
                      <div className="px-3 py-1 bg-green-900/20 text-green-400 rounded-full text-xs flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
                        Active
                      </div>
                    )}
                  </div>
                  {chatViews}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <svg className="w-20 h-20 mx-auto mb-6 text-gray-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                    </svg>
                    <h3 className="text-xl font-medium text-white mb-2">No Active Session</h3>
                    <p className="text-gray-400 mb-8">Create a new session to start chatting with the AI assistant</p>
                    <button 
                      onClick={() => handleEditSession()}
                      disabled={isLoading}
                      className="bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 text-white py-3 px-6 rounded-lg flex items-center justify-center gap-2 text-base font-medium transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg shadow-md mx-auto"
                    >
                      <PlusCircle className="w-5 h-5" />
                      New Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full overflow-hidden p-6 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br rounded-xl flex items-center justify-center mx-auto mb-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <img src="/images/bg/fx-logo.svg" alt="fusionAIx Logo" className="w-12 h-12" />
                </div>
                <h2 className="text-2xl font-semibold text-white">Welcome to fusionAIx Studio</h2>
                <p className="text-gray-400 mb-2">Your AI-powered workspace for enhanced productivity</p>
                <p className="text-gray-500 text-sm">Experience the future of work with our intelligent assistant.</p>
              </div>
            </div>
          )}
        </div>

        <SessionEditor
          session={editingSession}
          isOpen={isEditorOpen}
          onSave={handleSaveSession}
          onCancel={() => {
            setIsEditorOpen(false);
            setEditingSession(undefined);
          }}
        />
      </div>
    </div>
  );
};
