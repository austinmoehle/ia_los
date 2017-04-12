/* @flow */

import _ from 'lodash';
import {gridCastRay} from './RayCast';

export type Cell = 'Empty' | 'Blocking' | 'Source' | 'Target' | 'OutOfBounds';
export type Corner = 'TopLeft' | 'TopRight' | 'BottomLeft' | 'BottomRight';
export type Edge = 'Clear' | 'Blocked';
export type EdgeDirection = 'Down' | 'Right';
export const CORNERS = ['TopLeft', 'TopRight', 'BottomLeft', 'BottomRight'];

export type Point = {
  x: number,
  y: number,
};
export type LineOfSightResult = {
  hasLineOfSight: bool,
  sourceCorner: ?Corner,
  targetCorners: ?[Corner],
};
export type RayCastPoint = {
  x: number,
  y: number,
  corner: Corner,
};
export type RayCheckResult = {
  blocked: bool,
};

function cellPointToCornerPoint(
  cellPoint: Point,
  corner: Corner,
): Point {
  return {
    x: cellPoint.x + ((corner === 'TopLeft' || corner === 'BottomLeft') ? 0 : 1),
    y: cellPoint.y + ((corner === 'TopLeft' || corner === 'TopRight') ? 0 : 1),
  };
}

export default class Board {
  width: number;
  height: number;
  board: Array<Cell>;

  constructor(width: number, height: number, board: Array<Cell>) {
    this.height = height;
    this.width = width;
    this.board = board;
  }

  getCell(x: number, y: number): Cell {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return 'OutOfBounds';
    }
    return this.board[x + y * this.width];
  }
  getEdge(x: number, y: number, dir: EdgeDirection): Edge {
    if (x < 0 || x > this.width || y < 0 || y > this.height) {
      throw new Error(`bad coordinate (${x}, ${y})`);
    }
    let cell = this.getCell(x, y);
    if (cell === 'Blocking' || cell === 'OutOfBounds') {
      return 'Blocked';
    }
    if (dir === 'Down') {
      x = x - 1;
      if (x < 0) {
        return 'Blocked';
      }
    } else {
      y = y - 1;
      if (y < 0) {
        return 'Blocked';
      }
    }
    cell = this.getCell(x, y);
    if (cell === 'Blocking' || cell === 'OutOfBounds') {
      return 'Blocked';
    }
    return 'Clear';
  }

  /*
   * x and y are in square or cell space
   * (0, 0) to (width, height) exclusive
   */
  checkLineOfSight(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
  ): LineOfSightResult {
    const results = CORNERS.map(sourceCorner => {
      return _.flatMap(CORNERS, targetCorner => {
        const {blocked} = this.checkRay(
          {x: sourceX, y: sourceY, corner: sourceCorner},
          {x: targetX, y: targetY, corner: targetCorner},
        );
        if (blocked) {
          return [];
        }
        return {sourceCorner, targetCorner};
      });
    });
    console.log(results);

    let hasLineOfSight = false;
    let sourceCorner = null;
    let targetCorners = null;
    return {
      hasLineOfSight,
      sourceCorner,
      targetCorners,
    };
  }

  /* x and y are in corner space, (0, 0) to (width, height) inclusive */
  checkRay(
    source: RayCastPoint,
    dest: RayCastPoint,
  ): RayCheckResult {
    let sourcePoint = cellPointToCornerPoint({x: source.x, y: source.y}, source.corner);
    let destPoint = cellPointToCornerPoint({x: dest.x, y: dest.y}, dest.corner);

    //console.log('checkRay', sourcePoint, destPoint)

    const blocked = !!gridCastRay(
      sourcePoint.x,
      sourcePoint.y,
      destPoint.x,
      destPoint.y,
      (x, y) => {
        const cell = this.getCell(x, y);
        //console.log(x, y, cell);
        if (cell === 'Empty' || cell === 'Source' || cell === 'Target') {
          return;
        }
        //console.log('blocked by', x, y);
        return true;
      },
    );
    return {blocked};
  }

  /* x and y are in cell space */
  areCellsConnected(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
  ): bool {
    throw new Error('unimplemented');
  }
}

export function boardFromRows(rows: Array<Array<string>>): Board {
  const INPUT_TO_CELL_MAP = {
    '-': 'Empty',
    'X': 'Blocking',
  };

  const height = rows.length;
  const width = rows[0].length;
  rows.forEach((row, i) => {
    if (row.length !== width) {
      throw new Error(`Row ${i} has invalid length ${row.length}; expected ${width}`);
    }
  });

  const flattenedBoard = _.flatten(rows).map((x, i) => {
    const ret = INPUT_TO_CELL_MAP[x];
    if (!ret) {
      const x = i % width;
      const y = Math.floor(i / width);
      throw new Error(`bad input at (${x}, ${y}): '${x}'`);
    }
    return ret;
  });

  return new Board(width, height, flattenedBoard);
}
