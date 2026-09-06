
import os
import re

mapping = {
    'forest-950': 'goa-dark',
    'forest-900': 'goa-dark',
    'forest-800': 'goa-dark',
    'cream-50': 'goa-cream',
    'cream-100': 'goa-cream',
    'cream-200': 'goa-cream',
    'cream-300': 'goa-dark/50',
    'text-pink': 'text-goa-pink',
    'bg-pink': 'bg-goa-pink',
    'border-pink': 'border-goa-pink',
    'shadow-brutal-pink': 'shadow-brutal',
    'text-emerald': 'text-goa-green',
    'bg-emerald': 'bg-goa-green',
    'border-emerald': 'border-goa-green',
    'charcoal': 'goa-dark',
    'charcoal-light': 'goa-dark/80',
    'pink-hot': 'goa-red',
    'border-white/10': 'border-goa-dark',
    'border-white/20': 'border-goa-dark',
    'text-white': 'text-goa-cream',
    'text-black': 'text-goa-dark',
}

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for k, v in mapping.items():
        # Only replace exact classes or variants
        content = re.sub(r'\b' + re.escape(k) + r'\b', v, content)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
print('Replacements complete')

