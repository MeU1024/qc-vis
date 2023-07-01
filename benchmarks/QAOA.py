import random
import numpy as np
from qiskit import QuantumCircuit


def initialize_qaoa(V, E):
    qc = QuantumCircuit(len(V), len(V))
    for i in range(len(V)):
        qc.h(i)
    return qc


def apply_cost_hamiltonian(qc, V, E, gamma):
    choice = random.randint(0, len(E)-1)
    for _index, (k, l, weight) in enumerate(E):
        qc.cp(-2*gamma*weight, k, l)
        qc.p(gamma*weight, k)
        qc.p(gamma*weight, l)
    return qc


def apply_mixing_hamiltonian(qc, V, E, beta):
    for i in range(len(V)):
        qc.rx(2*beta, i)
    return qc


def construct_full_qaoa(p, gammas, betas, V, E):
    qc = initialize_qaoa(V, E)
    for i in range(p):
        qc = apply_cost_hamiltonian(qc, V, E, gammas[0])
        qc = apply_mixing_hamiltonian(qc, V, E, betas[0])
    return qc


def get_cir(n):
    E = []
    for _ in range(random.randint(n/2, n)):
        sample = random.sample(range(0, n), 2)
        E.append((sample[0], sample[1], random.random()))
    qc = construct_full_qaoa(5, [.4], [.8], range(n), E)
    return qc

qc = get_cir(50)
