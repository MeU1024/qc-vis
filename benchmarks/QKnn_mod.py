from pydantic import EnumMemberError
from qiskit import QuantumRegister, ClassicalRegister, QuantumCircuit
import numpy as np


quantum_register = None


def init(qubit_count):
    global quantum_register, circuit
    quantum_register = QuantumRegister(qubit_count)
    circuit = QuantumCircuit(quantum_register)
    return circuit


def data_load(circuit):
    for qubit in list(quantum_register)[1:]:
        circuit.ry(np.random.rand()*np.pi, qubit)


def swap_test(circuit):
    circuit.h(0)
    qubit_list = list(quantum_register)[1:]
    q1 = qubit_list[:len(qubit_list)//2]
    q2 = qubit_list[len(qubit_list)//2:]
    for _index, (q_1, q_2) in enumerate(zip(q1, q2)):
        circuit.cswap(quantum_register[0], q_1, q_2)
    circuit.h(0)


def get_cir(n_qubits):
    qc = init(n_qubits)
    data_load(qc)
    swap_test(qc)
    return qc


qc = get_cir(5)
