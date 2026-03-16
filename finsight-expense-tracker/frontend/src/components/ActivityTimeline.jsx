import React from 'react';

const ActivityTimeline = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return <p style={{ color: 'var(--gray)', padding: '20px' }}>No recent activity</p>;
    }

    return (
        <div style={{ padding: '8px' }}>
            {activities.map((activity, index) => (
                <div key={index} style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: '20px',
                    position: 'relative'
                }}>
                    {index !== activities.length - 1 && (
                        <div style={{
                            position: 'absolute',
                            left: '11px',
                            top: '28px',
                            bottom: '-12px',
                            width: '2px',
                            background: 'var(--gray-light)'
                        }}></div>
                    )}

                    <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: activity.type === 'approved' ? 'var(--success)' :
                            activity.type === 'rejected' ? 'var(--danger)' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        color: 'white',
                        zIndex: 1,
                        boxShadow: '0 0 0 4px var(--white)'
                    }}>
                        {activity.type === 'approved' ? '✓' :
                            activity.type === 'rejected' ? '✕' : '•'}
                    </div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '700' }}>{activity.title}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{activity.time}</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--gray)' }}>
                            {activity.description}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ActivityTimeline;
