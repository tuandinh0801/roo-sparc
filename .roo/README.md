# Roo Modes and MCP Integration Guide

## Overview

This guide provides information about the various modes available in Roo and detailed documentation on the Model Context Protocol (MCP) integration capabilities.

Create by @ruvnet

## Available Modes

Roo offers specialized modes for different aspects of the development process:

### 📋 Specification Writer
- **Role**: Captures project context, functional requirements, edge cases, and constraints
- **Focus**: Translates requirements into modular pseudocode with TDD anchors
- **Best For**: Initial project planning and requirement gathering

### 🏗️ Architect
- **Role**: Designs scalable, secure, and modular architectures
- **Focus**: Creates architecture diagrams, data flows, and integration points
- **Best For**: System design and component relationships

### 🧠 Auto-Coder
- **Role**: Writes clean, efficient, modular code based on pseudocode and architecture
- **Focus**: Implements features with proper configuration and environment abstraction
- **Best For**: Feature implementation and code generation

### 🧪 Tester (TDD)
- **Role**: Implements Test-Driven Development (TDD, London School)
- **Focus**: Writes failing tests first, implements minimal code to pass, then refactors
- **Best For**: Ensuring code quality and test coverage

### 🪲 Debugger
- **Role**: Troubleshoots runtime bugs, logic errors, or integration failures
- **Focus**: Uses logs, traces, and stack analysis to isolate and fix bugs
- **Best For**: Resolving issues in existing code

### 🛡️ Security Reviewer
- **Role**: Performs static and dynamic audits to ensure secure code practices
- **Focus**: Flags secrets, poor modular boundaries, and oversized files
- **Best For**: Security audits and vulnerability assessments

### 📚 Documentation Writer
- **Role**: Writes concise, clear, and modular Markdown documentation
- **Focus**: Creates documentation that explains usage, integration, setup, and configuration
- **Best For**: Creating user guides and technical documentation

### 🔗 System Integrator
- **Role**: Merges outputs of all modes into a working, tested, production-ready system
- **Focus**: Verifies interface compatibility, shared modules, and configuration standards
- **Best For**: Combining components into a cohesive system

### 📈 Deployment Monitor
- **Role**: Observes the system post-launch, collecting performance data and user feedback
- **Focus**: Configures metrics, logs, uptime checks, and alerts
- **Best For**: Post-deployment observation and issue detection

### 🧹 Optimizer
- **Role**: Refactors, modularizes, and improves system performance
- **Focus**: Audits files for clarity, modularity, and size
- **Best For**: Code refinement and performance optimization

### 🚀 DevOps
- **Role**: Handles deployment, automation, and infrastructure operations
- **Focus**: Provisions infrastructure, configures environments, and sets up CI/CD pipelines
- **Best For**: Deployment and infrastructure management

### 🔐 Supabase Admin
- **Role**: Designs and implements database schemas, RLS policies, triggers, and functions
- **Focus**: Ensures secure, efficient, and scalable data management with Supabase
- **Best For**: Database management and Supabase integration

### ♾️ MCP Integration
- **Role**: Connects to and manages external services through MCP interfaces
- **Focus**: Ensures secure, efficient, and reliable communication with external APIs
- **Best For**: Integrating with third-party services

### ⚡️ SPARC Orchestrator
- **Role**: Orchestrates complex workflows by breaking down objectives into subtasks
- **Focus**: Ensures secure, modular, testable, and maintainable delivery
- **Best For**: Managing complex projects with multiple components

### ❓ Ask
- **Role**: Helps users navigate, ask, and delegate tasks to the correct modes
- **Focus**: Guides users to formulate questions using the SPARC methodology
- **Best For**: Getting started and understanding how to use Roo effectively

## MCP Integration Mode

The MCP Integration Mode (♾️) in Roo is designed specifically for connecting to and managing external services through MCP interfaces. This mode ensures secure, efficient, and reliable communication between your application and external service APIs.

### Key Features

- Establish connections to MCP servers and verify availability
- Configure and validate authentication for service access
- Implement data transformation and exchange between systems
- Robust error handling and retry mechanisms
- Documentation of integration points, dependencies, and usage patterns

### MCP Integration Workflow

| Phase | Action | Tool Preference |
|-------|--------|-----------------|
| 1. Connection | Establish connection to MCP servers and verify availability | `use_mcp_tool` for server operations |
| 2. Authentication | Configure and validate authentication for service access | `use_mcp_tool` with proper credentials |
| 3. Data Exchange | Implement data transformation and exchange between systems | `use_mcp_tool` for operations, `apply_diff` for code |
| 4. Error Handling | Implement robust error handling and retry mechanisms | `apply_diff` for code modifications |
| 5. Documentation | Document integration points, dependencies, and usage patterns | `insert_content` for documentation |

### Non-Negotiable Requirements

- ✅ ALWAYS verify MCP server availability before operations
- ✅ NEVER store credentials or tokens in code
- ✅ ALWAYS implement proper error handling for all API calls
- ✅ ALWAYS validate inputs and outputs for all operations
- ✅ NEVER use hardcoded environment variables
- ✅ ALWAYS document all integration points and dependencies
- ✅ ALWAYS use proper parameter validation before tool execution
- ✅ ALWAYS include complete parameters for MCP tool operations

## Best Practices

1. Always initiate a connection before attempting to use any MCP tools
2. Implement retry mechanisms with exponential backoff for transient failures
3. Use circuit breakers to prevent cascading failures
4. Implement request batching to optimize API usage
5. Use proper logging for all API operations
6. Implement data validation for all incoming and outgoing data
7. Use proper error codes and messages for API responses
8. Implement proper timeout handling for all API calls
9. Use proper versioning for API integrations
10. Implement proper rate limiting to prevent API abuse
11. Use proper caching strategies to reduce API calls