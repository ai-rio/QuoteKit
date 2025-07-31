# Claude Code Configuration - Solo Developer Edition

## 🚀 CRITICAL: Personal Productivity Parallel Execution

**MANDATORY RULE**: As a solo developer, ALL development activities MUST be self-coordinated and efficient:

1. **Project Planning** → Initialize personal productivity swarm in ONE call
2. **Feature Development** → Batch ALL related tasks together  
3. **Testing & QA** → Parallel execution of all quality checks
4. **Deployment** → Batch ALL release activities together

### ⚡ SOLO DEVELOPER GOLDEN RULE: "1 MESSAGE = COMPLETE FEATURE"

**✅ CORRECT: Full-stack feature development in parallel**
```javascript
[Single Message - Solo Development]:
  - TodoWrite { todos: [5-8 focused todos with priorities] }
  - Task("Full-Stack Developer: Implement authentication feature end-to-end")
  - Task("QA Self: Write comprehensive tests for auth feature")
  - Read("existing-files"), Write("new-components"), Edit("config-files")
  - Bash("npm install"), Bash("npm test"), Bash("npm run build")
```

**❌ WRONG: Fragmented solo development**
```javascript
Message 1: Plan frontend
Message 2: Plan backend  
Message 3: Plan tests
// This breaks focus and wastes solo developer time!
```

### 🎯 SOLO DEVELOPER EFFICIENCY CHECKLIST:
Before ANY coding session:
- ✅ Is the entire feature scope planned in ONE message?
- ✅ Are frontend, backend, and tests coordinated together?
- ✅ Is learning/research integrated with implementation?
- ✅ Are deployment considerations included from the start?

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

## 👤 SOLO DEVELOPER EXECUTION MODEL

### 🎯 YOU ARE THE ENTIRE DEVELOPMENT TEAM

**SOLO PRINCIPLE**: As a solo developer, you handle ALL aspects of development:

### ✅ Your Responsibilities:
- 🔧 **Frontend & Backend** - Full-stack implementation
- 💻 **Code & Tests** - Quality assurance is your job
- 🖥️ **DevOps & Deployment** - From code to production
- 🏗️ **Architecture & Design** - Technical decisions are yours
- 📝 **Documentation & Planning** - Future you will thank present you
- 🔄 **Maintenance & Updates** - Long-term sustainability

### 🧠 Claude Flow MCP Tools Help You:
- 🎯 **Self-coordination** - Breaking down complex tasks
- 💾 **Personal knowledge base** - Remember decisions and learnings
- 📊 **Productivity tracking** - Measure your efficiency
- 🐝 **Focus management** - Stay organized and on-track

**⚠️ Solo Developer Principle**: Tools support you, but you create everything.

## Personal Productivity Agents (4 Core Roles)

### 🚀 Solo Developer Agent Usage
Spawn 3-4 focused agents that represent different aspects of your development role.

### 👤 Your Development Personas

#### **Core Solo Developer Agents**
- `planner` - Project Manager Self (scope, timeline, priorities)
- `coder` - Full-Stack Developer (frontend, backend, integration) 
- `tester` - QA Self (testing, validation, quality assurance)
- `researcher` - Tech Lead Self (architecture, tech decisions, learning)

#### **Optional Specialized Agents** (use when needed)
- `backend-dev` - For complex API development
- `mobile-dev` - For React Native projects  
- `system-architect` - For complex architecture decisions
- `cicd-engineer` - For deployment automation
- `reviewer` - For code quality reviews

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

## Solo Developer Benefits

When using Claude Flow for solo development:
- **Complete feature ownership** - End-to-end implementation control
- **Rapid MVP development** - Focus on shipping over perfection
- **Integrated learning** - Continuous skill development while building
- **Personal productivity** - Time management and focus optimization
- **Quality balance** - Maintainable code without over-engineering

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

## Solo Developer Best Practices

### ✅ DO:
- **Start Small**: Begin with MVP and iterate based on feedback
- **Document Everything**: Maintain clear documentation for future you
- **Automate Repetitive Tasks**: Use scripts and tools to reduce manual work
- **Time Boxing**: Use focused time blocks (Pomodoro) for different work types
- **Learning Integration**: Incorporate new technologies gradually while building
- **Testing Early**: Write tests as you develop, not after
- **Regular Backups**: Implement version control and backup strategies

### ❌ DON'T:
- Don't over-engineer solutions - keep it simple and working
- Avoid perfectionism paralysis - ship and iterate
- Don't skip version control or proper git practices
- Never work without backups and deployment safety nets
- Don't ignore security basics even in personal projects
- Avoid feature creep - stick to your defined scope

## Solo Developer Workflow Tips

1. **Daily Routine**: Start each coding session with clear goals and time limits
2. **Feature-Complete Focus**: Implement entire features (frontend + backend + tests) together
3. **Personal Memory System**: Store decisions, learnings, and architectural choices
4. **Progress Tracking**: Use hooks to monitor your productivity and learning
5. **MVP Mindset**: Ship working solutions, then iterate and improve
6. **Learning Integration**: Document new technologies and patterns as you discover them

## Support

- Documentation: https://github.com/ruvnet/claude-flow
- Issues: https://github.com/ruvnet/claude-flow/issues
- Examples: https://github.com/ruvnet/claude-flow/tree/main/examples

---

## 🎯 Solo Developer Quick Start

### Personal Project Initialization (Single Message)
```javascript
[Solo Developer Project Setup]:
  // Initialize personal productivity swarm
  - mcp__claude-flow__swarm_init { 
      topology: "star", 
      maxAgents: 4, 
      strategy: "solo_developer" 
    }
  
  // Spawn productivity-focused agents
  - mcp__claude-flow__agent_spawn { type: "coordinator", name: "Project Manager Self" }
  - mcp__claude-flow__agent_spawn { type: "coder", name: "Full-Stack Developer" }
  - mcp__claude-flow__agent_spawn { type: "tester", name: "QA Self" }
  - mcp__claude-flow__agent_spawn { type: "analyst", name: "Tech Lead Self" }

  // Solo developer todos - ALL project aspects at once
  - TodoWrite { todos: [
      { id: "project-planning", content: "Define project scope and MVP features", status: "completed", priority: "high" },
      { id: "tech-stack", content: "Choose technology stack and architecture", status: "in_progress", priority: "high" },
      { id: "development-setup", content: "Set up development environment and tools", status: "pending", priority: "high" },
      { id: "frontend-development", content: "Build user interface and components", status: "pending", priority: "high" },
      { id: "backend-development", content: "Implement API and business logic", status: "pending", priority: "high" },
      { id: "testing-suite", content: "Write comprehensive tests", status: "pending", priority: "medium" },
      { id: "deployment-setup", content: "Configure deployment and hosting", status: "pending", priority: "medium" },
      { id: "documentation", content: "Create project documentation", status: "pending", priority: "low" }
    ]}

  // Initialize solo developer memory context
  - mcp__claude-flow__memory_usage { 
      action: "store", 
      key: "solo/project_context", 
      value: { 
        developer: "solo",
        project_type: "full_stack_web_app",
        time_commitment: "evenings_weekends",
        tech_stack: "react_node_postgres",
        deployment_target: "vercel_heroku"
      } 
    }
```

### 💻 Time Management Integration

```bash
# Daily development check-in (run each coding session)
npx claude-flow@alpha hooks pre-task --description "Daily coding session start" --auto-spawn-agents false
npx claude-flow@alpha hooks notification --message "Today's focus: [feature], Time: [hours], Goals: [targets]" --telemetry true

# Pomodoro session coordination
npx claude-flow@alpha hooks pre-task --description "Pomodoro session: [specific task]"
# ... 25 minutes of focused coding ...
npx claude-flow@alpha hooks post-task --task-id "pomodoro_session" --analyze-performance true
```

---

**Remember**: You are the entire development team! Claude Flow helps you coordinate all aspects of development efficiently while maintaining focus and productivity.