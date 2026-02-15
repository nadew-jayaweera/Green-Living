export default function RegisterLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <div className="no-sidebar">{children}</div>;
}
