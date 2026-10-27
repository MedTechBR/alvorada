"""Antecipa só os módulos usados na abertura padrão, sem mudar suas URLs internas."""
import pathlib,re,sys
raiz=pathlib.Path(__file__).resolve().parents[1]
iniciais=['vendor/pixi-8.6.6.min.js','src/main.js','src/visual2d/firered/index.js']
visitados=set()
def visitar(rel):
    if rel in visitados:return
    visitados.add(rel)
    if rel.startswith('vendor/'):return
    texto=(raiz/rel).read_text()
    texto=re.sub(r'/\*[\s\S]*?\*/','',texto)
    texto=re.sub(r'(?m)^\s*//.*$','',texto)
    for m in re.finditer(r'''(?:^|;)\s*(?:import|export)\s*(?:[^;'"()]*?\bfrom\s*)?['"]([^'"]+)['"]''',texto,re.M):
        p=m.group(1)
        if p=='pixi.js':visitar(iniciais[0]);continue
        if not p.startswith('.'):continue
        arquivo=((raiz/rel).parent/p).resolve()
        if arquivo.suffix not in('.js','.mjs'):continue
        if not arquivo.is_file():raise RuntimeError('Módulo ausente: '+str(arquivo))
        visitar(arquivo.relative_to(raiz).as_posix())
for r in iniciais:visitar(r)
ordem=iniciais+sorted(visitados-set(iniciais))
inicio='  <!-- módulos iniciais: início -->';fim='  <!-- módulos iniciais: fim -->'
bloco=inicio+'\n'+'\n'.join('  <link rel="modulepreload" href="'+r+'">'for r in ordem)+'\n'+fim
p=raiz/'index.html';s=p.read_text()
if inicio in s:
    a=s.index(inicio);b=s.index(fim,a)+len(fim);novo=s[:a]+bloco+s[b:]
else:novo=s.replace('</head>',bloco+'\n</head>')
if '--verificar'in sys.argv:
    if novo!=s:raise SystemExit('Lista desatualizada: rode python3 tools/precarregar-modulos.py')
else:p.write_text(novo)
print('OK:',len(ordem),'módulos da abertura, sem pré-carregar arte ou modelos 3D.')
