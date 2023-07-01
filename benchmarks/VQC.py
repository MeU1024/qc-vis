from re import sub
from secrets import choice
from qiskit import QuantumCircuit, QuantumRegister
import numpy as np


def init(qubit_count):
    qubit_count = qubit_count
    quantum_register = QuantumRegister(qubit_count)
    circuit = QuantumCircuit(quantum_register)
    hadamard_circuit(circuit, quantum_register)
    phase_addition(circuit, quantum_register)
    learnable_layers(circuit, quantum_register, 4, qubit_count)
    return circuit


def hadamard_circuit(circuit, quantum_register):
    for qubit in quantum_register:
        circuit.h(qubit)


def phase_addition(circuit, quantum_register):
    choice = np.random.randint(0, len(quantum_register[:-1]))
    for qubit in quantum_register:
        circuit.rz(np.random.rand() * np.pi, qubit)
    for _index, (cqubit, aqubit) in enumerate(zip(quantum_register[:-1], quantum_register[1:])):
        circuit.cx(cqubit, aqubit)
        circuit.rz(np.random.rand() * np.pi, aqubit)
        circuit.cx(cqubit, aqubit)


def learnable_layers(circuit, quantum_register, layer_count, qubit_count):
    for _ in range(layer_count):
        for qubit in quantum_register:
            circuit.ry(np.random.rand() * np.pi, qubit)
            circuit.rz(np.random.rand() * np.pi, qubit)
        qbs = list(quantum_register)
        for i, qb in enumerate(qbs):
            for j in range(i + 1, qubit_count):
                circuit.cz(qb, qbs[j])


def get_cir(n_qubits):
    circuit = init(n_qubits)
    return circuit


qc = get_cir(5)
