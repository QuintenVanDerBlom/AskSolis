import { useState, useEffect } from 'react';

function App() {
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch initial history on mount
    useEffect(() => {
        const fetchInitialHistory = async () => {
            try {
                const res = await fetch('http://localhost:3000');
                if (!res.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await res.json();
                if (data.history) {
                    setHistory(data.history);
                }
            } catch (err) {
                console.error('Error fetching initial history:', err);
            }
        };
        fetchInitialHistory();
    }, []);

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
            setHistory(data.history || []);
            setPrompt(''); // Clear the textarea after submission
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey && !loading) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-800 via-teal-700 to-forest-900 flex items-center justify-center p-4">
            <div className="bg-cream-100 bg-opacity-80 backdrop-blur-md rounded-3xl p-8 w-full max-w-4xl shadow-xl border border-green-200">
                <h1 className="text-4xl font-bold text-center text-forest-800 mb-8 tracking-wide">AskSolis</h1>

                <div className="flex flex-col md:flex-row gap-6">
                    {/* Form Section */}
                    <div className="flex-1">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="prompt" className="block text-base font-medium text-forest-700">
                                    Your Prompt
                                </label>
                                <textarea
                                    id="prompt"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="mt-1 block w-full px-4 py-3 bg-cream-50 bg-opacity-60 border border-green-300 rounded-lg text-forest-800 placeholder-forest-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition duration-200 text-base"
                                    rows="4"
                                    placeholder="Ask about nature or plants..."
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-2 px-4 rounded-lg text-cream-50 font-semibold transition duration-300 ${
                                    loading
                                        ? 'bg-green-400 cursor-not-allowed'
                                        : 'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2'
                                }`}
                            >
                                {loading ? 'Sending...' : 'Submit'}
                            </button>
                        </form>

                        {/* Error Message */}
                        {error && (
                            <div className="mt-4 p-3 bg-red-300 bg-opacity-30 rounded-lg text-red-800 text-base">
                                Error: {error}
                            </div>
                        )}

                        {/* Latest Response */}
                        {response && (
                            <div className="mt-4 p-3 bg-green-300 bg-opacity-30 rounded-lg text-forest-800">
                                <h3 className="font-semibold text-lg">Latest Response:</h3>
                                <p className="whitespace-pre-wrap text-base">{response.message}</p>
                            </div>
                        )}
                    </div>

                    {/* Chat History Section */}
                    <div className="flex-1">
                        <div className="bg-cream-50 bg-opacity-60 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                            <h3 className="font-semibold text-lg text-forest-800 mb-4">Conversation History</h3>
                            {history.length === 0 ? (
                                <p className="text-base text-forest-600">No conversation history yet.</p>
                            ) : (
                                history.map((item, index) => (
                                    <div
                                        key={index}
                                        className="mb-4 p-3 bg-cream-100 bg-opacity-80 rounded-lg border border-green-200"
                                    >
                                        <p className="text-base font-medium text-forest-700">You:</p>
                                        <p className="text-base text-forest-800 whitespace-pre-wrap mb-2">
                                            {item.prompt}
                                        </p>
                                        <p className="text-base font-medium text-forest-700">Solis:</p>
                                        <p className="text-base text-forest-800 whitespace-pre-wrap">
                                            {item.response}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;