import ast
from unparse import Unparser
import json
import os
import sys
import re
from structure import extract_target_tree, tree_to_list
from gates_and_semantics import reconstruct_ast, set_semantic_types


def parse_file(file_path, target, output_name):
    with open(file_path, 'r') as f:
        file = f.read()
    ast_tree = ast.parse(file)
    target_tree, func_list = extract_target_tree(
        ast_tree, target, re.split('[.\\\\/]', file_path)[-2])
    node_list = tree_to_list(target_tree)
    print_structure(node_list, output_name)
    new_ast = reconstruct_ast(func_list, target_tree, target, output_name)
    print_file(output_name + "_new.py", new_ast)
    os.system("python " + output_name + "_new.py")
    set_semantic_types(output_name)


def print_structure(structure, filename):
    with open(filename + "_structure.json", 'w') as f:
        json.dump(structure, f, indent=4)


def print_file(file_path, ast_tree):
    with open(file_path, 'w') as f:
        Unparser(ast_tree, f)


if __name__ == "__main__":
    parse_file(sys.argv[1], sys.argv[2], sys.argv[3])
