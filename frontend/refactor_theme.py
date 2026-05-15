import os
import re

FRONTEND_DIR = r"c:\Users\HP ELITEBOOK 840 G8\Desktop\crm_ai_project\frontend\src\app"

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    modified = False

    # Replacements for Tailwind classes
    # Ensure we only replace full words for classes
    replacements = {
        r'\btext-black\b': 'text-gray-900 dark:text-white',
        r'\btext-gray-800\b': 'text-gray-800 dark:text-gray-200',
        r'\btext-gray-700\b': 'text-gray-700 dark:text-gray-300',
        r'\bbg-white\b': 'bg-white dark:bg-slate-900',
        r'\bbg-black\b': 'bg-gray-100 dark:bg-slate-800',
        r'\bbg-gray-100\b': 'bg-gray-100 dark:bg-slate-800',
        r'\bbg-[#0A101F]\b': 'bg-white dark:bg-[#0A101F]',
        r'\bbg-[#1A2235]\b': 'bg-gray-50 dark:bg-[#1A2235]',
        r'\bbg-[#1E293B]\b': 'bg-gray-100 dark:bg-[#1E293B]',
        r'\bborder-gray-200\b': 'border-gray-200 dark:border-slate-700',
        r'\bborder-gray-300\b': 'border-gray-300 dark:border-slate-600',
        # Handle some cases where text-white is used as the main text color in their previous dark-mode default
        # But we must be careful not to replace text-white inside buttons that are blue
    }

    # Manual regex replacements
    for pattern, replacement in replacements.items():
        if re.search(pattern, content):
            # Only replace if not already part of a dark: setup
            content = re.sub(f'(?<!dark:){pattern}', replacement, content)

    # Recharts theme injection
    if "from 'recharts'" in content or 'from "recharts"' in content:
        # Check if useChartTheme is imported
        if "useChartTheme" not in content:
            # Add import after React imports
            import_statement = "import { useChartTheme } from '../../hooks/useChartTheme';\n"
            if "../../hooks/useChartTheme" not in content and "../hooks/useChartTheme" not in content:
                # Find a good place to insert: after the last import
                last_import_match = list(re.finditer(r'^import .*?;?$', content, re.MULTILINE))
                if last_import_match:
                    last_import_pos = last_import_match[-1].end()
                    # Calculate depth
                    depth = filepath.count(os.sep) - FRONTEND_DIR.count(os.sep)
                    path_prefix = "../" * depth if depth > 0 else "./"
                    if "pages" in filepath:
                        path_prefix = "../../"
                    elif "components" in filepath:
                        path_prefix = "../../"
                    
                    content = content[:last_import_pos] + f"\nimport {{ useChartTheme }} from '{path_prefix}hooks/useChartTheme';" + content[last_import_pos:]

        # Inject hook inside components
        # This is a bit tricky with regex, we'll look for component declarations
        component_pattern = r'(export (?:default )?function \w+\(.*?\)\s*{)'
        components = list(re.finditer(component_pattern, content))
        for comp in reversed(components):
            comp_start = comp.end()
            if "const chartTheme = useChartTheme();" not in content[comp_start:comp_start+200]:
                content = content[:comp_start] + "\n  const chartTheme = useChartTheme();" + content[comp_start:]

        # Fix XAxis, YAxis
        content = re.sub(r'<XAxis([^>]*?)(?:stroke="[^"]*"|stroke=\{[^}]*\})([^>]*?)>', r'<XAxis\1stroke={chartTheme.textColor}\2>', content)
        content = re.sub(r'<XAxis([^>]*?)>', lambda m: m.group(0) if 'stroke=' in m.group(0) else f"<XAxis{m.group(1)} stroke={{chartTheme.textColor}}>", content)
        
        content = re.sub(r'<YAxis([^>]*?)(?:stroke="[^"]*"|stroke=\{[^}]*\})([^>]*?)>', r'<YAxis\1stroke={chartTheme.textColor}\2>', content)
        content = re.sub(r'<YAxis([^>]*?)>', lambda m: m.group(0) if 'stroke=' in m.group(0) else f"<YAxis{m.group(1)} stroke={{chartTheme.textColor}}>", content)
        
        # Fix CartesianGrid
        content = re.sub(r'<CartesianGrid([^>]*?)(?:stroke="[^"]*"|stroke=\{[^}]*\})([^>]*?)>', r'<CartesianGrid\1stroke={chartTheme.gridColor}\2>', content)
        content = re.sub(r'<CartesianGrid([^>]*?)>', lambda m: m.group(0) if 'stroke=' in m.group(0) else f"<CartesianGrid{m.group(1)} stroke={{chartTheme.gridColor}}>", content)

        # Fix Tooltip
        content = re.sub(r'<Tooltip([^>]*?)(?:contentStyle=\{[^}]*\})([^>]*?)>', r'<Tooltip\1contentStyle={chartTheme.tooltipStyle}\2>', content)
        content = re.sub(r'<Tooltip([^>]*?)>', lambda m: m.group(0) if 'contentStyle=' in m.group(0) else f"<Tooltip{m.group(1)} contentStyle={{chartTheme.tooltipStyle}}>", content)

    # Some hardcoded text-white might be used for text, let's fix it safely if it's not in a primary button
    # Actually, replacing text-white blindly is bad. We replace text-white only if it's accompanied by text-slate-400 or something,
    # But user said "Remplacer toutes les couleurs statiques text-black, text-white, text-gray fixes".
    # I'll replace `text-white` with `text-gray-900 dark:text-white` ONLY if the element doesn't have `bg-primary`, `bg-blue`, `bg-red`, `bg-green`, `bg-emerald`.
    
    def replace_text_white(match):
        full_class = match.group(0)
        if any(color in full_class for color in ['bg-primary', 'bg-blue', 'bg-red', 'bg-emerald', 'bg-amber', 'bg-orange', 'bg-purple', 'bg-green']):
            return full_class
        # Replace text-white with text-gray-900 dark:text-white
        return re.sub(r'(?<!dark:)\btext-white\b', 'text-gray-900 dark:text-white', full_class)

    content = re.sub(r'className="[^"]*"', replace_text_white, content)

    # Do the same for text-gray-400 -> text-gray-500 dark:text-gray-400
    def replace_text_gray_400(match):
        full_class = match.group(0)
        return re.sub(r'(?<!dark:)\btext-gray-400\b', 'text-gray-500 dark:text-gray-400', full_class)
    
    content = re.sub(r'className="[^"]*"', replace_text_gray_400, content)

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
        return True
    return False

updated_files = 0
for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith('.tsx'):
            if process_file(os.path.join(root, file)):
                updated_files += 1

print(f"Refactoring complete. Updated {updated_files} files.")
