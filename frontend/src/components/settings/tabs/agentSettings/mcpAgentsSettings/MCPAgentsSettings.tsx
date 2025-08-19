import React, { useState } from "react";
import { List, Divider, Table, Button, Typography, Space, Tag } from "antd";
import { Button as MagenticButton } from "../../../../common/Button";
import { MCPAgentConfig } from "./types";
import { DEFAULT_OPENAI } from "../modelSelector/modelConfigForms/OpenAIModelConfigForm";
import { SettingsTabProps } from "../../../types";
import { ModelConfig } from "../modelSelector/modelConfigForms/types";
import MCPAgentModal from "./MCPAgentModal";
import { Edit, Trash2 } from "lucide-react";

const DEFAULT_AGENT: MCPAgentConfig = {
  name: "",
  description: "",
  system_message: "",
  mcp_servers: [],
  model_context_token_limit: undefined,
  tool_call_summary_format: "{tool_name}({arguments}): {result}",
  model_client: DEFAULT_OPENAI,
};

export interface MCPAgentsSettingsProps extends SettingsTabProps {
  defaultModel: ModelConfig | undefined;
  advanced: boolean;
}

const MCPAgentsSettings: React.FC<MCPAgentsSettingsProps> = ({ config, handleUpdateConfig, defaultModel, advanced }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<MCPAgentConfig | undefined>(undefined);
  const [editingIndex, setEditingIndex] = useState<number | undefined>(undefined);
  
  const agents = config?.mcp_agent_configs || [];

  const openAddModal = () => {
    setEditingAgent(undefined);
    setEditingIndex(undefined);
    setIsModalOpen(true);
  };

  const openEditModal = (agent: MCPAgentConfig, index: number) => {
    setEditingAgent(agent);
    setEditingIndex(index);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingAgent(undefined);
    setEditingIndex(undefined);
  };

  const saveAgent = (agent: MCPAgentConfig) => {
    if (editingIndex !== undefined) {
      // Edit existing agent
      const updatedAgents = agents.map((a, i) => (i === editingIndex ? agent : a));
      handleUpdateConfig({ mcp_agent_configs: [...updatedAgents] });
    } else {
      // Add new agent
      handleUpdateConfig({ mcp_agent_configs: [...agents, agent] });
    }
    closeModal();
  };

  const removeAgent = (idx: number) => {
    const updatedAgents = agents.filter((_, i) => i !== idx);
    handleUpdateConfig({ mcp_agent_configs: [...updatedAgents] });
  };

  // Table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-medium">{text}</span>
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Servers',
      dataIndex: 'mcp_servers',
      key: 'mcp_servers',
      render: (servers: any[]) => (
        <Space size={[0, 4]} wrap>
          {servers.map((server, idx) => (
            <Tag key={idx} className="bg-secondary border-secondary text-primary">
              {server.server_name || `Server ${idx + 1}`}
            </Tag>
          ))}
        </Space>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, agent: MCPAgentConfig, index: number) => (
        <Space>
          <Button 
            type="text" 
            icon={<Edit className="w-4 h-4" />} 
            onClick={() => openEditModal(agent, index)}
            className="text-blue-600"
          />
          <Button 
            type="text" 
            icon={<Trash2 className="w-4 h-4" />} 
            onClick={() => removeAgent(index)} 
            danger
          />
        </Space>
      )
    }
  ];

  return (
    <div className="space-y-4">
      {/* Header Section with Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Typography.Text className="text-secondary block mb-2">
            Extend Magentic-UI's capabilities by adding custom agents that connect to local or remote Model Context Protocol (MCP) Servers!
          </Typography.Text>
          <Typography.Text className="text-secondary block">
            Any number of agents are supported, and each agent requires at least one MCP Server.
          </Typography.Text>
        </div>
        <div className="flex-shrink-0">
          <MagenticButton onClick={openAddModal} variant="primary">
            + Add MCP Agent
          </MagenticButton>
        </div>
      </div>
      
      <Divider style={{ margin: "12px 0" }} />
      
      <Table 
        dataSource={agents} 
        columns={columns}
        rowKey={(record, index) => index?.toString() || '0'} 
        pagination={false}
        locale={{ emptyText: 'No MCP Agents. Click "Add MCP Agent" to create one.' }}
        className="bg-tertiary rounded-lg"
      />

      {/* Modal for Add/Edit Agent */}
      <MCPAgentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={saveAgent}
        agent={editingAgent}
        defaultModel={defaultModel}
        advanced={advanced}
      />
    </div>
  );
};

export default MCPAgentsSettings;
