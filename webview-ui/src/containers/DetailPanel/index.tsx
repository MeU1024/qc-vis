import {useEffect, useState} from 'react';
import BitsName from '../../components/BitsName';
import {CircuitAnnotator} from '../../components/CircuitAnnotator';
import {CircuitRender} from '../../components/CircuitRender';
import Circuit2GridData from '../../utilities/Circuit2GridData';

import data from '../../../data/vqc-10-detail-abstract.json';
export interface DetailPanelProps {
  theme: any;
  highlightGate: string | null;
}

const DetailPanel = (props: DetailPanelProps) => {
  const [qbitLengths, setQbitLength] = useState<string[]>([]);
  const [gridWidth, setGridWidth] = useState<number>(25);
  const [gridHeight, setGridHeight] = useState<number>(25);
  const [canvasWidth, setCanvasWidth] = useState(650);
  const [canvasHeight, setCanvasHeight] = useState(350);
  const [circuit, setCircuit] = useState<{
    output_size: number[];
    op_map: {};
    qubits: string[];
    gate_format: string;
    all_gates: (number | number[])[][];
  }>(data);

  const [panelTitle, setPanelTitle] = useState('Abstraction');

  const {theme, highlightGate} = props;

  //fetch data and modify canvas size
  useEffect(() => {
    // var gridSize =
    //   canvasWidth / circuit.output_size[1] <
    //   canvasHeight / circuit.output_size[0]
    //     ? canvasWidth / circuit.output_size[1]
    //     : canvasHeight / circuit.output_size[0];
    var gridSize = canvasHeight / circuit.output_size[0];
    gridSize = gridSize < 25 ? 25 : gridSize;

    setGridWidth(gridSize);
    setGridHeight(gridSize);
    setCanvasWidth(gridSize * circuit.output_size[1]);
    setCanvasHeight(gridSize * circuit.output_size[0]);
    // if (gridSize * circuit.output_size[0] < canvasWidth) {
    //   setGridHeight(canvasHeight / circuit.output_size[0]);
    // }
    setQbitLength(circuit.qubits);
  }, [circuit]);

  useEffect(() => {
    if (gridHeight !== null && gridWidth !== null) {
      const {graph, graphText} = Circuit2GridData(circuit);

      const canvas = document.getElementById('detailCanvas');
      if (canvas) {
        const ctx = (canvas as HTMLCanvasElement).getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.clearRect(
            0,
            0,
            (canvas as HTMLCanvasElement).width,
            (canvas as HTMLCanvasElement).height
          );
          CircuitRender({graph, ctx, gridWidth, gridHeight});
          CircuitAnnotator({graphText, ctx, gridWidth, gridHeight});
        }
      }
    }
  }, [gridWidth, theme, circuit, canvasHeight, canvasWidth]);

  useEffect(() => {
    const handleMessageEvent = (event: any) => {
      const message = event.data;
      switch (message.command) {
        case 'abstraction.setCircuit':
          setCircuit(message.data);
          console.log('abs', message.data);
          break;
        case 'abstraction.setCanvasSize':
          setCanvasWidth(message.data.width);
          setCanvasHeight(message.data.height);
          break;
        case 'abstraction.setTitle':
          setPanelTitle(message.data.title);
          break;
      }
    };
    window.addEventListener('message', handleMessageEvent);
    return () => {
      window.removeEventListener('message', handleMessageEvent);
    };
  }, []);

  return (
    <div className='panel abstraction-view'>
      <div className='panelHeader'>
        <span className='title'>{panelTitle}</span>
      </div>
      <div
        className='circuit'
        style={{
          gridTemplateColumns:
            ((gridHeight < 50 ? gridHeight : 50) * 1.2).toString() + 'px auto',
        }}
      >
        <BitsName
          qbitLengths={qbitLengths}
          alignment={'sub'}
          gridHeight={gridHeight}
        />
        <canvas
          id='detailCanvas'
          width={canvasWidth}
          height={canvasHeight}
        ></canvas>
      </div>
      <div className='divider'></div>
    </div>
  );
};

export default DetailPanel;
