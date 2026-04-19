export default function Badge({ children, className = "" }) {
  return (
    <span className={`inline-flex w-fit items-center justify-center whitespace-nowrap ${className}`.trim()}>
      {children}
    </span>
  );
}
