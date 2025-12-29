# JIRA MCP Server

A professional **Model Context Protocol (MCP)** HTTP server for JIRA that enables AI assistants to analyze JIRA issues, generate reports, and provide insights about your projects.

**Version 2.0.0** - Modern implementation using HTTP transport with Express and streamable HTTP protocol.

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

### Option 1: Docker (Recommended for Production)

The easiest way to run the server on any machine:

```bash
# 1. Configure environment
cp .env.docker .env
# Edit .env and set your JIRA_BASE_URL

# 2. Run with Docker Compose
docker-compose up -d

# 3. Check status
docker-compose logs -f
```

See [DOCKER.md](DOCKER.md) for complete Docker deployment guide.

### Option 2: Local Development

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

Edit `.env` with your JIRA base URL:

```bash
JIRA_BASE_URL=https://your-domain.atlassian.net
PORT=3000  # Optional, defaults to 3000
CORS_ORIGIN=*  # Optional, defaults to *
```

**Note:** In version 2.0, credentials (email and API token) are passed via HTTP headers on each request, not stored in the `.env` file.

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

The server will start on `http://0.0.0.0:3000` (or your configured PORT).

Endpoints:
- **MCP endpoint**: `http://localhost:3000/mcp`
- **Health check**: `http://localhost:3000/health`

Or for development with auto-rebuild:

```bash
npm run watch
```

## � Integration with AI Assistants

This is an **HTTP MCP Server** that works with any MCP-compatible AI assistant that supports HTTP transport.

### Authentication

The server accepts JIRA credentials via HTTP headers on each request:
- **Authorization**: `Bearer YOUR_JIRA_API_TOKEN` (or just `YOUR_JIRA_API_TOKEN`)
- **X-JIRA-Email**: `your-email@company.com`

Alternatively, credentials can be passed as query parameters:
- `?email=your-email@company.com&token=YOUR_JIRA_API_TOKEN`

### MCP Clients

Configure your MCP client to use the HTTP endpoint:
- **Endpoint**: `http://localhost:3000/mcp`
- **Method**: POST
- **Headers**: Include Authorization and X-JIRA-Email headers

See [config.example.js](config.example.js) for configuration examples (note: these may need updates for HTTP transport).

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

**PaDockerfile            # Docker container definition
├── docker-compose.yml    # Docker Compose configuration
├── .dockerignore         # Docker build exclusions
├── .env.template         # Environment variable template
├── .env.docker           # Docker environment template
├── config.example.js     # Example configurations
├── test-init.js          # Server initialization test
├── DOCKER.md            # Docker deployment guide: 30)
- `maxResults` (optional): Maximum issues to analyze (default: 200)

**Returns:**
- Total completed issues
- Average per day/week
- Completion breakdown by type

## 📁 Project Structure

```
JIRA_MCP/
├── src/
│   ├── index.ts           # Main HTTP MCP server implementation
│   └── JiraSchema.ts      # JIRA field definitions and constants
├── build/                 # Compiled JavaScript output (not in repo)
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
├── .env.template         # Environment variable template
├── config.example.js     # Example configurations
├── test-init.js          # Server initialization test
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
- **@modelcontextprotocol/sdk** (v1.6.1+) for MCP protocol implementation
- **Express** (v5.2.1+) for HTTP server
- **StreamableHTTPServerTransport** for HTTP-based MCP communication
- **Native fetch API** for JIRA REST API calls (Node.js 20+)
- **Zod** for schema validation
- **dotenv** for environment variable management
- **aikido-npm** for secure dependency installation

### Key Components

#### JiraClient Class
Handles all JIRA API communication and analysis:
- API authentication using Bearer token
- 30-second timeout protection
- Issue search and retrieval
- Various analysis methods (status, priority, type, assignee)
- Report generation
- Velocity calculations

#### HTTP Server (Express)
- CORS-enabled for cross-origin requests
- Health check endpoint (`/health`)
- MCP protocol endpoint (`/mcp`)
- Credential extraction from headers or query params
- Request logging for tool calls

#### Tool Registration
Each tool is registered using `server.registerTool()` with:
- Tool name
- Description and input schema (Zod)
- Async handler function

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
- Credentials are passed per-request, not stored server-side
- API tokens have the same permissions as your account
- Consider creating a dedicated service account for automation
- Use HTTPS in production to protect credentials in transit
- Configure `CORS_ORIGIN` to restrict access to trusted domains
- Tokens are logged only with last 4 characters for debugging

## 🐛 Troubleshooting

### "Missing JIRA_BASE_URL in environment variables"
Make sure `JIRA_BASE_URL` is set in your `.env` file:
- `JIRA_BASE_URL=https://your-domain.atlassian.net`

### "Missing JIRA credentials in request headers"
Ensure your MCP client sends credentials on each request:
- **Authorization** header: `Bearer YOUR_API_TOKEN`
- **X-JIRA-Email** header: `your-email@company.com`

Or use query parameters:
- `?email=your-email@company.com&token=YOUR_API_TOKEN`

### "JIRA API Error (401)"
- Check that your email is correct
- Verify your API token is valid
- Ensure you have access to the JIRA instance
- Token should be passed without "Bearer" prefix in the actual token value

### "JIRA API Error (400)"
- Check your JQL syntax
- Some fields may not exist in your JIRA instance
- Verify project keys and other identifiers

### "JIRA API request timed out after 30 seconds"
- Reduce `maxResults` parameter
- Simplify your JQL query
- Check JIRA instance availability

### Testing the Server

1. **Health Check**:
   ```bash
   curl http://localhost:3000/health
   ```

2. **Test MCP Endpoint**:
   ```bash
   npm run test
   ```
   This runs `test-init.js` which simulates the MCP initialization sequence.

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
