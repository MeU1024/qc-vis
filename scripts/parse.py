import ast
from unparse import Unparser
import json
import os
import sys
from structure import extract_target_tree, tree_to_list
from gates_and_semantics import reconstruct_ast, set_semantic_types


def parse_file(file_path, target, filename):
    with open(file_path, 'r') as f:
        file = f.read()
    ast_tree = ast.parse(file)
    target_tree, func_list = extract_target_tree(ast_tree, target)
    node_list = tree_to_list(target_tree)
    print_structure(node_list, filename)
    new_ast = reconstruct_ast(func_list, target_tree, target, filename)
    print_file(filename + "_new.py", new_ast)
    python_path = sys.executable
    script_name = filename + "_new.py"
    print("python_path" + python_path)
    print("script_name" + script_name)
    os.system(f'{python_path} {script_name}') 
    #os.system("python " + filename + "_new.py")
    set_semantic_types(filename)


def print_structure(structure, filename):
    with open(filename + "_structure.json", 'w') as f:
        json.dump(structure, f, indent=4)


def print_file(file_path, ast_tree):
    with open(file_path, 'w') as f:
        Unparser(ast_tree, f)


if __name__ == "__main__":
    parse_file(sys.argv[1], sys.argv[2], sys.argv[3])
