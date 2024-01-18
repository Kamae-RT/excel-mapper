import { describe, expect, it } from 'vitest'
import {
  type ColumnConfig,
  getColumns,
  getLeaves,
  getMerges,
  invertMatrix,
  maxDepth,
  padHeaders,
} from '../src'

const exampleConfig: ColumnConfig = {
  key: '',
  columns: [
    {
      key: 'a',
      columns: [{ key: 'aa' }, { key: 'ab' }],
    },
    {
      key: 'b',
      columns: [{ key: 'ba' }],
    },
    {
      key: 'c',
      columns: [{ key: 'ca' }, { key: 'cb' }],
    },
  ],
}

const deepExample: ColumnConfig = {
  key: '',
  columns: [
    {
      key: 'a',
      columns: [{ key: 'aa' }, { key: 'ab' }],
    },
    {
      key: 'b',
      columns: [{ key: 'ba' }],
    },
    {
      key: 'c',
      columns: [
        {
          key: 'ca',
          columns: [
            {
              key: 'caa',
              columns: [{ key: 'caaa' }],
            },
          ],
        },
        { key: 'cb' },
      ],
    },
  ],
}

describe('tree Operations', () => {
  it('should find max depth', () => {
    expect(maxDepth({ key: '' })).toBe(0)
    expect(maxDepth(exampleConfig)).toBe(2)
    expect(maxDepth(deepExample)).toBe(4)
  })

  it('keeps tree chain when flattening', () => {
    const expected: ColumnConfig[][] = [
      [{ key: 'a' }, { key: 'aa' }],
      [{ key: 'a' }, { key: 'ab' }],
      [{ key: 'b' }, { key: 'ba' }],
      [{ key: 'c' }, { key: 'ca' }, { key: 'caa' }, { key: 'caaa' }],
      [{ key: 'c' }, { key: 'cb' }],
    ]

    const actual = getColumns(deepExample)
    const simplifiedActual = actual.map(r =>
      r.map(rr => ({ key: rr.key })),
    )
    expect(simplifiedActual).toStrictEqual(expected)
  })

  it('leaves', () => {
    const expected: ColumnConfig[] = [
      { key: 'aa' },
      { key: 'ab' },
      { key: 'ba' },
      { key: 'caaa' },
      { key: 'cb' },
    ]

    const actual = getLeaves(deepExample)
    const simplifiedActual = actual.map(rr => ({ key: rr.key }))

    expect(simplifiedActual).toStrictEqual(expected)
  })

  it('merge intervals', () => {
    const md = maxDepth(exampleConfig)
    const cols = getColumns(exampleConfig)

    padHeaders(cols, md)

    const merges = getMerges(cols)
    const expected = [
      { row: 0, x: 0, y: 1 },
      { row: 0, x: 3, y: 4 },
    ]

    expect(merges).toStrictEqual(expected)
  })
})

describe('test matrix', () => {
  it('invert square matrix', () => {
    const input = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
    ]

    const expected = [
      ['1', '4', '7'],
      ['2', '5', '8'],
      ['3', '6', '9'],
    ]

    expect(invertMatrix(input)).toStrictEqual(expected)
  })

  it('invert non-square matrix', () => {
    const input = [
      ['1', '2', '3', '4'],
      ['5', '6', '7', '8'],
      ['9', '10', '11', '12'],
    ]

    const expected = [
      ['1', '5', '9'],
      ['2', '6', '10'],
      ['3', '7', '11'],
      ['4', '8', '12'],
    ]

    expect(invertMatrix(input)).toStrictEqual(expected)
  })
})
