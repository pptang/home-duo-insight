#!/bin/bash

# Supabase Remote Database Backup Script
# This script creates a complete backup of your remote Supabase database

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script configuration
PROJECT_NAME="Homie"
PROJECT_REF="qditnqwrjioypsuxwagg"
BACKUP_DIR="backups"

# Functions
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

check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        log_error "Supabase CLI is not installed. Please install it first:"
        echo "https://supabase.com/docs/guides/cli/getting-started"
        exit 1
    fi

    # Check if we're in a Supabase project
    if [ ! -f "supabase/config.toml" ]; then
        log_error "This doesn't appear to be a Supabase project directory."
        echo "Please run this script from your project root."
        exit 1
    fi

    # Check if linked to remote project
    if ! supabase projects list | grep -q "$PROJECT_REF"; then
        log_error "Not linked to the expected Supabase project ($PROJECT_REF)"
        echo "Please run: supabase link --project-ref $PROJECT_REF"
        exit 1
    fi

    log_success "Prerequisites check passed"
}

create_backup_directory() {
    local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    local backup_path="$BACKUP_DIR/$timestamp"

    log_info "Creating backup directory: $backup_path"
    mkdir -p "$backup_path"
    echo "$backup_path"
}

backup_data() {
    local backup_path=$1
    local data_file="$backup_path/data.sql"

    log_info "Backing up database data..."

    if supabase db dump --linked --data-only --file "$data_file"; then
        local file_size=$(du -h "$data_file" | cut -f1)
        log_success "Data backup completed: $data_file ($file_size)"
    else
        log_error "Data backup failed"
        return 1
    fi
}

backup_complete() {
    local backup_path=$1
    local complete_file="$backup_path/complete.sql"

    log_info "Creating complete backup (schema + data)..."

    if supabase db dump --linked --file "$complete_file"; then
        local file_size=$(du -h "$complete_file" | cut -f1)
        log_success "Complete backup created: $complete_file ($file_size)"
    else
        log_error "Complete backup failed"
        return 1
    fi
}

create_restore_script() {
    local backup_path=$1
    local restore_script="$backup_path/restore.sh"

    log_info "Creating restore script..."

    cat > "$restore_script" << 'EOF'
#!/bin/bash

# Restore script for Supabase database backup
# Usage: ./restore.sh [local|remote]

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

TARGET=${1:-local}
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"

echo -e "${BLUE}🔄 Restoring database backup to $TARGET environment...${NC}"

if [ "$TARGET" == "local" ]; then
    # Restore to local Supabase
    echo -e "${BLUE}📋 Checking local Supabase status...${NC}"

    if ! supabase status > /dev/null 2>&1; then
        echo -e "${BLUE}🚀 Starting local Supabase...${NC}"
        supabase start
    fi

    echo -e "${BLUE}📥 Restoring to local database...${NC}"
    psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < "$SCRIPT_DIR/complete.sql"

    echo -e "${GREEN}✅ Restore to local database completed!${NC}"
    echo -e "${BLUE}🌐 Access Studio at: http://127.0.0.1:54323${NC}"

elif [ "$TARGET" == "remote" ]; then
    # Restore to remote Supabase (be very careful!)
    echo -e "${RED}⚠️  WARNING: This will restore to your REMOTE database!${NC}"
    echo -e "${RED}⚠️  This will overwrite your production data!${NC}"
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm

    if [ "$confirm" != "yes" ]; then
        echo "Restore cancelled."
        exit 0
    fi

    echo -e "${BLUE}📥 Restoring to remote database...${NC}"
    # Note: This would require psql connection to remote DB
    echo -e "${RED}❌ Remote restore not implemented for safety reasons${NC}"
    echo "Please use Supabase Dashboard or manual SQL execution for remote restores."
    exit 1

else
    echo "Usage: $0 [local|remote]"
    echo "  local  - Restore to local Supabase instance (default)"
    echo "  remote - Restore to remote Supabase instance (use with caution!)"
    exit 1
fi
EOF

    chmod +x "$restore_script"
    log_success "Restore script created: $restore_script"
}

create_metadata() {
    local backup_path=$1
    local metadata_file="$backup_path/backup_info.json"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    log_info "Creating backup metadata..."

    cat > "$metadata_file" << EOF
{
  "project_name": "$PROJECT_NAME",
  "project_ref": "$PROJECT_REF",
  "backup_timestamp": "$timestamp",
  "backup_date": "$(date)",
  "supabase_cli_version": "$(supabase --version 2>/dev/null || echo 'unknown')",
  "backup_files": {
    "data": "data.sql",
    "complete": "complete.sql",
    "restore_script": "restore.sh"
  },
  "urls": {
    "remote_project": "https://$PROJECT_REF.supabase.co",
    "local_studio": "http://127.0.0.1:54323",
    "local_api": "http://127.0.0.1:54321"
  }
}
EOF

    log_success "Metadata created: $metadata_file"
}

create_readme() {
    local backup_path=$1
    local readme_file="$backup_path/README.md"
    local timestamp=$(date)

    log_info "Creating backup documentation..."

    cat > "$readme_file" << EOF
# Supabase Database Backup

**Project**: $PROJECT_NAME
**Backup Date**: $timestamp
**Project Reference**: $PROJECT_REF

## Files in this backup

- \`data.sql\` - Data only (all table contents)
- \`complete.sql\` - Complete dump (schema + data combined)
- \`restore.sh\` - Automated restore script
- \`backup_info.json\` - Backup metadata
- \`README.md\` - This documentation

## How to restore

### Quick restore to local Supabase
\`\`\`bash
./restore.sh
# or explicitly:
./restore.sh local
\`\`\`

### Manual restore to local Supabase
\`\`\`bash
# Make sure local Supabase is running
supabase status

# Restore complete backup
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < complete.sql
\`\`\`

### Restore specific parts
\`\`\`bash
# Data only (requires schema to be present)
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < data.sql
\`\`\`

## File sizes
\`\`\`bash
$(du -h "$backup_path"/*.sql 2>/dev/null | while read size file; do echo "- $(basename "$file"): $size"; done)
\`\`\`

## Backup created with
- Supabase CLI: \$(supabase --version)
- Command: \`supabase db dump --linked\`
- Source: https://$PROJECT_REF.supabase.co

## ⚠️ Important Notes

1. Always test restores on a local environment first
2. Make sure your local Supabase version matches the remote version
3. For production restores, consider maintenance mode
4. Keep backups in a secure location
5. Regular backups are recommended (daily/weekly depending on usage)
EOF

    log_success "Documentation created: $readme_file"
}

main() {
    echo -e "${BLUE}🗄️  Supabase Remote Database Backup Script${NC}"
    echo -e "${BLUE}Project: $PROJECT_NAME ($PROJECT_REF)${NC}"
    echo ""

    # Check prerequisites
    check_prerequisites

    # Create backup directory
    local timestamp=$(date +%Y-%m-%d_%H-%M-%S)
    local backup_path="$BACKUP_DIR/$timestamp"
    log_info "Creating backup directory: $backup_path"
    mkdir -p "$backup_path"

    # Perform backups
    backup_data "$backup_path"
    backup_complete "$backup_path"

    # Create supporting files
    create_restore_script "$backup_path"
    create_metadata "$backup_path"
    create_readme "$backup_path"

    # Summary
    echo ""
    log_success "Backup completed successfully!"
    echo -e "${BLUE}📁 Backup location: $backup_path${NC}"
    echo -e "${BLUE}📊 Backup contents:${NC}"
    ls -la "$backup_path" | tail -n +2 | while read -r line; do
        echo "   $line"
    done

    echo ""
    log_info "To restore this backup:"
    echo -e "   ${YELLOW}cd $backup_path && ./restore.sh${NC}"

    echo ""
    log_info "Backup summary:"
    du -sh "$backup_path"
}

# Run main function
main "$@"
