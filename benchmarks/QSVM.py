from qiskit import QuantumCircuit, QuantumRegister
import numpy as np


def init(qubit_count):
    quantum_register = QuantumRegister(qubit_count)
    circuit = QuantumCircuit(quantum_register)
    hadamard_circuit(circuit, quantum_register)
    phase_addition(circuit, quantum_register)
    hadamard_circuit(circuit, quantum_register)
    return circuit


def hadamard_circuit(circuit, quantum_register):
    for qubit in quantum_register:
        circuit.h(qubit)


def phase_addition(circuit, quantum_register):
    for qubit in quantum_register:
        circuit.p(np.random.rand() * np.pi, qubit)
    for _index, (cqubit, aqubit) in enumerate(zip(quantum_register[:-1], quantum_register[1:])):
        circuit.cx(cqubit, aqubit)
        circuit.rz(np.random.rand() * np.pi, aqubit)
        circuit.cx(cqubit, aqubit)
    iterables = list(quantum_register).copy()
    iterables.reverse()
    l1 = iterables[:-1]
    l2 = iterables[1:]
    for a1, a2 in zip(l1, l2):
        circuit.cx(a2, a1)
        circuit.rz(np.random.rand() * np.pi, a1)
        circuit.cx(a2, a1)
    for qubit in quantum_register:
        circuit.rz(np.random.rand() * np.pi, qubit)


def get_cir(n_qubits):
    circuit = init(n_qubits)
    return circuit


qc = get_cir(3)
