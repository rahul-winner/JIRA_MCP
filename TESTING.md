# Testing the JIRA MCP Server

This guide helps you verify that your JIRA MCP Server is working correctly.

## Pre-flight Checks

### 1. Verify Installation
```bash
cd /Users/rsinghai/my_space/learning/MCP_Servers/JIRA_MCP
npm list --depth=0
```

Should show:
```
@jira/mcp-server@1.0.0
├── @modelcontextprotocol/sdk@1.6.1
└── zod-to-json-schema@3.24.4
```

### 2. Verify Build
```bash
ls -la build/
```

Should show:
- index.js
- index.d.ts
- JiraSchema.js
- JiraSchema.d.ts
- Source maps (*.js.map)

### 3. Check Node Version
```bash
node -v
```

Should be >= v20.15.1

## Manual Testing

### Test 1: Verify Environment Variables

```bash
echo "JIRA_BASE_URL: $JIRA_BASE_URL"
echo "JIRA_EMAIL: $JIRA_EMAIL"
echo "JIRA_API_TOKEN: ${JIRA_API_TOKEN:0:10}..." # Show only first 10 chars
```

All three should have values.

### Test 2: Test JIRA Connectivity

```bash
# Test your credentials directly with JIRA API
curl -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -H "Accept: application/json" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

Expected: Your JIRA user profile in JSON format

If you get:
- **401**: Credentials are wrong
- **404**: Base URL is incorrect
- **Connection refused**: Network/firewall issue

### Test 3: Start the Server

```bash
npm start
```

Expected output:
```
Starting JIRA MCP Server...
Waiting for configuration...
✓ JIRA client initialized
✓ JIRA MCP Server running successfully!
✓ Available tools: search_issues, get_issue, analyze_status, analyze_priority, analyze_type, analyze_assignee, generate_report, calculate_velocity
```

The server will wait for MCP requests on stdin. Press Ctrl+C to stop.

### Test 4: Test with a Simple JQL Query

Create a test script `test-jira.sh`:

```bash
#!/bin/bash

# Set your environment
export JIRA_BASE_URL="https://your-domain.atlassian.net"
export JIRA_EMAIL="your-email@company.com"
export JIRA_API_TOKEN="your-api-token"

# Test a simple query
curl -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "jql": "order by created DESC",
    "maxResults": 1,
    "fields": ["key", "summary", "status"]
  }' \
  "$JIRA_BASE_URL/rest/api/3/search"
```

Run it:
```bash
chmod +x test-jira.sh
./test-jira.sh
```

Expected: JSON response with at least one issue.

## Integration Testing

### Test with Claude Desktop

1. **Add to Claude Desktop config**:

   Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:
   ```json
   {
     "mcpServers": {
       "jira": {
         "command": "node",
         "args": ["/Users/rsinghai/my_space/learning/MCP_Servers/JIRA_MCP/build/index.js"],
         "env": {
           "JIRA_BASE_URL": "https://your-domain.atlassian.net",
           "JIRA_EMAIL": "your-email@company.com",
           "JIRA_API_TOKEN": "your-api-token"
         }
       }
     }
   }
   ```

2. **Restart Claude Desktop**

3. **Test with queries**:
   - "List all JIRA tools available"
   - "Search for issues in project MYPROJECT"
   - "Show me the status of issue PROJ-123"

### Expected Behavior

✅ **Server starts without errors**
✅ **Connects to JIRA successfully**  
✅ **Returns tool list when requested**
✅ **Executes queries and returns data**
✅ **Handles errors gracefully**

## Troubleshooting Test Failures

### Problem: "Missing required environment variables"

**Solution**:
```bash
# Check all vars are set
printenv | grep JIRA
```

### Problem: "JIRA API Error (401)"

**Test your credentials**:
```bash
# Test authentication
curl -v -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  "$JIRA_BASE_URL/rest/api/3/myself"
```

**Possible causes**:
- Wrong email
- Wrong API token
- API token expired
- Account doesn't have API access

**Solution**: Generate new API token

### Problem: "Cannot find module"

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Problem: Server starts but doesn't respond

**Check**:
- Is it really running? (should block the terminal)
- Are you sending proper MCP requests?
- Check Claude Desktop logs: `~/Library/Logs/Claude/`

### Problem: "TypeError" or "ReferenceError"

**Solution**:
```bash
# Rebuild from scratch
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

## Performance Testing

### Test Query Speed

```bash
time curl -u "$JIRA_EMAIL:$JIRA_API_TOKEN" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jql": "project = MYPROJECT", "maxResults": 50}' \
  "$JIRA_BASE_URL/rest/api/3/search"
```

Typical response times:
- **< 1s**: Excellent
- **1-3s**: Good
- **> 3s**: Check network/JIRA instance

### Memory Usage

```bash
# Start server in background
npm start &
SERVER_PID=$!

# Check memory
ps aux | grep $SERVER_PID

# Cleanup
kill $SERVER_PID
```

Expected: < 100MB for idle server

## Automated Test Suite (Optional)

Create `tests/basic.test.js`:

```javascript
import assert from 'assert';

// Test environment variables
assert(process.env.JIRA_BASE_URL, 'JIRA_BASE_URL must be set');
assert(process.env.JIRA_EMAIL, 'JIRA_EMAIL must be set');
assert(process.env.JIRA_API_TOKEN, 'JIRA_API_TOKEN must be set');

console.log('✓ All environment variables are set');

// Test JIRA connectivity
const response = await fetch(`${process.env.JIRA_BASE_URL}/rest/api/3/myself`, {
  headers: {
    'Authorization': `Basic ${Buffer.from(`${process.env.JIRA_EMAIL}:${process.env.JIRA_API_TOKEN}`).toString('base64')}`,
    'Accept': 'application/json'
  }
});

assert(response.ok, `JIRA connection failed: ${response.status}`);
console.log('✓ JIRA connectivity verified');

const user = await response.json();
console.log(`✓ Authenticated as: ${user.displayName}`);

console.log('\n🎉 All tests passed!');
```

Run tests:
```bash
node tests/basic.test.js
```

## Production Readiness Checklist

Before deploying to production:

- [ ] All environment variables are set
- [ ] JIRA credentials are valid
- [ ] Server starts without errors
- [ ] Can query JIRA successfully
- [ ] Error handling works (try invalid JQL)
- [ ] All 8 tools are listed
- [ ] Documentation is read and understood
- [ ] Logs are accessible
- [ ] Security: No credentials in code
- [ ] Security: .gitignore is configured
- [ ] Performance: Response times are acceptable
- [ ] Integration: Works with MCP client

## Success Criteria

✅ **All pre-flight checks pass**
✅ **Manual connectivity test succeeds**
✅ **Server starts and shows success message**
✅ **At least one JIRA query returns data**
✅ **Integration with Claude Desktop works**

---

**If all tests pass, you're ready to use the JIRA MCP Server! 🚀**

For issues, check:
1. This testing guide
2. QUICKSTART.md for setup
3. README.md for detailed documentation
4. EXAMPLES.md for usage patterns
