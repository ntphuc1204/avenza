'use client'
import { Layout } from 'antd';

const AdminFooter = () => {
    const { Footer } = Layout;

    return (
        <>
            <Footer style={{ textAlign: 'center' }}>
                Avenza ©{new Date().getFullYear()} Created by @avenza
            </Footer>
        </>
    )
}

export default AdminFooter;