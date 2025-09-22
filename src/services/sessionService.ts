/**
 * Session Service for persistent login
 */

export const sessionService = {
    /**
     * Store session token
     */
    setSession(token: string, email: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('booking_session_token', token);
            localStorage.setItem('booking_user_email', email);
        }
    },

    /**
     * Get stored session token
     */
    getSessionToken(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('booking_session_token');
        }
        return null;
    },

    /**
     * Get stored user email
     */
    getUserEmail(): string | null {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('booking_user_email');
        }
        return null;
    },

    /**
     * Clear session data
     */
    clearSession() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('booking_session_token');
            localStorage.removeItem('booking_user_email');
        }
    },

    /**
     * Validate session with backend
     */
    async validateSession(token: string): Promise<{valid: boolean, email?: string}> {
        try {
            const response = await fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/session`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                return { valid: true, email: data.email };
            }
            return { valid: false };
        } catch (error) {
            console.error('Session validation failed:', error);
            return { valid: false };
        }
    },

    /**
     * Create session after OTP verification
     */
    async createSession(email: string): Promise<{success: boolean, token?: string}> {
        try {
            const response = await fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.token) {
                    this.setSession(data.token, email);
                    return { success: true, token: data.token };
                }
            }
            return { success: false };
        } catch (error) {
            console.error('Session creation failed:', error);
            return { success: false };
        }
    },

    /**
     * Destroy session
     */
    async destroySession(token: string): Promise<boolean> {
        try {
            await fetch(`${window.bookingAPI?.root || '/wp-json/'}appointease/v1/session`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            this.clearSession();
            return true;
        } catch (error) {
            console.error('Session destruction failed:', error);
            this.clearSession(); // Clear local data anyway
            return false;
        }
    }
};