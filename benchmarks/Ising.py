from qiskit import QuantumCircuit
import random

Bx = 2.0
total_T = 15.0
M = 1
# random.seed(555)


def CZ(qc, q1, q2, phi):
    qc.rz(0.5 * phi, q2)
    qc.cx(q1, q2)
    qc.rz(-0.5 * phi, q2)
    qc.cx(q1, q2)


def ZcrossZ(qc, q1, q2, phi):
    qc.rz(phi, q1)
    qc.rz(-phi, q2)
    CZ(qc, q1, q2, -2.0 * phi)


def initialize(qc, N):
    for i in range(0, N):
        qc.h(i)


def red_hamiltonian(qc, m, N, J):

    for i in range(0, N - 1, 2):
        phi = J[i] * (2.0 * m - 1) / M
        ZcrossZ(qc, i, i + 1, phi)


def black_hamiltonian(qc, m, N, J):

    for i in range(1, N - 1, 2):
        phi = J[i] * (2.0 * m - 1) / M
        ZcrossZ(qc, i, i + 1, phi)


def Bz_hamiltonian(qc, m, N, Bz):

    for i in range(0, N):
        theta1 = (1.0 - (2.0 * m - 1.0) / M) * -2.0 * Bx * total_T / M
        theta2 = (1.0 - (2.0 * m - 1.0) / M) * -2.0 * Bz[i] * total_T / M
        qc.h(i)
        qc.rz(theta1, i)
        qc.h(i)
        qc.rz(theta2, i)


def get_cir(N):
    Bz = [random.uniform(-2.0, 2.0) for i in range(0, N)]
    J = [random.uniform(-2.0, 2.0) for i in range(0, N)]
    qc = QuantumCircuit(N, N)
    initialize(qc, N) 
    choice = random.randint(0, 2)
    for i in range(1, M + 1, N):
        red_hamiltonian(qc, i, N, J)
        black_hamiltonian(qc, i, N, J)
        Bz_hamiltonian(qc, i, N, Bz)
    return qc
