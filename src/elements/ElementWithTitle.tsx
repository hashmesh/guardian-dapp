
export default function ElementWithTitle({ title, element: input }: { title: string; element: JSX.Element }) {
  return (
    <div className="relative">
      <span className="absolute top-0 left-5 -translate-y-1/2 px-1 bg-white text-xs text-gray-400">{title}</span>
      {input}
    </div>
  );
}
