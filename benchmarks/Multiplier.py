from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
import random
import math
import numpy as np


def Carry(qc, c0, a, b, c1):
    qc.ccx(a, b, c1)
    qc.cx(a, b)
    qc.ccx(c0, b, c1)


def Uncarry(qc, c0, a, b, c1):
    qc.ccx(c0, b, c1)
    qc.cx(a, b)
    qc.ccx(a, b, c1)


def CarrySum(qc, c0, a, b):
    qc.cx(a, b)
    qc.cx(c0, b)


def Adder(qc, qubits):
    n = int(len(qubits) / 3)
    c = qubits[0::3]
    a = qubits[1::3]
    b = qubits[2::3]
    for i in range(0, n - 1):
        Carry(qc, c[i], a[i], b[i], c[i + 1])
    CarrySum(qc, c[n - 1], a[n - 1], b[n - 1])
    for i in range(n - 2, -1, -1):
        Uncarry(qc, c[i], a[i], b[i], c[i + 1])
        CarrySum(qc, c[i], a[i], b[i])


def CAdder(qc, qubits, i, x_i):
    n = int(len(qubits) / 5)
    a = qubits[1:n * 3:3]
    y = qubits[n * 3:n * 4]
    for a_qubit, y_qubit in zip(a[i:], y[:n - i]):
        qc.ccx(x_i, y_qubit, a_qubit)
    Adder(qc, qubits[:3 * n])
    for a_qubit, y_qubit in zip(a[i:], y[:n - i]):
        qc.ccx(x_i, y_qubit, a_qubit)


def Multiplier(qc, qubits):
    n = int(len(qubits) / 5)
    x = qubits[n * 4:]
    for i, x_i in enumerate(x):
        CAdder(qc, qubits, i, x_i)


def InitBits(qc, x_bin, *qubits):
    indexes = np.where(np.array(list(x_bin)) == '1')[0]
    r_qubits = list(qubits)[::-1]
    for i in indexes:
        qc.x(r_qubits[i])


def QuantumMultiplier(n):
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

    InitBits(qc, x_bin, *x)
    InitBits(qc, y_bin, *y)
    Multiplier(qc, qr)
    return qc


qc = QuantumMultiplier(3)
