import urllib.request, re
req = urllib.request.Request('https://hhgoa.com/', headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
links = re.findall(r'href=\"([^\"]+\.css[^\"]*)\"', html)
print('CSS Links:', links)
if links:
    css_url = links[0] if links[0].startswith('http') else 'https://hhgoa.com' + links[0]
    css = urllib.request.urlopen(urllib.request.Request(css_url, headers={'User-Agent': 'Mozilla/5.0'})).read().decode('utf-8')
    colors = set(re.findall(r'#[0-9a-fA-F]{6}', css))
    print('Colors in CSS:', list(colors)[:30])
