import React from "react";
import { Modal, Input, Form, Divider, Tooltip, Typography, List, Flex, Button } from "antd";
import MCPServerForm, { DEFAULT_STDIO_PARAMS } from "./mcpServerForms/MCPServerForm";
import ModelSelector from "../modelSelector/ModelSelector";
import { validateModelConfig } from '../../../validation';
import { Button as MagenticButton } from '../../../../common/Button'
import { MCPAgentConfig } from "./types";
import { ModelConfig } from "../modelSelector/modelConfigForms/types";
import { DEFAULT_OPENAI } from "../modelSelector/modelConfigForms/OpenAIModelConfigForm";

const DEFAULT_AGENT: MCPAgentConfig = {
  name: "",
  description: "",
  system_message: "",
  mcp_servers: [],
  model_context_token_limit: undefined,
  tool_call_summary_format: "{tool_name}({arguments}): {result}",
  model_client: DEFAULT_OPENAI,
};

interface MCPAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: MCPAgentConfig) => void;
  agent?: MCPAgentConfig;
  defaultModel?: ModelConfig;
  advanced: boolean;
}

const MCPAgentModal: React.FC<MCPAgentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  agent: initialAgent,
  defaultModel,
  advanced
}) => {
  const [form] = Form.useForm();
  const [agent, setAgent] = React.useState<MCPAgentConfig>(initialAgent || { ...DEFAULT_AGENT });
  const [errors, setErrors] = React.useState({
    nameError: false,
    descError: false,
    mcpServerError: false,
    modelClientError: false
  });

  React.useEffect(() => {
    if (isOpen) {
      setAgent(initialAgent || { ...DEFAULT_AGENT });
      form.resetFields();
    }
  }, [isOpen, initialAgent, form]);

  React.useEffect(() => {
    if (advanced && defaultModel) {
      setAgent(prev => ({ ...prev, model_client: defaultModel }));
    }
  }, [defaultModel, advanced]);

  // Validation
  const validateForm = () => {
    const nameError = !agent.name || agent.name.trim() === '';
    const descError = !agent.description || agent.description.trim() === '';
    const hasServer = Array.isArray(agent.mcp_servers) && agent.mcp_servers.length > 0;
    const mcpServerError = !hasServer;
    const modelConfigErrors = validateModelConfig(agent.model_client);
    const modelClientError = modelConfigErrors.length > 0;
    
    setErrors({
      nameError,
      descError,
      mcpServerError,
      modelClientError
    });
    
    return !(nameError || descError || mcpServerError || modelClientError);
  };

  // Form Handlers
  const handleChange = (field: keyof MCPAgentConfig, value: any) => {
    setAgent(prev => ({ ...prev, [field]: value }));
  };

  const handleServerChange = (serverIdx: number, updated: any) => {
    const updatedServers = agent.mcp_servers.map((s: any, i: number) => (i === serverIdx ? updated : s));
    setAgent(prev => ({ ...prev, mcp_servers: updatedServers }));
  };

  const addServer = () => {
    const newServer = {
      server_name: "",
      server_params: DEFAULT_STDIO_PARAMS,
    };
    const updatedServers = [...(agent.mcp_servers || []), newServer];
    setAgent(prev => ({ ...prev, mcp_servers: updatedServers }));
  };

  const removeServer = (serverIdx: number) => {
    const updatedServers = (agent.mcp_servers || []).filter((_: any, i: number) => i !== serverIdx);
    setAgent(prev => ({ ...prev, mcp_servers: updatedServers }));
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave(agent);
    }
  };

  return (
    <Modal
      title={initialAgent ? "Edit MCP Agent" : "Add MCP Agent"}
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button 
          key="save" 
          type="primary" 
          onClick={handleSave}
          className="bg-magenta-800 hover:bg-magenta-900 border-magenta-800"
        >
          Save
        </Button>
      ]}
    >
      <Form form={form} layout="vertical" className="mt-4">
        <Tooltip title={errors.nameError ? 'Name is required' : ''} open={errors.nameError ? undefined : false}>
          <Form.Item label="Name" required validateStatus={errors.nameError ? 'error' : ''}>
            <Input
              placeholder="Enter the agent's name"
              value={agent.name}
              onChange={e => handleChange('name', e.target.value)}
            />
          </Form.Item>
        </Tooltip>

        {advanced && (
          <Tooltip title={errors.modelClientError ? 'Errors in Model' : ''} open={errors.modelClientError ? undefined : false}>
            <Form.Item
              label="Model"
              required
              validateStatus={errors.modelClientError ? 'error' : ''}
              style={errors.modelClientError ? { border: '1px solid #ff4d4f', borderRadius: 4, padding: 4 } : {}}
            >
              <ModelSelector
                value={agent.model_client}
                onChange={modelClient => handleChange('model_client', modelClient)}
              />
            </Form.Item>
          </Tooltip>
        )}

        <Tooltip title={errors.descError ? 'Description is required' : ''} open={errors.descError ? undefined : false}>
          <Form.Item label="Description" required validateStatus={errors.descError ? 'error' : ''}>
            <Input.TextArea
              value={agent.description}
              placeholder="Describe what this agent can do. The orchestrator will use this description to determine when to hand off to this agent."
              onChange={e => handleChange('description', e.target.value)}
              autoSize={{ minRows: 3, maxRows: 6 }}
            />
          </Form.Item>
        </Tooltip>

        <Divider orientation="left" style={{ margin: "16px 0" }}>MCP Servers</Divider>
        
        <Flex vertical gap="small">
          <Tooltip title={errors.mcpServerError ? 'At least one MCP Server is required' : ''} open={errors.mcpServerError ? undefined : false}>
            <div style={{
              border: errors.mcpServerError ? '1px solid #ff4d4f' : 'none',
              borderRadius: 4,
              padding: errors.mcpServerError ? 4 : 0
            }}>
              <List
                dataSource={agent.mcp_servers || []}
                renderItem={(server: any, serverIdx: number) => (
                  <List.Item key={serverIdx} style={{ width: "100%" }}>
                    <MCPServerForm
                      server={server}
                      idx={serverIdx}
                      handleServerChange={handleServerChange}
                      removeServer={removeServer}
                    />
                  </List.Item>
                )}
                locale={{ emptyText: 'No MCP Servers. Click "Add MCP Server" to create one.' }}
              />
            </div>
          </Tooltip>
          
          <div className="text-center mt-4">
            <MagenticButton onClick={addServer} variant="primary">
              + Add MCP Server
            </MagenticButton>
          </div>
        </Flex>
      </Form>
    </Modal>
  );
};

export default MCPAgentModal;
