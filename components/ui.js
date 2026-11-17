export const kes = (n) => 'KES ' + Number(n || 0).toLocaleString('en-KE');
export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-emerald-600 focus:outline-none focus:ring-1 focus:ring-emerald-600';
export const btnCls = 'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50';
export const btn2Cls = 'rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50';

const tones = { slate: 'text-slate-800', red: 'text-red-600', green: 'text-emerald-600' };

export const Card = ({ title, children, className = '' }) => (
  <section className={`rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-6 ${className}`}>
    {title && <h2 className="mb-4 text-base font-semibold">{title}</h2>}
    {children}
  </section>
);

export const Stat = ({ label, value, tone = 'slate' }) => (
  <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5">
    <p className="text-sm text-slate-500">{label}</p>
    <p className={`mt-1 text-xl font-bold sm:text-2xl ${tones[tone]}`}>{value}</p>
  </div>
);

export const Badge = ({ paid }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${paid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
    {paid ? 'Paid' : 'Unpaid'}
  </span>
);

export const Table = ({ head, children }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full whitespace-nowrap text-left text-sm">
      <thead className="border-b text-slate-500">
        <tr>{head.map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">{children}</tbody>
    </table>
  </div>
);

export const Td = ({ children, className = '' }) => <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
export const Empty = ({ children }) => <p className="py-6 text-center text-sm text-slate-500">{children}</p>;
export const PageTitle = ({ children }) => <h1 className="mb-5 text-xl font-bold sm:text-2xl">{children}</h1>;
