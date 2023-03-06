import * as qv from '../../quantivine';
import {ComponentGate} from '../structurelib/qcmodel';

export type AbstractionType =
  | 'normal'
  | 'vertical'
  | 'horizontal'
  | 'diagonal'
  | 'linkage';

export class AbstractionRule {
  static apply(
    gates: ComponentGate[],
    sem: Semantics
  ): Abstraction | undefined {
    if (!AbstractionRule._checkVisible(sem)) {
      return;
    }

    if (sem.type === 'vertical') {
      return AbstractionRule._vertical(gates, sem);
    }

    if (sem.type === 'diagonal') {
      return AbstractionRule._diagonal(gates, sem);
    }

    if (sem.type === 'horizontal') {
      return AbstractionRule._horizontal(gates, sem);
    }

    if (sem.type === 'linkage') {
      return AbstractionRule._linkage(gates, sem);
    }

    if (sem.type === 'normal') {
      return AbstractionRule._normal(gates, sem);
    }

    return;
  }

  private static _vertical(
    gates: ComponentGate[],
    sem: Semantics
  ): Abstraction | undefined {
    return new Abstraction(gates, 'vertical', sem.step);
  }

  private static _diagonal(
    gates: ComponentGate[],
    sem: Semantics
  ): Abstraction | undefined {
    return new Abstraction(gates, 'diagonal', sem.step);
  }

  private static _horizontal(circuit: any, sem: any): Abstraction | undefined {
    return;
  }

  private static _linkage(circuit: any, sem: any): Abstraction | undefined {
    return;
  }

  private static _normal(
    gates: ComponentGate[],
    sem: Semantics
  ): Abstraction | undefined {
    return new Abstraction(gates, 'normal', 1);
  }

  private static _checkVisible(sem: Semantics): boolean {
    let treeIndex = sem.treeIndex;

    return (
      qv.semanticTreeViewer.isVisible(treeIndex) &&
      !qv.semanticTreeViewer.isExpanded(treeIndex)
    );
  }
}

export class Abstraction {
  gates: ComponentGate[];
  type: AbstractionType;
  step: number;
  info: string;

  constructor(gates: any, type: AbstractionType, stepSize: number) {
    this.gates = gates;
    this.info = 'Abstracted';
    this.type = type;
    this.step = stepSize;
  }

  get start() {
    return this.gates.slice(0, this.step);
  }

  get end() {
    return this.gates.slice(this.gates.length - this.step, this.gates.length);
  }
}

export class Semantics {
  constructor(
    readonly type: AbstractionType,
    readonly range: number[],
    readonly treeIndex: number
  ) {}

  get step() {
    return this.range[2];
  }
}
