import { registerBlockType } from '@wordpress/blocks';
import { __ } from '@wordpress/i18n';
import { useBlockProps } from '@wordpress/block-editor';
import { useEffect } from '@wordpress/element';
import './editor.scss';
import '../src/frontend.css';

registerBlockType('appointease/booking-form', {
    apiVersion: 2,
    title: __('AppointEase Booking', 'appointease'),
    icon: 'clock',
    category: 'widgets',
    example: {},

    edit() {
        const blockProps = useBlockProps();
        

        
        return (
            <div {...blockProps}>
                <div className="appointease-booking-wrapper">
                    <div className="appointease-booking-container">
                        <div className="appointease-booking">
                            <div className="appointease-booking-header">
                                <div className="appointease-logo">
                                    <span className="logo-icon">A</span>
                                    <span className="logo-text">AppointEase</span>
                                </div>
                                <div className="manage-appointment">
                                    <input type="text" placeholder="APT-2024-XXXXXX" />
                                    <button>Manage</button>
                                </div>
                            </div>
                            <div className="appointease-booking-content">
                                <div className="appointease-steps">
                                    <div className="step active">
                                        <span className="step-number">1</span>
                                        <span className="step-label">Service</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">2</span>
                                        <span className="step-label">Employee</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">3</span>
                                        <span className="step-label">Date</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">4</span>
                                        <span className="step-label">Time</span>
                                    </div>
                                    <div className="step">
                                        <span className="step-number">5</span>
                                        <span className="step-label">Info</span>
                                    </div>
                                </div>
                                <div className="appointease-step-content">
                                    <h2>Choose Your Service</h2>
                                    <p className="step-description">Select the service you'd like to book</p>
                                    <div className="services-grid">
                                        <div className="service-card">
                                            <div className="service-icon"><i className="fas fa-stethoscope"></i></div>
                                            <div className="service-info">
                                                <h3>Consultation</h3>
                                                <p>Initial consultation session</p>
                                                <div className="service-meta">
                                                    <span className="duration">30 min</span>
                                                    <span className="price">$75.00</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="service-card">
                                            <div className="service-icon"><i className="fas fa-user-md"></i></div>
                                            <div className="service-info">
                                                <h3>Premium Service</h3>
                                                <p>Extended premium service</p>
                                                <div className="service-meta">
                                                    <span className="duration">60 min</span>
                                                    <span className="price">$150.00</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    },
    
    save() {
        return null; // Dynamic block - rendered by PHP
    }
});