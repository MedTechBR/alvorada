import sys
from base import *
import terreno
G, info = terreno.construir()
sys.path.insert(0,'.')
previa(G, '/private/tmp/claude-501/-Users-matheusparente-Documents-Claude-pokemon-3d/1326d1da-841e-451d-9800-f7dab8658f99/scratchpad/brasas_full.png', k=2)
previa(G, '/private/tmp/claude-501/-Users-matheusparente-Documents-Claude-pokemon-3d/1326d1da-841e-451d-9800-f7dab8658f99/scratchpad/brasas_fornalha.png', k=5, recorte=(925, 600, 230, 290))
print('ok')
