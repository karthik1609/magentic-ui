import React, { useState, useEffect } from "react";
import { Tooltip, Typography, Switch, Alert, Card, Space, Divider, Row, Col, Tabs, Badge, Progress, Avatar } from "antd";
import ModelSelector, {
  PROVIDER_FORM_MAP,
} from "../../settings/tabs/agentSettings/modelSelector/ModelSelector";
import { DEFAULT_OPENAI } from "../../settings/tabs/agentSettings/modelSelector/modelConfigForms/OpenAIModelConfigForm";
import { ModelConfig } from "../../settings/tabs/agentSettings/modelSelector/modelConfigForms/types";
import MCPAgentsSettings from "../../settings/tabs/agentSettings/mcpAgentsSettings/MCPAgentsSettings";
import { settingsAPI } from "../../views/api";
import { Prism, SyntaxHighlighterProps } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useSettingsStore } from "../../store";
import { message, Button } from "antd";
import { Save, Settings, Bot, Server, Zap, Cpu, Globe, Code, FileText, Shield, Sparkles, Palette, Layers } from "lucide-react";
import getAgentConfigTabs from "./AgentConfigTabs";

const SyntaxHighlighter = Prism as any as React.FC<SyntaxHighlighterProps>;

export const MODEL_CLIENT_CONFIGS = {
  orchestrator: {
    value: "orchestrator",
    label: "Orchestrator",
    defaultValue: DEFAULT_OPENAI,
    icon: <Sparkles className="w-5 h-5" />,
    color: "purple",
    description: "Coordinates and manages all other agents"
  },
  web_surfer: {
    value: "web_surfer",
    label: "Web Surfer",
    defaultValue: DEFAULT_OPENAI,
    icon: <Globe className="w-5 h-5" />,
    color: "blue",
    description: "Browses and interacts with web content"
  },
  coder: { 
    value: "coder", 
    label: "Coder", 
    defaultValue: DEFAULT_OPENAI,
    icon: <Code className="w-5 h-5" />,
    color: "green",
    description: "Writes and analyzes code"
  },
  file_surfer: {
    value: "file_surfer",
    label: "File Surfer",
    defaultValue: DEFAULT_OPENAI,
    icon: <FileText className="w-5 h-5" />,
    color: "orange",
    description: "Manages and analyzes files"
  },
  action_guard: {
    value: "action_guard",
    label: "Action Guard",
    defaultValue:
      PROVIDER_FORM_MAP[DEFAULT_OPENAI.provider].presets[
      "gpt-4.1-nano-2025-04-14"
      ],
    icon: <Shield className="w-5 h-5" />,
    color: "red",
    description: "Validates and approves actions"
  },
};

export type ModelClientKey = keyof typeof MODEL_CLIENT_CONFIGS;

const AgentConfigPanel: React.FC = () => {
  const { config, updateConfig } = useSettingsStore();
  const [advanced, setAdvanced] = useState<boolean>(
    (config as any).advanced_agent_settings ?? false
  );
  const [hasConfigFile, setHasConfigFile] = useState<boolean>(false);
  const [configFilePath, setConfigFilePath] = useState<string | null>(null);
  const [configContent, setConfigContent] = useState<any>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("models");

  // Initialize defaultModel from config or detect common model
  const initializeDefaultModel = () => {
    // If we have a stored default_model, use it
    if ((config as any).default_model) {
      return (config as any).default_model;
    }

    // Otherwise, try to detect if all agents use the same model
    const configs = config.model_client_configs;
    if (configs) {
      const firstConfig = configs[Object.keys(MODEL_CLIENT_CONFIGS)[0]];
      const allSame = Object.values(MODEL_CLIENT_CONFIGS).every(({ value }) => {
        const agentConfig = configs[value];
        return (
          agentConfig &&
          JSON.stringify(agentConfig) === JSON.stringify(firstConfig)
        );
      });

      if (allSame && firstConfig) {
        return firstConfig;
      }
    }

    return undefined;
  };

  const [defaultModel, setDefaultModel] = useState<ModelConfig | undefined>(
    initializeDefaultModel()
  );

  // Handler for individual model config changes
  const handleEachModelConfigChange = (key: ModelClientKey, value: any) => {
    updateConfig({
      model_client_configs: {
        ...config.model_client_configs,
        [key]: value,
      },
    });
    setHasChanges(true);
  };

  const handleUpdateConfig = (changes: any) => {
    updateConfig(changes);
    setHasChanges(true);
  };

  useEffect(() => {
    if (defaultModel) {
      // Set all model_client_configs to defaultModel
      const model_client_configs = Object.keys(MODEL_CLIENT_CONFIGS).reduce(
        (prev, key) => {
          prev[key] = defaultModel;
          return prev;
        },
        {} as Record<string, ModelConfig>
      );

      updateConfig({
        model_client_configs: model_client_configs,
        default_model: defaultModel,
      });
      setHasChanges(true);
    }
  }, [defaultModel]);

  // Fetch config info on component mount
  useEffect(() => {
    const fetchConfigInfo = async () => {
      try {
        // Try to fetch config info, but suppress the 404 error
        try {
          const configInfo = await settingsAPI.getConfigInfo();
          setHasConfigFile(configInfo.has_config_file);
          setConfigFilePath(configInfo.config_file_path);
          setConfigContent(configInfo.config_content);
        } catch (error) {
          // If the endpoint doesn't exist (404), just set default values
          if (error instanceof Error && error.message.includes("Failed to fetch config info")) {
            setHasConfigFile(false);
            setConfigFilePath(null);
            setConfigContent(null);
          } else {
            throw error; // Re-throw other errors
          }
        }
      } catch (error) {
        console.error("Failed to handle config info:", error);
      }
    };
    fetchConfigInfo();
  }, []);

  // Handle advanced toggle changes
  const handleAdvancedToggle = (value: boolean) => {
    setAdvanced(value);
    updateConfig({
      advanced_agent_settings: value,
    });
    setHasChanges(true);
  };

  // Save changes
  const handleSave = async () => {
    try {
      await settingsAPI.updateSettings("", config);
      message.success("Agent settings saved successfully!");
      setHasChanges(false);
    } catch (error) {
      message.error("Failed to save agent settings");
      console.error("Failed to save settings:", error);
    }
  };

  const getModelUsageStats = () => {
    const configs = config.model_client_configs;
    const stats: { [key: string]: number } = {};
    
    Object.values(MODEL_CLIENT_CONFIGS).forEach(({ value }) => {
      const model = configs?.[value as ModelClientKey];
      const modelName = model?.config?.model || 'Default';
      stats[modelName] = (stats[modelName] || 0) + 1;
    });
    
    return stats;
  };

  const modelStats = getModelUsageStats();

  const tabItems = getAgentConfigTabs({
    config,
    advanced,
    defaultModel,
    modelStats,
    handleAdvancedToggle,
    setDefaultModel,
    handleEachModelConfigChange,
    handleUpdateConfig,
    MODEL_CLIENT_CONFIGS,
  });

  return (
    <div className="h-full flex flex-col bg-primary">
      {/* Header Section with Professional Design */}
      <div className="p-6 bg-primary border-b border-secondary flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-700 to-magenta-700 rounded-xl flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <Typography.Title level={2} className="!mb-1 text-primary">
                Agent Configuration
              </Typography.Title>
              <Typography.Text className="text-secondary">
                Configure your AI agents and models
              </Typography.Text>
            </div>
          </div>
          {hasChanges && (
            <Button
              type="primary"
              icon={<Save className="w-4 h-4" />}
              onClick={handleSave}
              className="bg-gradient-to-br from-blue-700 to-magenta-700 hover:bg-gradient-to-br hover:from-blue-900 hover:to-magenta-900 border-0 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
            >
              Save Changes
            </Button>
          )}
        </div>
      </div>

      {/* Configuration Alert */}
      <div className="p-6 bg-primary flex-grow overflow-y-auto">
        {hasConfigFile && (
          <Alert
            message="LLM Configuration Override"
            description={
              <div>
                <Typography.Text className="text-primary">
                  Magentic-UI was started with an LLM config file ({configFilePath}).
                  LLM configurations set here will be ignored as they are overridden by the config file.
                </Typography.Text>
                {configContent && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-blue-700 hover:text-magenta-700 font-medium transition-colors">
                      Show Config Content
                    </summary>
                    <div className="mt-3 max-h-60 overflow-auto bg-secondary rounded-lg p-3">
                      <SyntaxHighlighter
                        language="json"
                        style={tomorrow}
                        customStyle={{
                          fontSize: '12px',
                          margin: 0,
                          background: 'transparent',
                        }}
                      >
                        {JSON.stringify(configContent, null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  </details>
                )}
              </div>
            }
            type="warning"
            showIcon
            className="mb-6"
          />
        )}

        {/* Main Content with Professional Tabs */}
        <div className="agent-config-tabs-wrapper">
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            className="agent-config-tabs"
            size="large"
          />
        </div>
      </div>
    </div>
  );
};

export default AgentConfigPanel;
