import { createElement } from '@wordpress/element';
import { BlockHeader } from './BlockHeader';
import { StepIndicator } from './StepIndicator';
import { ServiceCard } from './ServiceCard';

interface BookingPreviewProps {
    columns: number;
    width: number;
    height: number;
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

export const BookingPreview = ({ columns, width, height }: BookingPreviewProps) => (
    <div className="appointease-booking-wrapper" style={{ width: `${width}%`, minWidth: '600px' }}>
        <div className="appointease-booking-container">
            <div className="appointease-booking">
                <BlockHeader />
                <div className="appointease-booking-content">
                    <StepIndicator currentStep={1} />
                    <div className="appointease-step-content">
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
