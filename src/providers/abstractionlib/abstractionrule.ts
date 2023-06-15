import * as qv from '../../quantivine';
import { ComponentGate } from '../structurelib/qcmodel';

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
    let semType = sem.type.toLocaleLowerCase();

    if (['vertical', 'horizontal', 'diagonal'].includes(semType)) {
      return AbstractionRule._directional(gates, sem);
    }

    // if (sem.type === 'linkage') {
    //   return AbstractionRule._linkage(gates, sem);
    // }

    // if (sem.type === 'normal') {
    //   return AbstractionRule._normal(gates, sem);
    // }

    return;
  }

  private static _directional(
    gates: ComponentGate[],
    sem: Semantics
  ): Abstraction | undefined {
    return new Abstraction(gates, sem.type, sem.range);
  }

  // private static _linkage(
  //   gates: ComponentGate[],
  //   sem: Semantics
  // ): Abstraction | undefined {
  //   return;
  // }

  // private static _normal(
  //   gates: ComponentGate[],
  //   sem: Semantics
  // ): Abstraction | undefined {
  //   return new Abstraction(gates, 'normal', 1);
  // }

  private static _checkVisible(sem: Semantics): boolean {
    let treeIndex = sem.treeIndex;

    return (
      qv.semanticTreeViewer.isVisible(treeIndex)
      // && !qv.semanticTreeViewer.isExpanded(treeIndex)
    );
  }
}

export class Abstraction {
  gates: ComponentGate[];
  type: AbstractionType;
  info: string;
  // step: number;
  range: number[][];
  startTime: number;
  endTime: number;
  length: number;

  // constructor(gates: any, type: AbstractionType, stepSize: number) {
  constructor(gates: any, type: AbstractionType, range: number[][]) {
    this.gates = gates;
    this.info = 'Abstracted';
    this.type = type;
    // this.step = stepSize;
    this.range = range;
    this.startTime = gates[0].range[0];
    this.endTime = gates[gates.length - 1].range[1];
    this.length = this.endTime - this.startTime + 1;
  }

  get start() {
    // return this.slice(0, this.step - 1);
    return this.slice(this.range[0][0], this.range[0][1]);
  }

  get second() {
    if (this.range.length <= 2) {
      return [];
    }
    return this.slice(this.range[1][0], this.range[1][1]);
  }

  get end() {
    // return this.slice(this.length - this.step, this.length - 1);
    return this.slice(this.range[this.range.length - 1][0], this.range[this.range.length - 1][1]);
  }

  slice(start: number, end: number) {
    // if (start < 0 || end > this.length) {
    if (start > end) {
      return [];
    }

    let ret: ComponentGate[] = [];
    this.gates.forEach((gate: ComponentGate) => {
      if (gate.range[0] >= start && gate.range[1] <= end) {
        ret.push(gate);
      }
    });
    return ret;
  }
}

export class Semantics {
  constructor(
    readonly type: AbstractionType,
    readonly range: number[][],
    readonly treeIndex: number
  ) { }

  // get step() {
  //   return this.range[2];
  // }
}
