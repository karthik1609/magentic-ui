import React from "react";
import { Select, Collapse, Flex } from "antd";
import {
  OpenAIModelConfigForm,
  AzureModelConfigForm,
  OllamaModelConfigForm,
} from "./modelConfigForms";
import { ModelConfig, ModelConfigFormProps } from "./modelConfigForms/types";

// Import the default configs from each form
import { DEFAULT_OPENAI } from "./modelConfigForms/OpenAIModelConfigForm";
import { DEFAULT_AZURE } from "./modelConfigForms/AzureModelConfigForm";
import { DEFAULT_OLLAMA } from "./modelConfigForms/OllamaModelConfigForm";

interface ModelSelectorProps {
  onChange: (m: ModelConfig) => void;
  value?: ModelConfig;
}

export const PROVIDERS = {
  openai: DEFAULT_OPENAI.provider,
  azure: DEFAULT_AZURE.provider,
  ollama: DEFAULT_OLLAMA.provider
}

// Map each model value to its config form, label, and initial config value
export const PROVIDER_FORM_MAP: Record<string, { label: string, defaultValue: ModelConfig, presets: Record<string, ModelConfig>, form: React.FC<ModelConfigFormProps> }> = {
  [DEFAULT_OPENAI.provider]: {
    label: "OpenAI",
    defaultValue: { ...DEFAULT_OPENAI },
    form: OpenAIModelConfigForm,
    presets: {
      "OpenRouter": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          base_url: "https://openrouter.ai/api/v1"
        }
      },
      "o3-2025-04-16": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          model: "o3-2025-04-16"
        }
      },
      "o3-mini-2025-01-31": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          model: "o3-mini-2025-01-31"
        }
      },
      "o4-mini-2025-04-16": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          model: "o4-mini-2025-04-16"
        }
      },
      "gpt-4.1-2025-04-14": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          model: "gpt-4.1-2025-04-14"
        }
      },
      "gpt-4.1-mini-2025-04-14": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          model: "gpt-4.1-mini-2025-04-14"
        }
      },
      "gpt-4.1-nano-2025-04-14": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          model: "gpt-4.1-nano-2025-04-14"
        }
      },
      "gpt-4o-2024-08-06": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          model: "gpt-4o-2024-08-06"
        }
      },
      "gpt-4o-mini-2024-07-18": {
        ...DEFAULT_OPENAI,
        config: {
          ...DEFAULT_OPENAI.config,
          model: "gpt-4o-mini-2024-07-18"
        }
      }
    }
  },
  [DEFAULT_AZURE.provider]: {
    label: "Azure AI Foundry",
    defaultValue: { ...DEFAULT_AZURE },
    form: AzureModelConfigForm,
    presets: { [DEFAULT_AZURE.config.model]: { ...DEFAULT_AZURE } }
  },
  [DEFAULT_OLLAMA.provider]: {
    label: "Ollama",
    defaultValue: { ...DEFAULT_OLLAMA },
    form: OllamaModelConfigForm,
    presets: { [DEFAULT_OLLAMA.config.model]: { ...DEFAULT_OLLAMA } }
  },
};

const ModelSelector: React.FC<ModelSelectorProps> = ({ onChange, value }) => {
  // Use activeKey to control the collapse state
  const [activeKey, setActiveKey] = React.useState<string[]>(['1']);

  // Define selectClickHandler before using it
  const selectClickHandler = (e: React.MouseEvent) => {
    // Stop propagation to prevent collapse panel from toggling
    e.stopPropagation();
  };

  const provider = value?.provider;
  const providerFormEntry = provider ? PROVIDER_FORM_MAP[provider] : undefined;
  const FormComponent = providerFormEntry?.form;

  const config = value?.config;
  let preset = undefined;
  if (providerFormEntry) {
    preset = Object.entries(providerFormEntry.presets)
      .find(([, presetConfig]) => comparePreset(presetConfig.config, config))
    ?.[0]
  }
  preset ??= value?.config?.model;

  // When dropdown changes, update both selectedModel and values
  const handleProviderChange = (provider: string) => {
    if (PROVIDER_FORM_MAP[provider]) {
      onChange(PROVIDER_FORM_MAP[provider].defaultValue);
    }
  };

  const handlePresetChange = (preset: string) => {
    if (providerFormEntry && providerFormEntry.presets[preset]) {
      onChange(providerFormEntry.presets[preset]);
    }
  };

  // --- Hide advanced toggles for OpenAI recognized models (except OpenRouter) ---
  let hideAdvancedToggles = false;
  if (
    provider === DEFAULT_OPENAI.provider &&
    providerFormEntry &&
    preset &&
    Object.keys(providerFormEntry.presets).includes(preset) &&
    preset !== 'OpenRouter'
  ) {
    hideAdvancedToggles = true;
  }

  const headerContent = (
    <Flex gap="small" align="top" justify="start" className="flex-wrap">
      <Select
        options={Object.entries(PROVIDER_FORM_MAP).map(([key, { label }]) => ({ value: key, label }))}
        placeholder="Select a Model provider."
        value={provider}
        onChange={handleProviderChange}
        onClick={selectClickHandler}
        dropdownMatchSelectWidth={false}
        popupClassName="model-dropdown"
        getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
        dropdownAlign={{ offset: [0, 4] }}
        placement="bottomLeft"
        listHeight={256}
      />
      {
        providerFormEntry &&
        <Select
          options={Object.entries(providerFormEntry.presets).map(([key, { label }]) => ({ value: key, label }))}
          placeholder="Select a Preset"
          value={preset}
          onChange={handlePresetChange}
          onClick={selectClickHandler}
          dropdownMatchSelectWidth={false}
          popupClassName="model-dropdown"
          getPopupContainer={(triggerNode) => triggerNode.parentNode as HTMLElement}
          dropdownAlign={{ offset: [0, 4] }}
          placement="bottomLeft"
          listHeight={256}
        />
      }
    </Flex>
  );

  const items = [
    {
      key: "1",
      label: headerContent,
      children: FormComponent && (
        <FormComponent
          onChange={onChange}
          value={value}
          hideAdvancedToggles={hideAdvancedToggles}
        />
      )
    }
  ];

  // Prevent collapse panel from expanding/collapsing when interacting with dropdowns
  const handleCollapseChange = (key: string | string[]) => {
    // Only allow manual toggling of the collapse panel
    if (typeof key === 'object' && key.length === 0) {
      setActiveKey([]);
    } else if (typeof key === 'object' && key.length > 0) {
      setActiveKey(['1']);
    }
  };

  return (
    <Collapse 
      items={items} 
      activeKey={activeKey} 
      onChange={handleCollapseChange} 
      className="model-selector-collapse" 
    />
  );
};

// Returns true if every key in 'preset' exists in 'config' and the values are strictly equal (deep for objects)
function comparePreset(preset: any, config: any): boolean {
  if (typeof preset !== "object" || preset === null) return preset === config;
  if (typeof config !== "object" || config === null) return false;
  for (const key of Object.keys(preset)) {
    if (!(key in config)) return false;
    if (!comparePreset(preset[key], config[key])) return false;
  }
  return true;
}

export default ModelSelector;
