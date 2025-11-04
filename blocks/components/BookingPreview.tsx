import { createElement } from '@wordpress/element';
import { BlockHeader } from './BlockHeader';
import { StepIndicator } from './StepIndicator';
import { ServiceCard } from './ServiceCard';

interface BookingPreviewProps {
    width: number;
}

const DEMO_SERVICES = [
    {
        title: 'Consultation',
        description: 'Initial consultation session',
        duration: 30,
        price: 75
    },
    {
        title: 'Premium Service',
        description: 'Extended premium service',
        duration: 60,
        price: 150
    }
];

export const BookingPreview = ({ width }: BookingPreviewProps) => (
    <div className="appointease-booking-wrapper" style={{ width: `${width}%`, minWidth: '600px' }}>
        <div className="appointease-booking-container">
            <div className="appointease-booking" style={{ background: '#ffffff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                <BlockHeader />
                <div className="appointease-booking-content">
                    <StepIndicator currentStep={1} />
                    <div className="appointease-step-content" style={{ background: '#f9fafb', padding: '40px 30px' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '700', textAlign: 'center', marginBottom: '2rem', color: '#1f2937' }}>Choose Your Service</h2>
                        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                            {DEMO_SERVICES.map((service, index) => (
                                <ServiceCard key={index} {...service} isSelected={index === 0} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
