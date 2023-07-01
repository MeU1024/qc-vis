from qiskit import QuantumCircuit, QuantumRegister
import numpy as np


def QuGAN(qubit_count):
    qr = QuantumRegister(qubit_count)
    circuit = QuantumCircuit(qr)
    Discriminator(circuit, qr)
    Generator(circuit, qr)
    SwapTest(circuit, qr)
    return circuit


def Unitary(circuit, qr):
    for qubit in list(qr):
        circuit.ry(np.random.rand() * np.pi, qubit)
    ra, rb = qr[:-1], qr[1:]
    for _index, (qa, qb) in enumerate(zip(ra, rb)):
        circuit.ryy(np.random.rand() * np.pi, qa, qb)


def Entanglement(circuit, qr):
    ra, rb = qr[:-1], qr[1:]
    for _index, (qa, qb) in enumerate(zip(ra, rb)):
        circuit.cry(np.random.rand() * np.pi, qa, qb)


def Discriminator(circuit, qr):
    qubit_list = list(qr)[1:]
    s = qubit_list[:len(qubit_list) // 2]
    Unitary(circuit, s)
    Entanglement(circuit, s)


def Generator(circuit, qr):
    qubit_list = list(qr)[1:]
    s = qubit_list[len(qubit_list) // 2:]
    Unitary(circuit, s)
    Entanglement(circuit, s)


def cSWAPs(circuit, qr):
    qubit_list = list(qr)[1:]
    q1 = qubit_list[:len(qubit_list) // 2]
    q2 = qubit_list[len(qubit_list) // 2:]
    for q_1, q_2 in zip(q1, q2):
        circuit.cswap(qr[0], q_1, q_2)


def SwapTest(circuit, qr):
    circuit.h(0)
    cSWAPs(circuit, qr)
    circuit.h(0)


qc = QuGAN(99)
