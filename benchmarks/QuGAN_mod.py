from qiskit import QuantumCircuit, QuantumRegister
import numpy as np


def __init__(qubit_count):
    quantum_register = QuantumRegister(qubit_count)
    circuit = QuantumCircuit(quantum_register)
    data_load(circuit, quantum_register)
    swap_test(circuit, quantum_register)
    generate_samples(quantum_register)
    return circuit


def data_load(circuit, quantum_register):
    for qubit in list(quantum_register)[1:]:
        circuit.ry(np.random.rand() * np.pi, qubit)
    qubit_list = list(quantum_register)[1:]
    s1 = qubit_list[:len(qubit_list) // 2]
    s1_a, s1_b = s1[:-1], s1[1:]
    s2 = qubit_list[len(qubit_list) // 2:]
    s2_a, s2_b = s2[:-1], s2[1:]
    choice = np.random.randint(0, len(s1_a))
    for _index, (qa, qb) in enumerate(zip(s1_a, s1_b)):
        circuit.ryy(np.random.rand() * np.pi, qa, qb)
        circuit.cry(np.random.rand() * np.pi, qa, qb)
    for qa, qb in zip(s2_a, s2_b):
        circuit.ryy(np.random.rand() * np.pi, qa, qb)
        circuit.cry(np.random.rand() * np.pi, qa, qb)


def swap_test(circuit, quantum_register):
    circuit.h(0)
    qubit_list = list(quantum_register)[1:]
    q1 = qubit_list[:len(qubit_list) // 2]
    q2 = qubit_list[len(qubit_list) // 2:]
    for q_1, q_2 in zip(q1, q2):
        circuit.cswap(quantum_register[0], q_1, q_2)
    circuit.h(0)


def generate_samples(quantum_register):
    qubit_list = list(quantum_register)[1:]
    s2 = qubit_list[len(qubit_list) // 2:]


# 大于等于3的奇数
def get_cir(n_qubits):
    circuit = __init__(n_qubits)
    return circuit

qc = get_cir(5)