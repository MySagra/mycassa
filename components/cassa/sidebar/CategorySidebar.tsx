import { Category } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslation } from 'react-i18next';

interface CategorySidebarProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onSelectCategory: (id: number | null) => void;
    loading: boolean;
}

export function CategorySidebar({ categories, selectedCategoryId, onSelectCategory, loading }: CategorySidebarProps) {
    const { t } = useTranslation();

    return (
        <aside className="w-64 border-r bg-card hidden xl:block">
            <div className="p-2">
                <Button
                    variant={selectedCategoryId === null ? 'default' : 'outline'}
                    className="w-full justify-start h-20 cursor-pointer"
                    onClick={() => onSelectCategory(null)}
                >
                    <div className='text-lg select-none'>
                        {t('categorySideBar.allCategories')}
                    </div>
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="space-y-2.5 p-2">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            {t('categorySideBar.loading')}
                        </div>
                    ) : (
                        categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                                className={`w-full justify-start cursor-pointer select-none ${category.available === false ? 'opacity-60' : ''}`}
                                onClick={() => onSelectCategory(category.id)}
                            >
                                <span className="truncate">{category.name}</span>
                                {category.available === false && (
                                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{t('categorySideBar.notAvailable')}</span>
                                )}
                            </Button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
