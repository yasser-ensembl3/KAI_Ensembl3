#!/bin/bash

# =============================================================================
# MiniVault MCP Server Installation Script
# =============================================================================
# This script installs the MCP server for NotionManager skill.
# Database IDs are pre-configured - you only need your Notion token.
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           MiniVault MCP Server Installation                   ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# =============================================================================
# Pre-configured Database IDs (shared across team)
# =============================================================================
NOTION_DB_TASKS="29d58fe731b1812e964bd1817a08e968"
NOTION_DB_RECURRING_TASKS="2be58fe731b180cf8bbbcd92a3b63330"
NOTION_DB_ORDERS="2e158fe731b180bbbfe3f5407e42b7a7"
NOTION_DB_ESSENTIALS="2be58fe731b180639eaadd9d15875447"
NOTION_DB_METRICS="29d58fe731b18196bf0bf04dffa764c7"
NOTION_DB_GOALS="29d58fe731b181ddb983dc112c880df7"
NOTION_DB_DOCUMENTS="29d58fe731b1811281cbe3a44f751a63"
NOTION_DB_FEEDBACK="29d58fe731b181ce8682d63f1229bb6e"
NOTION_DB_SALES="2df58fe731b180b3844bd23584744d36"
NOTION_DB_WEB_ANALYTICS="2df58fe731b1809ab509c1c75e5a629d"

# =============================================================================
# Check prerequisites
# =============================================================================
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command -v claude &> /dev/null; then
    echo -e "${RED}Error: Claude Code is not installed.${NC}"
    echo "Install with: npm install -g @anthropic-ai/claude-code"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites OK${NC}"

# =============================================================================
# Get Notion Token from user
# =============================================================================
echo ""
echo -e "${YELLOW}You need a Notion Integration Token to continue.${NC}"
echo ""
echo "To get your token:"
echo "  1. Go to https://www.notion.so/my-integrations"
echo "  2. Create a new integration (or use existing)"
echo "  3. Copy the 'Internal Integration Token' (starts with ntn_)"
echo "  4. Make sure your databases are shared with this integration"
echo ""

read -p "Enter your Notion Token (ntn_...): " NOTION_TOKEN

if [[ ! $NOTION_TOKEN == ntn_* ]]; then
    echo -e "${RED}Error: Token should start with 'ntn_'${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Token received${NC}"

# =============================================================================
# Install MCP Server
# =============================================================================
echo ""
echo -e "${YELLOW}Installing MCP server...${NC}"

MCP_DIR="$HOME/.claude/mcp-servers/minivault"

# Create directory
mkdir -p "$MCP_DIR"

# Copy MCP server files from this skill's mcp-server directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -d "$SCRIPT_DIR/mcp-server" ]; then
    cp -r "$SCRIPT_DIR/mcp-server/"* "$MCP_DIR/"
else
    # Download from GitHub if not bundled
    echo -e "${YELLOW}Downloading MCP server...${NC}"
    curl -sL https://github.com/yasser-ensembl3/KAI_Ensembl3/raw/main/NotionManager/mcp-server.tar.gz | tar -xz -C "$MCP_DIR"
fi

# Install dependencies
cd "$MCP_DIR"
npm install --silent
npm run build --silent

echo -e "${GREEN}✓ MCP server installed${NC}"

# =============================================================================
# Configure Claude Code
# =============================================================================
echo ""
echo -e "${YELLOW}Configuring Claude Code...${NC}"

# Remove existing minivault config if exists
claude mcp remove minivault 2>/dev/null || true

# Add MCP server with all configurations
claude mcp add minivault --scope user \
    --env "NOTION_TOKEN=$NOTION_TOKEN" \
    --env "NOTION_DB_TASKS=$NOTION_DB_TASKS" \
    --env "NOTION_DB_RECURRING_TASKS=$NOTION_DB_RECURRING_TASKS" \
    --env "NOTION_DB_ORDERS=$NOTION_DB_ORDERS" \
    --env "NOTION_DB_ESSENTIALS=$NOTION_DB_ESSENTIALS" \
    --env "NOTION_DB_METRICS=$NOTION_DB_METRICS" \
    --env "NOTION_DB_GOALS=$NOTION_DB_GOALS" \
    --env "NOTION_DB_DOCUMENTS=$NOTION_DB_DOCUMENTS" \
    --env "NOTION_DB_FEEDBACK=$NOTION_DB_FEEDBACK" \
    --env "NOTION_DB_SALES=$NOTION_DB_SALES" \
    --env "NOTION_DB_WEB_ANALYTICS=$NOTION_DB_WEB_ANALYTICS" \
    -- node "$MCP_DIR/dist/index.js"

echo -e "${GREEN}✓ Claude Code configured${NC}"

# =============================================================================
# Verify installation
# =============================================================================
echo ""
echo -e "${YELLOW}Verifying installation...${NC}"

if claude mcp list 2>/dev/null | grep -q "minivault.*Connected"; then
    echo -e "${GREEN}✓ MCP server connected successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify connection. Try restarting Claude Code.${NC}"
fi

# =============================================================================
# Done!
# =============================================================================
echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                    Installation Complete!                      ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "You can now use these commands in Claude Code:"
echo ""
echo "  • 'Show me the project status'"
echo "  • 'List all tasks'"
echo "  • 'Create a task for X'"
echo "  • 'What orders are unfulfilled?'"
echo ""
echo -e "${BLUE}Restart Claude Code to apply changes.${NC}"
echo ""
