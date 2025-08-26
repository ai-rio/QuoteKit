#!/usr/bin/env node

/**
 * Blueprint Migration Progress Tracker - Task M1.2
 * 
 * Comprehensive progress tracking and logging utilities for QuoteKit Blueprint migration
 * Provides detailed progress monitoring, performance metrics, and status reporting
 * Following established logging patterns from the existing codebase
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

class ProgressTracker extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.sessionId = `migration-${Date.now()}`;
    this.startTime = Date.now();
    this.logDir = path.join(__dirname, 'logs');
    this.progressFile = path.join(this.logDir, `${this.sessionId}-progress.json`);
    this.logFile = path.join(this.logDir, `${this.sessionId}.log`);
    this.metricsFile = path.join(this.logDir, `${this.sessionId}-metrics.json`);
    
    // Configuration
    this.config = {
      logLevel: options.logLevel || 'INFO',
      updateInterval: options.updateInterval || 1000, // 1 second
      enableMetrics: options.enableMetrics !== false,
      enableConsole: options.enableConsole !== false,
      maxLogSize: options.maxLogSize || 50 * 1024 * 1024, // 50MB
      ...options
    };

    // State tracking
    this.progress = {
      sessionId: this.sessionId,
      startTime: new Date().toISOString(),
      currentPhase: 'initialization',
      phases: {},
      overallProgress: 0,
      estimatedCompletion: null,
      status: 'running',
      errors: [],
      warnings: [],
      metrics: {}
    };

    // Performance metrics
    this.metrics = {
      operationsCount: 0,
      dataProcessed: 0,
      recordsProcessed: 0,
      errorCount: 0,
      warningCount: 0,
      phaseTimings: {},
      memoryUsage: [],
      performanceMarkers: []
    };

    // Ensure log directory exists
    this.ensureLogDirectory();
    
    // Initialize progress tracking
    this.initializeProgress();
    
    // Set up periodic updates
    if (this.config.updateInterval > 0) {
      this.updateInterval = setInterval(() => {
        this.updateMetrics();
        this.saveProgress();
      }, this.config.updateInterval);
    }

    // Handle cleanup on process exit
    process.on('exit', () => this.cleanup());
    process.on('SIGINT', () => {
      this.cleanup();
      process.exit(0);
    });
    process.on('uncaughtException', (error) => {
      this.logError(`Uncaught exception: ${error.message}`, error);
      this.cleanup();
      throw error;
    });
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Initialize progress tracking
   */
  initializeProgress() {
    this.log('Progress tracker initialized', 'INFO');
    this.saveProgress();
    this.emit('initialized', this.progress);
  }

  /**
   * Enhanced logging with multiple output targets
   */
  log(message, level = 'INFO', metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      sessionId: this.sessionId,
      phase: this.progress.currentPhase,
      ...metadata
    };

    // Console output
    if (this.config.enableConsole) {
      const consoleMessage = `[${timestamp}] [${level}] [${this.progress.currentPhase}] ${message}`;
      
      switch (level) {
        case 'ERROR':
          console.error(consoleMessage);
          break;
        case 'WARNING':
          console.warn(consoleMessage);
          break;
        case 'SUCCESS':
          console.log(`✅ ${consoleMessage}`);
          break;
        case 'PROGRESS':
          console.log(`📊 ${consoleMessage}`);
          break;
        default:
          console.log(consoleMessage);
      }
    }

    // File output
    this.writeToLogFile(logEntry);

    // Update counters
    if (level === 'ERROR') {
      this.metrics.errorCount++;
      this.progress.errors.push({ timestamp, message, metadata });
    } else if (level === 'WARNING') {
      this.metrics.warningCount++;
      this.progress.warnings.push({ timestamp, message, metadata });
    }

    // Emit event
    this.emit('log', logEntry);
  }

  /**
   * Write log entry to file
   */
  writeToLogFile(logEntry) {
    try {
      const logLine = JSON.stringify(logEntry) + '\n';
      
      // Check file size and rotate if necessary
      if (fs.existsSync(this.logFile)) {
        const stats = fs.statSync(this.logFile);
        if (stats.size > this.config.maxLogSize) {
          this.rotateLogFile();
        }
      }
      
      fs.appendFileSync(this.logFile, logLine);
    } catch (error) {
      console.error(`Failed to write to log file: ${error.message}`);
    }
  }

  /**
   * Rotate log file when it gets too large
   */
  rotateLogFile() {
    try {
      const rotatedFile = `${this.logFile}.${Date.now()}`;
      fs.renameSync(this.logFile, rotatedFile);
      this.log(`Log file rotated to ${rotatedFile}`, 'INFO');
    } catch (error) {
      console.error(`Failed to rotate log file: ${error.message}`);
    }
  }

  /**
   * Start tracking a new phase
   */
  startPhase(phaseName, options = {}) {
    const phase = {
      name: phaseName,
      startTime: new Date().toISOString(),
      startTimestamp: Date.now(),
      estimatedDuration: options.estimatedDuration,
      totalSteps: options.totalSteps || 0,
      currentStep: 0,
      status: 'running',
      progress: 0,
      operations: [],
      metrics: {
        recordsProcessed: 0,
        dataProcessed: 0,
        operationsCount: 0
      }
    };

    this.progress.phases[phaseName] = phase;
    this.progress.currentPhase = phaseName;
    this.metrics.phaseTimings[phaseName] = { start: Date.now() };

    this.log(`Starting phase: ${phaseName}`, 'PROGRESS', {
      estimatedDuration: options.estimatedDuration,
      totalSteps: options.totalSteps
    });

    this.emit('phaseStarted', phase);
    return phase;
  }

  /**
   * Update progress for current phase
   */
  updatePhaseProgress(completed, total, message = '') {
    const currentPhase = this.progress.phases[this.progress.currentPhase];
    if (!currentPhase) {
      this.log('No active phase to update progress', 'WARNING');
      return;
    }

    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    currentPhase.currentStep = completed;
    currentPhase.totalSteps = total;
    currentPhase.progress = progress;

    if (message) {
      currentPhase.lastMessage = message;
    }

    // Calculate estimated completion
    if (progress > 0 && currentPhase.estimatedDuration) {
      const elapsed = Date.now() - currentPhase.startTimestamp;
      const estimatedTotal = (elapsed / progress) * 100;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      currentPhase.estimatedCompletion = new Date(Date.now() + remaining).toISOString();
    }

    // Update overall progress
    this.calculateOverallProgress();

    // Progress bar visualization
    const progressBar = this.generateProgressBar(progress, 30);
    const progressMessage = `${progressBar} ${progress}% - ${currentPhase.name}${message ? ': ' + message : ''} (${completed}/${total})`;
    
    this.log(progressMessage, 'PROGRESS');
    this.emit('progressUpdated', { phase: currentPhase, progress, completed, total });
  }

  /**
   * Generate ASCII progress bar
   */
  generateProgressBar(percentage, width = 30) {
    const filled = Math.floor((percentage / 100) * width);
    const empty = width - filled;
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  }

  /**
   * Complete current phase
   */
  completePhase(success = true, summary = {}) {
    const currentPhase = this.progress.phases[this.progress.currentPhase];
    if (!currentPhase) {
      this.log('No active phase to complete', 'WARNING');
      return;
    }

    currentPhase.endTime = new Date().toISOString();
    currentPhase.endTimestamp = Date.now();
    currentPhase.duration = currentPhase.endTimestamp - currentPhase.startTimestamp;
    currentPhase.status = success ? 'completed' : 'failed';
    currentPhase.progress = success ? 100 : currentPhase.progress;
    currentPhase.summary = summary;

    // Record timing
    this.metrics.phaseTimings[currentPhase.name].end = Date.now();
    this.metrics.phaseTimings[currentPhase.name].duration = currentPhase.duration;

    const statusIcon = success ? '✅' : '❌';
    const durationText = this.formatDuration(currentPhase.duration);
    
    this.log(`${statusIcon} Phase completed: ${currentPhase.name} (${durationText})`, 
      success ? 'SUCCESS' : 'ERROR', {
        duration: currentPhase.duration,
        summary
      });

    this.calculateOverallProgress();
    this.emit('phaseCompleted', currentPhase);
  }

  /**
   * Track operation within current phase
   */
  trackOperation(operation, data = {}) {
    const currentPhase = this.progress.phases[this.progress.currentPhase];
    if (currentPhase) {
      currentPhase.operations.push({
        timestamp: new Date().toISOString(),
        operation,
        ...data
      });
      
      // Update metrics
      currentPhase.metrics.operationsCount++;
      if (data.recordsProcessed) {
        currentPhase.metrics.recordsProcessed += data.recordsProcessed;
      }
      if (data.dataProcessed) {
        currentPhase.metrics.dataProcessed += data.dataProcessed;
      }
    }

    // Update global metrics
    this.metrics.operationsCount++;
    if (data.recordsProcessed) {
      this.metrics.recordsProcessed += data.recordsProcessed;
    }
    if (data.dataProcessed) {
      this.metrics.dataProcessed += data.dataProcessed;
    }

    this.emit('operationTracked', { operation, data });
  }

  /**
   * Add performance marker
   */
  markPerformance(marker, metadata = {}) {
    const performanceMarker = {
      timestamp: new Date().toISOString(),
      timestampMs: Date.now(),
      marker,
      phase: this.progress.currentPhase,
      memoryUsage: process.memoryUsage(),
      ...metadata
    };

    this.metrics.performanceMarkers.push(performanceMarker);
    
    this.log(`Performance marker: ${marker}`, 'PROGRESS', performanceMarker);
    this.emit('performanceMarked', performanceMarker);
  }

  /**
   * Calculate overall progress across all phases
   */
  calculateOverallProgress() {
    const phases = Object.values(this.progress.phases);
    if (phases.length === 0) {
      this.progress.overallProgress = 0;
      return;
    }

    const totalProgress = phases.reduce((sum, phase) => sum + phase.progress, 0);
    this.progress.overallProgress = Math.round(totalProgress / phases.length);

    // Calculate estimated completion for overall migration
    const runningPhases = phases.filter(p => p.status === 'running');
    if (runningPhases.length > 0) {
      const estimatedCompletions = runningPhases
        .map(p => p.estimatedCompletion)
        .filter(e => e)
        .map(e => new Date(e).getTime());
      
      if (estimatedCompletions.length > 0) {
        const latestCompletion = Math.max(...estimatedCompletions);
        this.progress.estimatedCompletion = new Date(latestCompletion).toISOString();
      }
    }
  }

  /**
   * Update performance metrics
   */
  updateMetrics() {
    if (!this.config.enableMetrics) return;

    const memoryUsage = process.memoryUsage();
    this.metrics.memoryUsage.push({
      timestamp: new Date().toISOString(),
      ...memoryUsage
    });

    // Keep only last 100 memory readings
    if (this.metrics.memoryUsage.length > 100) {
      this.metrics.memoryUsage = this.metrics.memoryUsage.slice(-100);
    }

    // Update progress metrics
    this.progress.metrics = {
      ...this.metrics,
      currentMemoryUsage: memoryUsage,
      uptime: Date.now() - this.startTime
    };
  }

  /**
   * Save progress to file
   */
  saveProgress() {
    try {
      fs.writeFileSync(this.progressFile, JSON.stringify(this.progress, null, 2));
    } catch (error) {
      console.error(`Failed to save progress: ${error.message}`);
    }
  }

  /**
   * Save detailed metrics
   */
  saveMetrics() {
    try {
      const metricsReport = {
        sessionId: this.sessionId,
        generatedAt: new Date().toISOString(),
        duration: Date.now() - this.startTime,
        ...this.metrics,
        phases: this.progress.phases
      };
      
      fs.writeFileSync(this.metricsFile, JSON.stringify(metricsReport, null, 2));
    } catch (error) {
      console.error(`Failed to save metrics: ${error.message}`);
    }
  }

  /**
   * Format duration in human-readable format
   */
  formatDuration(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  /**
   * Generate comprehensive status report
   */
  generateStatusReport() {
    const totalDuration = Date.now() - this.startTime;
    const phases = Object.values(this.progress.phases);
    
    const report = {
      session: {
        id: this.sessionId,
        startTime: this.progress.startTime,
        duration: this.formatDuration(totalDuration),
        status: this.progress.status
      },
      progress: {
        overall: `${this.progress.overallProgress}%`,
        estimatedCompletion: this.progress.estimatedCompletion,
        phases: phases.map(phase => ({
          name: phase.name,
          status: phase.status,
          progress: `${phase.progress}%`,
          duration: phase.duration ? this.formatDuration(phase.duration) : 'In progress'
        }))
      },
      metrics: {
        operationsCount: this.metrics.operationsCount,
        recordsProcessed: this.metrics.recordsProcessed,
        errorCount: this.metrics.errorCount,
        warningCount: this.metrics.warningCount,
        memoryUsage: this.progress.metrics.currentMemoryUsage
      },
      files: {
        progressFile: this.progressFile,
        logFile: this.logFile,
        metricsFile: this.metricsFile
      }
    };

    return report;
  }

  /**
   * Log error with stack trace
   */
  logError(message, error, metadata = {}) {
    const errorData = {
      message: error?.message || message,
      stack: error?.stack,
      ...metadata
    };
    
    this.log(message, 'ERROR', errorData);
    
    // Also emit error event
    this.emit('error', { message, error, metadata: errorData });
  }

  /**
   * Complete migration and finalize tracking
   */
  completeMigration(success = true, summary = {}) {
    // Complete current phase if any
    if (this.progress.currentPhase && this.progress.phases[this.progress.currentPhase]?.status === 'running') {
      this.completePhase(success, summary);
    }

    this.progress.status = success ? 'completed' : 'failed';
    this.progress.endTime = new Date().toISOString();
    this.progress.totalDuration = Date.now() - this.startTime;
    this.progress.summary = summary;

    // Generate final report
    const report = this.generateStatusReport();
    
    this.log('='.repeat(60), 'INFO');
    this.log(`Migration ${success ? 'COMPLETED' : 'FAILED'}`, success ? 'SUCCESS' : 'ERROR');
    this.log(`Total Duration: ${this.formatDuration(this.progress.totalDuration)}`, 'INFO');
    this.log(`Operations: ${this.metrics.operationsCount}`, 'INFO');
    this.log(`Records Processed: ${this.metrics.recordsProcessed}`, 'INFO');
    this.log(`Errors: ${this.metrics.errorCount}`, 'INFO');
    this.log(`Warnings: ${this.metrics.warningCount}`, 'INFO');
    this.log('='.repeat(60), 'INFO');

    // Save final state
    this.saveProgress();
    this.saveMetrics();

    this.emit('migrationCompleted', { success, report, summary });
    
    return report;
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    // Save final state
    this.saveProgress();
    this.saveMetrics();
    
    this.log('Progress tracker cleanup completed', 'INFO');
  }

  // Convenience methods for common logging patterns
  logInfo(message, metadata = {}) {
    this.log(message, 'INFO', metadata);
  }

  logWarning(message, metadata = {}) {
    this.log(message, 'WARNING', metadata);
  }

  logSuccess(message, metadata = {}) {
    this.log(message, 'SUCCESS', metadata);
  }

  logProgress(message, metadata = {}) {
    this.log(message, 'PROGRESS', metadata);
  }
}

// Export for use as module
module.exports = { ProgressTracker };

// CLI interface for standalone usage
if (require.main === module) {
  console.log('Progress Tracker utility - Use as a module in your migration scripts');
  console.log('Example usage:');
  console.log(`
const { ProgressTracker } = require('./progress-tracker');

const tracker = new ProgressTracker();

tracker.startPhase('validation', { totalSteps: 100 });
// ... do work ...
tracker.updatePhaseProgress(50, 100, 'Validating clients');
// ... more work ...
tracker.completePhase(true, { validatedRecords: 100 });

tracker.completeMigration(true);
  `);
}