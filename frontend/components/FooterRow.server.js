import Paging from './SettingsBar/Paging.client';

const FooterRow = ({ query, total }) => {
    const pages = Math.ceil(total / (query?.limit || total));
    const pagination = Array.from({ length: pages }, (val, idx) => idx + 1);

    return (
        <div className="footer-row">
            <Paging query={query} total={total} pagination={pagination} />
        </div>
    );
};

export default FooterRow;
