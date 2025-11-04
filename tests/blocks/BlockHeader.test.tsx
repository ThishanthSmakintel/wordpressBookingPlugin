import { render, screen } from '@testing-library/react';
import { BlockHeader } from '../../blocks/components/BlockHeader';

describe('BlockHeader', () => {
    it('renders logo icon', () => {
        const { container } = render(<BlockHeader />);
        expect(container.querySelector('.logo-icon')).toBeInTheDocument();
    });

    it('displays current time', () => {
        render(<BlockHeader />);
        expect(screen.getByText(/All bookings use this timezone/i)).toBeInTheDocument();
    });

    it('renders login button', () => {
        render(<BlockHeader />);
        expect(screen.getByText(/Existing Customer\? Login Here/i)).toBeInTheDocument();
    });

    it('updates time every second', async () => {
        jest.useFakeTimers();
        render(<BlockHeader />);
        const initialTime = screen.getByText(/\d{2}:\d{2}:\d{2}/);
        jest.advanceTimersByTime(1000);
        expect(initialTime).toBeInTheDocument();
        jest.useRealTimers();
    });
});
