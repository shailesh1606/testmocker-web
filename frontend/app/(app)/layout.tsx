export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar is rendered inside the pages or here. Actually wait, it's better to render it here, BUT the Test page doesn't have a sidebar! */}
      {/* Wait, the route structure is (app) for dashboard etc... and test could be separate, but I grouped test under (app) in mkdir. Let's fix this in the individual pages. */}
      {children}
    </div>
  );
}
