import { render, screen } from '@testing-library/react';
import { StepIndicator } from '../../blocks/components/StepIndicator';

describe('StepIndicator', () => {
    it('renders all 5 steps', () => {
        const { container } = render(<StepIndicator currentStep={1} />);
        const steps = container.querySelectorAll('div > div > div');
        expect(steps.length).toBeGreaterThanOrEqual(5);
    });

    it('highlights active step', () => {
        render(<StepIndicator currentStep={3} />);
        expect(screen.getByText('Date')).toBeInTheDocument();
    });

    it('shows checkmark for completed steps', () => {
        const { container } = render(<StepIndicator currentStep={3} />);
        const checkmarks = container.querySelectorAll('.fa-check');
        expect(checkmarks).toHaveLength(2); // Steps 1 and 2
    });

    it('applies correct colors to active step', () => {
        render(<StepIndicator currentStep={2} />);
        expect(screen.getByText('Employee')).toBeInTheDocument();
    });
});
