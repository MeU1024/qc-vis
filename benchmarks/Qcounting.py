import random

from qiskit import QuantumCircuit
import numpy as np


def example_grover_iteration():
    """Small circuit with 5/16 solutions"""
    # Do circuit
    qc = QuantumCircuit(4)
    # Oracle
    qc.h([2, 3])
    qc.ccx(0, 1, 2)
    qc.h(2)
    qc.x(2)
    qc.ccx(0, 2, 3)
    qc.x(2)
    qc.h(3)
    qc.x([1, 3])
    qc.h(2)
    qc.mct([0, 1, 3], 2)
    qc.x([1, 3])
    qc.h(2)
    # Diffuser
    qc.h(range(3))
    qc.x(range(3))
    qc.z(3)
    qc.mct([0, 1, 2], 3)
    qc.x(range(3))
    qc.h(range(3))
    qc.z(3)
    return qc


def qft(n):
    """Creates an n-qubit QFT circuit"""
    circuit = QuantumCircuit(4)

    def swap_registers(circuit, n):
        for qubit in range(n // 2):
            circuit.swap(qubit, n - qubit - 1)
        return circuit

    def qft_rotations(circuit, n):
        """Performs qft on the first n qubits in circuit (without swaps)"""
        if n == 0:
            return circuit
        n -= 1
        circuit.h(n)
        for qubit in range(n):
            circuit.cp(np.pi / 2 ** (n - qubit), qubit, n)
        qft_rotations(circuit, n)

    qft_rotations(circuit, n)
    swap_registers(circuit, n)
    return circuit


def get_cir(t, n):
    grit = example_grover_iteration().to_gate()
    grit.label = "Grover"
    cgrit = grit.control()
    qft_dagger = qft(4).to_gate().inverse()
    qft_dagger.label = "QFT†"
    qc = QuantumCircuit(n + t)  # Circuit with n+t qubits and t classical bits

    # Initialize all qubits to |+>
    for qubit in range(t + n):
        qc.h(qubit)

    # Begin controlled Grover iterations
    iterations = 1
    for qubit in range(t):
        for i in range(iterations):
            qc.append(cgrit, [qubit] + [*range(t, n + t)])
        iterations *= 2

    # Do inverse QFT on counting qubits
    qc.append(qft_dagger, range(t))
    return qc