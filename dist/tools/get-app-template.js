/**
 * get_app_template Tool
 *
 * Get example code and templates for creating FlowDot apps.
 * No API call required - returns pre-defined templates.
 */
export const getAppTemplateTool = {
    name: 'get_app_template',
    description: `Get example code and templates for creating FlowDot apps.

## EXECUTION ENVIRONMENT
FlowDot apps run in a sandboxed browser iframe with:
- React 18 (global - use React.useState, React.useEffect, etc.)
- Tailwind CSS (full utility classes available)
- FlowDot color tokens: primary-50 to primary-900, secondary-50 to secondary-900
- invokeWorkflow(workflowHash, inputs) - to call linked workflows

## CRITICAL CODE RULES
1. NO IMPORTS - React is global (use React.useState, React.useEffect, React.useRef, etc.)
2. NO EXPORTS - Just define your function
3. Function must be named: function MyAppName() { ... }
4. Use Tailwind CSS for ALL styling

## WORKFLOW RESPONSE FORMAT
invokeWorkflow returns data in this structure:
{
  "data": {
    "[nodeId]": {
      "nodeId": "uuid",
      "nodeTitle": "My Output Node",
      "nodeType": "text_output",
      "outputs": {
        "Consolidated Text": { "value": "the actual data", "metadata": {...} }
      }
    }
  }
}

IMPORTANT: Use this helper function to extract outputs by node title:
const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
  const node = Object.values(result?.data || {}).find(n => n.nodeTitle === nodeTitle);
  return node?.outputs?.[socketName]?.value;
};

Example: const weatherData = getNodeOutput(result, 'Weather Results', 'Consolidated Text');

## DISPLAY MODES
Set config.displayMode to:
- "windowed": Standard view with FlowDot header (default)
- "fullscreen": Full viewport, minimal floating control bar
- "embedded": No FlowDot UI, for iframe embedding

Available templates:
- "basic" - Simple form that invokes a workflow
- "chat" - Chat interface with streaming
- "dashboard" - Dashboard with multiple workflow calls
- "form-builder" - Dynamic form based on workflow schema
- "data-viewer" - Display workflow results in tables/charts

You can also request "all" to see all templates at once.`,
    inputSchema: {
        type: 'object',
        properties: {
            template: {
                type: 'string',
                enum: ['basic', 'chat', 'dashboard', 'form-builder', 'data-viewer', 'all'],
                description: 'Template type to retrieve (default: basic)',
            },
        },
    },
};
const TEMPLATES = {
    basic: {
        name: 'Basic Form App',
        description: 'A simple form that submits data to a workflow and displays results.',
        code: `function BasicFormApp() {
  const [input, setInput] = React.useState('');
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  // Helper to extract output from workflow response by node title
  const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
    const node = Object.values(result?.data || {}).find(n => n.nodeTitle === nodeTitle);
    return node?.outputs?.[socketName]?.value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Replace 'YOUR_WORKFLOW_HASH' with your actual workflow hash
      const response = await invokeWorkflow('YOUR_WORKFLOW_HASH', {
        text: input
      });
      // Extract the output - replace 'Output' with your node's title
      const output = getNodeOutput(response, 'Output');
      setResult(output || response);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My FlowDot App</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Input</label>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter your text..."
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="whitespace-pre-wrap text-sm">
              {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}`,
    },
    chat: {
        name: 'Chat Interface',
        description: 'A chat-style interface for conversational workflows.',
        code: `function ChatApp() {
  const [messages, setMessages] = React.useState([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const messagesEndRef = React.useRef(null);

  // Helper to extract output from workflow response by node title
  const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
    const node = Object.values(result?.data || {}).find(n => n.nodeTitle === nodeTitle);
    return node?.outputs?.[socketName]?.value;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Replace 'YOUR_WORKFLOW_HASH' with your LLM workflow hash
      const response = await invokeWorkflow('YOUR_WORKFLOW_HASH', {
        message: input,
        history: messages.map(m => ({ role: m.role, content: m.content }))
      });

      // Extract the response - replace 'Response' with your output node's title
      const responseText = getNodeOutput(response, 'Response') || JSON.stringify(response);
      const assistantMessage = {
        role: 'assistant',
        content: responseText
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'error',
        content: err.message || 'Failed to get response'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">Chat Assistant</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Start a conversation by typing a message below.
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}
          >
            <div
              className={\`max-w-[80%] p-3 rounded-lg \${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : msg.role === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-900'
              }\`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t bg-white p-4">
        <div className="flex space-x-2 max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}`,
    },
    dashboard: {
        name: 'Dashboard App',
        description: 'A dashboard that displays data from multiple workflow calls.',
        code: `function DashboardApp() {
  const [stats, setStats] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  // Helper to extract output from workflow response by node title
  const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
    const node = Object.values(result?.data || {}).find(n => n.nodeTitle === nodeTitle);
    return node?.outputs?.[socketName]?.value;
  };

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load data from multiple workflows in parallel
      const [statsResult, itemsResult] = await Promise.all([
        invokeWorkflow('STATS_WORKFLOW_HASH', {}),
        invokeWorkflow('ITEMS_WORKFLOW_HASH', { limit: 10 })
      ]);

      // Extract outputs - replace node titles with your actual node names
      const statsData = getNodeOutput(statsResult, 'Stats Output');
      const itemsData = getNodeOutput(itemsResult, 'Items Output');

      setStats(statsData ? JSON.parse(statsData) : statsResult);
      setItems(itemsData ? JSON.parse(itemsData) : itemsResult.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
          <button
            onClick={loadDashboardData}
            className="ml-4 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats && Object.entries(stats).map(([key, value]) => (
          <div key={key} className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500 uppercase">{key}</div>
            <div className="text-3xl font-bold mt-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
          </div>
        ))}
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">
                  <span className={\`px-2 py-1 text-xs rounded-full \${
                    item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }\`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}`,
    },
    'form-builder': {
        name: 'Dynamic Form Builder',
        description: 'A form that dynamically generates fields based on workflow input schema.',
        code: `function DynamicFormApp() {
  const [formData, setFormData] = React.useState({});
  const [result, setResult] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const [schemaLoading, setSchemaLoading] = React.useState(true);

  // Define your workflow hash here
  const WORKFLOW_HASH = 'YOUR_WORKFLOW_HASH';

  // Helper to extract output from workflow response by node title
  const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
    const node = Object.values(result?.data || {}).find(n => n.nodeTitle === nodeTitle);
    return node?.outputs?.[socketName]?.value;
  };

  // Define the expected input schema
  // This would typically come from the workflow's signature
  const inputSchema = [
    { name: 'text', type: 'string', description: 'Text input', required: true },
    { name: 'count', type: 'number', description: 'Number of items', required: false },
    { name: 'enabled', type: 'boolean', description: 'Enable feature', required: false },
    { name: 'options', type: 'select', options: ['option1', 'option2', 'option3'], required: false },
  ];

  React.useEffect(() => {
    // Initialize form data with defaults
    const defaults = {};
    inputSchema.forEach(field => {
      if (field.type === 'boolean') defaults[field.name] = false;
      else if (field.type === 'number') defaults[field.name] = 0;
      else defaults[field.name] = '';
    });
    setFormData(defaults);
    setSchemaLoading(false);
  }, []);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await invokeWorkflow(WORKFLOW_HASH, formData);
      // Extract the output - replace 'Output' with your node's title
      const output = getNodeOutput(response, 'Output');
      setResult(output || response);
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name];

    switch (field.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              className="rounded"
            />
            <span>{field.description}</span>
          </label>
        );
      case 'number':
        return (
          <input
            type="number"
            value={value || 0}
            onChange={(e) => handleChange(field.name, Number(e.target.value))}
            className="w-full p-2 border rounded-lg"
          />
        );
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.description}
            className="w-full p-2 border rounded-lg"
          />
        );
    }
  };

  if (schemaLoading) {
    return <div className="min-h-screen bg-gray-50 p-6 text-center">Loading form...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Dynamic Form</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {inputSchema.map(field => (
            <div key={field.name}>
              <label className="block text-sm font-medium mb-1">
                {field.name}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              {renderField(field)}
              {field.description && field.type !== 'boolean' && (
                <p className="text-xs text-gray-500 mt-1">{field.description}</p>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Submit'}
          </button>
        </form>

        {result && (
          <div className="mt-6 p-4 bg-white rounded-lg shadow">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="whitespace-pre-wrap text-sm overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}`,
    },
    'data-viewer': {
        name: 'Data Viewer',
        description: 'Display workflow results in tables and charts.',
        code: `function DataViewerApp() {
  const [data, setData] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [viewMode, setViewMode] = React.useState('table'); // 'table' or 'cards'
  const [sortField, setSortField] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState('asc');

  // Helper to extract output from workflow response by node title
  const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
    const node = Object.values(result?.data || {}).find(n => n.nodeTitle === nodeTitle);
    return node?.outputs?.[socketName]?.value;
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await invokeWorkflow('YOUR_WORKFLOW_HASH', {});
      // Extract the data - replace 'Data Output' with your node's title
      const outputData = getNodeOutput(result, 'Data Output');
      // Parse if it's JSON string, otherwise use as-is
      const parsed = outputData ? JSON.parse(outputData) : result;
      setData(parsed.items || parsed.data || parsed || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = React.useMemo(() => {
    if (!sortField) return data;
    return [...data].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      if (typeof aVal === 'number') return (aVal - bVal) * direction;
      return String(aVal).localeCompare(String(bVal)) * direction;
    });
  }, [data, sortField, sortDirection]);

  // Get column headers from first item
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Data Viewer</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('table')}
            className={\`px-3 py-1 rounded \${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-100'}\`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={\`px-3 py-1 rounded \${viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-gray-100'}\`}
          >
            Cards
          </button>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {columns.map(col => (
                  <th
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer hover:bg-gray-100"
                  >
                    {col}
                    {sortField === col && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedData.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  {columns.map(col => (
                    <td key={col} className="px-4 py-3 text-sm">
                      {typeof row[col] === 'object'
                        ? JSON.stringify(row[col])
                        : String(row[col])
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">No data available</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedData.map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-lg shadow">
              {columns.map(col => (
                <div key={col} className="mb-2">
                  <span className="text-xs text-gray-500 uppercase">{col}</span>
                  <div className="font-medium">
                    {typeof item[col] === 'object'
                      ? JSON.stringify(item[col])
                      : String(item[col])
                    }
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-500">
        Showing {data.length} items
      </div>
    </div>
  );
}`,
    },
};
export async function handleGetAppTemplate(args) {
    const templateName = args.template || 'basic';
    if (templateName === 'all') {
        const allTemplates = Object.entries(TEMPLATES)
            .map(([key, template]) => {
            return `## ${template.name} (${key})

${template.description}

\`\`\`jsx
${template.code}
\`\`\``;
        })
            .join('\n\n---\n\n');
        const text = `# FlowDot App Templates

Below are all available app templates. Each template demonstrates a different pattern for building FlowDot apps.

## EXECUTION ENVIRONMENT

Apps run in a sandboxed browser iframe with:
- React 18 (global - use React.useState, React.useEffect, etc.)
- Tailwind CSS (full utility classes available)
- FlowDot color tokens: primary-50 to primary-900, secondary-50 to secondary-900
- invokeWorkflow(workflowHash, inputs) - to call linked workflows

## CRITICAL CODE RULES

1. **NO IMPORTS** - React is global (use React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback)
2. **NO EXPORTS** - Just define your function, the system handles the rest
3. **Function naming** - Must be: function MyAppName() { ... }
4. **Styling** - Use Tailwind CSS for ALL styling (no inline style objects, no CSS-in-JS)

## WORKFLOW RESPONSE FORMAT

invokeWorkflow returns data in this structure:
\`\`\`json
{
  "data": {
    "[nodeId]": {
      "nodeId": "uuid",
      "nodeTitle": "My Output Node",
      "nodeType": "text_output",
      "outputs": {
        "Consolidated Text": { "value": "the actual data", "metadata": {...} }
      }
    }
  }
}
\`\`\`

**IMPORTANT**: Use this helper function to extract outputs by node title:
\`\`\`javascript
const getNodeOutput = (result, nodeTitle, socketName = 'Consolidated Text') => {
  const node = Object.values(result?.data || {}).find(n => n.nodeTitle === nodeTitle);
  return node?.outputs?.[socketName]?.value;
};
\`\`\`

Example: \`const weatherData = getNodeOutput(result, 'Weather Results', 'Consolidated Text');\`

## DISPLAY MODES

Set config.displayMode when creating/updating an app:
- "windowed": Standard view with FlowDot header (default)
- "fullscreen": Full viewport, minimal floating control bar
- "embedded": No FlowDot UI, for iframe embedding

---

${allTemplates}

## Tips

1. Replace 'YOUR_WORKFLOW_HASH' with your actual workflow hash
2. Link workflows to your app using link_app_workflow
3. Test locally before publishing
4. Use mobile_code for mobile-specific layouts
5. Use min-h-screen for fullscreen apps`;
        return {
            content: [{ type: 'text', text }],
        };
    }
    const template = TEMPLATES[templateName];
    if (!template) {
        const available = Object.keys(TEMPLATES).join(', ');
        return {
            content: [{ type: 'text', text: `Unknown template: "${templateName}". Available templates: ${available}, all` }],
        };
    }
    const text = `# ${template.name}

${template.description}

## Code

\`\`\`jsx
${template.code}
\`\`\`

## Usage

1. Create a new app using create_app with this code
2. Replace 'YOUR_WORKFLOW_HASH' with your actual workflow hash
3. Replace node titles in getNodeOutput() calls with your actual node names
4. Link the workflow using link_app_workflow
5. Test and publish when ready

## Workflow Response Format

invokeWorkflow returns data in this structure:
\`\`\`json
{
  "data": {
    "[nodeId]": {
      "nodeId": "uuid",
      "nodeTitle": "My Output Node",
      "outputs": { "Consolidated Text": { "value": "the data" } }
    }
  }
}
\`\`\`

Use the getNodeOutput helper (included in templates) to extract by node title.

## Critical Rules

- **NO IMPORTS** - React is global (use React.useState, React.useEffect, etc.)
- **NO EXPORTS** - Just define your function
- **invokeWorkflow(hash, inputs)** - Call a linked workflow
- **Tailwind CSS** - Full Tailwind for styling

## Other Templates

Available templates: ${Object.keys(TEMPLATES).join(', ')}
Use \`get_app_template(template: "all")\` to see all templates.`;
    return {
        content: [{ type: 'text', text }],
    };
}
//# sourceMappingURL=get-app-template.js.map