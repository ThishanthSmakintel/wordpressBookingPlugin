import { render, screen, fireEvent } from '@testing-library/react';
import { ServiceCard } from '../../blocks/components/ServiceCard';

describe('ServiceCard', () => {
    const mockService = {
        title: 'Consultation',
        description: 'Initial consultation session',
        duration: 30,
        price: 75
    };

    it('renders service information', () => {
        render(<ServiceCard {...mockService} />);
        expect(screen.getByText('Consultation')).toBeInTheDocument();
        expect(screen.getByText('Initial consultation session')).toBeInTheDocument();
        expect(screen.getByText('30 min')).toBeInTheDocument();
        expect(screen.getByText('$75')).toBeInTheDocument();
    });

    it('shows selected state', () => {
        render(<ServiceCard {...mockService} isSelected={true} />);
        expect(screen.getByText('Consultation')).toBeInTheDocument();
    });

    it('calls onClick when clicked', () => {
        const handleClick = jest.fn();
        const { container } = render(<ServiceCard {...mockService} onClick={handleClick} />);
        fireEvent.click(container.firstChild as Element);
        expect(handleClick).toHaveBeenCalledTimes(1);
    });
});
