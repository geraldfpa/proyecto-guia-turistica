import re, json, os

base = os.path.dirname(os.path.abspath(__file__))
src_path = os.path.join(base, "antigravity/resources/mapa-interactivo-cr (1).html")

with open(src_path, encoding='utf-8') as f:
    src = f.read()

# Extract the _paths() return block
m = re.search(r"_paths\(\)\s*\{return\{([\s\S]*?)\}\s*\}", src)
if not m:
    print("ERROR: _paths() not found"); exit(1)

block = m.group(1)

keys = ['CRA','CRG','CRL','CRH','CRSJ','CRC','CRP']
paths = {}
for key in keys:
    km = re.search(key + r":'([^']*)'", block)
    paths[key] = km.group(1) if km else ''
    print(f"{key}: {len(paths[key])} chars")

out = os.path.join(base, "data/map-paths.json")
with open(out, 'w', encoding='utf-8') as f:
    json.dump(paths, f, ensure_ascii=False, indent=2)
print("Done:", out)
