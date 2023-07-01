import random
import numpy as np
from qiskit import QuantumCircuit


def H(qc, n):
    for i in range(n):
        qc.h(i)


def Cost(qc, V, E, gamma):
    for _index, (k, l, weight) in enumerate(E):
        qc.cp(-2 * gamma * weight, k, l)
        qc.p(gamma * weight, k)
        qc.p(gamma * weight, l)
    return qc


def Mixing(qc, V, E, beta):
    for i in range(len(V)):
        qc.rx(2 * beta, i)
    return qc


def CM(qc, V, E, gammas, betas):
    Cost(qc, V, E, gammas[0])
    Mixing(qc, V, E, betas[0])


def initQAOA(n):
    p = 5
    gammas = [.4]
    betas = [.8]
    V = range(n)
    E = []
    for _ in range(random.randint(n / 2, n)):
        sample = random.sample(range(0, n), 2)
        E.append((sample[0], sample[1], random.random()))
    return p, gammas, betas, V, E


def QAOA(n):
    p, gammas, betas, V, E = initQAOA(n)
    qc = QuantumCircuit(len(V), len(V))
    H(qc, len(V))
    for i in range(p):
        CM(qc, V, E, gammas, betas)
    return qc


qc = QAOA(50)
