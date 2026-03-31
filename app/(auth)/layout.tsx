export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-5"
      style={{ background: "var(--bg-body)" }}
    >
      <div className="w-full max-w-[400px]">{children}</div>
    </div>
  );
}
