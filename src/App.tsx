//THE Core File for the Application AKA where the magic happens
//necessary imports 
import React, { useEffect, useState } from 'react';
import './styles/style.css';
import type { RawRow, LatestRow, FeeNotional } from './tier types';
import { formateDate } from './utilites /format';
import { latestBySymbolSource } from './utilites /transform';
import SearchBar from './components/SearchBar';
import NotionalSelector from './components/NotionalSelector';

//declaring Desired Notation based on Felix's insructions :)
const EM_DASH = '—';
const DEFAULT_NOTIONAL = '100' as const;

//keys for our Sorting Methods 
type SortKey = 'maker' | 'taker' | null;
type SortDir = 'asc' | 'desc';

function App() {
  //showing the extracted Json data on the table and loading it 
  const [rows, setRows] = useState<LatestRow[]>([]);
  const [loading, setLoading] = useState(true);
  //handling error
  const [error, setError] = useState<string | null>(null);

  //filtering data based on the notation Tiers 
  const [search, setSearch] = useState('');
  const [notional, setNotional] = useState<FeeNotional>(DEFAULT_NOTIONAL);

  //columns sorted based on maker and Taker Fees
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

//Loading Json file after the componets are properly set (based on symbol,source)
  useEffect(() => {
    let cancelled = false;

    //fetching data and reducing to latest rows + error handling
    function loadData() {
      fetch('/cleaned_data_large.json', { cache: 'no-store' })
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json: RawRow[]) => {
          const latest = latestBySymbolSource(json);
          if (!cancelled) setRows(latest);
        })
        .catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          if (!cancelled) setError(msg || 'Failed to load data');
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }

    //here we fetch :))
    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

//preparing Search bar and filtering rows by symbol or source 
  const query = search.trim().toLowerCase();
  const filtered = query
  ? rows.filter(
      (r) => r.symbol.toLowerCase().includes(query) || r.source.toLowerCase().includes(query)
    )
  : rows;

// get the value for maker or taker at the chosen notion
  function getValue(r: LatestRow, key: SortKey): number | undefined {
    if (!key) return undefined;
    const raw = r.fees?.[key]?.[notional];
    const num = typeof raw === 'string' ? Number(raw) : (raw as number);
    return Number.isFinite(num) ? num : undefined;
  }

//sorting based on the selected column 
  const sorted = sortKey
  ? [...filtered].sort((a, b) => {
      const av = getValue(a, sortKey);
      const bv = getValue(b, sortKey);
      if (av === undefined && bv === undefined) return 0;
    // push missing to bottom
      if (av === undefined) return 1; 
      if (bv === undefined) return -1; 
      return sortDir === 'asc' ? av - bv : bv - av;
    })
  : filtered;
 
  //toggling the header direction arrows based on ascending or descending
  function toggleSort(key: Exclude<SortKey, null>) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
  }

  //here we handle errors if they happen
  if (loading) return <div className="status">Loading…</div>;
  if (error) return <div className="status error">{error}</div>;

  // the UI of the main table with symbols, sources , makers , takers , etc 
  return (
    <div className="app">
      {/* Page title and a quick hint about the notional and how missing fees are displayed */}
      <h1 className="title">Challenge TUM Blockchain</h1>
      <p className="subtitle">this app shows maker/taker at the following notion {notional}. the missing value if there is any is shown as "{EM_DASH}" </p>

      {/*  search bar for filters by symbol/source */}
      <div className="controls">
        <SearchBar value={search} onChange={setSearch} />
        <NotionalSelector value={notional} onChange={setNotional} />
      </div>

      {/* Data table — columns for Symbol, Source, Maker, Taker, and Datetime */}
      <div className="table-wrap">
        <table className="fees-table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Source</th>
              <th
                className="th-clickable"
                onClick={() => toggleSort('maker')}
                aria-sort={DirArrow(sortKey, sortDir, 'maker')}
                title="Sort by maker fee"
              >
                Maker ({notional}) {SortDir(sortKey, sortDir, 'maker')}
              </th>
              <th
                className="th-clickable"
                onClick={() => toggleSort('taker')}
                aria-sort={DirArrow(sortKey, sortDir, 'taker')}
                title="Sort by taker fee"
              >
                Taker ({notional}) {SortDir(sortKey, sortDir, 'taker')}
              </th>
              <th>Datetime</th>
            </tr>
          </thead>

          <tbody>
            {/* If nothing matches the search */}
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5}>___</td>
              </tr>
            ) : (
              // Otherwise, list the latest rows with formatted numbers and dates
              sorted.map((r, i) => (
                <tr key={`${r.symbol}-${r.source}-${i}`}>
                  <td>{r.symbol}</td>
                  <td className="td-muted">{r.source}</td>
                  <td>{formatFee(r.fees?.maker?.[notional])}</td>
                  <td>{formatFee(r.fees?.taker?.[notional])}</td>
                  <td className="td-muted">{formateDate(r.datetime, EM_DASH)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

//turning fee value to rendarable text 
function formatFee(v: unknown): string {
  if (v === undefined || v === null) return EM_DASH;
  const n = typeof v === 'string' ? Number(v) : (v as number);
  if (!Number.isFinite(n)) return EM_DASH;
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 6 }).format(n);
}

//showing the direction that column is sorted
function SortDir(key: SortKey, dir: SortDir, me: Exclude<SortKey, null>) {
  if (key !== me) return '⇅';
  return dir === 'asc' ? '▲' : '▼';
}

//showing the sorted order to user 
function DirArrow(
  key: SortKey,
  dir: SortDir,
  me: Exclude<SortKey, null>
): 'none' | 'ascending' | 'descending' {
  if (key !== me) return 'none';
  return dir === 'asc' ? 'ascending' : 'descending';
}

export default App;
