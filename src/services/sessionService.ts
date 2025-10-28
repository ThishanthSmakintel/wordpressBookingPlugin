/**
 * Session Service for persistent login
 */

export const sessionService = {
    /**
     * Store session token securely
     */
    setSession(token: string, email: string) {
        if (typeof window !== 'undefined') {
            // Sanitize inputs
            const sanitizedToken = token.replace(/[<>"'&]/g, '');
            const sanitizedEmail = email.replace(/[<>"'&]/g, '');
            
            try {
                sessionStorage.setItem('booking_session_token', sanitizedToken);
                sessionStorage.setItem('booking_user_email', sanitizedEmail);
            } catch (e) {

            }
        }
    },

    /**
     * Get stored session token
     */
    getSessionToken(): string | null {
        if (typeof window !== 'undefined') {
            try {
                return sessionStorage.getItem('booking_session_token');
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    /**
     * Get stored user email
     */
    getUserEmail(): string | null {
        if (typeof window !== 'undefined') {
            try {
                return sessionStorage.getItem('booking_user_email');
            } catch (e) {
                return null;
            }
        }
        return null;
    },

    /**
     * Clear session data
     */
    clearSession() {
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.removeItem('booking_session_token');
                sessionStorage.removeItem('booking_user_email');
            } catch (e) {
                // Ignore storage errors
            }
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

            this.clearSession(); // Clear local data anyway
            return false;
        }
    }
};