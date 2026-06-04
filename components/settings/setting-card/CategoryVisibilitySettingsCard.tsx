'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { LayoutGrid } from 'lucide-react';
import { getCategories } from '@/actions/cashier';
import { Category } from '@/lib/api-types';
import { useTranslation } from 'react-i18next';

const LS_KEY = 'foodgrid_hidden_categories';

function loadHiddenIds(): number[] {
    try {
        const stored = localStorage.getItem(LS_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch {
        return [];
    }
}

function saveHiddenIds(ids: number[]) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(ids));
    } catch { /* noop */ }
}

export function CategoryVisibilitySettingsCard() {
    const { t } = useTranslation();
    const [categories, setCategories] = useState<Category[]>([]);
    const [hiddenIds, setHiddenIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setHiddenIds(loadHiddenIds());
        getCategories().then(result => {
            if (result.success) {
                const cats = (result.data as Category[])
                    .slice()
                    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
                setCategories(cats);
            }
        }).finally(() => setLoading(false));
    }, []);

    const toggle = (id: number, visible: boolean) => {
        setHiddenIds(prev => {
            const next = visible ? prev.filter(x => x !== id) : [...prev, id];
            saveHiddenIds(next);
            return next;
        });
    };

    const selectAll = () => {
        setHiddenIds([]);
        saveHiddenIds([]);
    };

    const deselectAll = () => {
        const all = categories.map(c => c.id);
        setHiddenIds(all);
        saveHiddenIds(all);
    };

    const allVisible = hiddenIds.length === 0;
    const noneVisible = categories.length > 0 && hiddenIds.length === categories.length;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2 select-none">
                    <LayoutGrid className="h-5 w-5 text-amber-600" />
                    <CardTitle>{t('settings.categoryVisibility.title')}</CardTitle>
                </div>
                <CardDescription className="select-none">
                    {t('settings.categoryVisibility.description')}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAll}
                        disabled={loading || allVisible}
                        className="cursor-pointer"
                    >
                        {t('settings.categoryVisibility.selectAll')}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={deselectAll}
                        disabled={loading || noneVisible}
                        className="cursor-pointer"
                    >
                        {t('settings.categoryVisibility.deselectAll')}
                    </Button>
                </div>
                {loading ? (
                    <p className="text-sm text-muted-foreground select-none">
                        {t('settings.categoryVisibility.loading')}
                    </p>
                ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                        {categories.map(cat => {
                            const visible = !hiddenIds.includes(cat.id);
                            return (
                                <label
                                    key={cat.id}
                                    className="flex items-center gap-2 cursor-pointer select-none group"
                                >
                                    <Checkbox
                                        checked={visible}
                                        onCheckedChange={(checked) => toggle(cat.id, !!checked)}
                                    />
                                    <span className="text-sm group-hover:text-foreground text-muted-foreground transition-colors">
                                        {cat.name}
                                    </span>
                                </label>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
