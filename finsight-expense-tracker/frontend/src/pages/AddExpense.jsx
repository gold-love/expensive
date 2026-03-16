import React from 'react';
import ExpenseForm from '../components/ExpenseForm';
import { useNavigate } from 'react-router-dom';

const AddExpense = () => {
    const navigate = useNavigate();

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <ExpenseForm onSuccess={() => navigate('/expenses')} />
        </div>
    );
};

export default AddExpense;
