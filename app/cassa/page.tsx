import CassaClient from './CassaClient';

export const dynamic = 'force-dynamic';

export default function CassaPage() {
    const requiredTable = process.env.REQUIRE_TABLE === 'true';
    return <CassaClient requiredTable={requiredTable} />;
}
