import os
import re

FRONTEND_DIR = r"c:\Users\HP ELITEBOOK 840 G8\Desktop\crm_ai_project\frontend\src\app"

def fix_tick(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    orig = content
    # Replace fill: '#FFFFFF' or fill:'#fff' with fill: chartTheme.textColor
    content = re.sub(r"fill:\s*['\"]#FFFFFF['\"]", "fill: chartTheme.textColor", content, flags=re.IGNORECASE)
    content = re.sub(r"fill:\s*['\"]#fff['\"]", "fill: chartTheme.textColor", content, flags=re.IGNORECASE)

    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed tick colors in {filepath}")

for root, _, files in os.walk(FRONTEND_DIR):
    for file in files:
        if file.endswith('.tsx'):
            fix_tick(os.path.join(root, file))
