//essential sorting 
import React from 'react';
import type { LatestRow, FeeNotional } from '../tier types';
import './styles/style.css';
import { formatNumber, formateDate, EM_DASH } from '../utilities/format';
import SortIcon from './SortIcon';

//how we want to sort the data 
export type SortKey = 'maker' | 'taker';
export type SortDir = 'asc' | 'desc';


interface Props {
  rows: LatestRow[];
  notional: FeeNotional;
  sortKey: SortKey | null;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  emDash?: string;
}

// this part is for the table structure 

export default function FeeTable({
  rows,
  notional,
  sortKey,
  sortDir,
  onToggleSort,
  emDash = EM_DASH,
}: Props) {
  const dirFor = (col: SortKey) => (sortKey === col ? sortDir : null);

  return (
    <div className="table-wrap">
      <table className="fees-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Source</th>
            <th
              className="th-clickable"
              onClick={() => onToggleSort('maker')}
              aria-sort={
                sortKey === 'maker'
                  ? (sortDir === 'asc' ? 'ascending' : 'descending')
                  : 'none'
              }
            >
              <span>Maker ({notional})</span>
              <SortIcon dir={dirFor('maker')} />
            </th>
            <th
              className="th-clickable"
              onClick={() => onToggleSort('taker')}
              aria-sort={
                sortKey === 'taker'
                  ? (sortDir === 'asc' ? 'ascending' : 'descending')
                  : 'none'
              }
            >
              <span>Taker ({notional})</span>
              <SortIcon dir={dirFor('taker')} />
            </th>
            <th>Datetime</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="td" colSpan={5}>No results</td>
            </tr>
          ) : (
            rows.map((r, i) => (
              <tr key={`${r.symbol}-${r.source}-${i}`}>
                <td className="td">{r.symbol}</td>
                <td className="td td-muted">{r.source}</td>
                <td className="td">{formatNumber(r.fees?.maker?.[notional], 6, emDash)}</td>
                <td className="td">{formatNumber(r.fees?.taker?.[notional], 6, emDash)}</td>
                <td className="td td-muted">{formateDate(r.datetime, emDash)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
