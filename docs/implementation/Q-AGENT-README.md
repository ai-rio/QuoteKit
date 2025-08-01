# QuoteKit Q Agent Integration

This directory contains a comprehensive Q Agent setup for your QuoteKit Next.js application, implementing the Q Agent schema through MCP (Model Context Protocol).

## 🏗️ Architecture

```
QuoteKit Application
├── q-agent-config.json          # Q Agent schema configuration
├── .mcp.json                    # MCP server configuration
├── mcp-server/                  # MCP server implementation
│   ├── package.json
│   └── q-agent-server.js
└── setup-mcp-server.sh         # Setup script
```

## 🚀 Quick Start

1. **Setup the MCP Server**:
   ```bash
   ./setup-mcp-server.sh
   ```

2. **Restart Amazon Q** to discover the new MCP server

3. **Start using Q Agent capabilities**:
   - Ask Q to analyze your codebase
   - Request new API routes or components
   - Manage database operations
   - Deploy your application

## 🛠️ Available Tools

### Code Analysis & Generation
- **`analyze_codebase`**: Deep analysis of your Next.js project structure
- **`create_api_route`**: Generate new API routes with authentication
- **`create_component`**: Create React components with TypeScript
- **`generate_types`**: Generate TypeScript types from Supabase schema

### Database & Integration Management
- **`manage_database`**: Perform CRUD operations via Supabase
- **`run_tests`**: Execute unit, integration, or e2e tests
- **`optimize_performance`**: Analyze and optimize application performance
- **`deploy_application`**: Deploy to Vercel, Netlify, or Docker

## 📋 Available Resources

- **`config://q-agent`**: Current Q Agent configuration
- **`schema://database`**: Database schema and relationships
- **`analysis://codebase`**: Live codebase analysis
- **`logs://application`**: Application logs and errors

## 💡 Example Usage

### With Amazon Q Chat:

**"Analyze my current codebase structure"**
```
Q will use the analyze_codebase tool to provide insights about your project
```

**"Create a new API route for user profiles"**
```
Q will use create_api_route to generate:
- src/app/api/users/profile/route.ts
- With authentication
- TypeScript types
- Error handling
```

**"Generate a new quote status component"**
```
Q will use create_component to create:
- Proper TypeScript interfaces
- Tailwind CSS styling
- Integration with your existing design system
```

**"Check my database schema"**
```
Q will read the schema://database resource to show:
- All tables and relationships
- Column definitions
- RLS policies
```

## 🔧 Configuration

### Q Agent Schema (`q-agent-config.json`)
Defines the agent's capabilities, tools, and context. Key sections:
- **Agent metadata**: Name, version, description
- **Tools**: Available operations and their schemas
- **Context**: Application environment and tech stack
- **Capabilities**: What the agent can do
- **Security**: Authentication and authorization rules

### MCP Configuration (`.mcp.json`)
Registers the MCP server with Amazon Q:
```json
{
  "mcpServers": {
    "quotekit-q-agent": {
      "command": "node",
      "args": ["./mcp-server/q-agent-server.js"],
      "type": "stdio"
    }
  }
}
```

## 🔐 Security Features

- **Authentication**: Supabase session validation
- **Authorization**: Role-based access control
- **Data Protection**: Sensitive data masking
- **Audit Trail**: All operations logged
- **Rate Limiting**: Prevents abuse

## 🎯 Integration Points

### Existing QuoteKit Features
- **Supabase**: Database operations and auth
- **Stripe**: Payment processing
- **Resend**: Email services
- **React PDF**: Document generation
- **PostHog**: Analytics
- **Next.js**: Full-stack framework

### Development Workflow
- **TypeScript**: Full type safety
- **Testing**: Jest and React Testing Library
- **Linting**: ESLint with custom rules
- **Formatting**: Prettier with Tailwind plugin
- **CI/CD**: GitHub Actions ready

## 🚀 Advanced Usage

### Custom Tool Development
Add new tools to `mcp-server/q-agent-server.js`:

```javascript
{
  name: 'custom_tool',
  description: 'Your custom functionality',
  inputSchema: {
    // Define parameters
  }
}
```

### Environment-Specific Configurations
The agent automatically adapts to:
- **Development**: Full debugging and hot reload
- **Staging**: Performance monitoring
- **Production**: Optimized and secure

### Performance Monitoring
Built-in metrics for:
- Response times
- Resource usage
- Error rates
- Cache hit ratios

## 🤝 Contributing

1. Modify `q-agent-config.json` for new capabilities
2. Add tools to `mcp-server/q-agent-server.js`
3. Update this README with new features
4. Test with Amazon Q integration

## 📚 Resources

- [Model Context Protocol Specification](https://modelcontextprotocol.io/)
- [Amazon Q Developer Documentation](https://docs.aws.amazon.com/amazonq/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)

## 🐛 Troubleshooting

### MCP Server Not Starting
```bash
# Check server logs
cd mcp-server && npm run dev

# Verify dependencies
npm install
```

### Q Agent Not Responding
1. Restart Amazon Q
2. Check `.mcp.json` configuration
3. Verify server is running: `ps aux | grep q-agent-server`

### Permission Issues
```bash
# Make scripts executable
chmod +x setup-mcp-server.sh
chmod +x mcp-server/q-agent-server.js
```

---

**🎉 Your QuoteKit application now has a powerful Q Agent that understands your codebase and can help with development, deployment, and maintenance tasks!**
