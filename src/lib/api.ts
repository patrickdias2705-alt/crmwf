const API_URL = import.meta.env.VITE_API_URL || 'https://jcqsczbodsrfjthxjjxq.supabase.co/functions/v1';

class Api {
  constructor(public baseUrl: string) {}

  async getHello() {
    const response = await fetch(`${this.baseUrl}/hello`);
    return await response.text();
  }

  async getAuthMe() {
    const token = localStorage.getItem('sb-jcqsczbodsrfjthxjjxq-auth-token');
    const parsedToken = token ? JSON.parse(token) : null;
    const accessToken = parsedToken ? parsedToken.access_token : null;

    const response = await fetch(`${this.baseUrl}/auth-me`, {
      headers: {
        Authorization: accessToken ? `Bearer ${accessToken}` : '',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('sb-jcqsczbodsrfjthxjjxq-auth-token');
      }
      try {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user');
      } catch {
        throw new Error('Failed to get user');
      }
    }

    return await response.json();
  }

  // Demo setup
  async setupDemo() {
    const response = await fetch(`${this.baseUrl}/setup-demo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      try {
        const error = await response.json();
        throw new Error(error.error || 'Failed to setup demo');
      } catch {
        throw new Error('Failed to setup demo');
      }
    }
    
    return await response.json();
  }
}

export const api = new Api(API_URL);
