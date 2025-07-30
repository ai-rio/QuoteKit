# Claude Code Configuration - High-Performance SPARC Development Environment

## 🏎️ CRITICAL: Performance-First Development + Solo Developer Optimization

**MANDATORY RULES**:
1. **Profile First** → Measure before optimizing
2. **Benchmark Everything** → Track performance metrics
3. **Optimize Hotpaths** → Focus on critical code paths  
4. **Minimize Overhead** → Reduce unnecessary operations
5. **Cache Aggressively** → Leverage all performance layers
6. **Batch Everything** → ALL operations in ONE message (5-10+ todos minimum)
7. **Solo Focus** → Self-coordinated development with minimal overhead

## 🚨 CONCURRENT EXECUTION FOR ALL ACTIONS

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**✅ CORRECT Example:**
```javascript
[Single Message]:
  - TodoWrite { todos: [10+ todos with all priorities] }
  - Task("Agent 1 with full instructions")
  - Task("Agent 2 with full instructions")
  - Read("file1.js") + Read("file2.js") + Read("file3.js")
  - Write("output1.js") + Write("output2.js")
  - Bash("npm install") + Bash("npm test") + Bash("npm build")
```

**❌ WRONG Example:**
```javascript
Message 1: TodoWrite { todos: [single todo] }
Message 2: Task("Agent 1")
Message 3: Read("file1.js")
// This is 6x slower!
```

## 👤 SOLO DEVELOPER PATTERN

### Quick Solo Project Setup
```javascript
[BatchTool]:
  mcp__claude-flow__swarm_init { topology: "star", maxAgents: 4, strategy: "solo_developer" }
  mcp__claude-flow__agent_spawn { type: "coordinator", name: "Project Manager Self" }
  mcp__claude-flow__agent_spawn { type: "coder", name: "Full-Stack Developer" }
  mcp__claude-flow__agent_spawn { type: "tester", name: "QA Self" }
  
  TodoWrite { todos: [
    { id: "mvp-core", content: "Build MVP core features", status: "in_progress", priority: "high" },
    { id: "testing", content: "Add comprehensive tests", status: "pending", priority: "high" },
    { id: "deploy", content: "Setup deployment pipeline", status: "pending", priority: "medium" },
    { id: "optimize", content: "Performance optimization", status: "pending", priority: "low" }
  ]}
```

### Daily Development Workflow
```bash
# Start coding session
npx claude-flow@alpha hooks pre-task --description "Daily coding session: [focus]"

# End session with metrics
npx claude-flow@alpha hooks post-task --analyze-performance true
```

## 🚀 PERFORMANCE OPTIMIZATION

### Performance-First Swarm
```javascript
[BatchTool]:
  mcp__claude-flow__swarm_init { topology: "star", maxAgents: 6, strategy: "specialized" }
  mcp__claude-flow__agent_spawn { type: "specialist", name: "Performance Engineer" }
  mcp__claude-flow__agent_spawn { type: "optimizer", name: "Code Optimizer" }
  mcp__claude-flow__agent_spawn { type: "analyst", name: "Profiling Analyst" }
  mcp__claude-flow__agent_spawn { type: "architect", name: "Performance Architect" }
  mcp__claude-flow__agent_spawn { type: "monitor", name: "Metrics Monitor" }
  
  TodoWrite { todos: [
    {id: "profile", content: "Profile baseline performance", status: "in_progress", priority: "high"},
    {id: "hotspots", content: "Identify performance hotspots", status: "pending", priority: "high"},
    {id: "optimize-algo", content: "Optimize critical algorithms (O(n²) → O(n log n))", status: "pending", priority: "high"},
    {id: "cache-strategy", content: "Implement multi-layer caching", status: "pending", priority: "high"},
    {id: "benchmark", content: "Run performance benchmarks", status: "pending", priority: "high"},
    {id: "memory-opt", content: "Optimize memory usage", status: "pending", priority: "medium"},
    {id: "db-indexes", content: "Add database indexes", status: "pending", priority: "high"},
    {id: "monitor-setup", content: "Setup performance monitoring", status: "pending", priority: "medium"}
  ]}

  // Store performance metrics in swarm memory
  mcp__claude-flow__memory_usage {
    action: "store",
    key: "performance/baseline",
    value: {
      responseTime: { p50: 45, p95: 120, p99: 250 },
      throughput: { rps: 5000, concurrent: 100 },
      resources: { cpu: 45, memory: 512, disk: 20 }
    }
  }
```

### Agent Coordination for Profiling
```javascript
// Performance Engineer Agent
Task(`You are the Performance Engineer agent.

MANDATORY COORDINATION:
1. START: npx claude-flow@alpha hooks pre-task --description "Profiling application performance"
2. PROFILE: Run comprehensive profiling tools (Node.js profiler, DevTools)
3. STORE: npx claude-flow@alpha hooks notification --message "Profile results: [metrics]"
4. ANALYZE: Identify bottlenecks and hotspots

OPTIMIZATION TARGETS:
- Time Complexity: Reduce from O(n²) to O(n log n) or better
- Space Complexity: Minimize memory allocation
- Cache Efficiency: Improve data locality
- Parallel Processing: Utilize all CPU cores`)

// Code Optimizer Agent  
Task(`You are the Code Optimizer agent.

IMPLEMENT:
- Replace nested loops with hash maps
- Use binary search for sorted data
- Implement memoization for repeated calculations
- Add worker threads for CPU-intensive tasks
- Optimize recursive algorithms with iteration`)
```

## SPARC Development Commands

### Core Commands
- `npx claude-flow sparc tdd "<feature>"`: Complete TDD workflow
- `npx claude-flow sparc pipeline "<task>"`: Full SPARC pipeline with parallel processing
- `npx claude-flow performance profile "<component>"`: Profile for optimization
- `npx claude-flow performance benchmark "<suite>"`: Run performance benchmarks

### Build Commands  
- `npm run build`: Build project
- `npm run test`: Run tests
- `npm run lint`: Lint and format

## Code Style & Best Practices

### SPARC + Performance Principles
- **Modular Design**: Files under 500 lines
- **Test-First**: Write tests before implementation
- **Performance Focus**: Profile and optimize critical paths
- **Solo Efficiency**: Batch operations, minimize context switching

### Solo Developer Best Practices
**✅ DO:**
- Start with MVP, iterate quickly
- Document decisions for future self
- Automate repetitive tasks
- Use time-boxed development sessions

**❌ DON'T:**
- Over-engineer solutions
- Skip version control
- Work without performance monitoring
- Ignore security basics

## 🚀 Performance Optimization Checklist

### Before Deployment Checklist
1. **Profiling Complete** ✓
   - CPU profiling done
   - Memory profiling done  
   - I/O profiling done
2. **Optimizations Applied** ✓
   - Critical algorithms optimized (O(n²) → O(n log n))
   - Multi-layer caching implemented
   - Database indexed
   - Code splitting done
3. **Benchmarks Passed** ✓
   - Response time < 100ms (p95)
   - Throughput > 1000 rps
   - Memory usage stable
   - CPU usage < 70%
4. **Monitoring Setup** ✓
   - Real-time performance tracking
   - Alert thresholds configured
   - Performance logs enabled

**Remember**: Measure → Optimize → Verify → Monitor

## Important Notes

- Always batch TodoWrite calls (5-10+ todos minimum)
- Use performance hooks for session tracking  
- Follow Red-Green-Refactor with parallel test generation
- Monitor system resources during parallel operations
- Leverage Claude Flow memory for cross-session context
- Profile before optimizing (mandatory first step)

## Available Agents (Optimized for Solo Development)

**Core Development (Use 3-5 agents max):**
- `coder` - Full-stack implementation
- `tester` - Test creation and validation  
- `reviewer` - Code quality assurance
- `planner` - Strategic planning
- `performance-benchmarker` - Performance optimization

**Specialized:**
- `solo-developer` - Personal productivity coordinator
- `performance-engineer` - Optimization specialist
- `sparc-coder` - TDD implementation

### Agent Usage Pattern
```javascript
// ✅ CORRECT: Deploy focused agent team
Task("Full-stack development with performance focus", "...", "coder")
Task("Comprehensive testing strategy", "...", "tester") 
Task("Performance profiling and optimization", "...", "performance-benchmarker")
```

## Performance Benefits
- **32.3% token reduction** through efficient batching
- **2.8-4.4x speed improvement** with parallel coordination
- **84.8% task completion rate** with structured workflows

---

**Remember**: Performance First + Solo Efficiency = Maximum Productivity

Start with `mcp__claude-flow__swarm_init` for enhanced development workflow.