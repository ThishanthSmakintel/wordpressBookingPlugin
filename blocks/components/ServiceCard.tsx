import { createElement } from '@wordpress/element';

interface ServiceCardProps {
    title: string;
    description: string;
    duration: number;
    price: number;
    isSelected?: boolean;
    onClick?: () => void;
}

export const ServiceCard = ({
    title,
    description,
    duration,
    price,
    isSelected = false,
    onClick
}: ServiceCardProps) => (
    <div 
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            padding: '24px',
            marginBottom: '16px',
            backgroundColor: 'white',
            border: isSelected ? '3px solid var(--button-bg, #10b981)' : '2px solid #e5e7eb',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isSelected ? '0 4px 12px rgba(16, 185, 129, 0.15)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
        }}
    >
        <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            border: '2px solid #d1d5db',
            marginRight: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSelected ? 'var(--button-bg, #10b981)' : 'white',
            borderColor: isSelected ? 'var(--button-bg, #10b981)' : '#d1d5db'
        }}>
            {isSelected && (
                <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: 'white'
                }}></div>
            )}
        </div>
        <div style={{ flex: '1' }}>
            <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: 'var(--text-primary, #1f2937)',
                marginBottom: '8px'
            }}>
                {title}
            </h3>
            <p style={{
                color: '#6b7280',
                marginBottom: '12px',
                fontSize: '0.95rem'
            }}>
                {description}
            </p>
            <div style={{ display: 'flex', gap: '16px' }}>
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: '#374151'
                }}>
                    <i className="fas fa-clock" style={{ marginRight: '6px', color: '#6b7280' }}></i>
                    {duration} min
                </span>
                <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: '600'
                }}>
                    <i className="fas fa-dollar-sign" style={{ marginRight: '6px', color: '#6b7280' }}></i>
                    ${price}
                </span>
            </div>
        </div>
    </div>
);
