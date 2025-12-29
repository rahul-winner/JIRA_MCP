/**
 * JIRA Issue Schema Definition
 * This file contains the field mappings for JIRA issues to help with querying and analysis
 * 
 * @description Common JIRA issue fields with their descriptions and data types
 * @version 1.0.0
 */

export interface JiraIssueField {
  id: string;
  name: string;
  description: string;
  type: string;
  example?: string;
}

/**
 * Standard JIRA Issue Fields
 * These are the most commonly used fields across JIRA instances
 */
export const jiraIssueFields: JiraIssueField[] = [
  {
    id: "key",
    name: "Issue Key",
    description: "Unique identifier for the issue (e.g., PROJ-123)",
    type: "string",
    example: "PROJ-123"
  },
  {
    id: "summary",
    name: "Summary",
    description: "Brief description of the issue",
    type: "string",
    example: "Login button not working"
  },
  {
    id: "description",
    name: "Description",
    description: "Detailed description of the issue",
    type: "string",
    example: "When users click the login button, nothing happens"
  },
  {
    id: "status",
    name: "Status",
    description: "Current status of the issue",
    type: "string",
    example: "In Progress, To Do, Done, Closed"
  },
  {
    id: "priority",
    name: "Priority",
    description: "Priority level of the issue",
    type: "string",
    example: "High, Medium, Low, Critical, Blocker"
  },
  {
    id: "issuetype",
    name: "Issue Type",
    description: "Type of the issue",
    type: "string",
    example: "Bug, Story, Task, Epic, Sub-task"
  },
  {
    id: "assignee",
    name: "Assignee",
    description: "Person assigned to work on the issue",
    type: "user",
    example: "john.doe@company.com"
  },
  {
    id: "reporter",
    name: "Reporter",
    description: "Person who reported the issue",
    type: "user",
    example: "jane.smith@company.com"
  },
  {
    id: "created",
    name: "Created Date",
    description: "When the issue was created",
    type: "datetime",
    example: "2024-01-15T10:30:00.000Z"
  },
  {
    id: "updated",
    name: "Updated Date",
    description: "When the issue was last updated",
    type: "datetime",
    example: "2024-01-20T15:45:00.000Z"
  },
  {
    id: "resolutiondate",
    name: "Resolution Date",
    description: "When the issue was resolved",
    type: "datetime",
    example: "2024-01-22T09:15:00.000Z"
  },
  {
    id: "resolution",
    name: "Resolution",
    description: "How the issue was resolved",
    type: "string",
    example: "Fixed, Won't Fix, Duplicate, Cannot Reproduce"
  },
  {
    id: "labels",
    name: "Labels",
    description: "Tags/labels associated with the issue",
    type: "array",
    example: "backend, api, security"
  },
  {
    id: "components",
    name: "Components",
    description: "Project components affected by the issue",
    type: "array",
    example: "UI, Database, API"
  },
  {
    id: "project",
    name: "Project",
    description: "Project this issue belongs to",
    type: "object",
    example: "{key: 'PROJ', name: 'My Project'}"
  },
  {
    id: "fixVersions",
    name: "Fix Versions",
    description: "Versions in which the issue will be/was fixed",
    type: "array",
    example: "1.2.0, 2.0.0"
  },
  {
    id: "duedate",
    name: "Due Date",
    description: "When the issue is due",
    type: "date",
    example: "2024-01-30"
  },
  {
    id: "timetracking",
    name: "Time Tracking",
    description: "Time spent and remaining estimate",
    type: "object",
    example: "{originalEstimate: '8h', remainingEstimate: '2h', timeSpent: '6h'}"
  },
  {
    id: "comment",
    name: "Comments",
    description: "Comments on the issue",
    type: "array",
    example: "Array of comment objects"
  },
  {
    id: "attachment",
    name: "Attachments",
    description: "Files attached to the issue",
    type: "array",
    example: "Array of attachment objects"
  }
];

/**
 * Issue Status Categories
 * JIRA groups statuses into these standard categories
 */
export const statusCategories = {
  TODO: ["To Do", "Open", "Backlog", "New"],
  IN_PROGRESS: ["In Progress", "In Development", "In Review", "Testing"],
  DONE: ["Done", "Closed", "Resolved", "Completed"]
};

/**
 * Priority Levels
 * Standard priority levels in JIRA
 */
export const priorityLevels = {
  HIGHEST: "Highest",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
  LOWEST: "Lowest"
};

/**
 * Issue Types
 * Common JIRA issue types
 */
export const issueTypes = {
  BUG: "Bug",
  STORY: "Story",
  TASK: "Task",
  EPIC: "Epic",
  SUBTASK: "Sub-task",
  IMPROVEMENT: "Improvement"
};
