# Claude Code Configuration - SPARC Development Environment

## 🚨 CRITICAL: CONCURRENT EXECUTION FOR ALL ACTIONS

**ABSOLUTE RULE**: ALL operations MUST be concurrent/parallel in a single message:

### 🔴 MANDATORY CONCURRENT PATTERNS:
1. **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
2. **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
3. **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
4. **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
5. **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**✅ CORRECT: Everything in ONE message**
```javascript
[Single Message]:
  - TodoWrite { todos: [10+ todos with all statuses/priorities] }
  - Task("Agent 1 with full instructions and hooks")
  - Task("Agent 2 with full instructions and hooks") 
  - Read("file1.js"), Read("file2.js")
  - Write("output1.js", content), Write("output2.js", content)
  - Bash("npm install"), Bash("npm test"), Bash("npm run build")
```

**❌ WRONG: Multiple messages (NEVER DO THIS)**
```javascript
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Read("file1.js")
// This is 6x slower and breaks coordination!
```

### 🎯 CONCURRENT EXECUTION CHECKLIST:
Before sending ANY message, ask yourself:
- ✅ Are ALL related TodoWrite operations batched together?
- ✅ Are ALL Task spawning operations in ONE message?
- ✅ Are ALL file operations (Read/Write/Edit) batched together?
- ✅ Are ALL bash commands grouped in ONE message?

If ANY answer is "No", you MUST combine operations into a single message!

## Project Overview
This project uses the SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) methodology for systematic Test-Driven Development with AI assistance through Claude-Flow orchestration.

## SPARC Development Commands

### Core SPARC Commands
- `npx claude-flow sparc modes`: List all available SPARC development modes
- `npx claude-flow sparc run <mode> "<task>"`: Execute specific SPARC mode for a task
- `npx claude-flow sparc tdd "<feature>"`: Run complete TDD workflow using SPARC methodology

### Batchtools Commands (Optimized)
- `npx claude-flow sparc batch <modes> "<task>"`: Execute multiple SPARC modes in parallel
- `npx claude-flow sparc pipeline "<task>"`: Execute full SPARC pipeline with parallel processing

### Standard Build Commands
- `npm run build`: Build the project
- `npm run test`: Run the test suite
- `npm run lint`: Run linter and format checks
- `npm run typecheck`: Run TypeScript type checking

## Code Style and Best Practices

### SPARC Development Principles
- **Modular Design**: Keep files under 500 lines
- **Environment Safety**: Never hardcode secrets
- **Test-First**: Always write tests before implementation
- **Clean Architecture**: Separate concerns
- **Parallel Documentation**: Maintain clear, up-to-date documentation

### Important Notes
- Always run tests before committing (`npm run test --parallel`)
- Use SPARC memory system to maintain context across sessions
- Follow the Red-Green-Refactor cycle during TDD phases
- Document architectural decisions in memory
- Regular security reviews for authentication or data handling code

## 🚀 CRITICAL: Claude Code Does ALL Real Work

### 🎯 CLAUDE CODE IS THE ONLY EXECUTOR

**ABSOLUTE RULE**: Claude Code performs ALL actual work:

### ✅ Claude Code ALWAYS Handles:
- 🔧 **ALL file operations** (Read, Write, Edit, MultiEdit, Glob, Grep)
- 💻 **ALL code generation** and programming tasks
- 🖥️ **ALL bash commands** and system operations
- 🏗️ **ALL actual implementation** work
- 📝 **ALL TodoWrite** and task management
- 🔄 **ALL git operations** (commit, push, merge)

### 🧠 Claude Flow MCP Tools ONLY Handle:
- 🎯 **Coordination only** - Planning Claude Code's actions
- 💾 **Memory management** - Storing decisions and context
- 📊 **Performance tracking** - Monitoring Claude Code's efficiency
- 🐝 **Swarm orchestration** - Coordinating multiple Claude Code instances

**⚠️ Key Principle**: MCP tools coordinate, Claude Code executes.

## Available Agents (54 Total)

### 🚀 Concurrent Agent Usage
Always spawn multiple agents concurrently using the Task tool in a single message.

### 📋 Agent Categories

#### **Core Development Agents**
- `coder` - Implementation specialist
- `reviewer` - Code quality assurance  
- `tester` - Test creation and validation
- `planner` - Strategic planning
- `researcher` - Information gathering

#### **Swarm Coordination Agents**
- `hierarchical-coordinator` - Queen-led coordination
- `mesh-coordinator` - Peer-to-peer networks
- `adaptive-coordinator` - Dynamic topology
- `collective-intelligence-coordinator` - Hive-mind intelligence
- `swarm-memory-manager` - Distributed memory

#### **Consensus & Distributed Systems**
- `byzantine-coordinator` - Byzantine fault tolerance
- `raft-manager` - Leader election protocols
- `gossip-coordinator` - Epidemic dissemination
- `consensus-builder` - Decision-making algorithms
- `crdt-synchronizer` - Conflict-free replication
- `security-manager` - Cryptographic security

#### **Performance & Optimization**
- `perf-analyzer` - Bottleneck identification
- `performance-benchmarker` - Performance testing
- `task-orchestrator` - Workflow optimization
- `memory-coordinator` - Memory management

#### **GitHub & Repository Management**
- `github-modes` - Comprehensive GitHub integration
- `pr-manager` - Pull request management
- `code-review-swarm` - Multi-agent code review
- `issue-tracker` - Issue management
- `release-manager` - Release coordination
- `workflow-automation` - CI/CD automation

#### **SPARC Methodology Agents**
- `sparc-coord` - SPARC orchestration
- `sparc-coder` - TDD implementation
- `specification` - Requirements analysis
- `pseudocode` - Algorithm design
- `architecture` - System design
- `refinement` - Iterative improvement

#### **Specialized Development**
- `backend-dev` - API development
- `mobile-dev` - React Native development
- `ml-developer` - Machine learning
- `cicd-engineer` - CI/CD pipelines
- `api-docs` - OpenAPI documentation
- `system-architect` - High-level design

## 🚀 Quick Setup (Stdio MCP)

### 1. Add MCP Server
```bash
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### 2. Use MCP Tools for Coordination
**Initialize a swarm:**
- Use `mcp__claude-flow__swarm_init` tool to set up coordination topology
- Choose: mesh, hierarchical, ring, or star

**Spawn agents:**
- Use `mcp__claude-flow__agent_spawn` tool to create specialized coordinators
- Agent types represent different thinking patterns

**Orchestrate tasks:**
- Use `mcp__claude-flow__task_orchestrate` tool to coordinate complex workflows

## Available MCP Tools for Coordination

### Coordination Tools:
- `mcp__claude-flow__swarm_init` - Set up coordination topology
- `mcp__claude-flow__agent_spawn` - Create cognitive patterns
- `mcp__claude-flow__task_orchestrate` - Break down and coordinate tasks

### Monitoring Tools:
- `mcp__claude-flow__swarm_status` - Monitor coordination effectiveness
- `mcp__claude-flow__agent_list` - View active cognitive patterns
- `mcp__claude-flow__task_status` - Check workflow progress

### Memory & Neural Tools:
- `mcp__claude-flow__memory_usage` - Persistent memory across sessions
- `mcp__claude-flow__neural_status` - Neural pattern effectiveness
- `mcp__claude-flow__neural_train` - Improve coordination patterns

### GitHub Integration Tools:
- `mcp__claude-flow__github_swarm` - Create specialized GitHub management swarms
- `mcp__claude-flow__repo_analyze` - Deep repository analysis
- `mcp__claude-flow__pr_enhance` - AI-powered pull request improvements

## 🧠 SWARM ORCHESTRATION PATTERN

### 📋 MANDATORY AGENT COORDINATION PROTOCOL

When you spawn an agent using the Task tool, that agent MUST:

**1️⃣ BEFORE Starting Work:**
```bash
npx claude-flow@alpha hooks pre-task --description "[agent task]"
npx claude-flow@alpha hooks session-restore --session-id "swarm-[id]"
```

**2️⃣ DURING Work (After EVERY Major Step):**
```bash
npx claude-flow@alpha hooks post-edit --file "[filepath]" --memory-key "swarm/[agent]/[step]"
npx claude-flow@alpha hooks notify --message "[what was done]" --telemetry true
```

**3️⃣ AFTER Completing Work:**
```bash
npx claude-flow@alpha hooks post-task --task-id "[task]" --analyze-performance true
npx claude-flow@alpha hooks session-end --export-metrics true
```

### 🎯 AGENT PROMPT TEMPLATE
When spawning agents, ALWAYS include coordination instructions:

```
You are the [Agent Type] agent in a coordinated swarm.

MANDATORY COORDINATION:
1. START: Run hooks pre-task
2. DURING: After EVERY file operation, run hooks post-edit
3. MEMORY: Store ALL decisions using hooks notify
4. END: Run hooks post-task

Your specific task: [detailed task description]

REMEMBER: Coordinate with other agents by checking memory BEFORE making decisions!
```

### ⚡ PARALLEL EXECUTION IS MANDATORY

**✅ CORRECT (Parallel - ALWAYS DO THIS):**
```
Message 1: [BatchTool]
  // MCP coordination setup
  - mcp__claude-flow__swarm_init
  - mcp__claude-flow__agent_spawn (researcher)
  - mcp__claude-flow__agent_spawn (coder)
  - mcp__claude-flow__agent_spawn (analyst)

Message 2: [BatchTool - Claude Code execution]
  // Task agents with coordination instructions
  - Task("You are researcher agent. MANDATORY: Run hooks. Task: Research API patterns")
  - Task("You are coder agent. MANDATORY: Run hooks. Task: Implement endpoints")
  
  // TodoWrite with ALL todos batched
  - TodoWrite { todos: [5-10 todos with all priorities and statuses] }
  
  // File operations in parallel
  - Write "api/package.json"
  - Write "api/server.js"
  - Bash "mkdir -p api/{routes,models,tests}"
```

## 📝 CRITICAL: TODOWRITE AND TASK TOOL BATCHING

### 🚨 MANDATORY BATCHING RULES

**TodoWrite Tool Requirements:**
1. **ALWAYS** include 5-10+ todos in a SINGLE TodoWrite call
2. **NEVER** call TodoWrite multiple times in sequence
3. **BATCH** all todo updates together

**Task Tool Requirements:**
1. **SPAWN** all agents using Task tool in ONE message
2. **INCLUDE** full task descriptions and coordination instructions
3. **BATCH** related Task calls together for parallel execution

## Performance Benefits

When using Claude Flow coordination with Claude Code:
- **84.8% SWE-Bench solve rate** - Better problem-solving through coordination
- **32.3% token reduction** - Efficient task breakdown reduces redundancy
- **2.8-4.4x speed improvement** - Parallel coordination strategies

## Claude Code Hooks Integration

### Pre-Operation Hooks
- Auto-assign agents before file edits based on file type
- Validate commands before execution for safety
- Optimize topology based on task complexity analysis

### Post-Operation Hooks
- Auto-format code using language-specific formatters
- Train neural patterns from successful operations
- Update memory with operation context

### Advanced Features
- **🚀 Automatic Topology Selection** - Optimal swarm structure for each task
- **⚡ Parallel Execution** - 2.8-4.4x speed improvements
- **🧠 Neural Training** - Continuous learning from operations
- **🔗 GitHub Integration** - Repository-aware swarms

## Best Practices for Coordination

### ✅ DO:
- Use MCP tools to coordinate Claude Code's approach to complex tasks
- Let the swarm break down problems into manageable pieces
- Use memory tools to maintain context across sessions
- Monitor coordination effectiveness with status tools

### ❌ DON'T:
- Expect agents to write code (Claude Code does all implementation)
- Use MCP tools for file operations (use Claude Code's native tools)
- Try to make agents execute bash commands (Claude Code handles this)

## Integration Tips

1. **Start Simple**: Begin with basic swarm init and single agent
2. **Scale Gradually**: Add more agents as task complexity increases
3. **Use Memory**: Store important decisions and context
4. **Monitor Progress**: Regular status checks ensure effective coordination
5. **Enable Hooks**: Use the pre-configured hooks for automation

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Examples: https://github.com/ruvnet/claude-flow/tree/main/examples

---

Remember: **Claude Flow coordinates, Claude Code creates!** Start with `mcp__claude-flow__swarm_init` to enhance your development workflow.