import { Workbook } from 'exceljs'
import type { DataValidation, Style, Worksheet } from 'exceljs'

type Example = string | Date | boolean | number
export interface ColumnConfig {
  key: string
  prop?: string
  columns?: ColumnConfig[]

  style?: Style
  width?: number
  example?: Example
  validation?: DataValidation
}

export function createWorkbook(config: ColumnConfig): Workbook {
  const wb = new Workbook()
  const ws = wb.addWorksheet()

  const md = maxDepth(config)
  const cols = getColumns(config)
  padHeaders(cols, md)

  const columns = cols.map((c) => {
    const last = c[c.length - 1]

    const style = c.find(cc => !!cc.style)?.style
    const width = c.find(cc => !!cc.width)?.width

    return {
      header: [...c.map(cc => cc.key), exampleString(last.example)],
      style,
      width,
      key: last.key,
      validation: last.validation,
    }
  })

  ws.columns = columns

  // addValidations(ws, config, md);

  return wb
}

export function read<T>(ws: Worksheet, config: ColumnConfig): T[] {
  const md = maxDepth(config)
  const leaves = getLeaves(config)

  const data: T[] = []

  ws.eachRow((r, rowNumber) => {
    if (rowNumber <= md)
      return

    const t = {}

    for (let i = 0; i < leaves.length; i++) {
      const cell = r.getCell(i + 1)
      const prop = leaves[i].prop

      if (prop)
        Reflect.set(t, prop, cell)
    }

    data.push(t as T)
  })

  return data
}

export function maxDepth(node: ColumnConfig): number {
  return maxDepthTail(node, 0)
}

function maxDepthTail(node: ColumnConfig, acc: number): number {
  if (!node.columns || node.columns.length === 0)
    return acc

  return Math.max(...node.columns.map(c => maxDepthTail(c, acc + 1)))
}

export function getColumns(node: ColumnConfig): ColumnConfig[][] {
  return getColumnsTail(node, [])
}

function getColumnsTail(
  node: ColumnConfig,
  chain: ColumnConfig[],
): ColumnConfig[][] {
  if (!node.columns || node.columns.length === 0)
    return [chain]

  return node.columns.flatMap(c => getColumnsTail(c, [...chain, c]))
}

export function padHeaders(d: ColumnConfig[][], md: number) {
  for (let i = 0; i < d.length; i++) {
    const row = d[i]

    if (row.length < md) {
      const n = md - row.length

      const newRow: ColumnConfig[] = []
      for (let k = 0; k < n; k++) newRow.push({ key: '', prop: '' })

      d[i] = [row[0], ...newRow, ...row.slice(1)]
    }
  }
}

export function exampleString(example?: Example): string {
  if (typeof example === 'string')
    return example

  if (example instanceof Date)
    return example.toISOString()

  if (typeof example === 'boolean' || typeof example === 'number')
    return `${example}`

  return ''
}

export function getLeaves(node: ColumnConfig): ColumnConfig[] {
  if (!node.columns || node.columns.length === 0)
    return [node]

  return node.columns.flatMap(c => getLeaves(c))
}

interface MergeInterval {
  row: number
  x: number
  y: number
}

export function getMerges(columns: ColumnConfig[][]): MergeInterval[] {
  const intervals: MergeInterval[] = []

  let rows = []
  for (let i = 0; i < columns.length; i++) {
    const row = []

    for (let j = 0; j < columns[i].length; j++)
      row.push(columns[i][j].key)

    rows.push(row)
  }

  rows = invertMatrix(rows)

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r]

    let start = 0
    let end = 0

    for (let i = 1; i <= row.length; i++) {
      if (i === row.length || row[i] !== row[i - 1]) {
        // End of current interval
        end = i - 1

        if (start !== end)
          intervals.push({ row: r, x: start, y: end })

        if (i < row.length) {
          // Start a new interval
          start = i
          end = i
        }
      }
    }
  }

  return intervals
}

export function invertMatrix(matrix: string[][]): string[][] {
  const rows = matrix.length
  const cols = matrix[0].length

  const grid = []
  for (let j = 0; j < cols; j++)
    grid[j] = Array(rows)

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++)
      grid[j][i] = matrix[i][j]
  }
  return grid
}

// function addValidations(ws: Worksheet, config: ColumnConfig, md: number) {
//  const leaves = getLeaves(config);
//
//  for (let i = 0; i < leaves.length; i++) {
//    const c = columnLetter(i);
//
//    if (leaves[i].validation)
//      ws.dataValidations.add(`${c}${md}:${c}9999`, leaves[i].validation);
//  }
// }
//
// function columnLetter(i: number) {
//  return "A" + i; // TODO:
// }
