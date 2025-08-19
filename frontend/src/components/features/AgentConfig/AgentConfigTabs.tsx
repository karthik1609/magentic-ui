import React from "react";
import { Card, Typography, Switch, Row, Col, Progress, Divider } from "antd";
import { Palette, Cpu, Sparkles, Bot, Settings, Globe, Code, FileText, Shield } from "lucide-react";
import ModelSelector from "../../settings/tabs/agentSettings/modelSelector/ModelSelector";
import MCPAgentsSettings from "../../settings/tabs/agentSettings/mcpAgentsSettings/MCPAgentsSettings";
import { ModelConfig } from "../../settings/tabs/agentSettings/modelSelector/modelConfigForms/types";
import { ModelClientKey } from "./AgentConfigPanel";

interface AgentConfigTabsProps {
  config: any;
  advanced: boolean;
  defaultModel: ModelConfig | undefined;
  modelStats: Record<string, number>;
  handleAdvancedToggle: (value: boolean) => void;
  setDefaultModel: (model: ModelConfig | undefined) => void;
  handleEachModelConfigChange: (key: ModelClientKey, value: any) => void;
  handleUpdateConfig: (changes: any) => void;
  MODEL_CLIENT_CONFIGS: any;
}

const getAgentConfigTabs = ({
  config,
  advanced,
  defaultModel,
  modelStats,
  handleAdvancedToggle,
  setDefaultModel,
  handleEachModelConfigChange,
  handleUpdateConfig,
  MODEL_CLIENT_CONFIGS,
}: AgentConfigTabsProps) => {

  return [
    {
      key: "models",
      label: (
        <span className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Model Configuration
        </span>
      ),
      children: (
        <div className="space-y-6">
          {/* Header Card with Advanced Toggle */}
          <Card className="bg-tertiary border-secondary">
            <div className="flex items-center justify-between">
              <div>
                <Typography.Title level={3} className="text-primary !mb-2">
                  AI Model Configuration
                </Typography.Title>
                <Typography.Text className="text-secondary">
                  Configure the intelligence behind each agent with precision and creativity
                </Typography.Text>
              </div>
              <div className="flex items-center gap-3 bg-primary px-4 py-2 rounded-lg border border-secondary">
                <Typography.Text className="text-secondary font-medium">Basic</Typography.Text>
                <Switch 
                  checked={advanced} 
                  onChange={handleAdvancedToggle}
                />
                <Typography.Text className="text-secondary font-medium">Advanced</Typography.Text>
              </div>
            </div>
          </Card>

          {!advanced ? (
            /* Universal Model Configuration */
            <Card className="bg-tertiary border-secondary hover:shadow-lg transition-shadow">
              <div className="text-center space-y-6">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-magenta-800 to-magenta-900 rounded-2xl flex items-center justify-center shadow-lg">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <div>
                  <Typography.Title level={3} className="text-primary !mb-2">
                    Universal AI Model
                  </Typography.Title>
                  <Typography.Text className="text-secondary">
                    All agents will use this unified model for consistent performance and optimal results
                  </Typography.Text>
                </div>
                <div className="bg-primary p-6 rounded-xl border border-secondary">
                  <ModelSelector onChange={setDefaultModel} value={defaultModel} />
                </div>
              </div>
            </Card>
          ) : (
            /* Individual Agent Configuration */
            <Card className="bg-tertiary border-secondary">
              <Typography.Title level={4} className="text-primary mb-6">
                Individual Agent Configuration
              </Typography.Title>
              <Row gutter={[24, 24]}>
                {(Object.values(MODEL_CLIENT_CONFIGS) as any[]).map(
                  ({ value, label, defaultValue, icon, color, description }, index) => (
                    <Col key={value} xs={24} lg={12} xl={8}>
                      <Card 
                        className="h-full hover:shadow-lg transition-shadow border-2 bg-primary"
                        style={{ 
                          borderColor: `var(--color-${color}-800)`,
                        }}
                      >
                        <div className="text-center space-y-4">
                          <div 
                            className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center shadow-md"
                            style={{ backgroundColor: `var(--color-${color}-800)` }}
                          >
                            {React.cloneElement(icon, { className: "w-6 h-6 text-white" })}
                          </div>
                          <div>
                            <Typography.Title level={5} className="text-primary !mb-2">
                              {label}
                            </Typography.Title>
                            <Typography.Text className="text-secondary">
                              {description}
                            </Typography.Text>
                          </div>
                          <div className="bg-secondary p-4 rounded-lg border border-secondary overflow-visible">
                            <ModelSelector
                              onChange={(modelValue: any) =>
                                handleEachModelConfigChange(value, modelValue)
                              }
                              value={
                                config.model_client_configs?.[value] ?? defaultValue
                              }
                            />
                          </div>
                        </div>
                      </Card>
                    </Col>
                  )
                )}
              </Row>
            </Card>
          )}

          {/* Model Usage Statistics */}
          <Card className="bg-tertiary border-secondary">
            <Typography.Title level={4} className="text-primary text-center mb-6">
              Model Distribution
            </Typography.Title>
            <div className="space-y-4">
              {Object.entries(modelStats).map(([model, count], index) => (
                <div key={model} className="flex items-center justify-between p-4 bg-primary rounded-lg border border-secondary hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `hsl(${index * 72}, 70%, 50%)` }}
                    />
                    <Typography.Text className="text-primary font-medium">
                      {model}
                    </Typography.Text>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress
                      percent={(count / Object.values(modelStats).reduce((a, b) => a + b, 0)) * 100}
                      showInfo={false}
                      strokeColor={`hsl(${index * 72}, 70%, 50%)`}
                      className="w-24"
                    />
                    <Typography.Text className="text-secondary font-medium min-w-[3rem] text-right">
                      {count} agent{count > 1 ? 's' : ''}
                    </Typography.Text>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      ),
    },
    {
      key: "mcp-agents",
      label: (
        <span className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          MCP Agents
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card className="bg-tertiary border-secondary">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-800 to-blue-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <Typography.Title level={3} className="text-primary !mb-1">
                    Custom MCP Agents
                  </Typography.Title>
                  <Typography.Text className="text-secondary">
                    Extend capabilities with custom agents that connect to local or remote Model Context Protocol (MCP) Servers
                  </Typography.Text>
                </div>
              </div>
            </div>
            <MCPAgentsSettings
              config={config}
              handleUpdateConfig={handleUpdateConfig}
              defaultModel={defaultModel}
              advanced={advanced}
            />
          </Card>
        </div>
      ),
    },
  ];
};

export default getAgentConfigTabs;
