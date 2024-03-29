
uni_index = 0

def get_index():
    global uni_index
    temp = uni_index
    uni_index += 1
    return temp
timestamp = 0

def get_timestamp():
    global timestamp
    temp = timestamp
    timestamp += 1
    return temp
gates = []
semantics = []
path = [get_index()]
base_index = 0
from qiskit import QuantumCircuit
import math

def F_gate(qc, i, j, n, k, path, base_index):
    path = (path.copy() + [get_index()])
    theta = math.acos(math.sqrt((1.0 / ((n - k) + 1))))
    qc.ry((- theta), j)
    gates.append(['ry', [(j if (type(j) == int) else j.index)], ([get_timestamp()] * 2), (1 + base_index), (path.copy() + [get_index()])])
    qc.cz(i, j)
    gates.append(['cz', [(i if (type(i) == int) else i.index), (j if (type(j) == int) else j.index)], ([get_timestamp()] * 2), (2 + base_index), (path.copy() + [get_index()])])
    qc.ry(theta, j)
    gates.append(['ry', [(j if (type(j) == int) else j.index)], ([get_timestamp()] * 2), (3 + base_index), (path.copy() + [get_index()])])

def get_cir(n_qubits, path, base_index):
    path = (path.copy() + [get_index()])
    qc = QuantumCircuit(n_qubits, n_qubits)
    n = n_qubits
    qc.x((n - 1))
    gates.append(['x', [((n - 1) if (type((n - 1)) == int) else (n - 1).index)], ([get_timestamp()] * 2), (1 + base_index), (path.copy() + [get_index()])])
    range_list = []
    for i in range(0, (n - 1)):
        start_time = timestamp
        F_gate(qc, ((n - 1) - i), ((n - 2) - i), n, (i + 1), path=path, base_index=
        (base_index + 3))
        range_list.append([start_time, (timestamp - 1)])
    semantics.append({'type': 'unknown', 'range': range_list, 'treeIndex': (2 + base_index)})
    range_list = []
    for i in range(0, (n - 1)):
        start_time = timestamp
        qc.cx(((n - 2) - i), ((n - 1) - i))
        gates.append(['cx', [(((n - 2) - i) if (type(((n - 2) - i)) == int) else ((n - 2) - i).index), (((n - 1) - i) if (type(((n - 1) - i)) == int) else ((n - 1) - i).index)], ([get_timestamp()] * 2), (8 + base_index), (path.copy() + [get_index()])])
        range_list.append([start_time, (timestamp - 1)])
    semantics.append({'type': 'unknown', 'range': range_list, 'treeIndex': (7 + base_index)})
    return qc
qc = get_cir(10, path=path, base_index=
(base_index + 1))
import json
gate_info = {'qubit': qc.num_qubits, 'gates': gates}
with open('C:\\Users\\61049\\AppData\\Local\\Temp\\tmp-6880-VmPzzdd6Dqcw\\W_state_gates.json', 'w') as f:
    json.dump(gate_info, f)
with open('C:\\Users\\61049\\AppData\\Local\\Temp\\tmp-6880-VmPzzdd6Dqcw\\W_state_semantics.json', 'w') as f:
    json.dump(semantics, f)
