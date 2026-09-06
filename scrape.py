import urllib.request
req = urllib.request.Request('https://hhgoa.com/', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
lines = html.split('\n')
print('FONTS:')
for line in lines:
    if 'font' in line.lower() and 'http' in line:
        print(line.strip()[:200])
print('COLORS/THEME:')
for line in lines:
    if 'theme-color' in line.lower() or 'root' in line:
        print(line.strip()[:200])
