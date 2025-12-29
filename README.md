# JIRA MCP Server

A professional **Model Context Protocol (MCP)** server for JIRA that enables AI assistants to analyze JIRA issues, generate reports, and provide insights about your projects.

## 🌟 Features

- **Search Issues**: Query JIRA using powerful JQL (JIRA Query Language)
- **Get Issue Details**: Retrieve comprehensive information about specific issues
- **Status Analysis**: Analyze issue distribution across different statuses
- **Priority Analysis**: Understand priority breakdown of your issues
- **Type Analysis**: See distribution of Bugs, Stories, Tasks, etc.
- **Assignee Analysis**: Analyze workload distribution across team members
- **Comprehensive Reports**: Generate detailed reports with multiple metrics
- **Velocity Calculation**: Track team velocity and completion rates over time
- **Easy Configuration**: Automatically loads credentials from `.env` file

## 📋 Prerequisites

- **Node.js**: >= 20.15.1
- **JIRA Account**: With API access
- **JIRA API Token**: Generated from your JIRA account settings

## 🚀 Quick Start

### 1. Installation

```bash
cd JIRA_MCP
npm install
```

### 2. Build the Project

```bash
npm run build
```

### 3. Configuration

Create a `.env` file in the project root:

```bash
cp .env.template .env
```

Edit `.env` with your JIRA credentials:

```bash
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-api-token
```

The server automatically loads these variables from the `.env` file.

#### How to Get Your JIRA API Token:

1. Log in to your JIRA account
2. Go to **Account Settings** → **Security**
3. Click **Create and manage API tokens**
4. Click **Create API token**
5. Give it a name and copy the token (you won't see it again!)

### 4. Run the Server

```bash
npm start
```

Or for development with auto-rebuild:

```bash
npm run watch
```

## � Integration with AI Assistants

This is a **Stdio MCP Server** that works with any MCP-compatible AI assistant:

### Claude Desktop
See [config.example.js](config.example.js) for Claude Desktop configuration examples.

### Goose AI
See [GOOSE_INTEGRATION.md](GOOSE_INTEGRATION.md) for complete Goose setup guide.

Quick Goose setup - add to `~/.config/goose/profiles.yaml`:
```yaml
mcp:
  jira-server:
    command: node
    args:
      - /Users/rsinghai/my_space/learning/MCP_Servers/JIRA_MCP/build/index.js
```

## �🛠️ Available Tools

### 1. `jira_search_issues`
Search for JIRA issues using JQL queries.

**Parameters:**
- `jql` (required): JQL query string
- `maxResults` (optional): Maximum results to return (default: 50, max: 100)

**Example JQL queries:**
```jql
project = MYPROJECT
project = MYPROJECT AND status = "In Progress"
assignee = currentUser() AND status != Done
priority = High AND created >= -7d
type = Bug AND status != Closed
```

### 2. `jira_get_issue`
Get detailed information about a specific issue.

**Parameters:**
- `issueKey` (required): Issue key (e.g., "PROJ-123")

### 3. `jira_analyze_status`
Analyze issues by status distribution.

**Parameters:**
- `jql` (required): JQL query to filter issues
- `maxResults` (optional): Maximum issues to analyze (default: 100)

**Returns:**
- Total issues
- Status distribution with counts and percentages

### 4. `jira_analyze_priority`
Analyze issues by priority levels.

**Parameters:**
- `jql` (required): JQL query to filter issues
- `maxResults` (optional): Maximum issues to analyze (default: 100)

**Returns:**
- Priority distribution
- Counts and percentages for each priority level

### 5. `jira_analyze_type`
Analyze issues by type (Bug, Story, Task, etc.).

**Parameters:**
- `jql` (required): JQL query to filter issues
- `maxResults` (optional): Maximum issues to analyze (default: 100)

### 6. `jira_analyze_assignee`
Analyze workload distribution across team members.

**Parameters:**
- `jql` (required): JQL query to filter issues
- `maxResults` (optional): Maximum issues to analyze (default: 100)

**Returns:**
- Assignee workload distribution
- Sorted by number of assigned issues

### 7. `jira_generate_report`
Generate a comprehensive project/sprint report.

**Parameters:**
- `jql` (required): JQL query to filter issues
- `maxResults` (optional): Maximum issues to include (default: 100)

**Returns:**
- Overview (total, open, resolved, completion rate)
- Status, priority, and type analysis
- Assignee distribution
- Top 10 oldest open issues
- Average age of open issues

### 8. `jira_calculate_velocity`
Calculate team velocity and completion metrics.

**Parameters:**
- `jql` (required): JQL query to filter issues
- `timeFrameDays` (optional): Days to analyze (default: 30)
- `maxResults` (optional): Maximum issues to analyze (default: 200)

**Returns:**
- Total completed issues
- Average per day/week
- Completion breakdown by type

## 📁 Project Structure

```
JIRA_MCP/
├── src/
│   ├── index.ts           # Main MCP server implementation
│   └── JiraSchema.ts      # JIRA field definitions and constants
├── build/                 # Compiled JavaScript output
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔧 Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled server
- `npm run dev` - Build and run in one command
- `npm run watch` - Watch mode for development

### Code Structure

The server is built with:
- **TypeScript** for type safety and better developer experience
- **@modelcontextprotocol/sdk** for MCP protocol implementation
- **Native fetch API** for JIRA REST API calls (Node.js 20+)

### Key Components

#### JiraClient Class
Handles all JIRA API communication and analysis:
- API authentication using Basic Auth
- Issue search and retrieval
- Various analysis methods (status, priority, type, assignee)
- Report generation
- Velocity calculations

#### Tool Definitions
Each tool is defined with:
- Name and description
- Input schema (parameters)
- Handler function in the main request handler

## 📊 Example Use Cases

### 1. Sprint Report
```jql
project = MYPROJECT AND sprint = "Sprint 1"
```
Use `jira_generate_report` to get comprehensive sprint metrics.

### 2. My Open Work
```jql
assignee = currentUser() AND status != Done
```
Use `jira_analyze_priority` to prioritize your work.

### 3. Bug Analysis
```jql
project = MYPROJECT AND type = Bug AND created >= -30d
```
Use `jira_analyze_status` to see bug resolution progress.

### 4. Team Velocity
```jql
project = MYPROJECT AND resolution != Unresolved
```
Use `jira_calculate_velocity` to track team performance.

## 🔐 Security Notes

- **Never commit your API token** to version control
- Use environment variables or secure credential storage
- API tokens have the same permissions as your account
- Consider creating a dedicated service account for automation

## 🐛 Troubleshooting

### "Missing required environment variables"
Make sure all three environment variables are set:
- `JIRA_BASE_URL`
- `JIRA_EMAIL`
- `JIRA_API_TOKEN`

### "JIRA API Error (401)"
- Check that your email is correct
- Verify your API token is valid
- Ensure you have access to the JIRA instance

### "JIRA API Error (400)"
- Check your JQL syntax
- Some fields may not exist in your JIRA instance
- Verify project keys and other identifiers

## 📚 Additional Resources

- [JIRA REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [JQL (JIRA Query Language) Guide](https://support.atlassian.com/jira-software-cloud/docs/use-advanced-search-with-jira-query-language-jql/)
- [Model Context Protocol](https://modelcontextprotocol.io/)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📝 License

This project is provided as-is for educational and professional use.

## 👥 Author

JIRA MCP Team

---

**Built with ❤️ using TypeScript and the Model Context Protocol**
