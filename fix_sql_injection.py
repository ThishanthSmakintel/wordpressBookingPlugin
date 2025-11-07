#!/usr/bin/env python3
"""
SQL Injection Auto-Fixer for WordPress Plugin
Automatically fixes SQL injection vulnerabilities in PHP files
"""

import os
import re
import shutil
from datetime import datetime

class SQLInjectionFixer:
    def __init__(self, plugin_dir):
        self.plugin_dir = plugin_dir
        self.backup_dir = os.path.join(plugin_dir, 'backups', datetime.now().strftime('%Y%m%d_%H%M%S'))
        self.fixed_count = 0
        self.files_modified = []
        
    def create_backup(self, file_path):
        """Create backup of file before modification"""
        os.makedirs(self.backup_dir, exist_ok=True)
        rel_path = os.path.relpath(file_path, self.plugin_dir)
        backup_path = os.path.join(self.backup_dir, rel_path)
        os.makedirs(os.path.dirname(backup_path), exist_ok=True)
        shutil.copy2(file_path, backup_path)
        print(f"✓ Backed up: {rel_path}")
        
    def fix_simple_select(self, content):
        """Fix: $wpdb->get_row("SELECT * FROM table WHERE id = $id")"""
        pattern = r'\$wpdb->(get_row|get_var|get_col|get_results)\s*\(\s*"([^"]*\$[^"]*)"'
        
        def replace(match):
            method = match.group(1)
            query = match.group(2)
            
            # Skip if already using prepare
            if 'prepare' in query:
                return match.group(0)
            
            # Extract variables
            vars_found = re.findall(r'\$(\w+)', query)
            if not vars_found:
                return match.group(0)
            
            # Replace variables with placeholders
            fixed_query = query
            params = []
            for var in vars_found:
                # Determine placeholder type
                if any(x in var.lower() for x in ['id', 'count', 'num']):
                    placeholder = '%d'
                elif any(x in var.lower() for x in ['price', 'amount', 'total']):
                    placeholder = '%f'
                else:
                    placeholder = '%s'
                
                fixed_query = re.sub(rf'\${var}', placeholder, fixed_query, count=1)
                params.append(f'${var}')
            
            params_str = ', '.join(params)
            self.fixed_count += 1
            return f'$wpdb->{method}($wpdb->prepare("{fixed_query}", {params_str})'
        
        return re.sub(pattern, replace, content)
    
    def fix_insert_query(self, content):
        """Fix INSERT queries to use $wpdb->insert()"""
        pattern = r'\$wpdb->query\s*\(\s*"INSERT INTO \{?\$wpdb->prefix\}?(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)"\s*\)'
        
        def replace(match):
            table = match.group(1)
            columns = [c.strip() for c in match.group(2).split(',')]
            values = match.group(3)
            
            # Extract variables from values
            vars_found = re.findall(r"'?\$(\w+)'?", values)
            if not vars_found:
                return match.group(0)
            
            # Build array syntax
            data_array = ', '.join([f"'{col}' => ${var}" for col, var in zip(columns, vars_found)])
            format_array = ', '.join(["'%s'" for _ in vars_found])
            
            self.fixed_count += 1
            return f"$wpdb->insert($wpdb->prefix . '{table}', array({data_array}), array({format_array}))"
        
        return re.sub(pattern, replace, content)
    
    def fix_update_query(self, content):
        """Fix UPDATE queries to use $wpdb->update()"""
        pattern = r'\$wpdb->query\s*\(\s*"UPDATE \{?\$wpdb->prefix\}?(\w+)\s+SET\s+(\w+)\s*=\s*\'?\$(\w+)\'?\s+WHERE\s+(\w+)\s*=\s*\$(\w+)"\s*\)'
        
        def replace(match):
            table = match.group(1)
            set_col = match.group(2)
            set_var = match.group(3)
            where_col = match.group(4)
            where_var = match.group(5)
            
            self.fixed_count += 1
            return f"$wpdb->update($wpdb->prefix . '{table}', array('{set_col}' => ${set_var}), array('{where_col}' => ${where_var}), array('%s'), array('%d'))"
        
        return re.sub(pattern, replace, content)
    
    def fix_delete_query(self, content):
        """Fix DELETE queries to use $wpdb->delete()"""
        pattern = r'\$wpdb->query\s*\(\s*"DELETE FROM \{?\$wpdb->prefix\}?(\w+)\s+WHERE\s+(\w+)\s*=\s*\$(\w+)"\s*\)'
        
        def replace(match):
            table = match.group(1)
            where_col = match.group(2)
            where_var = match.group(3)
            
            self.fixed_count += 1
            return f"$wpdb->delete($wpdb->prefix . '{table}', array('{where_col}' => ${where_var}), array('%d'))"
        
        return re.sub(pattern, replace, content)
    
    def fix_prepare_with_concat(self, content):
        """Fix queries with string concatenation"""
        pattern = r'\$wpdb->(get_\w+|query)\s*\(\s*"([^"]*)"[^)]*\.\s*\$(\w+)'
        
        def replace(match):
            method = match.group(1)
            query = match.group(2)
            var = match.group(3)
            
            if 'prepare' in query:
                return match.group(0)
            
            self.fixed_count += 1
            return f'$wpdb->{method}($wpdb->prepare("{query}%d", ${var}'
        
        return re.sub(pattern, replace, content)
    
    def process_file(self, file_path):
        """Process a single PHP file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Apply all fixes
            content = self.fix_simple_select(content)
            content = self.fix_insert_query(content)
            content = self.fix_update_query(content)
            content = self.fix_delete_query(content)
            content = self.fix_prepare_with_concat(content)
            
            # Only write if changes were made
            if content != original_content:
                self.create_backup(file_path)
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                self.files_modified.append(file_path)
                return True
            
            return False
            
        except Exception as e:
            print(f"✗ Error processing {file_path}: {e}")
            return False
    
    def scan_and_fix(self):
        """Scan all PHP files and fix SQL injection issues"""
        print("=" * 60)
        print("SQL Injection Auto-Fixer")
        print("=" * 60)
        print(f"Plugin directory: {self.plugin_dir}")
        print(f"Backup directory: {self.backup_dir}")
        print()
        
        # Files to process
        files_to_check = [
            'includes/class-api-endpoints.php',
            'admin/appointease-admin.php',
            'includes/class-activator.php',
            'includes/class-db-seeder.php',
            'includes/class-db-reset.php',
            'includes/class-atomic-booking.php',
            'includes/class-booking-plugin.php',
            'includes/session-manager.php',
            'includes/debug-data-endpoint.php',
            'includes/class-heartbeat-handler.php'
        ]
        
        print("Processing files...")
        print()
        
        for file_rel in files_to_check:
            file_path = os.path.join(self.plugin_dir, file_rel)
            if os.path.exists(file_path):
                print(f"Processing: {file_rel}")
                if self.process_file(file_path):
                    print(f"  ✓ Fixed and backed up")
                else:
                    print(f"  - No changes needed")
            else:
                print(f"  ✗ File not found")
            print()
        
        # Summary
        print("=" * 60)
        print("SUMMARY")
        print("=" * 60)
        print(f"Total fixes applied: {self.fixed_count}")
        print(f"Files modified: {len(self.files_modified)}")
        print(f"Backups saved to: {self.backup_dir}")
        print()
        
        if self.files_modified:
            print("Modified files:")
            for f in self.files_modified:
                print(f"  - {os.path.relpath(f, self.plugin_dir)}")
        
        print()
        print("⚠️  IMPORTANT: Test thoroughly before deploying!")
        print()

def main():
    # Get plugin directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("SQL Injection Auto-Fixer")
    print("This will automatically fix SQL injection vulnerabilities")
    print()
    
    response = input("Continue? (yes/no): ").strip().lower()
    if response != 'yes':
        print("Aborted.")
        return
    
    fixer = SQLInjectionFixer(script_dir)
    fixer.scan_and_fix()

if __name__ == '__main__':
    main()
