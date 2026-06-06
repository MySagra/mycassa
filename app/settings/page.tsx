import SettingsPageClient from './SettingsPageClient';

export const dynamic = 'force-dynamic';

export default function SettingsPage() {
    const requireCustomer = process.env.REQUIRE_CUSTOMER !== 'false';
    const requireTable = process.env.REQUIRE_TABLE === 'true';
    return <SettingsPageClient requireCustomer={requireCustomer} requireTable={requireTable} />;
}
