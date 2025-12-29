#!/usr/bin/env node

/**
 * JIRA MCP Server - Modern Implementation
 * 
 * @description A Model Context Protocol (MCP) server for JIRA using the latest SDK
 * - Uses McpServer (modern high-level API)
 * - Uses StreamableHTTPServerTransport (built-in streamable HTTP)
 * - Supports Goose and other MCP clients
 * 
 * @version 2.0.0
 * @author JIRA MCP Team
 * @requires Node.js >= 20.15.1
 */

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import cors from "cors";
import { z } from "zod";

/**
 * JIRA Client Class
 * Handles all communication with the JIRA API
 */
class JiraClient {
  private readonly baseUrl: string;
  private readonly authHeaders: { Authorization: string; "Content-Type": string; Accept: string };

  constructor(baseUrl: string, _email: string, apiToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.authHeaders = {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async searchIssues(jql: string, maxResults: number = 50, fields?: string[]): Promise<any> {
    const url = `${this.baseUrl}/rest/api/2/search`;
    const body = { jql, maxResults, fields: fields || ["*all"], startAt: 0 };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: this.authHeaders,
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`JIRA API Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('JIRA API request timed out after 30 seconds');
      }
      throw error;
    }
  }

  async getIssue(issueKey: string): Promise<any> {
    const url = `${this.baseUrl}/rest/api/2/issue/${issueKey}`;
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: this.authHeaders,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`JIRA API Error (${response.status}): ${errorText}`);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('JIRA API request timed out after 30 seconds');
      }
      throw error;
    }
  }

  analyzeByStatus(issues: any[]): any {
    const statusCount: { [key: string]: number } = {};
    const total = issues.length;

    issues.forEach((issue) => {
      const status = issue.fields?.status?.name || "Unknown";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    const analysis = Object.entries(statusCount).map(([status, count]) => ({
      status,
      count,
      percentage: ((count / total) * 100).toFixed(2) + "%",
    }));

    return {
      totalIssues: total,
      statusDistribution: analysis,
      summary: `Analyzed ${total} issues across ${Object.keys(statusCount).length} different statuses`,
    };
  }

  analyzeByPriority(issues: any[]): any {
    const priorityCount: { [key: string]: number } = {};
    const total = issues.length;

    issues.forEach((issue) => {
      const priority = issue.fields?.priority?.name || "Unassigned";
      priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    });

    const analysis = Object.entries(priorityCount).map(([priority, count]) => ({
      priority,
      count,
      percentage: ((count / total) * 100).toFixed(2) + "%",
    }));

    return {
      totalIssues: total,
      priorityDistribution: analysis,
      summary: `${total} issues distributed across ${Object.keys(priorityCount).length} priority levels`,
    };
  }

  analyzeByType(issues: any[]): any {
    const typeCount: { [key: string]: number } = {};
    const total = issues.length;

    issues.forEach((issue) => {
      const type = issue.fields?.issuetype?.name || "Unknown";
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    const analysis = Object.entries(typeCount).map(([type, count]) => ({
      type,
      count,
      percentage: ((count / total) * 100).toFixed(2) + "%",
    }));

    return {
      totalIssues: total,
      typeDistribution: analysis,
      summary: `${total} issues across ${Object.keys(typeCount).length} different types`,
    };
  }

  analyzeByAssignee(issues: any[]): any {
    const assigneeCount: { [key: string]: number } = {};
    const total = issues.length;

    issues.forEach((issue) => {
      const assignee = issue.fields?.assignee?.displayName || "Unassigned";
      assigneeCount[assignee] = (assigneeCount[assignee] || 0) + 1;
    });

    const analysis = Object.entries(assigneeCount)
      .map(([assignee, count]) => ({
        assignee,
        count,
        percentage: ((count / total) * 100).toFixed(2) + "%",
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalIssues: total,
      assigneeDistribution: analysis,
      totalAssignees: Object.keys(assigneeCount).length,
      summary: `${total} issues distributed among ${Object.keys(assigneeCount).length} assignees`,
    };
  }

  generateReport(issues: any[]): any {
    const total = issues.length;
    const statusAnalysis = this.analyzeByStatus(issues);
    const priorityAnalysis = this.analyzeByPriority(issues);
    const typeAnalysis = this.analyzeByType(issues);
    const assigneeAnalysis = this.analyzeByAssignee(issues);

    const resolvedStatuses = new Set(["Done", "Closed", "Resolved", "Completed"]);
    const resolved = issues.filter((issue) =>
      resolvedStatuses.has(issue.fields?.status?.name || "")
    ).length;
    const open = total - resolved;

    const now = new Date();
    const openIssues = issues.filter(
      (issue) => !resolvedStatuses.has(issue.fields?.status?.name || "")
    );
    
    const ageAnalysis = openIssues.map((issue) => {
      const created = new Date(issue.fields?.created);
      const ageInDays = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
      return {
        key: issue.key,
        summary: issue.fields?.summary,
        ageInDays,
        assignee: issue.fields?.assignee?.displayName || "Unassigned",
      };
    }).sort((a, b) => b.ageInDays - a.ageInDays);

    return {
      reportGeneratedAt: now.toISOString(),
      overview: {
        totalIssues: total,
        openIssues: open,
        resolvedIssues: resolved,
        completionRate: ((resolved / total) * 100).toFixed(2) + "%",
      },
      statusAnalysis,
      priorityAnalysis,
      typeAnalysis,
      assigneeAnalysis,
      oldestOpenIssues: ageAnalysis.slice(0, 10),
      averageAgeOfOpenIssues: openIssues.length > 0
        ? (ageAnalysis.reduce((sum, i) => sum + i.ageInDays, 0) / openIssues.length).toFixed(1) + " days"
        : "N/A",
    };
  }

  calculateVelocity(issues: any[], timeFrameDays: number = 30): any {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - timeFrameDays * 24 * 60 * 60 * 1000);
    
    const recentlyResolved = issues.filter((issue) => {
      const resolutionDate = issue.fields?.resolutiondate;
      if (!resolutionDate) return false;
      return new Date(resolutionDate) >= cutoffDate;
    });

    const total = recentlyResolved.length;
    const byType: { [key: string]: number } = {};
    recentlyResolved.forEach((issue) => {
      const type = issue.fields?.issuetype?.name || "Unknown";
      byType[type] = (byType[type] || 0) + 1;
    });

    return {
      timeFrame: `Last ${timeFrameDays} days`,
      totalCompleted: total,
      averagePerDay: (total / timeFrameDays).toFixed(2),
      averagePerWeek: ((total / timeFrameDays) * 7).toFixed(2),
      completedByType: byType,
      summary: `Team completed ${total} issues in the last ${timeFrameDays} days (avg ${(total / timeFrameDays).toFixed(1)} per day)`,
    };
  }
}

/**
 * Create and configure the MCP server
 */
function createMcpServer(getJiraClient: () => JiraClient): McpServer {
  const server = new McpServer(
    {
      name: "JIRA MCP Server",
      version: "2.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register all tools using modern McpServer API
  
  server.registerTool(
    "jira_search_issues",
    {
      description: `Search for JIRA issues using JQL (JIRA Query Language). 
      
Examples: "project = MYPROJECT", "status = 'In Progress'", "assignee = currentUser()"`,
      inputSchema: {
        jql: z.string().describe("JQL query string"),
        maxResults: z.number().optional().describe("Max results (default: 50, max: 100)"),
      },
    },
    async ({ jql, maxResults }) => {
      const jiraClient = getJiraClient();
      const result = await jiraClient.searchIssues(jql, Math.min(maxResults || 50, 100));
      // console.log(`===>>> JIRA Search returned issues for JQL: `, JSON.stringify(result, null, 2));
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  server.registerTool(
    "jira_get_issue",
    {
      description: "Get detailed information about a specific JIRA issue by key (e.g., PROJ-123)",
      inputSchema: {
        issueKey: z.string().describe("Issue key (e.g., PROJ-123)"),
      },
    },
    async ({ issueKey }) => {
      const jiraClient = getJiraClient();
      const result = await jiraClient.getIssue(issueKey);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(result, null, 2),
        }],
      };
    }
  );

  server.registerTool(
    "jira_analyze_status",
    {
      description: "Analyze JIRA issues by status distribution",
      inputSchema: {
        jql: z.string().describe("JQL query"),
        maxResults: z.number().optional().describe("Max results (default: 100)"),
      },
    },
    async ({ jql, maxResults }) => {
      const jiraClient = getJiraClient();
      const searchResult = await jiraClient.searchIssues(jql, Math.min(maxResults || 100, 100));
      const analysis = jiraClient.analyzeByStatus(searchResult.issues);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        }],
      };
    }
  );

  server.registerTool(
    "jira_analyze_priority",
    {
      description: "Analyze JIRA issues by priority distribution",
      inputSchema: {
        jql: z.string().describe("JQL query"),
        maxResults: z.number().optional().describe("Max results (default: 100)"),
      },
    },
    async ({ jql, maxResults }) => {
      const jiraClient = getJiraClient();
      const searchResult = await jiraClient.searchIssues(jql, Math.min(maxResults || 100, 100));
      const analysis = jiraClient.analyzeByPriority(searchResult.issues);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        }],
      };
    }
  );

  server.registerTool(
    "jira_analyze_type",
    {
      description: "Analyze JIRA issues by type (Bug, Story, Task, etc.)",
      inputSchema: {
        jql: z.string().describe("JQL query"),
        maxResults: z.number().optional().describe("Max results (default: 100)"),
      },
    },
    async ({ jql, maxResults }) => {
      const jiraClient = getJiraClient();
      const searchResult = await jiraClient.searchIssues(jql, Math.min(maxResults || 100, 100));
      const analysis = jiraClient.analyzeByType(searchResult.issues);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        }],
      };
    }
  );

  server.registerTool(
    "jira_analyze_assignee",
    {
      description: "Analyze JIRA issues by assignee workload distribution",
      inputSchema: {
        jql: z.string().describe("JQL query"),
        maxResults: z.number().optional().describe("Max results (default: 100)"),
      },
    },
    async ({ jql, maxResults }) => {
      const jiraClient = getJiraClient();
      const searchResult = await jiraClient.searchIssues(jql, Math.min(maxResults || 100, 100));
      const analysis = jiraClient.analyzeByAssignee(searchResult.issues);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(analysis, null, 2),
        }],
      };
    }
  );

  server.registerTool(
    "jira_generate_report",
    {
      description: "Generate comprehensive report with status, priority, type, assignee analysis",
      inputSchema: {
        jql: z.string().describe("JQL query"),
        maxResults: z.number().optional().describe("Max results (default: 100)"),
      },
    },
    async ({ jql, maxResults }) => {
      const jiraClient = getJiraClient();
      const searchResult = await jiraClient.searchIssues(jql, Math.min(maxResults || 100, 100));
      const report = jiraClient.generateReport(searchResult.issues);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(report, null, 2),
        }],
      };
    }
  );

  server.registerTool(
    "jira_calculate_velocity",
    {
      description: "Calculate team velocity metrics over a time period",
      inputSchema: {
        jql: z.string().describe("JQL query"),
        timeFrameDays: z.number().optional().describe("Days to analyze (default: 30)"),
        maxResults: z.number().optional().describe("Max results (default: 200)"),
      },
    },
    async ({ jql, timeFrameDays, maxResults }) => {
      const jiraClient = getJiraClient();
      const searchResult = await jiraClient.searchIssues(jql, Math.min(maxResults || 200, 200));
      const velocity = jiraClient.calculateVelocity(searchResult.issues, timeFrameDays || 30);
      return {
        content: [{
          type: "text",
          text: JSON.stringify(velocity, null, 2),
        }],
      };
    }
  );

  return server;
}

/**
 * Main function to start the HTTP server
 */
async function main() {
  // Only require JIRA base URL from environment
  const jiraBaseUrl = process.env.JIRA_BASE_URL;

  if (!jiraBaseUrl) {
    console.error("❌ Missing JIRA_BASE_URL in environment variables");
    console.error("   Please set JIRA_BASE_URL in .env file");
    process.exit(1);
  }

  console.log("✅ JIRA base URL loaded:", jiraBaseUrl);
  console.log("ℹ️  Credentials will be accepted from client headers");
  
  const port = parseInt(process.env.PORT || "3000", 10);

  // Store current request credentials in AsyncLocalStorage-like pattern
  let currentJiraEmail = '';
  let currentJiraToken = '';

  // Create MCP server with a factory function that gets credentials from current request
  const mcpServer = createMcpServer(() => {
    if (!currentJiraEmail || !currentJiraToken) {
      throw new Error('Missing JIRA credentials in request headers. Please provide X-JIRA-Email and Authorization headers.');
    }
    return new JiraClient(jiraBaseUrl, currentJiraEmail, currentJiraToken);
  });
  console.log("✅ MCP server initialized with 8 tools");

  // Create transport ONCE
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Stateless mode
  });

  // Connect server to transport ONCE at startup
  await mcpServer.connect(transport);

  // Setup Express app
  const app = express();
  
  app.use(cors({
    origin: process.env.CORS_ORIGIN || "*",
    credentials: true
  }));
  
  app.use(express.json());

  // Health check
  app.get("/health", (_req, res) => {
    res.json({ status: "healthy", service: "JIRA MCP Server" });
  });

  // MCP endpoint using StreamableHTTPServerTransport
  app.post("/mcp", async (req, res) => {
    const method = req.body?.method || 'unknown';
    const toolName = req.body?.params?.name;
    
    // Extract JIRA credentials from headers OR query params
    const authHeader = req.headers['authorization'] || req.headers['x-jira-token'];
    const emailHeader = req.headers['x-jira-email'];
    const queryEmail = req.query.email as string;
    const queryToken = req.query.token as string;
    
    // Set credentials for this request (prefer headers, fallback to query params)
    if (authHeader) {
      // Support both "Bearer TOKEN" and just "TOKEN"
      currentJiraToken = authHeader.toString().replace(/^Bearer\s+/i, '');
    } else if (queryToken) {
      currentJiraToken = queryToken;
    }
    
    if (emailHeader) {
      currentJiraEmail = emailHeader.toString();
    } else if (queryEmail) {
      currentJiraEmail = queryEmail;
    }
    
    // Only log tools/call requests (the important ones)
    if (method === 'tools/call') {
      console.log(`🔧 Tool called: ${toolName}`);
      console.log(`   Args: ${JSON.stringify(req.body?.params?.arguments || {})}`);
      console.log(`   Email: ${currentJiraEmail || 'not provided'}`);
      console.log(`   Token: ${currentJiraToken ? '***' + currentJiraToken.slice(-4) : 'not provided'}`);
    }
    
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal server error'
          },
          id: req.body?.id || null
        });
      }
    }
  });

  // Start server
  app.listen(port, '0.0.0.0', () => {
    console.log(`\n🚀 JIRA MCP Server running on http://0.0.0.0:${port}`);
    console.log(`   MCP endpoint: http://localhost:${port}/mcp`);
    console.log(`   Health check: http://localhost:${port}/health\n`);
  });
}

// Start the server
try {
  await main();
} catch (error) {
  console.error("Fatal error starting JIRA MCP Server:", error);
  process.exit(1);
}
