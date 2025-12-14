import React, { useState } from 'react';
import { Menu, X, Map, Route as RouteIcon, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface MapLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: '/mapa', label: 'Distribuição de alimentos', icon: Map },
  { href: '/mapa/logistica', label: 'Rotas logísticas (IA)', icon: RouteIcon },
  { href: '/mapa/agentes', label: 'Agentes', icon: Bot },
  // Adicione outros futuros mapas aqui
];

function SidebarContent({
  locationPath,
  onNavigate,
}: {
  locationPath: string;
  onNavigate: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between p-4 border-b h-16">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.svg" alt="RAJAI Logo" className="h-8" />
          <span className="font-bold text-xl">RAJAI</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onNavigate}
          aria-label="Fechar menu"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <nav className="flex-1 p-4">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center p-2 rounded-lg',
                  locationPath === item.href
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-200'
                )}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}

const MapLayout: React.FC<MapLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para desktop */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:z-20 md:w-64 bg-white border-r">
        <SidebarContent locationPath={location.pathname} onNavigate={() => {}} />
      </aside>

      {/* Mobile-only Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar para mobile (Drawer) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 bg-white border-r flex flex-col transform transition-transform duration-300 ease-in-out md:hidden",
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent locationPath={location.pathname} onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="md:pl-64 flex flex-col flex-1">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b md:justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          <div className="hidden md:block">
            {/* Você pode adicionar outros elementos aqui, como um menu de usuário */}
            <span className="text-sm font-medium">Bem-vindo</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MapLayout;
