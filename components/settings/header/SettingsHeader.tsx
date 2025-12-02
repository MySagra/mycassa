import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SettingsHeader() {
    const router = useRouter();

    return (
        <header className="border-b bg-card sticky top-0 z-10">
            <div className="flex h-16 items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <img
                        src="/logo.svg"
                        alt="Logo"
                        className="mx-auto h-10 w-auto select-none cursor-pointer"
                        onClick={() => router.push('/cassa')}
                    />
                    <h1 className="text-2xl font-bold select-none">Impostazioni</h1>
                </div>

                <Button
                    variant="outline"
                    size="lg"
                    className='select-none cursor-pointer'
                    onClick={() => router.push('/cassa')}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Torna alla Cassa
                </Button>
            </div>
        </header>
    );
}

