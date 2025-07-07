# Database Backup Scripts

This directory contains scripts for backing up your Supabase remote database.

## Scripts

### 1. `backup-remote-db.sh` - Comprehensive Backup Script

A full-featured backup script that creates complete database backups with documentation.

**Features:**
- ✅ Schema-only backup
- ✅ Data-only backup
- ✅ Complete backup (schema + data)
- ✅ Automatic restore script generation
- ✅ Backup metadata and documentation
- ✅ Prerequisites checking
- ✅ Colored output and progress tracking

**Usage:**
```bash
./scripts/backup-remote-db.sh
```

**Output:**
- Creates timestamped backup directory in `backups/YYYY-MM-DD_HH-MM-SS/`
- Includes schema.sql, data.sql, complete.sql
- Generates restore.sh script for easy restoration
- Creates README.md with backup details

### 2. `daily-backup.sh` - Quick Daily Backup

A lightweight script for automated daily backups.

**Features:**
- ✅ Single complete backup file
- ✅ Automatic cleanup (keeps 30 days)
- ✅ Minimal output for automation
- ✅ Date-organized storage

**Usage:**
```bash
./scripts/daily-backup.sh
```

**Output:**
- Creates `backups/daily/YYYY-MM-DD/backup_YYYY-MM-DD.sql`
- Automatically removes backups older than 30 days

## Setup for Automated Backups

### Option 1: Cron Job (macOS/Linux)

Add to your crontab for daily backups at 2 AM:

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /Users/neo/Projects/dowell/home-duo-insight && ./scripts/daily-backup.sh >> logs/backup.log 2>&1
```

### Option 2: Manual Weekly Backups

Run the comprehensive backup script weekly:

```bash
# Create a comprehensive backup
./scripts/backup-remote-db.sh

# Or schedule it weekly
0 2 * * 0 cd /Users/neo/Projects/dowell/home-duo-insight && ./scripts/backup-remote-db.sh >> logs/backup.log 2>&1
```

## Backup Storage Structure

```
backups/
├── daily/                          # Daily automated backups
│   ├── 2025-07-07/
│   │   ├── backup_2025-07-07.sql
│   │   └── info.txt
│   └── 2025-07-08/
│       ├── backup_2025-07-08.sql
│       └── info.txt
└── 2025-07-07_19-55-46/           # Comprehensive backups
    ├── schema.sql
    ├── data.sql
    ├── complete.sql
    ├── restore.sh
    ├── backup_info.json
    └── README.md
```

## Restoring Backups

### From Comprehensive Backup
```bash
cd backups/2025-07-07_19-55-46/
./restore.sh
```

### From Daily Backup
```bash
psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" < backups/daily/2025-07-07/backup_2025-07-07.sql
```

## Prerequisites

1. **Supabase CLI installed**
   ```bash
   npm install -g supabase
   ```

2. **Linked to remote project**
   ```bash
   supabase link --project-ref qditnqwrjioypsuxwagg
   ```

3. **Local Supabase running** (for restores)
   ```bash
   supabase start
   ```

## Environment Variables

The scripts automatically use your linked Supabase project. No additional environment variables needed.

## Security Notes

- ⚠️ Backup files contain sensitive data - store securely
- ⚠️ Don't commit backup files to version control
- ⚠️ Consider encrypting backups for production data
- ⚠️ Test restore procedures regularly

## Troubleshooting

### "Project not linked" error
```bash
supabase link --project-ref qditnqwrjioypsuxwagg
```

### "Supabase CLI not found" error
```bash
npm install -g supabase
```

### Permission denied
```bash
chmod +x scripts/*.sh
```
