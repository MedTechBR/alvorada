# Reformata assets/maps/*.json de forma compacta e legível (uma operação/objeto por linha, salas em texto).
# Uso: python3 tools/formatar-mapa.py assets/maps/alvorada.json
import json, sys
p = sys.argv[1]
d = json.load(open(p, encoding='utf-8'))
one = lambda v: json.dumps(v, ensure_ascii=False)
out = ['{']
keys = list(d.keys())
for i, k in enumerate(keys):
    v = d[k]; end = ',' if i < len(keys) - 1 else ''
    if isinstance(v, list) and all(not isinstance(x, (dict, list)) for x in v):
        out.append(f'  {one(k)}: {one(v)}{end}')
    elif isinstance(v, list) and k != 'interiors':
        out.append(f'  {one(k)}: [')
        out += [f'    {one(x)}' + (',' if j < len(v) - 1 else '') for j, x in enumerate(v)]
        out.append('  ]' + end)
    elif k == 'interiors':
        out.append(f'  {one(k)}: [')
        for j, r in enumerate(v):
            out.append('    {')
            rk = list(r.keys())
            for m, kk in enumerate(rk):
                e2 = ',' if m < len(rk) - 1 else ''
                if kk == 'rows':
                    out.append('      "rows": [')
                    out += [f'        {one(x)}' + (',' if n < len(r[kk]) - 1 else '') for n, x in enumerate(r[kk])]
                    out.append('      ]' + e2)
                else:
                    out.append(f'      {one(kk)}: {one(r[kk])}{e2}')
            out.append('    }' + (',' if j < len(v) - 1 else ''))
        out.append('  ]' + end)
    elif isinstance(v, dict) and k == 'spots':
        out.append(f'  {one(k)}: {{')
        items = list(v.items())
        out += [f'    {one(a)}: {one(b)}' + (',' if j < len(items) - 1 else '') for j, (a, b) in enumerate(items)]
        out.append('  }' + end)
    else:
        out.append(f'  {one(k)}: {one(v)}{end}')
out.append('}')
open(p, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
json.load(open(p, encoding='utf-8'))
print(p, len(out), 'linhas')
