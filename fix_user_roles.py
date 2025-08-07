#!/usr/bin/env python3

import os
import re

# Pattern to match the user_roles EXISTS clause
pattern = r'EXISTS \(\s*SELECT 1 FROM user_roles\s*WHERE user_id = auth\.uid\(\) AND role = \'admin\'\s*\)'
replacement = 'public.is_admin()'

# Directory containing migrations
migrations_dir = 'supabase/migrations'

# Files to fix
files_to_fix = [
    '20250807120000_create_performance_monitoring.sql',
    '20250808120000_create_batch_jobs_and_webhook_monitoring.sql',
    '20250808140000_create_migration_control_system.sql',
    '20250808150000_create_production_validation_system.sql',
    '20250808160000_create_global_optimization_system.sql',
    '20250808170000_create_security_hardening_system.sql',
    '20250808180000_create_connection_pooling_system.sql',
    '20250808190000_create_performance_optimization_system.sql'
]

for filename in files_to_fix:
    filepath = os.path.join(migrations_dir, filename)
    if os.path.exists(filepath):
        print(f"Fixing {filename}...")
        
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Replace the pattern
        new_content = re.sub(pattern, replacement, content, flags=re.MULTILINE | re.DOTALL)
        
        # Count replacements
        replacements = len(re.findall(pattern, content, flags=re.MULTILINE | re.DOTALL))
        
        with open(filepath, 'w') as f:
            f.write(new_content)
        
        print(f"  Made {replacements} replacements")
    else:
        print(f"File not found: {filename}")

print("Done!")
