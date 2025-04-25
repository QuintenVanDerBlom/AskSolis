import StreamingChat from './components/StreamingChat';

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-800 via-teal-700 to-forest-900">
            <div className="container mx-auto py-8">
                <h1 className="text-4xl font-bold text-center text-white mb-8 tracking-wide">AskSolis</h1>
                <StreamingChat />
            </div>
        </div>
    );
}

export default App;