# Exporta todas as cenas .scn do demo para .glb (Godot 4.4, sem janela).
# Chamado por tools/hgss/modelos-glb.py:  Godot --headless --path <projeto> --script res://exportar_glb.gd
extends SceneTree

func _scan(dir: String, acc: Array) -> void:
	var d := DirAccess.open(dir)
	if d == null:
		return
	for f in d.get_files():
		if f.ends_with(".scn"):
			acc.append(dir.path_join(f))
	for sub in d.get_directories():
		_scan(dir.path_join(sub), acc)

func _init() -> void:
	var lista: Array = []
	_scan("res://assets/models", lista)
	lista.sort()
	var ok := 0
	var falhas: Array = []
	for p in lista:
		var rel: String = String(p).trim_prefix("res://assets/models/")
		var dest := "res://saida/" + rel.get_basename() + ".glb"
		DirAccess.make_dir_recursive_absolute(ProjectSettings.globalize_path(dest.get_base_dir()))
		var ps = load(p)
		if ps == null or not (ps is PackedScene):
			falhas.append(p + " (nao carregou)")
			continue
		var inst: Node = ps.instantiate()
		var doc := GLTFDocument.new()
		var st := GLTFState.new()
		var e1 := doc.append_from_scene(inst, st)
		if e1 != OK:
			falhas.append(p + " (append " + str(e1) + ")")
			inst.free()
			continue
		var e2 := doc.write_to_filesystem(st, ProjectSettings.globalize_path(dest))
		inst.free()
		if e2 != OK:
			falhas.append(p + " (write " + str(e2) + ")")
		else:
			ok += 1
	print("EXPORTADOS: ", ok, " de ", lista.size())
	for f in falhas:
		print("FALHA: ", f)
	quit()
