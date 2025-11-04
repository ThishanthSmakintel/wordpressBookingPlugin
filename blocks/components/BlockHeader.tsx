import { createElement } from '@wordpress/element';

interface BlockHeaderProps {
    onLoginClick?: () => void;
}

export const BlockHeader = ({ onLoginClick }: BlockHeaderProps) => (
    <div className="appointease-booking-header">
        <div className="appointease-logo">
            <span className="logo-icon">A</span>
        </div>
        <div className="manage-appointment">
            <button className="login-btn" onClick={onLoginClick}>
                <i className="fas fa-sign-in-alt"></i>
                <strong>Existing Customer? Login Here</strong>
            </button>
        </div>
    </div>
);
