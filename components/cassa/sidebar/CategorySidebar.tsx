import { Category } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { PanelLeftClose, PanelLeftOpen, LayoutGrid } from 'lucide-react';

const LS_HIDDEN_CATS_KEY = 'foodgrid_hidden_categories';
const LS_COLLAPSED_KEY = 'categorySidebar_collapsed';

function getInitials(name: string): string {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('');
}

interface CategorySidebarProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onSelectCategory: (id: number | null) => void;
    loading: boolean;
}

export function CategorySidebar({ categories, selectedCategoryId, onSelectCategory, loading }: CategorySidebarProps) {
    const { t } = useTranslation();

    const [hiddenIds, setHiddenIds] = useState<number[]>(() => {
        try {
            const stored = localStorage.getItem(LS_HIDDEN_CATS_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem(LS_COLLAPSED_KEY) === '1';
        } catch { return false; }
    });

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try { localStorage.setItem(LS_COLLAPSED_KEY, next ? '1' : '0'); } catch { /* noop */ }
            return next;
        });
    };

    useEffect(() => {
        const handler = () => {
            try {
                const stored = localStorage.getItem(LS_HIDDEN_CATS_KEY);
                setHiddenIds(stored ? JSON.parse(stored) : []);
            } catch { /* noop */ }
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    const visibleCategories = categories.filter(c => !hiddenIds.includes(c.id));

    return (
        <aside className={`${collapsed ? 'w-14' : 'w-64'} border-r bg-card hidden xl:flex xl:flex-col transition-[width] duration-150`}>
            <div className="p-2">
                <Button
                    variant={selectedCategoryId === null ? 'default' : 'outline'}
                    className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'} h-20 cursor-pointer`}
                    onClick={() => onSelectCategory(null)}
                    title={t('categorySideBar.allCategories')}
                >
                    {collapsed ? (
                        <LayoutGrid className="size-5" />
                    ) : (
                        <div className='text-lg select-none'>{t('categorySideBar.allCategories')}</div>
                    )}
                </Button>
            </div>

            <ScrollArea className="flex-1 min-h-0">
                <div className="space-y-2.5 p-2">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {collapsed ? '…' : t('categorySideBar.loading')}
                        </div>
                    ) : (
                        visibleCategories.map((category) => (
                            <Button
                                key={category.id}
                                variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                                className={`w-full ${collapsed ? 'justify-center px-0' : 'justify-start'} cursor-pointer select-none ${category.available === false ? 'opacity-60' : ''}`}
                                onClick={() => onSelectCategory(category.id)}
                                title={category.name}
                            >
                                {collapsed ? (
                                    <span className="text-xs font-semibold">{getInitials(category.name)}</span>
                                ) : (
                                    <>
                                        <span className="truncate">{category.name}</span>
                                        {category.available === false && (
                                            <span className="ml-auto shrink-0 text-xs text-muted-foreground">{t('categorySideBar.notAvailable')}</span>
                                        )}
                                    </>
                                )}
                            </Button>
                        ))
                    )}
                </div>
            </ScrollArea>

            <div className="p-2 border-t bg-card">
                <Button
                    variant="outline"
                    size={collapsed ? 'icon' : 'default'}
                    className={`w-full cursor-pointer ${collapsed ? '' : 'justify-between'}`}
                    onClick={toggleCollapsed}
                    title={collapsed ? t('categorySideBar.expand') : t('categorySideBar.collapse')}
                >
                    {collapsed ? (
                        <PanelLeftOpen className="size-4" />
                    ) : (
                        <>
                            <span className="text-sm select-none">{t('categorySideBar.collapseLabel')}</span>
                            <PanelLeftClose className="size-4" />
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
