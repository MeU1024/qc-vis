from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
import random
import math
import numpy as np


def carry(qc, c0, a, b, c1):
    qc.ccx(a, b, c1)
    qc.cx(a, b)
    qc.ccx(c0, b, c1)


def uncarry(qc, c0, a, b, c1):
    qc.ccx(c0, b, c1)
    qc.cx(a, b)
    qc.ccx(a, b, c1)


def carry_sum(qc, c0, a, b):
    qc.cx(a, b)
    qc.cx(c0, b)


def adder(qc, qubits):
    n = int(len(qubits) / 3)
    c = qubits[0::3]
    a = qubits[1::3]
    b = qubits[2::3]
    for i in range(0, n - 1):
        carry(qc, c[i], a[i], b[i], c[i + 1])
    carry_sum(qc, c[n - 1], a[n - 1], b[n - 1])
    for i in range(n - 2, -1, -1):
        uncarry(qc, c[i], a[i], b[i], c[i + 1])
        carry_sum(qc, c[i], a[i], b[i])


def multiplier(qc, qubits):
    n = int(len(qubits) / 5)
    a = qubits[1:n * 3:3]
    y = qubits[n * 3:n * 4]
    x = qubits[n * 4:]

    for i, x_i in enumerate(x):
        for a_qubit, y_qubit in zip(a[i:], y[:n - i]):
            qc.ccx(x_i, y_qubit, a_qubit)
        adder(qc, qubits[:3 * n])
        for a_qubit, y_qubit in zip(a[i:], y[:n - i]):
            qc.ccx(x_i, y_qubit, a_qubit)


def init_bits(qc, x_bin, *qubits):
    indexes = np.where(np.array(list(x_bin)) == '1')[0]
    r_qubits = list(qubits)[::-1]
    for i in indexes:
        qc.x(r_qubits[i])


def get_cir(n):
    n_qubits = 5 * n
    qr = QuantumRegister(n_qubits)
    qc = QuantumCircuit(qr)

    maxv = math.floor(math.sqrt(2 ** (n)))
    p = random.randint(1, maxv)
    q = random.randint(1, maxv)

    y_bin = '{:08b}'.format(p)[-n:]
    x_bin = '{:08b}'.format(q)[-n:]

    b = qr[2:n * 3:3]
    y = qr[n * 3:n * 4]
    x = qr[n * 4:]

    init_bits(qc, x_bin, *x)
    init_bits(qc, y_bin, *y)
    multiplier(qc, qr)
    return qc

qc = get_cir(4)
