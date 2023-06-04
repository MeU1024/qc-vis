
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
    start_time = timestamp
    for i in range(0, (n - 1)):
        F_gate(qc, ((n - 1) - i), ((n - 2) - i), n, (i + 1), path=path, base_index=
        (base_index + 3))
    semantics.append({'type': 'unknown', 'range': [start_time, (timestamp - 1)], 'treeIndex': (2 + base_index)})
    start_time = timestamp
    for i in range(0, (n - 1)):
        qc.cx(((n - 2) - i), ((n - 1) - i))
        gates.append(['cx', [(((n - 2) - i) if (type(((n - 2) - i)) == int) else ((n - 2) - i).index), (((n - 1) - i) if (type(((n - 1) - i)) == int) else ((n - 1) - i).index)], ([get_timestamp()] * 2), (8 + base_index), (path.copy() + [get_index()])])
    semantics.append({'type': 'unknown', 'range': [start_time, (timestamp - 1)], 'treeIndex': (7 + base_index)})
    return qc
qc = get_cir(10, path=path, base_index=
(base_index + 1))
import json
gate_info = {'qubit': qc.num_qubits, 'gates': gates}
with open('D://goodluck//resources_new//W_state_gates.json', 'w') as f:
    json.dump(gate_info, f)
with open('D://goodluck//resources_new//W_state_semantics.json', 'w') as f:
    json.dump(semantics, f)
