#!/bin/bash
set -e

# Edge Functions Development Script
# Provides convenient commands for Edge Functions development

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Supabase CLI is available
check_supabase_cli() {
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI not found. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    log_success "Supabase CLI is available"
}

# Start Supabase local development
start_supabase() {
    log_info "Starting Supabase local development environment..."
    cd "$PROJECT_ROOT"
    
    if supabase status | grep -q "supabase local development setup is running"; then
        log_warning "Supabase is already running"
    else
        supabase start
        log_success "Supabase started successfully"
    fi
}

# Stop Supabase local development
stop_supabase() {
    log_info "Stopping Supabase local development environment..."
    cd "$PROJECT_ROOT"
    supabase stop
    log_success "Supabase stopped successfully"
}

# Serve Edge Functions locally
serve_functions() {
    log_info "Starting Edge Functions local server..."
    cd "$PROJECT_ROOT"
    
    # Check if functions directory exists
    if [ ! -d "supabase/functions" ]; then
        log_error "Functions directory not found. Please run 'setup' first."
        exit 1
    fi
    
    supabase functions serve --env-file .env.local
}

# Deploy specific function
deploy_function() {
    if [ -z "$1" ]; then
        log_error "Function name required. Usage: $0 deploy <function-name>"
        exit 1
    fi
    
    local func_name="$1"
    log_info "Deploying function: $func_name"
    
    cd "$PROJECT_ROOT"
    supabase functions deploy "$func_name" --project-ref "${SUPABASE_PROJECT_ID:-UPDATE_THIS_WITH_YOUR_SUPABASE_PROJECT_ID}"
    log_success "Function $func_name deployed successfully"
}

# Deploy all functions
deploy_all() {
    log_info "Deploying all Edge Functions..."
    cd "$PROJECT_ROOT"
    
    if [ ! -d "supabase/functions" ]; then
        log_error "Functions directory not found"
        exit 1
    fi
    
    for func_dir in supabase/functions/*/; do
        if [ -d "$func_dir" ] && [ "$(basename "$func_dir")" != "_shared" ]; then
            func_name=$(basename "$func_dir")
            log_info "Deploying $func_name..."
            supabase functions deploy "$func_name" --project-ref "${SUPABASE_PROJECT_ID:-UPDATE_THIS_WITH_YOUR_SUPABASE_PROJECT_ID}"
        fi
    done
    
    log_success "All functions deployed successfully"
}

# Test function locally
test_function() {
    if [ -z "$1" ]; then
        log_error "Function name required. Usage: $0 test <function-name> [method] [data]"
        exit 1
    fi
    
    local func_name="$1"
    local method="${2:-GET}"
    local data="${3:-{}}"
    
    log_info "Testing function: $func_name"
    log_info "Method: $method"
    log_info "Data: $data"
    
    local url="http://127.0.0.1:54321/functions/v1/$func_name"
    
    if [ "$method" = "GET" ]; then
        curl -X GET "$url" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-your-anon-key}" \
            -H "Content-Type: application/json" \
            | jq '.'
    else
        curl -X "$method" "$url" \
            -H "Authorization: Bearer ${SUPABASE_ANON_KEY:-your-anon-key}" \
            -H "Content-Type: application/json" \
            -d "$data" \
            | jq '.'
    fi
}

# Create new function from template
create_function() {
    if [ -z "$1" ]; then
        log_error "Function name required. Usage: $0 create <function-name>"
        exit 1
    fi
    
    local func_name="$1"
    local func_dir="$PROJECT_ROOT/supabase/functions/$func_name"
    
    log_info "Creating new function: $func_name"
    
    # Create function directory
    mkdir -p "$func_dir"
    
    # Create basic index.ts template
    cat > "$func_dir/index.ts" << 'EOF'
import { handleCors, createCorsResponse } from '../_shared/cors.ts';
import { requireAuth } from '../_shared/auth.ts';
import { withPerformanceTracking } from '../_shared/performance.ts';

const FUNCTION_NAME = 'REPLACE_WITH_FUNCTION_NAME';

Deno.serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  return withPerformanceTracking(
    FUNCTION_NAME,
    'main_operation',
    undefined, // Will be set after auth
    async (monitor) => {
      try {
        // Authentication
        const { response: authResponse, user } = await requireAuth(req);
        if (authResponse) return authResponse;

        // Your function logic here
        const result = {
          message: 'Function executed successfully',
          timestamp: new Date().toISOString(),
        };

        return createCorsResponse(result);

      } catch (error) {
        console.error(`Error in ${FUNCTION_NAME}:`, error);
        return createCorsResponse(
          { error: 'Internal server error' },
          500
        );
      }
    }
  );
});
EOF

    # Replace placeholder with actual function name
    sed -i "s/REPLACE_WITH_FUNCTION_NAME/$func_name/g" "$func_dir/index.ts"
    
    log_success "Function $func_name created at $func_dir"
    log_info "Edit $func_dir/index.ts to implement your function logic"
}

# Check function logs
logs() {
    if [ -z "$1" ]; then
        log_error "Function name required. Usage: $0 logs <function-name>"
        exit 1
    fi
    
    local func_name="$1"
    log_info "Showing logs for function: $func_name"
    
    cd "$PROJECT_ROOT"
    supabase functions logs "$func_name" --follow
}

# Show help
show_help() {
    echo "Edge Functions Development Script"
    echo ""
    echo "Usage: $0 <command> [arguments]"
    echo ""
    echo "Commands:"
    echo "  start          Start Supabase local development environment"
    echo "  stop           Stop Supabase local development environment"
    echo "  serve          Serve Edge Functions locally"
    echo "  create <name>  Create new function from template"
    echo "  deploy <name>  Deploy specific function"
    echo "  deploy-all     Deploy all functions"
    echo "  test <name>    Test function locally"
    echo "  logs <name>    Show function logs"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 create subscription-status"
    echo "  $0 serve"
    echo "  $0 test subscription-status GET"
    echo "  $0 deploy subscription-status"
    echo ""
}

# Main command dispatcher
main() {
    check_supabase_cli
    
    case "${1:-help}" in
        "start")
            start_supabase
            ;;
        "stop")
            stop_supabase
            ;;
        "serve")
            serve_functions
            ;;
        "create")
            create_function "$2"
            ;;
        "deploy")
            deploy_function "$2"
            ;;
        "deploy-all")
            deploy_all
            ;;
        "test")
            test_function "$2" "$3" "$4"
            ;;
        "logs")
            logs "$2"
            ;;
        "help"|"--help"|"-h")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"