import { useState } from 'react';

function App() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setResponse(null);

        try {
            const res = await fetch('http://localhost:3000', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ prompt }),
            });

            if (!res.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await res.json();
            setResponse(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-700 flex items-center justify-center p-4">
            <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 max-w-md w-full shadow-2xl">
                <h1 className="text-4xl font-bold text-center text-white mb-6">AskSolis</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-200">
                            Your Prompt
                        </label>
                        <textarea
                            id="prompt"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="mt-1 block w-full px-3 py-2 bg-white bg-opacity-20 border border-gray-300 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            rows="4"
                            placeholder="Enter your prompt here..."
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-2 px-4 rounded-md text-white font-semibold transition duration-300 ${
                            loading
                                ? 'bg-indigo-400 cursor-not-allowed'
                                : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                        }`}
                    >
                        {loading ? 'Sending...' : 'Submit'}
                    </button>
                </form>

                {error && (
                    <div className="mt-4 p-3 bg-red-500 bg-opacity-20 rounded-md text-red-200">
                        Error: {error}
                    </div>
                )}

                {response && (
                    <div className="mt-4 p-3 bg-green-500 bg-opacity-20 rounded-md text-green-200">
                        <h3 className="font-semibold">Response:</h3>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(response, null, 2)}</pre>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;