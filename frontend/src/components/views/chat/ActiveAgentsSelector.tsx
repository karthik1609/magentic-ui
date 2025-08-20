import React from "react";
import { Checkbox } from "antd";

interface AgentConfig {
  name: string;
  [key: string]: any;
}

interface ActiveAgentsSelectorProps {
  agents: AgentConfig[];
  selectedAgents: string[];
  onChange: (agents: string[]) => void;
}

const ActiveAgentsSelector: React.FC<ActiveAgentsSelectorProps> = ({
  agents,
  selectedAgents,
  onChange,
}) => {
  if (!agents || agents.length === 0) return null;

  const options = agents.map((agent) => ({
    label: agent.name,
    value: agent.name,
  }));

  return (
    <div className="mb-2">
      <Checkbox.Group
        options={options}
        value={selectedAgents}
        onChange={(list) => onChange(list as string[])}
      />
    </div>
  );
};

export default ActiveAgentsSelector;

