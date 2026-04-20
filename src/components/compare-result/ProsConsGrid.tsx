import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface ProsConsSide {
  title: string;
  pros: string[];
  cons: string[];
}

interface ProsConsGridProps {
  a: ProsConsSide;
  b: ProsConsSide;
}

export const ProsConsGrid = ({ a, b }: ProsConsGridProps) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-rule border border-rule rounded-lg overflow-hidden">
    <Side data={a} />
    <Side data={b} />
  </div>
);

const Side = ({ data }: { data: ProsConsSide }) => (
  <div className="bg-white p-6">
    <h3 className="text-property-name mb-4 pb-3 border-b border-rule">
      {data.title}
    </h3>
    <List
      icon={<ThumbsUp className="w-3 h-3" aria-hidden="true" />}
      label="Pros"
      items={data.pros}
    />
    <div className="mt-5">
      <List
        icon={<ThumbsDown className="w-3 h-3" aria-hidden="true" />}
        label="Cons"
        items={data.cons}
      />
    </div>
  </div>
);

const List = ({
  icon,
  label,
  items,
}: {
  icon: React.ReactNode;
  label: string;
  items: string[];
}) => (
  <>
    <div className="flex items-center gap-1.5 text-label-xs text-ink-60 mb-2">
      {icon}
      {label}
    </div>
    <ul className="space-y-1.5 text-[13px]">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="text-ink-30" aria-hidden="true">·</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  </>
);
