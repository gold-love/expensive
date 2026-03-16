import React from 'react';

const Footer = () => {
    return (
        <footer style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
            <p>&copy; {new Date().getFullYear()} Finsight Expense Tracker. All rights reserved.</p>
        </footer>
    );
};

export default Footer;
