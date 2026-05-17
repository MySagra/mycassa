import CassaClient from './CassaClient';

export const dynamic = 'force-dynamic';

export default function CassaPage() {
    const requiredTable = process.env.REQUIRE_TABLE === 'true';
    const requireCustomer = process.env.REQUIRE_CUSTOMER !== 'false';
    return <CassaClient requiredTable={requiredTable} requireCustomer={requireCustomer} />;
}
