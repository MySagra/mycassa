import { Category } from '@/lib/api-types';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CategorySidebarProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onSelectCategory: (id: number | null) => void;
    loading: boolean;
}

export function CategorySidebar({ categories, selectedCategoryId, onSelectCategory, loading }: CategorySidebarProps) {
    return (
        <aside className="w-64 border-r bg-card hidden xl:block">
            <div className="p-2">
                <Button
                    variant={selectedCategoryId === null ? 'default' : 'outline'}
                    className="w-full justify-start h-20"
                    onClick={() => onSelectCategory(null)}
                >
                    <div className='text-lg select-none'>
                        Tutte le categorie
                    </div>
                </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-8rem)]">
                <div className="space-y-2.5 p-2">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            Caricamento...
                        </div>
                    ) : (
                        categories.map((category) => (
                            <Button
                                key={category.id}
                                variant={selectedCategoryId === category.id ? 'default' : 'outline'}
                                className="w-full justify-start select-none"
                                onClick={() => onSelectCategory(category.id)}
                            >
                                {category.name}
                            </Button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
