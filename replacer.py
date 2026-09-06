
import os
import re

mapping = {
    'bg-[#F50064]': 'bg-goa-pink',
    'text-[#F50064]': 'text-goa-pink',
    'border-[#F50064]': 'border-goa-pink',
    'bg-[#141414]': 'bg-goa-dark',
    'text-[#141414]': 'text-goa-dark',
    'border-[#141414]': 'border-goa-dark',
    'bg-[#F5F0E3]': 'bg-goa-cream',
    'bg-[#FAF7F0]': 'bg-goa-cream',
    'text-[#F5F0E3]': 'text-goa-cream',
    'text-[#FAF7F0]': 'text-goa-cream',
    'text-[#EBE3D0]': 'text-goa-cream',
    'bg-[#0A2E23]': 'bg-goa-green',
    'text-[#0A2E23]': 'text-goa-green',
    'bg-[#071F17]': 'bg-goa-dark',
    'bg-[#00E599]': 'bg-goa-yellow',
    'text-[#00E599]': 'text-goa-yellow',
    'border-[#00E599]': 'border-goa-yellow',
    'bg-[#1D6B56]': 'bg-goa-green',
    'bg-[#0D3B2E]': 'bg-goa-dark',
    'text-[#0D3B2E]': 'text-goa-dark',
    'shadow-brutal-pink': 'shadow-brutal',
    'shadow-brutal-sm': 'shadow-brutal',
}

def process_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    for k, v in mapping.items():
        content = content.replace(k, v)
        # also handle with opacity, e.g. bg-[#F50064]/10 -> bg-goa-pink/10
        content = re.sub(re.escape(k) + r'(/[\d]+)', v + r'\1', content)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

for root, dirs, files in os.walk('frontend/src'):
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            process_file(os.path.join(root, file))
print('Replacements complete')

