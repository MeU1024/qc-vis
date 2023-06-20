import random
from qiskit import QuantumCircuit
import math


pi = math.pi


def diffuse(qc, n):
    for j in range(0, n):
        qc.h(j)
    for j in range(0, n):
        qc.x(j)
    for j in range(0, n - 1):
        qc.reset(2 * n + 1 + j)
    qc.ccx(1, 0, 2 * n + 1)
    for j in range(1, n - 1):
        qc.ccx(2 * n + 1 + j - 1, j + 1, 2 * n + 1 + j)
    qc.z(2 * n + 1 + n - 2)
    for j in range(n - 2, 0, -1):
        qc.ccx(2 * n + 1 + j - 1, j + 1, 2 * n + 1 + j)
    qc.ccx(1, 0, 2 * n + 1)
    for j in range(0, n):
        qc.x(j)
    for j in range(0, n):
        qc.h(j)


def EQxMark(qc, tF, n):
    for j in range(0, n):
        if j != 1:
            qc.x(n + j)
    for j in range(0, n - 1):
        qc.reset(2 * n + 1 + j)
    qc.ccx(n + 1, n, 2 * n + 1)
    for j in range(1, n - 1):
        qc.ccx(2 * n + 1 + j - 1, n + j + 1, 2 * n + 1 + j)
    if tF != 0:
        qc.cx(2 * n + 1 + n - 2, 2 * n)
    else:
        qc.z(2 * n + 1 + n - 2)
    for j in range(n - 2, 0, -1):
        qc.ccx(2 * n + 1 + j - 1, n + j + 1, 2 * n + 1 + j)
    qc.ccx(n + 1, n, 2 * n + 1)
    for j in range(0, n):
        if j != 1:
            qc.x(n + j)


def Sqr(qc, n):
    # sub_circuit = QuantumCircuit(qc.num_qubits)
    for i in range(0, ((n - 1) // 2) + 1):
        k = i * 2
        qc.cx(i, n + k)
    for i in range(((n + 1) // 2), n):
        k = 2 * i - n
        qc.cx(i, n + k)
        qc.cx(i, n + k + 1)

    # qc.compose(sub_circuit, inplace=True)


def get_cir(n_qubits):
    n = n_qubits // 3
    qc = QuantumCircuit(n_qubits)
    N = 2 ** n
    nstep = math.floor((pi / 4) * math.sqrt(N))

    for i in range(0, n):
        qc.h(i)

    for istep in range(1, nstep + 1):
        Sqr(qc, n)
        EQxMark(qc, 0, n)
        Sqr(qc, n)
        diffuse(qc, n)

    Sqr(qc, n)
    EQxMark(qc, 1, n)
    return qc


qc = get_cir(9)
